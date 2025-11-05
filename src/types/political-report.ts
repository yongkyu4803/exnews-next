/**
 * 정치 뉴스 리포트 타입 정의
 *
 * pol_news.md 문서를 기반으로 생성됨
 */

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
  generatedDate: Date | string;
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

/**
 * Supabase DB 스키마: skills_news_reports 테이블
 */
export interface SupabaseNewsReport {
  id: string;
  slug: string;
  topic: string;
  report_data: NewsReport;
  created_at: string;
  duration_ms?: number;
  cost_usd?: number;
  num_turns?: number;
}

/**
 * 리포트 목록 아이템 (간소화된 버전)
 */
export interface ReportListItem {
  id: string;
  slug: string;
  topic: string;
  created_at: string;
  duration_ms?: number;
  cost_usd?: string;
  tags?: string[];
  category?: string;
  summary?: string;
  keywords?: string[];
  source: 'supabase' | 'local';
}

/**
 * 뷰 모드 타입
 */
export type ViewMode = 'standard' | 'newsletter';

/**
 * 정치 리포트 판별 헬퍼 함수
 */
export function isPoliticalReport(report: NewsReport): boolean {
  return !!(
    report.insights.rulingParty ||
    report.insights.opposition ||
    report.insights.controversies ||
    report.insights.outlook
  );
}

/**
 * 비즈니스 리포트 판별 헬퍼 함수
 */
export function isBusinessReport(report: NewsReport): boolean {
  return !!(
    report.insights.positive ||
    report.insights.concerns ||
    report.insights.opportunities ||
    report.insights.strategies
  );
}
