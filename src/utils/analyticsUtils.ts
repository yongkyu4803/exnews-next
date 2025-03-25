// 간단한 분석 이벤트 추적 유틸리티

// 이벤트 타입 정의
type EventType = 
  | 'click_news' 
  | 'share_news' 
  | 'save_news' 
  | 'unsave_news' 
  | 'select_news' 
  | 'load_more' 
  | 'refresh_news'
  | 'page_view'
  | 'copy_selected_news'
  | 'share_selected_news';

// 이벤트 속성 타입
interface EventProps {
  [key: string]: string | number | boolean;
}

/**
 * 이벤트 추적 함수
 * @param eventType 추적할 이벤트 타입
 * @param eventProps 이벤트 속성
 */
export function trackEvent(eventType: EventType, eventProps: EventProps = {}): void {
  // 개발 환경에서는 콘솔에 로그만 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventType}:`, eventProps);
    return;
  }

  try {
    // 실제 프로덕션 환경에서는 Google Analytics 또는 기타 분석 서비스에 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventType, eventProps);
    }
    
    // Vercel Analytics가 설정된 경우 사용
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va.track(eventType, eventProps);
    }
  } catch (error) {
    console.error('이벤트 추적 중 오류 발생:', error);
  }
}

/**
 * 페이지 뷰 추적 함수
 * @param path 페이지 경로
 * @param title 페이지 제목
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', { path, title: title || document.title });
} 