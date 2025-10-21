import { useState, useRef, useCallback } from 'react';

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
 * Window 스크롤 기반으로 동작
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
  const currentScrollRef = useRef<number>(0);

  // Touch Start 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    console.log('[Pull-to-Refresh] Touch Start', { enabled, isRefreshing });
    if (!enabled || isRefreshing) return;

    // Window 스크롤 위치 확인
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    console.log('[Pull-to-Refresh] Scroll Top:', scrollTop);

    if (scrollTop === 0) {
      const touch = e.touches[0];
      startYRef.current = touch.clientY;
      currentScrollRef.current = scrollTop;
      setIsPulling(true);
      console.log('[Pull-to-Refresh] Pulling started at Y:', touch.clientY);
    }
  }, [enabled, isRefreshing]);

  // Touch Move 핸들러
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing || !isPulling) return;

    const touch = e.touches[0];
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const deltaY = touch.clientY - startYRef.current;

    console.log('[Pull-to-Refresh] Touch Move', { scrollTop, deltaY, clientY: touch.clientY, startY: startYRef.current });

    // 스크롤이 최상단이고 아래로 당기는 경우만
    if (scrollTop === 0 && touch.clientY > startYRef.current) {
      if (deltaY > minimumPullDown) {
        // 네이티브 스크롤 방지
        e.preventDefault();

        // 저항값 적용
        const resistedPullDistance = deltaY / resistance;
        const limitedPullDistance = Math.min(resistedPullDistance, maxPullDown);

        console.log('[Pull-to-Refresh] Pull Distance:', limitedPullDistance);
        setPullDistance(limitedPullDistance);
      }
    } else {
      // 스크롤이 발생하면 Pull-to-Refresh 취소
      console.log('[Pull-to-Refresh] Cancelled');
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [enabled, isRefreshing, isPulling, resistance, maxPullDown, minimumPullDown]);

  // Touch End 핸들러
  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) return;

    setIsPulling(false);

    // 임계값 이상 당긴 경우 새로고침 실행
    if (pullDistance >= threshold) {
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-Refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // 임계값 미만이면 원래 위치로 복귀
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
