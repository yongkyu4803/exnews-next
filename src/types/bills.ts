/**
 * 법안 모니터링 타입 정의
 * Supabase bills_monitor_reports, bills_monitor_bills 테이블 스키마 기반
 */

export interface BillsReport {
  id: string;
  slug: string;
  report_date: string;
  generated_at: string;
  total_bills: number;
  analyzed_bills: number;
  filtered_bills: number;
  llm_summary_success: number;
  llm_summary_failed: number;
  headline: string | null;
  overview: string | null;
  key_trends: string[] | null;
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
    classification: {
      enactment: number;
      full_revision: number;
      partial_revision: number;
    };
  } | null;
  is_published: boolean;
  published_at: string | null;
  source_json_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillItem {
  id: string;
  report_id: string;
  bill_id: string;
  bill_no: string;
  bill_name: string;
  proposer: string;
  proposal_date: string;
  committee: string | null;
  link_url: string | null;
  domain: 'political' | 'economic' | 'social' | 'administrative' | 'unknown' | null;
  regulation_type: '신설' | '강화' | '완화' | null;  // null = 비규제
  regulation_affected_groups: any | null;
  summary_one_sentence: string | null;
  summary_easy_explanation: string | null;
  summary_why_important: string | null;
  summary_who_affected: string | null;
  has_summary: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillsReportWithBills extends BillsReport {
  bills: BillItem[];
}

export type RegulationType = '신설' | '강화' | '완화' | '비규제';

export const REGULATION_TYPE_LABELS: Record<RegulationType, string> = {
  '신설': '신설',
  '강화': '강화',
  '완화': '완화',
  '비규제': '비규제',
};

export const REGULATION_TYPE_COLORS: Record<RegulationType, { bg: string; border: string; text: string }> = {
  '신설': { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  '강화': { bg: '#fffbeb', border: '#fde68a', text: '#d97706' },
  '완화': { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
  '비규제': { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280' },
};
