# Next.js 뉴스트렌드 뷰어 마이그레이션 가이드

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [Next.js 프로젝트 설정](#nextjs-프로젝트-설정)
5. [Supabase 클라이언트 설정](#supabase-클라이언트-설정)
6. [TypeScript 타입 정의](#typescript-타입-정의)
7. [데이터 페칭 전략](#데이터-페칭-전략)
8. [API 라우트 구현](#api-라우트-구현)
9. [컴포넌트 구조](#컴포넌트-구조)
10. [UI 구현 예시](#ui-구현-예시)
11. [단계별 구현 가이드](#단계별-구현-가이드)
12. [배포 가이드](#배포-가이드)

---

## 프로젝트 개요

### 목적
Django 기반 뉴스트렌드 분석 시스템의 데이터를 Next.js 프로젝트에서 조회하고 표시하는 독립적인 뷰어 애플리케이션 구축

### 주요 기능
- ✅ 뉴스트렌드 분석 결과 목록 조회 (페이지네이션)
- ✅ 분석 결과 상세 보기 (주제별 기사 포함)
- ✅ 검색 및 필터링
- ✅ 반응형 UI (모바일/데스크톱)
- ✅ 실시간 데이터 동기화

### 기술 스택
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **Date Handling**: date-fns, date-fns-tz
- **Deployment**: Vercel

---

## 시스템 아키텍처

### 현재 Django 시스템
```
[사용자] → [Django Views] → [Supabase PostgreSQL]
                ↓
         [news_analysis]
         [analysis_topic]
         [analysis_article]
```

### 새로운 Next.js 시스템
```
[사용자] → [Next.js App] → [Supabase Direct Client] → [Supabase PostgreSQL]
              ↓                                              ↓
         [React Components]                          [news_analysis]
              ↓                                       [analysis_topic]
         [SWR Cache]                                 [analysis_article]
```

### 데이터 흐름
1. **Next.js 클라이언트**에서 Supabase 직접 연결
2. **Server Components**에서 초기 데이터 로드 (SSR)
3. **Client Components**에서 실시간 업데이트 (SWR)
4. **API Routes** (선택사항): 복잡한 데이터 조인 처리

### Supabase 연결 정보
- **URL**: `https://bwgndhxhnduoouodxngw.supabase.co`
- **Database**: PostgreSQL (2번 프로젝트)
- **Authentication**: Anon Key (읽기 전용) 또는 Service Role Key (전체 권한)

---

## 데이터베이스 스키마

### ERD (Entity Relationship Diagram)

```
┌─────────────────────┐
│   news_analysis     │
├─────────────────────┤
│ id (uuid) PK        │
│ query (varchar)     │
│ analysis_type (str) │
│ analyzed_at (ts)    │
│ user_id (uuid) FK   │
│ llm_model (varchar) │
│ raw_response (text) │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│  analysis_topic     │
├─────────────────────┤
│ id (uuid) PK        │
│ analysis_id (uuid)  │◄── FK
│ topic_number (int)  │
│ topic_title (str)   │
│ topic_summary (text)│
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│ analysis_article    │
├─────────────────────┤
│ id (uuid) PK        │
│ topic_id (uuid)     │◄── FK
│ article_number (int)│
│ title (varchar)     │
│ media (varchar)     │
│ pubdate (timestamp) │
│ link (text)         │
│ content (text)      │
└─────────────────────┘
```

### 테이블 상세

#### 1. `news_analysis` (메인 분석 테이블)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY | 분석 고유 ID |
| `query` | VARCHAR(200) | NOT NULL | 검색어/분석 주제 |
| `analysis_type` | VARCHAR(20) | DEFAULT 'news' | 분석 타입 (news, editorial) |
| `analyzed_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | 분석 시각 (KST) |
| `user_id` | UUID | FOREIGN KEY | 사용자 ID (auth.users) |
| `llm_model` | VARCHAR(50) | DEFAULT 'GPT-4' | 사용된 LLM 모델명 |
| `raw_response` | TEXT | NULLABLE | LLM 원본 응답 JSON |

**인덱스**:
- `idx_news_analysis_analyzed_at` ON `analyzed_at DESC`
- `idx_news_analysis_user_id` ON `user_id`

#### 2. `analysis_topic` (분석 주제 테이블)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY | 주제 고유 ID |
| `analysis_id` | UUID | FOREIGN KEY → news_analysis(id) | 분석 참조 |
| `topic_number` | INTEGER | NOT NULL | 주제 순번 (1, 2, 3...) |
| `topic_title` | VARCHAR(200) | NOT NULL | 주제 제목 |
| `topic_summary` | TEXT | NOT NULL | 주제 요약 (5문장 이내) |

**유니크 제약**:
- UNIQUE (`analysis_id`, `topic_number`)

**인덱스**:
- `idx_analysis_topic_analysis_id` ON `analysis_id`

#### 3. `analysis_article` (주제별 기사 테이블)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY | 기사 고유 ID |
| `topic_id` | UUID | FOREIGN KEY → analysis_topic(id) | 주제 참조 |
| `article_number` | INTEGER | NOT NULL | 기사 순번 (1, 2, 3...) |
| `title` | VARCHAR(500) | NOT NULL | 기사 제목 |
| `media` | VARCHAR(100) | NOT NULL | 언론사명 |
| `pubdate` | TIMESTAMP WITH TIME ZONE | NULLABLE | 발행일시 (KST) |
| `link` | TEXT | NOT NULL | 기사 URL |
| `content` | TEXT | NULLABLE | 기사 본문 (사설용) |

**유니크 제약**:
- UNIQUE (`topic_id`, `article_number`)

**인덱스**:
- `idx_analysis_article_topic_id` ON `topic_id`

### 샘플 데이터 구조

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "AI 규제",
  "analysis_type": "news",
  "analyzed_at": "2025-01-15T14:30:00+09:00",
  "user_id": "user-uuid",
  "llm_model": "GPT-4",
  "topics": [
    {
      "id": "topic-uuid-1",
      "topic_number": 1,
      "topic_title": "주요 키워드와 트렌드 3가지",
      "topic_summary": "AI 규제 법안, 데이터 보호, 알고리즘 투명성...",
      "articles": [
        {
          "id": "article-uuid-1",
          "article_number": 1,
          "title": "정부, AI 규제 법안 발표",
          "media": "조선일보",
          "pubdate": "2025-01-15T10:00:00+09:00",
          "link": "https://example.com/article1"
        }
      ]
    }
  ]
}
```

---

## Next.js 프로젝트 설정

### 1. 프로젝트 초기화

```bash
# Next.js 프로젝트 생성 (TypeScript, App Router, Tailwind CSS)
npx create-next-app@latest newstrend-viewer \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd newstrend-viewer
```

### 2. 필수 패키지 설치

```bash
# Supabase 클라이언트
npm install @supabase/supabase-js

# 데이터 페칭 (SWR)
npm install swr

# 날짜 처리
npm install date-fns date-fns-tz

# UI 라이브러리 (선택사항)
npm install @headlessui/react @heroicons/react

# 개발 도구
npm install -D @types/node
```

### 3. 프로젝트 폴더 구조

```
newstrend-viewer/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # 루트 레이아웃
│   │   ├── page.tsx                   # 홈페이지
│   │   ├── analysis/
│   │   │   ├── page.tsx              # 분석 목록 페이지
│   │   │   └── [id]/
│   │   │       └── page.tsx          # 분석 상세 페이지
│   │   └── api/
│   │       └── analysis/
│   │           ├── route.ts          # 목록 API
│   │           └── [id]/
│   │               └── route.ts      # 상세 API
│   ├── components/
│   │   ├── analysis/
│   │   │   ├── AnalysisList.tsx      # 분석 목록 컴포넌트
│   │   │   ├── AnalysisCard.tsx      # 분석 카드
│   │   │   ├── AnalysisDetail.tsx    # 분석 상세
│   │   │   ├── TopicSection.tsx      # 주제 섹션
│   │   │   └── ArticleList.tsx       # 기사 목록
│   │   ├── common/
│   │   │   ├── Loading.tsx           # 로딩 컴포넌트
│   │   │   ├── ErrorMessage.tsx      # 에러 메시지
│   │   │   └── Pagination.tsx        # 페이지네이션
│   │   └── layout/
│   │       ├── Header.tsx            # 헤더
│   │       └── Footer.tsx            # 푸터
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Supabase 클라이언트
│   │   │   └── server.ts             # 서버용 클라이언트
│   │   ├── hooks/
│   │   │   ├── useAnalysisList.ts    # 분석 목록 훅
│   │   │   └── useAnalysisDetail.ts  # 분석 상세 훅
│   │   └── utils/
│   │       ├── dateFormat.ts         # 날짜 포맷팅
│   │       └── apiHelpers.ts         # API 헬퍼
│   └── types/
│       ├── analysis.ts                # 분석 타입 정의
│       └── database.ts                # 데이터베이스 타입
├── .env.local                         # 환경 변수 (로컬)
├── .env.production                    # 환경 변수 (프로덕션)
├── next.config.js                     # Next.js 설정
├── tailwind.config.ts                 # Tailwind 설정
└── tsconfig.json                      # TypeScript 설정
```

---

## Supabase 클라이언트 설정

### 1. 환경 변수 설정

**`.env.local`** 파일 생성:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://bwgndhxhnduoouodxngw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 서버 사이드 전용 (선택사항)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. 클라이언트 사이드 Supabase 클라이언트

**`src/lib/supabase/client.ts`**:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 클라이언트 사이드에서만 사용
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false, // 뷰어는 인증 불필요
    },
  }
)
```

### 3. 서버 사이드 Supabase 클라이언트

**`src/lib/supabase/server.ts`**:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 서버 컴포넌트 및 API 라우트에서 사용
export const createServerSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}
```

### 4. Supabase RLS(Row Level Security) 정책 확인

**중요**: Supabase에서 다음 RLS 정책이 설정되어 있어야 합니다:

```sql
-- news_analysis 테이블 읽기 권한
CREATE POLICY "Enable read access for all users"
ON news_analysis FOR SELECT
USING (true);

-- analysis_topic 테이블 읽기 권한
CREATE POLICY "Enable read access for all users"
ON analysis_topic FOR SELECT
USING (true);

-- analysis_article 테이블 읽기 권한
CREATE POLICY "Enable read access for all users"
ON analysis_article FOR SELECT
USING (true);
```

**Supabase Dashboard에서 확인**:
1. `https://supabase.com/dashboard/project/bwgndhxhnduoouodxngw`
2. Authentication → Policies
3. 각 테이블의 SELECT 정책 확인

---

## TypeScript 타입 정의

### 1. 데이터베이스 타입

**`src/types/database.ts`**:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      news_analysis: {
        Row: {
          id: string
          query: string
          analysis_type: 'news' | 'editorial'
          analyzed_at: string
          user_id: string | null
          llm_model: string
          raw_response: string | null
        }
        Insert: {
          id?: string
          query: string
          analysis_type?: 'news' | 'editorial'
          analyzed_at?: string
          user_id?: string | null
          llm_model?: string
          raw_response?: string | null
        }
        Update: {
          id?: string
          query?: string
          analysis_type?: 'news' | 'editorial'
          analyzed_at?: string
          user_id?: string | null
          llm_model?: string
          raw_response?: string | null
        }
      }
      analysis_topic: {
        Row: {
          id: string
          analysis_id: string
          topic_number: number
          topic_title: string
          topic_summary: string
        }
        Insert: {
          id?: string
          analysis_id: string
          topic_number: number
          topic_title: string
          topic_summary: string
        }
        Update: {
          id?: string
          analysis_id?: string
          topic_number?: number
          topic_title?: string
          topic_summary?: string
        }
      }
      analysis_article: {
        Row: {
          id: string
          topic_id: string
          article_number: number
          title: string
          media: string
          pubdate: string | null
          link: string
          content: string | null
        }
        Insert: {
          id?: string
          topic_id: string
          article_number: number
          title: string
          media: string
          pubdate?: string | null
          link: string
          content?: string | null
        }
        Update: {
          id?: string
          topic_id?: string
          article_number?: number
          title?: string
          media?: string
          pubdate?: string | null
          link?: string
          content?: string | null
        }
      }
    }
  }
}
```

### 2. 애플리케이션 타입

**`src/types/analysis.ts`**:

```typescript
// 기사 타입
export interface Article {
  id: string
  article_number: number
  title: string
  media: string
  pubdate: string | null
  link: string
  content?: string | null
}

// 주제 타입
export interface Topic {
  id: string
  topic_number: number
  topic_title: string
  topic_summary: string
  articles: Article[]
}

// 분석 타입 (상세)
export interface Analysis {
  id: string
  query: string
  analysis_type: 'news' | 'editorial'
  analyzed_at: string
  user_id: string | null
  llm_model: string
  raw_response?: string | null
  topics: Topic[]
}

// 분석 타입 (목록용)
export interface AnalysisListItem {
  id: string
  query: string
  analysis_type: 'news' | 'editorial'
  analyzed_at: string
  llm_model: string
  topic_count?: number
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

---

## 데이터 페칭 전략

### 1. SWR 설정

**`src/app/layout.tsx`**:

```typescript
import { SWRConfig } from 'swr'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <SWRConfig
          value={{
            refreshInterval: 30000, // 30초마다 자동 갱신
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 2000,
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  )
}
```

### 2. 커스텀 훅: 분석 목록 조회

**`src/lib/hooks/useAnalysisList.ts`**:

```typescript
import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import type { AnalysisListItem, PaginatedResponse } from '@/types/analysis'

interface UseAnalysisListOptions {
  page?: number
  perPage?: number
  analysisType?: 'news' | 'editorial' | null
}

const fetcher = async (
  _key: string,
  page: number,
  perPage: number,
  analysisType?: 'news' | 'editorial' | null
): Promise<PaginatedResponse<AnalysisListItem>> => {
  const offset = (page - 1) * perPage

  // 기본 쿼리
  let query = supabase
    .from('news_analysis')
    .select('id, query, analysis_type, analyzed_at, llm_model', { count: 'exact' })
    .order('analyzed_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  // 필터 적용
  if (analysisType) {
    query = query.eq('analysis_type', analysisType)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  // 각 분석의 주제 개수 조회 (병렬 처리)
  const dataWithTopicCount = await Promise.all(
    (data || []).map(async (analysis) => {
      const { count: topicCount } = await supabase
        .from('analysis_topic')
        .select('id', { count: 'exact', head: true })
        .eq('analysis_id', analysis.id)

      return {
        ...analysis,
        topic_count: topicCount || 0,
      }
    })
  )

  return {
    data: dataWithTopicCount,
    count: count || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  }
}

export function useAnalysisList(options: UseAnalysisListOptions = {}) {
  const { page = 1, perPage = 10, analysisType = null } = options

  const { data, error, isLoading, mutate } = useSWR(
    ['analysisList', page, perPage, analysisType],
    ([_, p, pp, at]) => fetcher(_, p, pp, at),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    data: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.total_pages || 0,
    isLoading,
    error,
    refresh: mutate,
  }
}
```

### 3. 커스텀 훅: 분석 상세 조회

**`src/lib/hooks/useAnalysisDetail.ts`**:

```typescript
import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import type { Analysis } from '@/types/analysis'

const fetcher = async (analysisId: string): Promise<Analysis> => {
  // 1. 분석 기본 정보 가져오기
  const { data: analysisData, error: analysisError } = await supabase
    .from('news_analysis')
    .select('*')
    .eq('id', analysisId)
    .single()

  if (analysisError) {
    throw new Error(analysisError.message)
  }

  // 2. 주제 정보 가져오기
  const { data: topicsData, error: topicsError } = await supabase
    .from('analysis_topic')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('topic_number', { ascending: true })

  if (topicsError) {
    throw new Error(topicsError.message)
  }

  // 3. 각 주제의 기사 정보 가져오기 (병렬 처리)
  const topicsWithArticles = await Promise.all(
    (topicsData || []).map(async (topic) => {
      const { data: articlesData, error: articlesError } = await supabase
        .from('analysis_article')
        .select('*')
        .eq('topic_id', topic.id)
        .order('article_number', { ascending: true })

      if (articlesError) {
        console.error('Failed to fetch articles:', articlesError)
        return {
          ...topic,
          articles: [],
        }
      }

      return {
        ...topic,
        articles: articlesData || [],
      }
    })
  )

  return {
    ...analysisData,
    topics: topicsWithArticles,
  }
}

export function useAnalysisDetail(analysisId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    analysisId ? ['analysisDetail', analysisId] : null,
    ([_, id]) => fetcher(id),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    analysis: data,
    isLoading,
    error,
    refresh: mutate,
  }
}
```

---

## API 라우트 구현

### 1. 분석 목록 API

**`src/app/api/analysis/route.ts`**:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '10')
    const analysisType = searchParams.get('analysis_type') as 'news' | 'editorial' | null

    const supabase = createServerSupabaseClient()
    const offset = (page - 1) * perPage

    // 쿼리 빌드
    let query = supabase
      .from('news_analysis')
      .select('id, query, analysis_type, analyzed_at, llm_model', { count: 'exact' })
      .order('analyzed_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    if (analysisType) {
      query = query.eq('analysis_type', analysisType)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // 주제 개수 조회
    const dataWithTopicCount = await Promise.all(
      (data || []).map(async (analysis) => {
        const { count: topicCount } = await supabase
          .from('analysis_topic')
          .select('id', { count: 'exact', head: true })
          .eq('analysis_id', analysis.id)

        return {
          ...analysis,
          topic_count: topicCount || 0,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: dataWithTopicCount,
      count: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

### 2. 분석 상세 API

**`src/app/api/analysis/[id]/route.ts`**:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabaseClient()

    // 1. 분석 기본 정보
    const { data: analysisData, error: analysisError } = await supabase
      .from('news_analysis')
      .select('*')
      .eq('id', id)
      .single()

    if (analysisError) {
      return NextResponse.json(
        { success: false, error: analysisError.message },
        { status: 404 }
      )
    }

    // 2. 주제 정보
    const { data: topicsData, error: topicsError } = await supabase
      .from('analysis_topic')
      .select('*')
      .eq('analysis_id', id)
      .order('topic_number', { ascending: true })

    if (topicsError) {
      return NextResponse.json(
        { success: false, error: topicsError.message },
        { status: 500 }
      )
    }

    // 3. 기사 정보 (각 주제별)
    const topicsWithArticles = await Promise.all(
      (topicsData || []).map(async (topic) => {
        const { data: articlesData } = await supabase
          .from('analysis_article')
          .select('*')
          .eq('topic_id', topic.id)
          .order('article_number', { ascending: true })

        return {
          ...topic,
          articles: articlesData || [],
        }
      })
    )

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysisData,
        topics: topicsWithArticles,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

---

## 컴포넌트 구조

### 1. 분석 목록 컴포넌트

**`src/components/analysis/AnalysisList.tsx`**:

```typescript
'use client'

import { useState } from 'react'
import { useAnalysisList } from '@/lib/hooks/useAnalysisList'
import AnalysisCard from './AnalysisCard'
import Loading from '@/components/common/Loading'
import ErrorMessage from '@/components/common/ErrorMessage'
import Pagination from '@/components/common/Pagination'

export default function AnalysisList() {
  const [page, setPage] = useState(1)
  const [analysisType, setAnalysisType] = useState<'news' | 'editorial' | null>(null)

  const { data, count, totalPages, isLoading, error } = useAnalysisList({
    page,
    perPage: 10,
    analysisType,
  })

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error.message} />

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 필터 */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setAnalysisType(null)}
          className={`px-4 py-2 rounded-lg ${
            analysisType === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setAnalysisType('news')}
          className={`px-4 py-2 rounded-lg ${
            analysisType === 'news'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          뉴스 트렌드
        </button>
        <button
          onClick={() => setAnalysisType('editorial')}
          className={`px-4 py-2 rounded-lg ${
            analysisType === 'editorial'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          사설 분석
        </button>
      </div>

      {/* 분석 카드 목록 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map((analysis) => (
          <AnalysisCard key={analysis.id} analysis={analysis} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* 결과 개수 */}
      <p className="mt-4 text-center text-gray-600">
        총 {count}개의 분석 결과
      </p>
    </div>
  )
}
```

### 2. 분석 카드 컴포넌트

**`src/components/analysis/AnalysisCard.tsx`**:

```typescript
'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { AnalysisListItem } from '@/types/analysis'

interface AnalysisCardProps {
  analysis: AnalysisListItem
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const formattedDate = format(
    parseISO(analysis.analyzed_at),
    'yyyy년 MM월 dd일 HH:mm',
    { locale: ko }
  )

  return (
    <Link href={`/analysis/${analysis.id}`}>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        {/* 분석 타입 배지 */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              analysis.analysis_type === 'news'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {analysis.analysis_type === 'news' ? '뉴스 트렌드' : '사설 분석'}
          </span>
          <span className="text-xs text-gray-500">{analysis.llm_model}</span>
        </div>

        {/* 검색어 */}
        <h3 className="mb-2 text-lg font-bold text-gray-900">
          {analysis.query}
        </h3>

        {/* 메타 정보 */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{formattedDate}</span>
          {analysis.topic_count !== undefined && (
            <span className="font-medium">주제 {analysis.topic_count}개</span>
          )}
        </div>
      </div>
    </Link>
  )
}
```

### 3. 분석 상세 컴포넌트

**`src/components/analysis/AnalysisDetail.tsx`**:

```typescript
'use client'

import { useAnalysisDetail } from '@/lib/hooks/useAnalysisDetail'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import TopicSection from './TopicSection'
import Loading from '@/components/common/Loading'
import ErrorMessage from '@/components/common/ErrorMessage'

interface AnalysisDetailProps {
  analysisId: string
}

export default function AnalysisDetail({ analysisId }: AnalysisDetailProps) {
  const { analysis, isLoading, error } = useAnalysisDetail(analysisId)

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error.message} />
  if (!analysis) return <ErrorMessage message="분석 결과를 찾을 수 없습니다." />

  const formattedDate = format(
    parseISO(analysis.analyzed_at),
    'yyyy년 MM월 dd일 HH:mm',
    { locale: ko }
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-full bg-white/20 px-4 py-1 text-sm font-medium">
            {analysis.analysis_type === 'news' ? '뉴스 트렌드 분석' : '사설 분석'}
          </span>
          <span className="text-sm opacity-90">{analysis.llm_model}</span>
        </div>
        <h1 className="mb-3 text-3xl font-bold">{analysis.query}</h1>
        <p className="text-sm opacity-90">{formattedDate}</p>
      </div>

      {/* 주제별 섹션 */}
      <div className="space-y-8">
        {analysis.topics.map((topic) => (
          <TopicSection key={topic.id} topic={topic} />
        ))}
      </div>

      {/* 원본 응답 (개발용) */}
      {process.env.NODE_ENV === 'development' && analysis.raw_response && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-gray-600">
            LLM 원본 응답 보기
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-gray-100 p-4 text-xs">
            {analysis.raw_response}
          </pre>
        </details>
      )}
    </div>
  )
}
```

### 4. 주제 섹션 컴포넌트

**`src/components/analysis/TopicSection.tsx`**:

```typescript
'use client'

import type { Topic } from '@/types/analysis'
import ArticleList from './ArticleList'

interface TopicSectionProps {
  topic: Topic
}

export default function TopicSection({ topic }: TopicSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* 주제 번호 */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
          {topic.topic_number}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{topic.topic_title}</h2>
      </div>

      {/* 주제 요약 */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {topic.topic_summary}
        </p>
      </div>

      {/* 관련 기사 */}
      <ArticleList articles={topic.articles} />
    </div>
  )
}
```

### 5. 기사 목록 컴포넌트

**`src/components/analysis/ArticleList.tsx`**:

```typescript
'use client'

import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Article } from '@/types/analysis'

interface ArticleListProps {
  articles: Article[]
}

export default function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <p className="text-sm text-gray-500">관련 기사가 없습니다.</p>
    )
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        관련 기사 ({articles.length})
      </h3>
      <div className="space-y-3">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            {/* 기사 번호 */}
            <div className="mb-2 flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                {article.article_number}
              </span>
              <div className="flex-1">
                {/* 제목 */}
                <h4 className="mb-1 font-medium text-gray-900">
                  {article.title}
                </h4>

                {/* 메타 정보 */}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium">{article.media}</span>
                  {article.pubdate && (
                    <>
                      <span>•</span>
                      <span>
                        {format(parseISO(article.pubdate), 'MM/dd HH:mm', {
                          locale: ko,
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 외부 링크 아이콘 */}
              <svg
                className="h-5 w-5 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
```

---

## UI 구현 예시

### 1. 공통 컴포넌트: 로딩

**`src/components/common/Loading.tsx`**:

```typescript
export default function Loading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  )
}
```

### 2. 공통 컴포넌트: 에러 메시지

**`src/components/common/ErrorMessage.tsx`**:

```typescript
interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-center gap-3">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 className="font-semibold text-red-900">오류가 발생했습니다</h3>
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  )
}
```

### 3. 공통 컴포넌트: 페이지네이션

**`src/components/common/Pagination.tsx`**:

```typescript
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  // 표시할 페이지 번호 계산 (최대 7개)
  const getVisiblePages = () => {
    if (totalPages <= 7) return pages

    if (currentPage <= 4) {
      return [...pages.slice(0, 5), '...', totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', ...pages.slice(totalPages - 5)]
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ]
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="mt-8 flex justify-center">
      <nav className="flex items-center gap-2">
        {/* 이전 버튼 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          이전
        </button>

        {/* 페이지 번호 */}
        {visiblePages.map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`rounded-lg px-4 py-2 font-medium ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* 다음 버튼 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          다음
        </button>
      </nav>
    </div>
  )
}
```

---

## 단계별 구현 가이드

### Step 1: 프로젝트 설정 (30분)

```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest newstrend-viewer --typescript --tailwind --app

# 2. 디렉토리 이동
cd newstrend-viewer

# 3. 필수 패키지 설치
npm install @supabase/supabase-js swr date-fns date-fns-tz

# 4. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집
```

### Step 2: Supabase 연동 (20분)

```bash
# 1. Supabase 클라이언트 파일 생성
mkdir -p src/lib/supabase
touch src/lib/supabase/client.ts
touch src/lib/supabase/server.ts

# 2. 타입 정의 파일 생성
mkdir -p src/types
touch src/types/database.ts
touch src/types/analysis.ts
```

**작업 내용**:
- Supabase 클라이언트 코드 작성 (위 섹션 참조)
- TypeScript 타입 정의 작성
- 환경 변수 확인 및 테스트

### Step 3: 데이터 페칭 훅 구현 (40분)

```bash
# 1. 훅 디렉토리 생성
mkdir -p src/lib/hooks
touch src/lib/hooks/useAnalysisList.ts
touch src/lib/hooks/useAnalysisDetail.ts
```

**작업 내용**:
- `useAnalysisList` 훅 구현
- `useAnalysisDetail` 훅 구현
- 에러 처리 및 로딩 상태 관리

### Step 4: 공통 컴포넌트 개발 (30분)

```bash
# 1. 공통 컴포넌트 디렉토리 생성
mkdir -p src/components/common
touch src/components/common/Loading.tsx
touch src/components/common/ErrorMessage.tsx
touch src/components/common/Pagination.tsx
```

**작업 내용**:
- Loading, ErrorMessage, Pagination 컴포넌트 작성
- Tailwind CSS 스타일 적용

### Step 5: 분석 컴포넌트 개발 (1시간)

```bash
# 1. 분석 컴포넌트 디렉토리 생성
mkdir -p src/components/analysis
touch src/components/analysis/AnalysisList.tsx
touch src/components/analysis/AnalysisCard.tsx
touch src/components/analysis/AnalysisDetail.tsx
touch src/components/analysis/TopicSection.tsx
touch src/components/analysis/ArticleList.tsx
```

**작업 내용**:
- 각 컴포넌트 구현 (위 섹션 참조)
- Props 타입 정의
- 반응형 레이아웃 적용

### Step 6: 페이지 라우팅 설정 (30분)

```bash
# 1. 페이지 디렉토리 구조 생성
mkdir -p src/app/analysis/[id]
touch src/app/analysis/page.tsx
touch src/app/analysis/[id]/page.tsx
```

**`src/app/analysis/page.tsx`**:
```typescript
import AnalysisList from '@/components/analysis/AnalysisList'

export default function AnalysisListPage() {
  return (
    <main>
      <AnalysisList />
    </main>
  )
}
```

**`src/app/analysis/[id]/page.tsx`**:
```typescript
import AnalysisDetail from '@/components/analysis/AnalysisDetail'

export default function AnalysisDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <main>
      <AnalysisDetail analysisId={params.id} />
    </main>
  )
}
```

### Step 7: API 라우트 구현 (선택사항, 30분)

```bash
# 1. API 라우트 디렉토리 생성
mkdir -p src/app/api/analysis/[id]
touch src/app/api/analysis/route.ts
touch src/app/api/analysis/[id]/route.ts
```

**작업 내용**:
- API 라우트 코드 작성 (위 섹션 참조)
- 에러 처리 및 응답 포맷 통일

### Step 8: 테스트 및 최적화 (1시간)

**테스트 항목**:
- ✅ 분석 목록 조회 동작 확인
- ✅ 페이지네이션 동작 확인
- ✅ 필터링 기능 확인
- ✅ 분석 상세 조회 동작 확인
- ✅ 반응형 레이아웃 확인 (모바일/태블릿/데스크톱)
- ✅ 로딩/에러 상태 확인
- ✅ 날짜 포맷 확인 (KST)

**최적화**:
- 이미지 최적화 (Next.js Image 컴포넌트)
- 코드 스플리팅 (Dynamic Import)
- SWR 캐시 전략 조정
- Lighthouse 성능 측정

---

## 배포 가이드

### 1. Vercel 배포

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 연결 및 배포
vercel

# 4. 프로덕션 배포
vercel --prod
```

### 2. 환경 변수 설정

**Vercel Dashboard**:
1. 프로젝트 설정 → Environment Variables
2. 다음 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (선택사항)

### 3. 도메인 설정

1. Vercel Dashboard → Domains
2. 커스텀 도메인 추가
3. DNS 레코드 설정 (A 또는 CNAME)

### 4. Next.js 설정 최적화

**`next.config.js`**:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화
  images: {
    domains: ['bwgndhxhnduoouodxngw.supabase.co'],
  },

  // 압축 활성화
  compress: true,

  // 성능 최적화
  swcMinify: true,

  // 엄격 모드
  reactStrictMode: true,
}

module.exports = nextConfig
```

### 5. 성능 최적화 체크리스트

- ✅ **서버 컴포넌트 활용**: 가능한 한 Server Components 사용
- ✅ **동적 임포트**: 무거운 컴포넌트는 `dynamic import` 사용
- ✅ **이미지 최적화**: `next/image` 컴포넌트 사용
- ✅ **폰트 최적화**: `next/font` 사용
- ✅ **번들 크기 분석**: `@next/bundle-analyzer` 사용
- ✅ **캐싱 전략**: SWR `staleTime`, `cacheTime` 조정
- ✅ **데이터베이스 인덱스**: Supabase 테이블 인덱스 확인

---

## 추가 고려사항

### 1. 보안

**RLS(Row Level Security) 정책**:
- Supabase에서 읽기 전용 정책 설정
- Service Role Key는 서버 사이드에서만 사용
- Anon Key는 클라이언트에서 사용 가능

**환경 변수 관리**:
- `.env.local` 파일을 `.gitignore`에 추가
- 프로덕션 환경 변수는 Vercel Dashboard에서 관리

### 2. 에러 처리

**전역 에러 핸들러**:
```typescript
// src/app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">문제가 발생했습니다</h2>
        <p className="mb-4 text-gray-600">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
```

### 3. SEO 최적화

**메타데이터**:
```typescript
// src/app/analysis/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '뉴스트렌드 분석 | NewsTrend Viewer',
  description: 'AI 기반 뉴스 트렌드 분석 결과를 확인하세요',
}
```

### 4. 접근성

- **시맨틱 HTML**: 적절한 태그 사용 (`article`, `section`, `nav`)
- **ARIA 속성**: 스크린 리더 지원
- **키보드 네비게이션**: Tab 키로 모든 인터랙션 가능
- **색상 대비**: WCAG AA 기준 준수

---

## 문제 해결 가이드

### 1. Supabase 연결 오류

**증상**: `Failed to connect to Supabase`

**해결 방법**:
1. 환경 변수 확인 (`.env.local`)
2. Supabase URL 및 Anon Key 확인
3. RLS 정책 확인 (읽기 권한)
4. 네트워크 방화벽 확인

### 2. 데이터 조회 실패

**증상**: `Error fetching analysis data`

**해결 방법**:
1. Supabase Dashboard에서 SQL 쿼리 직접 실행
2. 테이블 및 컬럼명 확인
3. Foreign Key 관계 확인
4. 브라우저 콘솔에서 네트워크 요청 확인

### 3. 날짜 포맷 오류

**증상**: `Invalid date format`

**해결 방법**:
1. ISO 8601 포맷 확인 (`2025-01-15T14:30:00+09:00`)
2. `date-fns-tz` 사용하여 타임존 처리
3. Supabase 테이블의 `TIMESTAMP WITH TIME ZONE` 타입 확인

### 4. 성능 문제

**증상**: 페이지 로딩이 느림

**해결 방법**:
1. SWR 캐싱 활성화 확인
2. 불필요한 리렌더링 방지 (`React.memo`, `useMemo`)
3. 데이터베이스 쿼리 최적화 (인덱스 추가)
4. `next/image`로 이미지 최적화
5. 번들 크기 분석 (`@next/bundle-analyzer`)

---

## 참고 자료

### 공식 문서
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [SWR Documentation](https://swr.vercel.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [date-fns Documentation](https://date-fns.org/docs)

### 커뮤니티
- [Next.js Discord](https://discord.com/invite/nextjs)
- [Supabase Discord](https://discord.supabase.com/)

### 도구
- [Vercel](https://vercel.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

---

## 라이센스 및 크레딧

이 마이그레이션 가이드는 Django 뉴스트렌드 분석 시스템의 데이터를 Next.js에서 활용하기 위해 작성되었습니다.

**작성일**: 2025년 1월
**버전**: 1.0.0
**대상 독자**: Next.js 및 TypeScript 중급 개발자

---

## 마치며

이 가이드를 따라하면 약 **4-6시간** 안에 완전히 동작하는 뉴스트렌드 뷰어를 구축할 수 있습니다.

궁금한 점이나 문제가 발생하면 위 [문제 해결 가이드](#문제-해결-가이드)를 참조하거나, 프로젝트 이슈를 생성해주세요.

**Happy Coding! 🚀**
