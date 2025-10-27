import { VisitAnalytics, TabName, EventType, DeviceType } from '@/types';
import { createLogger } from './logger';

const logger = createLogger('Utils:Analytics');

const VISITOR_ID_KEY = 'exnews_visitor_id';
const SESSION_ID_KEY = 'exnews_session_id';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Generate a unique visitor ID and store in localStorage
 */
export const generateVisitorId = (): string => {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    // Generate UUID-like visitor ID
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    logger.info('New visitor ID generated', { visitorId });
  }

  return visitorId;
};

/**
 * Get or create session ID with timeout management
 */
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  const stored = sessionStorage.getItem(SESSION_ID_KEY);
  const lastActivity = sessionStorage.getItem(`${SESSION_ID_KEY}_timestamp`);

  // Check if session is still valid
  if (stored && lastActivity) {
    const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
    if (timeSinceActivity < SESSION_TIMEOUT) {
      // Update last activity timestamp
      sessionStorage.setItem(`${SESSION_ID_KEY}_timestamp`, Date.now().toString());
      return stored;
    }
  }

  // Create new session
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  sessionStorage.setItem(`${SESSION_ID_KEY}_timestamp`, Date.now().toString());
  logger.info('New session ID generated', { sessionId });

  return sessionId;
};

/**
 * Detect device type based on screen width
 */
export const getDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth <= 768 ? 'mobile' : 'desktop';
};

/**
 * Track analytics event to our custom backend
 */
export const trackAnalyticsEvent = async (
  eventType: EventType,
  options?: {
    tabName?: TabName;
    pagePath?: string;
    durationSeconds?: number;
    scrollDepth?: number;
    interactionCount?: number;
    exitPage?: boolean;
  }
): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const visitorId = generateVisitorId();
    const sessionId = getSessionId();
    const deviceType = getDeviceType();

    const trackData: Partial<VisitAnalytics> = {
      session_id: sessionId,
      visitor_id: visitorId,
      page_path: options?.pagePath || window.location.pathname,
      tab_name: options?.tabName,
      event_type: eventType,
      referrer: document.referrer || undefined,
      user_agent: navigator.userAgent,
      device_type: deviceType,
      duration_seconds: options?.durationSeconds,
      scroll_depth: options?.scrollDepth,
      interaction_count: options?.interactionCount,
      exit_page: options?.exitPage
    };

    // Send to backend API
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(trackData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Failed to track analytics event', { error: errorData });
    } else {
      logger.debug('Analytics event tracked', { eventType, tabName: options?.tabName });
    }
  } catch (error) {
    logger.error('Error tracking analytics event', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (tabName?: TabName): void => {
  trackAnalyticsEvent('page_view', { tabName });
};

/**
 * Track tab change
 */
export const trackTabChange = (tabName: TabName): void => {
  trackAnalyticsEvent('tab_change', { tabName });
};

/**
 * Track user interaction
 */
export const trackInteraction = (tabName?: TabName, interactionCount: number = 1): void => {
  trackAnalyticsEvent('interaction', { tabName, interactionCount });
};

/**
 * Track page exit with duration and scroll depth
 */
export const trackPageExit = (
  tabName?: TabName,
  durationSeconds?: number,
  scrollDepth?: number
): void => {
  trackAnalyticsEvent('page_view', {
    tabName,
    durationSeconds,
    scrollDepth,
    exitPage: true
  });
};

/**
 * Google Analytics event tracking (existing functionality)
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