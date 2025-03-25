// IndexedDB 데이터베이스 관련 상수
const DB_NAME = 'news-pwa-db';
const DB_VERSION = 1;
const NEWS_STORE = 'news';
const CATEGORIES_STORE = 'categories';

interface NewsItem {
  id: string | number;
  title: string;
  description?: string;
  pub_date: string;
  original_link: string;
  category: string;
  isRecent?: boolean;
  viewedAt?: string;
}

// IndexedDB 초기화
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB 열기 실패:', event);
      reject('IndexedDB를 열 수 없습니다.');
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 뉴스 저장소 생성
      if (!db.objectStoreNames.contains(NEWS_STORE)) {
        const newsStore = db.createObjectStore(NEWS_STORE, { keyPath: 'id' });
        newsStore.createIndex('category', 'category', { unique: false });
        newsStore.createIndex('pub_date', 'pub_date', { unique: false });
      }
      
      // 카테고리 저장소 생성
      if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
        db.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' });
      }
    };
  });
};

// 뉴스 아이템 저장
export const saveNewsItems = async (newsItems: NewsItem[]): Promise<boolean> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(NEWS_STORE, 'readwrite');
    const store = transaction.objectStore(NEWS_STORE);
    
    // 모든 아이템 저장
    for (const item of newsItems) {
      store.put(item);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = (event) => {
        console.error('뉴스 저장 실패:', event);
        reject(false);
      };
    });
  } catch (error) {
    console.error('뉴스 저장 중 오류 발생:', error);
    return false;
  }
};

// 카테고리별 뉴스 가져오기
export const getNewsByCategory = async (category?: string, limit = 50): Promise<NewsItem[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(NEWS_STORE, 'readonly');
    const store = transaction.objectStore(NEWS_STORE);
    
    return new Promise((resolve, reject) => {
      let request: IDBRequest<NewsItem[]>;
      
      if (category && category !== 'all') {
        const index = store.index('category');
        request = index.getAll(category, limit);
      } else {
        request = store.getAll(null, limit);
      }
      
      request.onsuccess = () => {
        // 날짜 순으로 정렬 (최신순)
        const items = request.result.sort((a, b) => 
          new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime()
        );
        resolve(items);
      };
      
      request.onerror = (event) => {
        console.error('뉴스 가져오기 실패:', event);
        reject([]);
      };
    });
  } catch (error) {
    console.error('뉴스 가져오기 중 오류 발생:', error);
    return [];
  }
};

// 로컬 스토리지 기반 뉴스 저장 유틸리티
// IndexedDB 대신 간단하게 로컬 스토리지를 활용합니다

const SAVED_NEWS_KEY = 'saved_news_items';
const RECENT_NEWS_KEY = 'recent_news_items';

// 저장된 뉴스 아이템 타입
export interface SavedNewsItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  category: string;
  original_link: string;
  saved_at?: number;
}

// 저장된 모든 뉴스 아이템 가져오기
export function getSavedNews(): SavedNewsItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedNews = localStorage.getItem(SAVED_NEWS_KEY);
    return savedNews ? JSON.parse(savedNews) : [];
  } catch (error) {
    console.error('Failed to get saved news', error);
    return [];
  }
}

// 뉴스 아이템 저장
export function saveNews(newsItem: SavedNewsItem): void {
  if (typeof window === 'undefined') return;
  
  try {
    const savedNews = getSavedNews();
    // 이미 저장된 항목인지 확인
    const existingIndex = savedNews.findIndex(item => item.id === newsItem.id);
    
    if (existingIndex >= 0) {
      // 이미 저장된 항목이면 업데이트
      savedNews[existingIndex] = {
        ...newsItem,
        saved_at: Date.now()
      };
    } else {
      // 새 항목 추가
      savedNews.push({
        ...newsItem,
        saved_at: Date.now()
      });
    }
    
    localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(savedNews));
  } catch (error) {
    console.error('Failed to save news', error);
  }
}

// 뉴스 아이템 이미 저장되었는지 확인
export function isNewsAlreadySaved(id: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const savedNews = getSavedNews();
    return savedNews.some(item => item.id === id);
  } catch (error) {
    console.error('Failed to check if news is already saved', error);
    return false;
  }
}

// 저장된 뉴스 아이템 삭제
export function removeSavedNews(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const savedNews = getSavedNews();
    const updatedNews = savedNews.filter(item => item.id !== id);
    localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(updatedNews));
  } catch (error) {
    console.error('Failed to remove saved news', error);
  }
}

// 최근 본 뉴스 저장
export function saveRecentNews(newsItem: SavedNewsItem): void {
  if (typeof window === 'undefined') return;
  
  try {
    const recentNews = getRecentNews();
    // 이미 있는 항목인지 확인
    const existingIndex = recentNews.findIndex(item => item.id === newsItem.id);
    
    if (existingIndex >= 0) {
      // 이미 있는 항목이면 맨 앞으로 이동
      const item = recentNews.splice(existingIndex, 1)[0];
      recentNews.unshift({
        ...item,
        saved_at: Date.now()
      });
    } else {
      // 새 항목 추가 (최대 50개 유지)
      recentNews.unshift({
        ...newsItem,
        saved_at: Date.now()
      });
      
      if (recentNews.length > 50) {
        recentNews.pop();
      }
    }
    
    localStorage.setItem(RECENT_NEWS_KEY, JSON.stringify(recentNews));
  } catch (error) {
    console.error('Failed to save recent news', error);
  }
}

// 최근 본 뉴스 가져오기
export function getRecentNews(limit?: number): SavedNewsItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const recentNews = localStorage.getItem(RECENT_NEWS_KEY);
    const allNews = recentNews ? JSON.parse(recentNews) : [];
    
    // limit이 지정된 경우 해당 개수만큼만 반환
    return limit ? allNews.slice(0, limit) : allNews;
  } catch (error) {
    console.error('Failed to get recent news', error);
    return [];
  }
}

// 모든 데이터 지우기 (오래된 캐시 정리용)
export const clearOldData = async (days = 7): Promise<boolean> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(NEWS_STORE, 'readwrite');
    const store = transaction.objectStore(NEWS_STORE);
    const request: IDBRequest<NewsItem[]> = store.getAll();
    
    request.onsuccess = () => {
      const allItems = request.result;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      allItems.forEach(item => {
        const pubDate = new Date(item.pub_date);
        if (pubDate < cutoffDate && !item.isRecent) {
          store.delete(item.id);
        }
      });
    };
    
    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
    });
  } catch (error) {
    console.error('오래된 데이터 정리 실패:', error);
    return false;
  }
}; 