/**
 * 선택된 뉴스 아이템을 클립보드에 복사하는 유틸리티
 */

import { trackEvent } from './analyticsUtils';
import { SavedNewsItem } from './indexedDBUtils';

interface NewsItem {
  id: string | number;
  title: string;
  description?: string;
  date?: string;
  pub_date?: string;
  original_link: string;
  category?: string;
}

/**
 * 뉴스 항목을 클립보드에 복사하기 위한 텍스트 형식으로 변환
 */
export function formatNewsForClipboard(items: NewsItem[]): string {
  if (!items || items.length === 0) return '';
  
  return items.map(item => {
    const date = item.date || item.pub_date || '';
    const formattedDate = date ? new Date(date).toLocaleDateString('ko-KR') : '';
    
    return `[${item.title}]
${item.description || ''}
${formattedDate}
원문 링크: ${item.original_link}
--------------------------`;
  }).join('\n\n');
}

/**
 * 선택된 뉴스 항목을 클립보드에 복사
 * @returns 복사 성공 여부
 */
export async function copySelectedNewsToClipboard(items: NewsItem[]): Promise<boolean> {
  if (!items || items.length === 0) return false;
  
  try {
    const text = formatNewsForClipboard(items);
    await navigator.clipboard.writeText(text);
    
    trackEvent('copy_selected_news', { count: items.length });
    return true;
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    return false;
  }
}

/**
 * 선택된 뉴스 항목을 카카오톡으로 공유
 * 카카오톡 SDK가 있어야 작동
 */
export function shareSelectedNewsToKakao(items: NewsItem[]): boolean {
  if (!items || items.length === 0) return false;
  
  // 카카오톡 SDK 존재 여부 확인
  const kakao = (window as any).Kakao;
  if (!kakao || !kakao.Share) return false;
  
  try {
    const text = items.length > 1 
      ? `${items.length}개의 뉴스 모음`
      : items[0].title;
      
    const description = items.length > 1
      ? `${items[0].title} 외 ${items.length - 1}건의 뉴스`
      : (items[0].description || '').slice(0, 100);
      
    kakao.Share.sendDefault({
      objectType: 'text',
      text,
      link: {
        mobileWebUrl: window.location.href,
        webUrl: window.location.href,
      },
    });
    
    trackEvent('share_selected_news', { 
      platform: 'kakao', 
      count: items.length 
    });
    return true;
  } catch (error) {
    console.error('카카오톡 공유 실패:', error);
    return false;
  }
} 