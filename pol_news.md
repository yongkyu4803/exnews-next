# 뉴스 리포트 뷰어 마이그레이션 가이드

이 문서는 현재 Next.js 애플리케이션의 뉴스 리포트 뷰어를 다른 환경(React, Vue, 순수 HTML 등)으로 마이그레이션하기 위한 가이드입니다.

## 목차
1. [현재 구조 개요](#현재-구조-개요)
2. [데이터 스키마](#데이터-스키마)
3. [컴포넌트 구조](#컴포넌트-구조)
4. [API 엔드포인트](#api-엔드포인트)
5. [스타일 시스템](#스타일-시스템)
6. [마이그레이션 체크리스트](#마이그레이션-체크리스트)

---

## 현재 구조 개요

### 기술 스택
- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS + CSS Variables
- **데이터베이스**: Supabase (PostgreSQL)
- **상태 관리**: React Hooks (useState, useEffect)

### 주요 기능
1. **리포트 목록 페이지**: 파일 시스템 + Supabase DB에서 리포트 목록 표시
2. **리포트 뷰어**: 일반 뷰 / 뉴스레터 뷰 전환 가능
3. **PDF 저장**: 브라우저 프린트 기능 활용
4. **Supabase 발행**: 로컬 JSON 파일을 Supabase에 업로드
5. **발행 상태 표시**: DB/파일 출처 구분 뱃지

---

## 데이터 스키마

### Supabase 테이블: `skills_news_reports`

```sql
CREATE TABLE IF NOT EXISTS public.skills_news_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    topic TEXT NOT NULL,
    report_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    cost_usd DECIMAL(10, 4),
    num_turns INTEGER
);
```

### TypeScript 타입 정의

**파일 위치**: `src/lib/reports/types.ts`

```typescript
export interface NewsReport {
  metadata: ReportMetadata;
  summary: string;
  keywords: KeywordItem[];
  newsSections: NewsSection[];
  insights: ReportInsights;
}

export interface ReportMetadata {
  slug: string;
  topic: string;
  timestamp: string;
  keywords: string;
  period: string;
  generatedDate: Date;
  tags: string[];
  category: string;
}

export interface KeywordItem {
  term: string;
  description: string;
}

export interface NewsSection {
  title: string;
  articles: NewsArticle[];
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  date: string;
  summary: string;
}

export interface InsightItem {
  title: string;
  description: string;
}

export interface ReportInsights {
  // Legacy business-oriented fields
  positive?: InsightItem[];
  concerns?: InsightItem[];
  opportunities?: InsightItem[];
  strategies?: string[];

  // Political analysis fields
  rulingParty?: InsightItem[];
  opposition?: InsightItem[];
  controversies?: InsightItem[];
  outlook?: InsightItem[];
}
```

---

## 컴포넌트 구조

### 1. 리포트 목록 페이지

**파일**: `src/app/news-report/page.tsx`

**주요 기능**:
- 파일 시스템과 Supabase에서 리포트 목록 가져오기
- DB/파일 출처에 따른 뱃지 표시
- 리포트 카드 UI (제목, 요약, 태그, 메타데이터)

**데이터 로딩**:
```typescript
// 파일 시스템에서 로딩
import { getAllReports } from '@/lib/reports/loader';

// Supabase DB에서 로딩
import { getAllReportsFromDB } from '@/lib/reports/db-loader';

const [fileReports, dbReports] = await Promise.all([
  getAllReports(),
  getAllReportsFromDB(),
]);
```

**UI 구조**:
```
├── Header (제목, 설명)
├── Generate New Report 버튼
├── 리포트 목록
│   ├── 리포트 카드 1
│   │   ├── 제목 (topic)
│   │   ├── 메타데이터 (timestamp, period)
│   │   ├── 태그 + 출처 뱃지 (📤 Supabase / 📄 로컬 파일)
│   │   ├── 요약 (summary, 180자 제한)
│   │   └── 통계 (sections 개수, keywords 개수)
│   ├── 리포트 카드 2
│   └── ...
└── Footer
```

### 2. 리포트 뷰어 (ReportViewSwitcher)

**파일**: `src/components/news-report/ReportViewSwitcher.tsx`

**주요 기능**:
- 일반 뷰 / 뉴스레터 뷰 전환
- PDF 저장 (window.print())
- Supabase 발행 버튼
- 발행 상태 확인 및 토스트 알림

**State 관리**:
```typescript
const [viewMode, setViewMode] = useState<'standard' | 'newsletter'>('standard');
const [isPublished, setIsPublished] = useState(false);
const [isPublishing, setIsPublishing] = useState(false);
const [isCheckingStatus, setIsCheckingStatus] = useState(true);
const [toastMessage, setToastMessage] = useState<{
  type: 'success' | 'error' | 'info',
  text: string
} | null>(null);
```

**발행 상태 확인**:
```typescript
useEffect(() => {
  const checkPublishStatus = async () => {
    try {
      const response = await fetch(`/api/reports/${report.metadata.slug}`);
      if (response.ok) {
        setIsPublished(true);
      }
    } catch (error) {
      setIsPublished(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  checkPublishStatus();
}, [report.metadata.slug]);
```

**발행 API 호출**:
```typescript
const handlePublish = async () => {
  setIsPublishing(true);

  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: report.metadata.slug })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        // Already published
        setIsPublished(true);
        showToast('info', '이미 Supabase에 발행된 리포트입니다');
      } else if (response.status === 503) {
        // Supabase not configured
        showToast('error', 'Supabase가 설정되지 않았습니다');
      } else {
        throw new Error(data.error || '발행에 실패했습니다');
      }
    } else {
      setIsPublished(true);
      showToast('success', '리포트가 Supabase에 발행되었습니다');
    }
  } catch (error: any) {
    showToast('error', `발행 실패: ${error.message}`);
  } finally {
    setIsPublishing(false);
  }
};
```

**UI 구조**:
```
├── 고정 버튼 영역 (우측 상단)
│   ├── 뷰 전환 토글 (일반 뷰 / 뉴스레터)
│   ├── PDF 저장 버튼
│   └── Supabase 발행 버튼
├── 토스트 알림 (상단 중앙)
└── 리포트 콘텐츠
    ├── NewsReportTemplate (일반 뷰)
    └── NewsletterTemplate (뉴스레터 뷰)
```

### 3. 일반 뷰 템플릿 (NewsReportTemplate)

**파일**: `src/components/news-report/NewsReportTemplate.tsx`

**섹션 구조**:
```
├── 헤더
│   ├── 제목 (topic)
│   ├── 메타데이터 (timestamp, period)
│   └── 태그
├── 요약 (Executive Summary)
├── 주요 키워드 (Key Terms)
│   └── 키워드 카드 (term + description)
├── 뉴스 커버리지 (News Coverage)
│   └── 섹션별 기사 목록
│       ├── 섹션 제목
│       └── 기사 카드 (title, source, date, summary, url)
├── 전략적 분석 (Strategic Analysis / Insights)
│   ├── 비즈니스 리포트: positive, concerns, opportunities, strategies
│   └── 정치 리포트: rulingParty, opposition, controversies, outlook
└── 푸터
```

### 4. 뉴스레터 뷰 템플릿 (NewsletterTemplate)

**파일**: `src/components/news-report/NewsletterTemplate.tsx`

**주요 기능**:
- 이메일/카카오톡 형식으로 변환
- 복사 버튼 (HTML, 카카오톡 텍스트)
- 간소화된 레이아웃

**생성 함수**:
```typescript
// HTML 이메일 생성
function generateEmailHTML(report: NewsReport): string

// 카카오톡 텍스트 생성
function generateKakaoText(report: NewsReport): string
```

---

## API 엔드포인트

### 1. GET `/api/reports`

**목적**: 모든 리포트 목록 조회

**Response**:
```json
{
  "success": true,
  "reports": [
    {
      "id": "uuid",
      "slug": "2025-10-28-politics-national-assembly-inspection",
      "topic": "국정감사 후반전: 여야 부동산·캄보디아·APEC 공방",
      "created_at": "2025-10-28T08:20:00.000Z",
      "duration_ms": 152924,
      "cost_usd": "0.5423"
    }
  ]
}
```

### 2. GET `/api/reports/[slug]`

**목적**: 특정 리포트 조회

**Response**:
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "slug": "2025-10-28-politics-national-assembly-inspection",
    "topic": "국정감사 후반전",
    "report_data": {
      "metadata": { /* ... */ },
      "summary": "...",
      "keywords": [ /* ... */ ],
      "newsSections": [ /* ... */ ],
      "insights": { /* ... */ }
    },
    "created_at": "2025-10-28T08:20:00.000Z"
  }
}
```

### 3. POST `/api/reports`

**목적**: 로컬 JSON 파일을 Supabase에 발행

**Request Body**:
```json
{
  "slug": "2025-10-28-politics-national-assembly-inspection"
}
```

**Response (성공)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "2025-10-28-politics-national-assembly-inspection",
    "topic": "국정감사 후반전",
    "created_at": "2025-10-28T08:20:00.000Z"
  }
}
```

**Response (실패)**:
```json
{
  "success": false,
  "error": "Report with this slug already exists"
}
```

**상태 코드**:
- `200`: 성공
- `400`: 잘못된 요청 (slug 누락)
- `404`: 파일을 찾을 수 없음
- `409`: 중복 (이미 발행됨)
- `503`: Supabase 미설정

---

## 스타일 시스템

### CSS Variables (Autumn Warmth Theme)

**파일**: `src/app/globals.css`

```css
:root {
  /* Primary colors */
  --autumn-primary: #D2691E;      /* Chocolate */
  --autumn-secondary: #CD853F;    /* Peru */
  --autumn-accent: #F4A460;       /* Sandy Brown */
  --autumn-dark: #8B4513;         /* Saddle Brown */
  --autumn-light: #FAEBD7;        /* Antique White */
  --autumn-background: #FFF8F0;   /* Off White */

  /* RGB values for opacity */
  --autumn-primary-rgb: 210, 105, 30;
  --autumn-secondary-rgb: 205, 133, 63;
  --autumn-accent-rgb: 244, 164, 96;
  --autumn-dark-rgb: 139, 69, 19;
}
```

### 주요 스타일 패턴

**그라데이션**:
```css
background: linear-gradient(135deg, var(--autumn-primary) 0%, var(--autumn-secondary) 100%);
```

**카드 스타일**:
```css
background: white;
border-left: 4px solid var(--autumn-primary);
border: 1px solid rgba(var(--autumn-dark-rgb), 0.08);
```

**버튼 스타일**:
```css
/* 활성 상태 */
background: linear-gradient(135deg, var(--autumn-primary) 0%, var(--autumn-secondary) 100%);
color: white;

/* 비활성 상태 */
background: #9CA3AF;
color: white;
opacity: 0.7;
cursor: not-allowed;
```

**뱃지 스타일**:
```css
/* Supabase (발행됨) */
background: #10B981;
color: white;

/* 로컬 파일 (미발행) */
background: #9CA3AF;
color: white;

/* 태그 */
background: rgba(var(--autumn-secondary-rgb), 0.15);
color: var(--autumn-secondary);
```

---

## 마이그레이션 체크리스트

### 1. 데이터 레이어

- [ ] Supabase 프로젝트 생성 및 설정
- [ ] `skills_news_reports` 테이블 생성 (schema.sql 실행)
- [ ] Supabase 클라이언트 라이브러리 설치
  - Next.js/React: `@supabase/supabase-js`
  - Vue: `@supabase/supabase-js`
  - 기타: Supabase REST API 직접 호출
- [ ] 환경 변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY)

### 2. API 레이어

- [ ] GET `/api/reports` 엔드포인트 구현
- [ ] GET `/api/reports/[slug]` 엔드포인트 구현
- [ ] POST `/api/reports` 엔드포인트 구현
- [ ] 에러 처리 로직 구현 (404, 409, 503 등)

### 3. UI 컴포넌트

#### 리포트 목록 페이지
- [ ] 리포트 목록 조회 로직
- [ ] 리포트 카드 컴포넌트
- [ ] 출처 뱃지 (Supabase / 로컬 파일)
- [ ] 태그 표시
- [ ] 페이지네이션 (선택사항)

#### 리포트 뷰어
- [ ] 뷰 전환 토글 (일반 뷰 / 뉴스레터)
- [ ] PDF 저장 버튼
- [ ] Supabase 발행 버튼
- [ ] 발행 상태 확인 로직
- [ ] 토스트 알림 시스템

#### 일반 뷰 템플릿
- [ ] 헤더 (제목, 메타데이터, 태그)
- [ ] 요약 섹션
- [ ] 키워드 섹션
- [ ] 뉴스 커버리지 섹션
- [ ] 인사이트 섹션 (비즈니스 / 정치 구분)
- [ ] 푸터

#### 뉴스레터 뷰 템플릿
- [ ] HTML 이메일 생성 함수
- [ ] 카카오톡 텍스트 생성 함수
- [ ] 복사 버튼 (클립보드 API)
- [ ] 미리보기 화면

### 4. 스타일링

- [ ] CSS Variables 정의
- [ ] 테마 색상 적용
- [ ] 반응형 디자인 (모바일 / 데스크톱)
- [ ] 프린트 스타일 (@media print)
- [ ] 토스트 알림 애니메이션

### 5. 기능 테스트

- [ ] 리포트 목록 로딩 테스트
- [ ] 리포트 상세 보기 테스트
- [ ] 뷰 전환 테스트
- [ ] PDF 저장 테스트
- [ ] Supabase 발행 테스트
  - [ ] 최초 발행
  - [ ] 중복 발행 방지
  - [ ] 에러 처리
- [ ] 발행 상태 뱃지 표시 테스트
- [ ] 토스트 알림 테스트

### 6. 최적화 (선택사항)

- [ ] 이미지 최적화
- [ ] 코드 스플리팅
- [ ] 로딩 스켈레톤 UI
- [ ] 무한 스크롤 / 페이지네이션
- [ ] 검색 기능
- [ ] 필터링 기능 (태그, 카테고리, 날짜)

---

## 프레임워크별 마이그레이션 가이드

### React (Create React App / Vite)

**필요한 라이브러리**:
```bash
npm install @supabase/supabase-js
npm install react-router-dom  # 라우팅
```

**Supabase 클라이언트 설정**:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**데이터 로딩 예시**:
```typescript
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function ReportList() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    async function loadReports() {
      const { data, error } = await supabase
        .from('skills_news_reports')
        .select('id, slug, topic, created_at')
        .order('created_at', { ascending: false });

      if (!error) {
        setReports(data);
      }
    }

    loadReports();
  }, []);

  return (
    <div>
      {reports.map(report => (
        <div key={report.id}>{report.topic}</div>
      ))}
    </div>
  );
}
```

### Vue 3 (Composition API)

**필요한 라이브러리**:
```bash
npm install @supabase/supabase-js
npm install vue-router  # 라우팅
```

**Supabase 클라이언트 설정**:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**데이터 로딩 예시**:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';

const reports = ref([]);

onMounted(async () => {
  const { data, error } = await supabase
    .from('skills_news_reports')
    .select('id, slug, topic, created_at')
    .order('created_at', { ascending: false });

  if (!error) {
    reports.value = data;
  }
});
</script>

<template>
  <div>
    <div v-for="report in reports" :key="report.id">
      {{ report.topic }}
    </div>
  </div>
</template>
```

### 순수 HTML + JavaScript

**Supabase CDN 사용**:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const { createClient } = supabase;

  const supabaseUrl = 'YOUR_SUPABASE_URL';
  const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

  async function loadReports() {
    const { data, error } = await supabaseClient
      .from('skills_news_reports')
      .select('id, slug, topic, created_at')
      .order('created_at', { ascending: false });

    if (!error) {
      renderReports(data);
    }
  }

  function renderReports(reports) {
    const container = document.getElementById('reports');
    container.innerHTML = reports.map(report => `
      <div class="report-card">
        <h3>${report.topic}</h3>
        <p>${report.created_at}</p>
      </div>
    `).join('');
  }

  loadReports();
</script>
```

---

## 참고 파일 목록

### 필수 파일
- `src/lib/reports/types.ts` - TypeScript 타입 정의
- `src/lib/supabase/client.ts` - Supabase 클라이언트 설정
- `src/lib/reports/db-loader.ts` - DB에서 리포트 로딩
- `src/components/news-report/ReportViewSwitcher.tsx` - 뷰어 메인 컴포넌트
- `src/components/news-report/NewsReportTemplate.tsx` - 일반 뷰 템플릿
- `src/components/news-report/NewsletterTemplate.tsx` - 뉴스레터 템플릿
- `src/app/news-report/page.tsx` - 리포트 목록 페이지
- `src/app/globals.css` - 전역 스타일 (CSS Variables)
- `supabase/schema.sql` - 데이터베이스 스키마

### API 라우트
- `src/app/api/reports/route.ts` - GET/POST 리포트 목록
- `src/app/api/reports/[slug]/route.ts` - GET 특정 리포트

---

## 문제 해결

### Q: Supabase 연결이 안 됩니다
**A**: 환경 변수가 제대로 설정되었는지 확인하세요. Next.js는 `NEXT_PUBLIC_` 접두사가 필요합니다.

### Q: 발행 버튼이 계속 로딩 상태입니다
**A**: 브라우저 콘솔에서 네트워크 요청을 확인하세요. API 엔드포인트가 올바른지 확인하세요.

### Q: 정치 리포트가 뉴스레터에서 제대로 표시되지 않습니다
**A**: `NewsletterTemplate.tsx`의 `isPoliticalReport` 감지 로직을 확인하세요. `insights.rulingParty` 등이 존재하는지 확인합니다.

### Q: PDF 저장 시 스타일이 깨집니다
**A**: `@media print` 스타일을 추가하고 `.print:hidden` 클래스를 버튼에 적용하세요.

---

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [TypeScript 문서](https://www.typescriptlang.org/docs/)

---

## 버전 정보

- 문서 버전: 1.0.0
- 작성일: 2025-10-28
- 최종 수정일: 2025-10-28
- Next.js 버전: 15.x
- Supabase JS 버전: 2.x
- TypeScript 버전: 5.x
