// NewsItem 정의 및 내보내기
export interface NewsItem {
  id?: number | string;
  title: string;
  original_link: string;
  pub_date: string;
  category: string;
  description?: string;
  processed_at?: string;
  media_name?: string; // 추가: original_link에서 추출된 미디어명
  [key: string]: any; // 추가 필드 허용
}

// RankingNewsItem 정의 추가
export interface RankingNewsItem {
  id?: number | string;
  title: string;
  link: string;
  media_name: string;
  [key: string]: any; // 추가 필드 허용
}

// Restaurant 정보 인터페이스 추가
export interface RestaurantItem {
  id?: number | string;
  category: string;
  name: string;
  location: string;
  building_name?: string; // 빌딩명 필드 추가
  pnum: string;
  price: string;
  remark?: string;
  link?: string;
  [key: string]: any; // 추가 필드 허용
}

export interface NewsResponse {
  items: NewsItem[];
  totalCount: number;
}

// RankingNewsResponse 정의 추가
export interface RankingNewsResponse {
  items: RankingNewsItem[];
  totalCount: number;
}

// RestaurantResponse 정의 추가
export interface RestaurantResponse {
  items: RestaurantItem[];
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
  searchTerm?: string;
  dateRange?: [Date | null, Date | null];
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

// 사설 분석 관련 타입
export interface EditorialArticle {
  id: string;
  topic_id: string;
  article_number: number;
  title: string;
  media: string;
  pubdate: string | null;
  link: string;
  content?: string | null;
}

export interface EditorialTopic {
  id: string;
  analysis_id: string;
  topic_number: number;
  topic_title: string;
  topic_summary: string;
  articles?: EditorialArticle[];
}

export interface EditorialAnalysis {
  id: string;
  query: string;
  analysis_type: 'news' | 'editorial';
  analyzed_at: string;
  llm_model: string;
  raw_response?: string | null;
  topics?: EditorialTopic[];
}

export interface EditorialResponse {
  items: EditorialAnalysis[];
  totalCount: number;
} 