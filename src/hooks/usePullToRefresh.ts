import { useState, useRef, useCallback, useEffect } from 'react';

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;        // 새로고침 트리거 임계값 (기본 80px)
  resistance?: number;       // 당김 저항값 (기본 2.5, 높을수록 당기기 어려움)
  enabled?: boolean;         // Pull-to-Refresh 활성화 여부
  maxPullDown?: number;      // 최대 당김 거리 (기본 150px)
  minimumPullDown?: number;  // 최소 당김 거리 (기본 5px, 우발적 트리거 방지)
}

export interface UsePullToRefreshReturn {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

/**
 * Pull-to-Refresh 기능을 제공하는 커스텀 훅
 *
 * 네이티브 Touch 이벤트를 사용하여 구현
 * react-window와의 스크롤 충돌 방지 로직 포함
 *
 * @example
 * const { pullDistance, isPulling, isRefreshing, handlers } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchData();
 *   },
 *   threshold: 80,
 *   enabled: true
 * });
 */
export function usePullToRefresh(options: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const {
    onRefresh,
    threshold = 80,
    resistance = 2.5,
    enabled = true,
    maxPullDown = 150,
    minimumPullDown = 5
  } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const scrollContainerRef = useRef<Element | null>(null);

  // 스크롤 컨테이너 찾기 (react-window의 스크롤 영역)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // react-window의 스크롤 컨테이너 또는 window
    const findScrollContainer = () => {
      const reactWindowList = document.querySelector('[data-testid="virtuoso-scroller"], .react-window-list, [role="list"]');
      return reactWindowList || window;
    };

    scrollContainerRef.current = findScrollContainer() as Element;
  }, []);

  // 현재 스크롤 위치 확인
  const getScrollTop = useCallback(() => {
    const container = scrollContainerRef.current;

    if (!container) return 0;

    // Window 객체인 경우
    if (container instanceof Window) {
      return window.scrollY || document.documentElement.scrollTop;
    }

    // Element 객체인 경우
    return (container as Element).scrollTop;
  }, []);

  // Touch Start 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;

    // 스크롤이 최상단일 때만 Pull-to-Refresh 활성화
    const scrollTop = getScrollTop();
    if (scrollTop === 0) {
      setIsPulling(true);
    }
  }, [enabled, isRefreshing, getScrollTop]);

  // Touch Move 핸들러
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing || !isPulling) return;

    const touch = e.touches[0];
    currentYRef.current = touch.clientY;

    const deltaY = currentYRef.current - startYRef.current;
    const scrollTop = getScrollTop();

    // 조건:
    // 1. 스크롤이 최상단에 있어야 함
    // 2. 아래로 당기는 동작이어야 함 (deltaY > 0)
    // 3. 최소 당김 거리 이상
    if (scrollTop === 0 && deltaY > minimumPullDown) {
      // 네이티브 스크롤 방지
      e.preventDefault();

      // 저항값을 적용한 당김 거리 계산
      const resistedPullDistance = deltaY / resistance;
      const limitedPullDistance = Math.min(resistedPullDistance, maxPullDown);

      setPullDistance(limitedPullDistance);
    } else {
      // 조건 불만족 시 Pull-to-Refresh 취소
      if (scrollTop > 0 || deltaY < 0) {
        setIsPulling(false);
        setPullDistance(0);
      }
    }
  }, [enabled, isRefreshing, isPulling, resistance, maxPullDown, minimumPullDown, getScrollTop]);

  // Touch End 핸들러
  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    setIsPulling(false);

    // Threshold 초과 시 새로고침 실행
    if (pullDistance >= threshold) {
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error('[Pull-to-Refresh] Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Threshold 미달 시 애니메이션으로 원위치
      setPullDistance(0);
    }
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh]);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}
