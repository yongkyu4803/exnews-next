export interface PaginationParams {
  page: number;
  pageSize: number;
  category?: string;
  searchTerm?: string;
  dateRange?: [Date | null, Date | null];
}

export interface NewsItem {
  id: number;
  title: string;
  original_link: string;
  category: string;
  pub_date: string;
  processed_at?: string;  // optional (처리되지 않은 항목이 있을 수 있음)
}