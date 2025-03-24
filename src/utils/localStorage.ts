import { NewsItem } from '../types';

const SAVED_NEWS_KEY = 'saved_news';

/**
 * 로컬 스토리지에서 저장된 뉴스 목록을 가져옵니다.
 */
export const getSavedNews = (): NewsItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedNews = localStorage.getItem(SAVED_NEWS_KEY);
    return savedNews ? JSON.parse(savedNews) : [];
  } catch (error) {
    console.error('저장된 뉴스를 불러오는 중 오류 발생:', error);
    return [];
  }
};

/**
 * 뉴스 아이템을 로컬 스토리지에 저장합니다.
 */
export const saveForLater = (newsItem: NewsItem): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const savedNews = getSavedNews();
    
    // 이미 저장된 뉴스인지 확인
    if (!savedNews.some(item => item.id === newsItem.id)) {
      savedNews.push(newsItem);
      localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(savedNews));
    }
  } catch (error) {
    console.error('뉴스 저장 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 특정 뉴스가 이미 저장되어 있는지 확인합니다.
 */
export const isNewsAlreadySaved = (newsId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const savedNews = getSavedNews();
    return savedNews.some(item => item.id && item.id.toString() === newsId);
  } catch (error) {
    console.error('저장된 뉴스 확인 중 오류 발생:', error);
    return false;
  }
};

/**
 * 저장된 뉴스를 삭제합니다.
 */
export const removeSavedNews = (newsId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const savedNews = getSavedNews();
    const updatedNews = savedNews.filter(item => item.id && item.id.toString() !== newsId);
    localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(updatedNews));
  } catch (error) {
    console.error('뉴스 삭제 중 오류 발생:', error);
    throw error;
  }
}; 