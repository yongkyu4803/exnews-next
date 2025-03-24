// NewsItem 정의 및 내보내기
export interface NewsItem {
  id?: number;
  title: string;
  original_link: string;
  pub_date: string;
  category: string;
  description?: string;
  processed_at?: string;
  [key: string]: any; // 추가 필드 허용
}

export interface NewsResponse {
  items: NewsItem[];
  totalCount: number;
}

// 오프라인 아이템 타입
export interface OfflineNewsItem extends NewsItem {
  cached_at: string;
}

// 페이지네이션 파라미터
export interface PaginationParams {
  page: number;
  pageSize: number;
  category?: string;
}

// 카테고리 타입
export enum Categories {
  All = 'all',
  Politics = '정치',
  Economy = '경제',
  Society = '사회',
  International = '국제',
  Culture = '문화',
  Entertainment = '연예/스포츠',
  Others = '기타'
} 