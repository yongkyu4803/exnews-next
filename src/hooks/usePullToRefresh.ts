import { useState, useRef, useEffect, useCallback } from 'react';

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
}

/**
 * Pull-to-Refresh 기능을 제공하는 커스텀 훅 (Window 레벨)
 *
 * ✅ Window 레벨 이벤트 리스너 사용
 * ✅ Passive 이벤트 리스너로 성능 최적화
 * ✅ 모바일 스크롤과 충돌 방지
 *
 * @example
 * const { pullDistance, isPulling, isRefreshing } = usePullToRefresh({
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
  const pullingRef = useRef<boolean>(false);

  // Touch Start 핸들러 (Window 레벨)
  const handleTouchStart = useCallback((e: TouchEvent) => {
    console.log('[PTR] Touch Start', {
      enabled,
      isRefreshing,
      targetTag: (e.target as HTMLElement)?.tagName,
      targetClass: (e.target as HTMLElement)?.className
    });

    if (!enabled || isRefreshing) return;

    // Window 스크롤 위치 확인
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    console.log('[PTR] Scroll Top:', scrollTop);

    // 최상단에서만 작동
    if (scrollTop === 0) {
      const touch = e.touches[0];
      startYRef.current = touch.clientY;
      currentScrollRef.current = scrollTop;
      pullingRef.current = true;
      setIsPulling(true);
      console.log('[PTR] Pulling started at Y:', touch.clientY);
    }
  }, [enabled, isRefreshing]);

  // Touch Move 핸들러 (Window 레벨)
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing || !pullingRef.current) return;

    const touch = e.touches[0];
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const deltaY = touch.clientY - startYRef.current;

    console.log('[PTR] Touch Move', {
      scrollTop,
      deltaY,
      clientY: touch.clientY,
      startY: startYRef.current,
      pullingRef: pullingRef.current
    });

    // 스크롤이 최상단이고 아래로 당기는 경우만
    if (scrollTop === 0 && deltaY > minimumPullDown) {
      // 네이티브 스크롤 방지 (중요!)
      e.preventDefault();

      // 저항값 적용
      const resistedPullDistance = deltaY / resistance;
      const limitedPullDistance = Math.min(resistedPullDistance, maxPullDown);

      console.log('[PTR] Pull Distance:', limitedPullDistance);
      setPullDistance(limitedPullDistance);
    } else if (scrollTop > 0 || deltaY < 0) {
      // 스크롤이 발생하거나 위로 스와이프하면 취소
      console.log('[PTR] Cancelled - scroll or swipe up');
      pullingRef.current = false;
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [enabled, isRefreshing, resistance, maxPullDown, minimumPullDown]);

  // Touch End 핸들러 (Window 레벨)
  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) return;

    console.log('[PTR] Touch End', { pullDistance, threshold, isPulling: pullingRef.current });

    pullingRef.current = false;
    setIsPulling(false);

    // 임계값 이상 당긴 경우 새로고침 실행
    if (pullDistance >= threshold) {
      console.log('[PTR] Threshold reached - triggering refresh');
      setIsRefreshing(true);

      try {
        await onRefresh();
        console.log('[PTR] Refresh completed successfully');
      } catch (error) {
        console.error('[PTR] Refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // 임계값 미만이면 원래 위치로 복귀
      console.log('[PTR] Threshold not reached - resetting');
      setPullDistance(0);
    }
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh]);

  // Window 레벨 이벤트 리스너 등록
  useEffect(() => {
    if (!enabled) return;

    console.log('[PTR] Installing window-level event listeners');

    // Passive: false for touchmove to allow preventDefault
    const touchMoveOptions = { passive: false };
    const touchStartOptions = { passive: true };
    const touchEndOptions = { passive: true };

    window.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    window.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    window.addEventListener('touchend', handleTouchEnd, touchEndOptions);
    window.addEventListener('touchcancel', handleTouchEnd, touchEndOptions);

    return () => {
      console.log('[PTR] Removing window-level event listeners');
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isPulling,
    isRefreshing
  };
}
