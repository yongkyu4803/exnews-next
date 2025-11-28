export interface WeeklyPollReport {
  id: number;
  week: string;
  year: number;
  week_number: number;
  generated_at: string;
  sources_collected: string[];
  total_politics_polls: number;
  total_economy_polls: number;
}

export interface WeeklyPollPolitics {
  id: number;
  week: string;
  source: 'gallup' | 'realmeter' | 'nbs' | 'ksoi';
  source_name: string;
  report_no?: number;
  survey_period: string;
  publish_date: string;
  sample_size: number;
  margin_of_error: number;
  method: 'CATI' | 'ARS';
  commissioned_by?: string;
  pres_positive: number;
  pres_negative: number;
  pres_change: number;
  party_democratic: number;
  party_ppp: number;
  party_reform: number;
  party_rebuild: number;
  party_progressive: number;
  source_url?: string;
  pdf_url?: string;
}

export interface WeeklyPollEconomy {
  id: number;
  week: string;
  period: string;
  indicator: 'ccsi' | 'bsi' | 'sbhi';
  indicator_name: string;
  source: string;
  publish_date: string;
  value: number;
  change: number;
  change_type: 'mom' | 'yoy';
  source_url?: string;
}

export interface WeeklyPollResponse {
  report: WeeklyPollReport;
  politics: WeeklyPollPolitics[];
  economy: WeeklyPollEconomy[];
}
