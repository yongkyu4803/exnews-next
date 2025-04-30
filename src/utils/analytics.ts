/**
 * Google Analytics 또는 기타 분석 도구로 이벤트를 추적합니다.
 * @param eventName 추적할 이벤트 이름
 * @param eventParams 이벤트와 함께 전송할 매개변수
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>): void => {
  // 브라우저 환경인지 확인
  if (typeof window === 'undefined') return;
  
  // Google Analytics가 있는지 확인
  if ('gtag' in window) {
    try {
      // @ts-ignore - window.gtag는 전역으로 정의되어 있지만 TypeScript에서 인식하지 못함
      window.gtag('event', eventName, eventParams);
    } catch (error) {
      console.error('이벤트 추적 중 오류 발생:', error);
    }
  }
  
  // 개발 환경에서 이벤트 기록
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, eventParams);
  }
}; 