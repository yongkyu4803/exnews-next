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
}

// IndexedDB 초기화
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
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
      let request;
      
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

// 최근 본 뉴스 저장
export const saveRecentNews = async (newsItem: NewsItem): Promise<boolean> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(NEWS_STORE, 'readwrite');
    const store = transaction.objectStore(NEWS_STORE);
    
    // 아이템 ID에 'recent-' 접두사 추가하여 저장
    const recentItem = {
      ...newsItem,
      id: `recent-${newsItem.id}`,
      isRecent: true,
      viewedAt: new Date().toISOString()
    };
    
    store.put(recentItem);
    
    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
    });
  } catch (error) {
    console.error('최근 본 뉴스 저장 실패:', error);
    return false;
  }
};

// 최근 본 뉴스 가져오기
export const getRecentNews = async (limit = 20): Promise<NewsItem[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(NEWS_STORE, 'readonly');
    const store = transaction.objectStore(NEWS_STORE);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const allItems = request.result;
        const recentItems = allItems
          .filter((item: any) => item.isRecent)
          .sort((a: any, b: any) => 
            new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
          )
          .slice(0, limit);
        resolve(recentItems);
      };
      
      request.onerror = (event) => {
        console.error('최근 뉴스 가져오기 실패:', event);
        reject([]);
      };
    });
  } catch (error) {
    console.error('최근 뉴스 가져오기 중 오류 발생:', error);
    return [];
  }
};

// 모든 데이터 지우기 (오래된 캐시 정리용)
export const clearOldData = async (days = 7): Promise<boolean> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(NEWS_STORE, 'readwrite');
    const store = transaction.objectStore(NEWS_STORE);
    const request = store.getAll();
    
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