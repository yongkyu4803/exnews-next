# 법안 모니터링 뷰어 마이그레이션 가이드

발행된 법안 분석 리포트를 다른 Next.js 애플리케이션에서 표시하기 위한 완전한 마이그레이션 가이드입니다.

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [환경 설정](#환경-설정)
4. [필수 파일 복사](#필수-파일-복사)
5. [API 라우트](#api-라우트)
6. [페이지 컴포넌트](#페이지-컴포넌트)
7. [배포 체크리스트](#배포-체크리스트)

---

## 시스템 개요

### 아키텍처

```
[bills-monitor 스킬]
    ↓ 생성
[JSON 파일]
    ↓ 발행 버튼 클릭
[Supabase DB]
    ↓ 읽기
[뷰어 애플리케이션]
```

### 특징

- **읽기 전용**: 발행된 리포트만 조회
- **DB 기반**: Supabase에서 데이터 로드
- **자동 업데이트**: 새 리포트 발행 시 자동 반영
- **독립 배포**: 원본 앱과 별도 배포 가능

---

## 데이터베이스 스키마

### 1. bills_monitor_reports (리포트 메타데이터)

발행된 법안 분석 리포트의 메타정보를 저장합니다.

```sql
CREATE TABLE bills_monitor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                    -- URL 슬러그 (예: "2025-10-29-bills-report-081324")
  report_date DATE NOT NULL,                    -- 리포트 날짜 (예: "2025-10-29")
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 생성 시각
  total_bills INTEGER NOT NULL,                 -- 전체 법안 수
  analyzed_bills INTEGER NOT NULL,              -- 분석된 법안 수
  filtered_bills INTEGER NOT NULL,              -- 필터링된 법안 수
  llm_summary_success INTEGER NOT NULL,         -- LLM 요약 성공 수
  llm_summary_failed INTEGER NOT NULL,          -- LLM 요약 실패 수
  headline TEXT,                                -- 헤드라인
  overview TEXT,                                -- 전체 개요
  key_trends JSONB,                             -- 주요 트렌드 배열
  statistics JSONB,                             -- 통계 데이터
  is_published BOOLEAN DEFAULT false,           -- 발행 여부
  published_at TIMESTAMP WITH TIME ZONE,        -- 발행 일시
  source_json_path TEXT,                        -- 원본 JSON 경로
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**주요 필드 설명**:

- `slug`: 리포트 고유 식별자, URL에 사용
- `statistics`: JSONB 형식의 통계 데이터
  ```json
  {
    "regulation": {
      "new": 5,          // 신설 규제
      "strengthen": 12,  // 강화 규제
      "relax": 6,        // 완화 규제
      "non_regulatory": 13 // 비규제
    },
    "domain": {
      "political": 4,       // 정치/행정
      "economic": 18,       // 경제/재정
      "social": 11,         // 사회/복지
      "administrative": 3   // 행정/법무
    },
    "classification": {
      "enactment": 0,        // 제정
      "full_revision": 0,    // 전부개정
      "partial_revision": 37 // 일부개정
    }
  }
  ```
- `key_trends`: 문자열 배열
  ```json
  [
    "직장인과 서민을 위한 세제 혜택이 5년 연장됩니다...",
    "가상자산 해외송금이 정부 규제 대상이 됩니다...",
    "가정폭력 피해자 보호가 한층 강화됩니다..."
  ]
  ```

**인덱스**:
```sql
CREATE INDEX idx_bills_monitor_reports_date ON bills_monitor_reports(report_date DESC);
CREATE INDEX idx_bills_monitor_reports_generated ON bills_monitor_reports(generated_at DESC);
CREATE INDEX idx_bills_monitor_reports_slug ON bills_monitor_reports(slug);
CREATE INDEX idx_bills_monitor_reports_published ON bills_monitor_reports(is_published, published_at DESC);
```

### 2. bills_monitor_bills (개별 법안 데이터)

리포트에 포함된 개별 법안의 상세 정보를 저장합니다.

```sql
CREATE TABLE bills_monitor_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES bills_monitor_reports(id) ON DELETE CASCADE,
  bill_id TEXT NOT NULL,                        -- 법안 ID (bill_no와 동일)
  bill_no TEXT NOT NULL,                        -- 의안번호
  bill_name TEXT NOT NULL,                      -- 법안명
  proposer TEXT NOT NULL,                       -- 제안자
  proposal_date DATE NOT NULL,                  -- 발의일
  committee TEXT,                               -- 소관위원회
  link_url TEXT,                                -- 국회 링크
  domain TEXT CHECK (domain IN ('political', 'economic', 'social', 'administrative', 'unknown')),
  regulation_type TEXT CHECK (regulation_type IN ('신설', '강화', '완화', '비규제')),
  regulation_affected_groups JSONB,             -- 영향받는 그룹
  summary_one_sentence TEXT,                    -- 한 줄 요약
  summary_easy_explanation TEXT,                -- 쉬운 설명
  summary_why_important TEXT,                   -- 중요한 이유
  summary_who_affected TEXT,                    -- 영향 대상
  has_summary BOOLEAN DEFAULT false,            -- 요약 존재 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_id, bill_id)
);
```

**주요 필드 설명**:

- `report_id`: 리포트 테이블과의 외래키
- `domain`: 법안 분야
  - `political`: 정치/행정
  - `economic`: 경제/재정
  - `social`: 사회/복지
  - `administrative`: 행정/법무
- `regulation_type`: 규제 유형
  - `신설`: 새로운 규제
  - `강화`: 기존 규제 강화
  - `완화`: 기존 규제 완화
  - `비규제`: 규제 아님
- `summary_*`: LLM 생성 요약 정보

**인덱스**:
```sql
CREATE INDEX idx_bills_monitor_bills_report ON bills_monitor_bills(report_id);
CREATE INDEX idx_bills_monitor_bills_domain ON bills_monitor_bills(domain);
CREATE INDEX idx_bills_monitor_bills_regulation ON bills_monitor_bills(regulation_type);
CREATE INDEX idx_bills_monitor_bills_date ON bills_monitor_bills(proposal_date DESC);
CREATE INDEX idx_bills_monitor_bills_bill_id ON bills_monitor_bills(bill_id);
CREATE INDEX idx_bills_monitor_bills_bill_no ON bills_monitor_bills(bill_no);
```

### 3. RLS (Row Level Security) 정책

모든 사용자가 발행된 리포트를 읽을 수 있도록 설정합니다.

```sql
-- RLS 활성화
ALTER TABLE bills_monitor_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills_monitor_bills ENABLE ROW LEVEL SECURITY;

-- Public 읽기 정책 (누구나 읽기 가능)
CREATE POLICY "Allow public read access on reports"
  ON bills_monitor_reports FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on bills"
  ON bills_monitor_bills FOR SELECT
  USING (true);
```

---

## 환경 설정

### 1. 필수 패키지 설치

```bash
npm install @supabase/supabase-js
```

### 2. 환경 변수 설정 (.env.local)

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Supabase 정보 확인 방법**:
1. Supabase 대시보드 → Settings → API
2. `URL`과 `anon` 키 복사

---

## 필수 파일 복사

뷰어 애플리케이션에 복사해야 할 파일 목록입니다.

### 1. Supabase 클라이언트

**위치**: `src/lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create client if environment variables are present
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;
```

### 2. 타입 정의

**위치**: `src/lib/bills/types.ts`

```typescript
export interface BillReportSummary {
  slug: string;
  metadata: {
    report_date: string;
    generated_at: string;
    total_bills: number;
    analyzed_bills: number;
    filtered_bills: number;
  };
  summary: {
    headline: string;
    overview: string;
    key_trends: string[];
  };
  statistics: {
    regulation: {
      new: number;
      strengthen: number;
      relax: number;
      non_regulatory: number;
    };
    domain: {
      political: number;
      economic: number;
      social: number;
      administrative: number;
    };
  };
  source?: 'db' | 'file';
}

export interface BillDetail {
  id: string;
  bill_no: string;
  bill_name: string;
  proposer: string;
  proposal_date: string;
  link_url?: string;
  domain: 'political' | 'economic' | 'social' | 'administrative' | 'unknown';
  regulation_type: '신설' | '강화' | '완화' | '비규제' | null;
  summary_one_sentence?: string;
  summary_easy_explanation?: string;
  summary_why_important?: string;
  summary_who_affected?: string;
  has_summary: boolean;
}

export interface BillReportDetail extends BillReportSummary {
  bills: BillDetail[];
}
```

### 3. 데이터 로더

**위치**: `src/lib/bills/loader.ts`

```typescript
import { supabase } from '@/lib/supabase/client';
import { BillReportSummary, BillReportDetail } from './types';

/**
 * 발행된 법안 리포트 목록 조회 (DB only)
 */
export async function getAllPublishedReports(): Promise<BillReportSummary[]> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: reports, error } = await supabase
    .from('bills_monitor_reports')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }

  if (!reports) return [];

  return reports.map((report) => ({
    slug: report.slug,
    metadata: {
      report_date: report.report_date,
      generated_at: report.generated_at,
      total_bills: report.total_bills,
      analyzed_bills: report.analyzed_bills,
      filtered_bills: report.filtered_bills
    },
    summary: {
      headline: report.headline || '',
      overview: report.overview || '',
      key_trends: (report.key_trends as string[]) || []
    },
    statistics: (report.statistics as any) || {
      regulation: { new: 0, strengthen: 0, relax: 0, non_regulatory: 0 },
      domain: { political: 0, economic: 0, social: 0, administrative: 0 }
    },
    source: 'db'
  }));
}

/**
 * 특정 법안 리포트 상세 조회 (DB only)
 */
export async function getPublishedReport(slug: string): Promise<BillReportDetail | null> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  // 1. 리포트 조회
  const { data: report, error: reportError } = await supabase
    .from('bills_monitor_reports')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (reportError || !report) {
    console.error('Error fetching report:', reportError);
    return null;
  }

  // 2. 법안 목록 조회
  const { data: bills, error: billsError } = await supabase
    .from('bills_monitor_bills')
    .select('*')
    .eq('report_id', report.id)
    .order('created_at', { ascending: true });

  if (billsError) {
    console.error('Error fetching bills:', billsError);
    return null;
  }

  return {
    slug: report.slug,
    metadata: {
      report_date: report.report_date,
      generated_at: report.generated_at,
      total_bills: report.total_bills,
      analyzed_bills: report.analyzed_bills,
      filtered_bills: report.filtered_bills
    },
    summary: {
      headline: report.headline || '',
      overview: report.overview || '',
      key_trends: (report.key_trends as string[]) || []
    },
    statistics: (report.statistics as any) || {
      regulation: { new: 0, strengthen: 0, relax: 0, non_regulatory: 0 },
      domain: { political: 0, economic: 0, social: 0, administrative: 0 }
    },
    bills: bills?.map(bill => ({
      id: bill.id,
      bill_no: bill.bill_no,
      bill_name: bill.bill_name,
      proposer: bill.proposer,
      proposal_date: bill.proposal_date,
      link_url: bill.link_url || undefined,
      domain: bill.domain as any,
      regulation_type: bill.regulation_type as any,
      summary_one_sentence: bill.summary_one_sentence || undefined,
      summary_easy_explanation: bill.summary_easy_explanation || undefined,
      summary_why_important: bill.summary_why_important || undefined,
      summary_who_affected: bill.summary_who_affected || undefined,
      has_summary: bill.has_summary
    })) || [],
    source: 'db'
  };
}
```

---

## API 라우트

### 1. 리포트 목록 API

**위치**: `src/app/api/bills/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getAllPublishedReports } from '@/lib/bills/loader';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reports = await getAllPublishedReports();

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
```

### 2. 리포트 상세 API

**위치**: `src/app/api/bills/[slug]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPublishedReport } from '@/lib/bills/loader';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const report = await getPublishedReport(slug);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
```

---

## 페이지 컴포넌트

### 1. 리스트 페이지

**위치**: `src/app/bills/page.tsx`

```typescript
import { getAllPublishedReports } from '@/lib/bills/loader';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BillsListPage() {
  const reports = await getAllPublishedReports();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            📜 법안 모니터링
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            발행된 법안 분석 리포트
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {reports.length === 0 ? (
          <div className="bg-white border p-8 text-center rounded">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-lg font-bold mb-1 text-gray-900">
              발행된 리포트가 없습니다
            </h2>
            <p className="text-sm text-gray-600">
              리포트가 발행되면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                전체 리포트 ({reports.length}개)
              </h2>
            </div>

            {reports.map((report) => (
              <Link
                key={report.slug}
                href={`/bills/${report.slug}`}
                className="block"
              >
                <article className="bg-white border-l-4 border-blue-500 p-4 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-blue-600 hover:underline">
                          {report.metadata.report_date} 법안 발의 동향
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {new Date(report.metadata.generated_at).toLocaleString('ko-KR', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} 분석
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500 text-white">
                          📤 발행됨
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs mb-3 text-gray-600">
                        <span>총 {report.metadata.total_bills}건</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          신설 {report.statistics.regulation.new}건
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          강화 {report.statistics.regulation.strengthen}건
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          완화 {report.statistics.regulation.relax}건
                        </span>
                      </div>

                      {/* Overview */}
                      {report.summary && (
                        <p className="text-sm leading-relaxed mb-3 text-gray-700">
                          {report.summary.overview.slice(0, 150)}
                          {report.summary.overview.length > 150 ? '...' : ''}
                        </p>
                      )}

                      {/* Key Trends */}
                      {report.summary?.key_trends && report.summary.key_trends.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {report.summary.key_trends.slice(0, 3).map((trend, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                            >
                              {trend.slice(0, 50)}...
                            </span>
                          ))}
                          {report.summary.key_trends.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{report.summary.key_trends.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>분석 {report.metadata.analyzed_bills}건</span>
                      <span>•</span>
                      <span>규제 {report.statistics.regulation.new + report.statistics.regulation.strengthen + report.statistics.regulation.relax}건</span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                      상세보기 →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p className="uppercase tracking-wide">
            Generated by bills-monitor skill
          </p>
        </footer>
      </main>
    </div>
  );
}
```

### 2. 상세 페이지

**위치**: `src/app/bills/[slug]/page.tsx`

```typescript
import { getPublishedReport } from '@/lib/bills/loader';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BillDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const report = await getPublishedReport(slug);

  if (!report) {
    notFound();
  }

  // Group bills by regulation type
  const newRegulations = report.bills.filter(b => b.regulation_type === '신설');
  const strengthened = report.bills.filter(b => b.regulation_type === '강화');
  const relaxed = report.bills.filter(b => b.regulation_type === '완화');
  const nonRegulatory = report.bills.filter(b => b.regulation_type === '비규제' || !b.regulation_type);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📜 {report.metadata.report_date} 법안 발의 동향
              </h1>
              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                <span>{report.metadata.report_date}</span>
                <span>•</span>
                <span>총 {report.metadata.total_bills}건</span>
                <span>•</span>
                <span>분석 {report.metadata.analyzed_bills}건</span>
              </div>
            </div>
            <Link href="/bills" className="text-blue-600 text-sm hover:underline">
              ← 목록
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Overview */}
        <div className="bg-white p-6 rounded shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-3 text-gray-900">
            {report.summary.headline}
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {report.summary.overview}
          </p>
        </div>

        {/* Key Trends */}
        {report.summary.key_trends.length > 0 && (
          <div className="bg-white p-6 rounded shadow-sm mb-6">
            <h3 className="text-lg font-bold mb-3 text-gray-900">주요 트렌드</h3>
            <div className="space-y-2">
              {report.summary.key_trends.map((trend, i) => (
                <div key={i} className="p-3 bg-blue-50 rounded text-sm text-gray-700">
                  {i + 1}. {trend}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-sm font-bold mb-3 text-gray-700">⚖️ 규제 현황</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded bg-red-50">
                <div className="text-xs text-gray-600 mb-1">🆕 신설</div>
                <div className="text-2xl font-bold text-red-600">
                  {report.statistics.regulation.new}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-amber-50">
                <div className="text-xs text-gray-600 mb-1">⬆️ 강화</div>
                <div className="text-2xl font-bold text-amber-600">
                  {report.statistics.regulation.strengthen}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-green-50">
                <div className="text-xs text-gray-600 mb-1">⬇️ 완화</div>
                <div className="text-2xl font-bold text-green-600">
                  {report.statistics.regulation.relax}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-gray-50">
                <div className="text-xs text-gray-600 mb-1">📘 일반</div>
                <div className="text-2xl font-bold text-gray-600">
                  {report.statistics.regulation.non_regulatory}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-sm font-bold mb-3 text-gray-700">📂 분야별 현황</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded bg-purple-50">
                <div className="text-xs text-gray-600 mb-1">정치</div>
                <div className="text-2xl font-bold text-purple-600">
                  {report.statistics.domain.political}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-blue-50">
                <div className="text-xs text-gray-600 mb-1">경제</div>
                <div className="text-2xl font-bold text-blue-600">
                  {report.statistics.domain.economic}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-green-50">
                <div className="text-xs text-gray-600 mb-1">사회</div>
                <div className="text-2xl font-bold text-green-600">
                  {report.statistics.domain.social}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-gray-50">
                <div className="text-xs text-gray-600 mb-1">행정</div>
                <div className="text-2xl font-bold text-gray-600">
                  {report.statistics.domain.administrative}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bills by regulation type */}
        <div className="space-y-6">
          {newRegulations.length > 0 && (
            <BillSection
              title="🆕 신설 규제"
              bills={newRegulations}
              color="red"
            />
          )}

          {strengthened.length > 0 && (
            <BillSection
              title="⬆️ 강화 규제"
              bills={strengthened}
              color="amber"
            />
          )}

          {relaxed.length > 0 && (
            <BillSection
              title="⬇️ 완화 규제"
              bills={relaxed}
              color="green"
            />
          )}

          {nonRegulatory.length > 0 && (
            <BillSection
              title="📘 비규제/일반 법안"
              bills={nonRegulatory}
              color="gray"
            />
          )}
        </div>
      </main>
    </div>
  );
}

function BillSection({
  title,
  bills,
  color
}: {
  title: string;
  bills: any[];
  color: string;
}) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    green: 'bg-green-50 border-green-200',
    gray: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <h3 className="text-lg font-bold mb-4 text-gray-900">
        {title} ({bills.length}건)
      </h3>
      <div className="space-y-3">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className={`p-4 rounded border ${colorClasses[color as keyof typeof colorClasses]}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-gray-900">{bill.bill_name}</h4>
              {bill.link_url && (
                <a
                  href={bill.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  국회 링크 →
                </a>
              )}
            </div>
            <div className="text-xs text-gray-600 mb-2">
              <span>{bill.proposer}</span>
              <span className="mx-2">•</span>
              <span>{bill.bill_no}</span>
            </div>
            {bill.has_summary && (
              <div className="space-y-2 mt-3">
                {bill.summary_one_sentence && (
                  <p className="text-sm text-gray-700">
                    <strong>요약:</strong> {bill.summary_one_sentence}
                  </p>
                )}
                {bill.summary_easy_explanation && (
                  <p className="text-sm text-gray-700">
                    <strong>설명:</strong> {bill.summary_easy_explanation}
                  </p>
                )}
                {bill.summary_why_important && (
                  <p className="text-sm text-gray-700">
                    <strong>중요성:</strong> {bill.summary_why_important}
                  </p>
                )}
                {bill.summary_who_affected && (
                  <p className="text-sm text-gray-700">
                    <strong>영향:</strong> {bill.summary_who_affected}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 배포 체크리스트

### 1. 환경 설정 확인

- [ ] `.env.local` 파일에 Supabase URL과 anon key 설정
- [ ] 프로덕션 환경 변수 설정 (Vercel/Netlify 등)

### 2. 데이터베이스 설정

- [ ] Supabase 프로젝트 생성
- [ ] SQL 마이그레이션 실행 (`001_create_bills_monitor_tables.sql`)
- [ ] RLS 정책 활성화 확인
- [ ] Public 읽기 권한 확인

### 3. 코드 복사

- [ ] `src/lib/supabase/client.ts` 복사
- [ ] `src/lib/bills/types.ts` 복사
- [ ] `src/lib/bills/loader.ts` 복사 (뷰어용 버전)
- [ ] API 라우트 생성
- [ ] 페이지 컴포넌트 생성

### 4. 패키지 설치

- [ ] `@supabase/supabase-js` 설치
- [ ] 기타 필요한 패키지 설치

### 5. 테스트

- [ ] 로컬 환경에서 리포트 목록 표시 확인
- [ ] 로컬 환경에서 리포트 상세 표시 확인
- [ ] DB에서 데이터 로드 확인
- [ ] 에러 처리 확인

### 6. 배포

- [ ] 프로덕션 빌드 테스트 (`npm run build`)
- [ ] 프로덕션 환경에 배포
- [ ] 배포 후 동작 확인

---

## 트러블슈팅

### Supabase 연결 오류

**증상**: "Supabase is not configured" 에러

**해결**:
```bash
# .env.local 파일 확인
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 개발 서버 재시작
npm run dev
```

### 리포트가 표시되지 않음

**증상**: 빈 목록 표시

**해결**:
1. Supabase 대시보드에서 데이터 확인
2. `is_published = true` 확인
3. RLS 정책 확인
4. 브라우저 콘솔에서 에러 확인

### API 404 에러

**증상**: `/api/bills` 또는 `/api/bills/[slug]` 404 에러

**해결**:
1. API 라우트 파일 경로 확인
2. `export const dynamic = 'force-dynamic'` 설정 확인
3. 개발 서버 재시작

---

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [원본 프로젝트 구조](../README.md)

---

**마지막 업데이트**: 2025-11-01
**버전**: 1.0.0
