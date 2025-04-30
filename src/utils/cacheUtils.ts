export const CACHE_KEYS = {
  RECENT_NEWS: 'recent-news',
  USER_PREFERENCES: 'user-preferences'
};

export const cacheNews = async (newsItem: any) => {
  try {
    const existingNews = await localStorage.getItem(CACHE_KEYS.RECENT_NEWS);
    const recentNews = existingNews ? JSON.parse(existingNews) : [];
    
    // Add new item and keep only last 20 items
    const updatedNews = [newsItem, ...recentNews].slice(0, 20);
    
    localStorage.setItem(CACHE_KEYS.RECENT_NEWS, JSON.stringify(updatedNews));
    return true;
  } catch (error) {
    console.error('Failed to cache news:', error);
    return false;
  }
};

export const getCachedNews = async () => {
  try {
    const cachedNews = await localStorage.getItem(CACHE_KEYS.RECENT_NEWS);
    return cachedNews ? JSON.parse(cachedNews) : [];
  } catch (error) {
    console.error('Failed to get cached news:', error);
    return [];
  }
};