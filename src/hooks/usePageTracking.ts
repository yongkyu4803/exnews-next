import { useEffect, useRef, useCallback } from 'react';
import { TabName } from '@/types';
import { trackPageExit, trackInteraction } from '@/utils/analytics';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Hooks:PageTracking');

interface UsePageTrackingOptions {
  tabName?: TabName;
  enableScrollTracking?: boolean;
  enableInteractionTracking?: boolean;
  scrollThrottleMs?: number;
}

/**
 * 페이지 체류 시간, 스크롤 깊이, 상호작용 횟수를 자동으로 추적하는 Hook
 *
 * Phase 2 기능:
 * - 체류 시간 (duration): 페이지 진입부터 이탈까지의 시간 (초 단위)
 * - 스크롤 깊이 (scroll_depth): 페이지에서 스크롤한 최대 깊이 (0-100%)
 * - 상호작용 횟수 (interaction_count): 클릭, 터치, 키보드 이벤트 횟수
 */
export const usePageTracking = (options: UsePageTrackingOptions = {}) => {
  const {
    tabName,
    enableScrollTracking = true,
    enableInteractionTracking = true,
    scrollThrottleMs = 500
  } = options;

  // 페이지 진입 시간 기록
  const pageEntryTime = useRef<number>(Date.now());

  // 최대 스크롤 깊이 추적
  const maxScrollDepth = useRef<number>(0);

  // 상호작용 횟수 추적
  const interactionCount = useRef<number>(0);

  // 스크롤 이벤트 throttle을 위한 타이머
  const scrollThrottleTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * 현재 스크롤 깊이 계산 (0-100%)
   */
  const calculateScrollDepth = useCallback((): number => {
    if (typeof window === 'undefined') return 0;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // 스크롤 가능한 높이
    const scrollableHeight = documentHeight - windowHeight;

    if (scrollableHeight <= 0) return 100; // 스크롤이 없는 경우 100%

    // 스크롤 깊이 계산 (0-100%)
    const depth = Math.round((scrollTop / scrollableHeight) * 100);
    return Math.min(100, Math.max(0, depth));
  }, []);

  /**
   * 스크롤 이벤트 핸들러 (throttled)
   */
  const handleScroll = useCallback(() => {
    if (!enableScrollTracking) return;

    // Throttle: 일정 시간 내에 한 번만 실행
    if (scrollThrottleTimer.current) return;

    scrollThrottleTimer.current = setTimeout(() => {
      const currentDepth = calculateScrollDepth();

      // 최대 스크롤 깊이 업데이트
      if (currentDepth > maxScrollDepth.current) {
        maxScrollDepth.current = currentDepth;
        logger.debug('Max scroll depth updated', { depth: currentDepth });
      }

      scrollThrottleTimer.current = null;
    }, scrollThrottleMs);
  }, [enableScrollTracking, calculateScrollDepth, scrollThrottleMs]);

  /**
   * 상호작용 이벤트 핸들러
   */
  const handleInteraction = useCallback(() => {
    if (!enableInteractionTracking) return;

    interactionCount.current += 1;
    logger.debug('Interaction count increased', { count: interactionCount.current });
  }, [enableInteractionTracking]);

  /**
   * 페이지 이탈 시 데이터 전송
   */
  const sendExitData = useCallback(() => {
    // 체류 시간 계산 (초 단위)
    const durationSeconds = Math.round((Date.now() - pageEntryTime.current) / 1000);

    // 최종 스크롤 깊이
    const finalScrollDepth = maxScrollDepth.current;

    logger.info('Sending exit data', {
      tabName,
      durationSeconds,
      scrollDepth: finalScrollDepth,
      interactionCount: interactionCount.current
    });

    // 이탈 데이터 전송
    trackPageExit(tabName, durationSeconds, finalScrollDepth);

    // 상호작용 데이터가 있으면 전송
    if (interactionCount.current > 0) {
      trackInteraction(tabName, interactionCount.current);
    }
  }, [tabName]);

  /**
   * beforeunload 이벤트 핸들러 (페이지 이탈 감지)
   */
  const handleBeforeUnload = useCallback(() => {
    sendExitData();
  }, [sendExitData]);

  /**
   * visibilitychange 이벤트 핸들러 (탭 전환 감지)
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // 탭이 숨겨질 때 (백그라운드로 전환)
      sendExitData();
    } else {
      // 탭이 다시 활성화될 때
      pageEntryTime.current = Date.now();
      interactionCount.current = 0;
      logger.info('Page re-activated, resetting tracking');
    }
  }, [sendExitData]);

  /**
   * Effect: 이벤트 리스너 등록 및 정리
   */
  useEffect(() => {
    // 페이지 진입 시간 초기화
    pageEntryTime.current = Date.now();
    maxScrollDepth.current = calculateScrollDepth();
    interactionCount.current = 0;

    logger.info('Page tracking started', { tabName });

    // 스크롤 이벤트 리스너 등록
    if (enableScrollTracking) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // 상호작용 이벤트 리스너 등록
    if (enableInteractionTracking) {
      window.addEventListener('click', handleInteraction);
      window.addEventListener('touchstart', handleInteraction);
      window.addEventListener('keydown', handleInteraction);
    }

    // 페이지 이탈 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 정리 함수
    return () => {
      // 컴포넌트 언마운트 시 데이터 전송
      sendExitData();

      // 이벤트 리스너 제거
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // 타이머 정리
      if (scrollThrottleTimer.current) {
        clearTimeout(scrollThrottleTimer.current);
      }

      logger.info('Page tracking stopped', { tabName });
    };
  }, [
    tabName,
    enableScrollTracking,
    enableInteractionTracking,
    handleScroll,
    handleInteraction,
    handleBeforeUnload,
    handleVisibilityChange,
    sendExitData,
    calculateScrollDepth
  ]);

  // 현재 추적 데이터 반환 (디버깅용)
  return {
    getCurrentDuration: () => Math.round((Date.now() - pageEntryTime.current) / 1000),
    getCurrentScrollDepth: () => maxScrollDepth.current,
    getCurrentInteractionCount: () => interactionCount.current
  };
};
