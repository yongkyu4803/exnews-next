import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { trackEvent } from '@/utils/analyticsUtils';
import { copySelectedNewsToClipboard } from '@/utils/clipboardUtils';

// 클라이언트 사이드에서만 로드되는 컴포넌트
const ReactWindowComponents = dynamic(() => import('./ReactWindowComponents'), {
  ssr: false,
  loading: () => <LoadingView />
});

// 스타일 컴포넌트 정의
const Container = styled.div`
  position: relative;
  height: calc(100vh - 180px);
  width: 100%;
  overflow: visible;
  background-color: #ffffff;
`;

// 전역 오버스크롤 방지 스타일 (모바일 브라우저의 기본 당겨서 새로고침 비활성화)
const GlobalStyle = styled.div`
  /* 브라우저 기본 pull-to-refresh 동작 방지 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
`;

const PullToRefreshContainer = styled.div`
  width: 100%;
  overflow: hidden;
  position: relative;
  height: 100%;
  /* 모바일 브라우저에서 스크롤 동작 제어 */
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  
  .refresh-indicator {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 20px;
    color: #666;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 16px;
    border-radius: 20px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
    pointer-events: none;
    
    &.visible {
      opacity: 1;
    }
    
    &.pulling {
      transform: translate(-50%, 0);
    }
    
    &.refreshing {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;

const LoadingContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 20px;
`;

const SkeletonCard = styled.div`
  height: 145px;
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const EmptyView = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  height: 100%;
  padding: 20px;
  
  h3 {
    margin-bottom: 8px;
    font-size: 18px;
    color: #333;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
`;

const ActionButton = styled.button<{ color?: string; visible?: boolean; isRefreshing?: boolean }>`
  position: fixed;
  bottom: 20px;
  right: ${props => props.color === 'green' ? '20px' : '80px'};
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${props => props.color === 'green' ? '#4CAF50' : 'var(--primary-color, #1a73e8)'};
  color: white;
  display: ${props => props.visible === false ? 'none' : 'flex'};
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
  z-index: 100;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
    background-color: ${props => props.color === 'green' ? '#3e8e41' : '#1562c5'};
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
  
  ${props => props.isRefreshing && `
    svg {
      animation: rotate 1s linear infinite;
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}
`;

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  z-index: 1000;
  max-width: 80%;
  text-align: center;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`;

// 회전 애니메이션 정의 추가
const SpinAnimation = styled.div`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// 아이콘 컴포넌트
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
    <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

// 로딩 뷰 컴포넌트
const LoadingView = () => (
  <LoadingContainer>
    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
    <div style={{ color: '#666', marginTop: '16px' }}>뉴스를 불러오는 중입니다...</div>
  </LoadingContainer>
);

// 인터페이스 정의
interface VirtualNewsListProps {
  items: any[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onRefresh: () => Promise<any>;
  selectedKeys?: React.Key[];
  onSelectChange?: (keys: React.Key[], rows: any[]) => void;
}

export default function VirtualNewsList({
  items,
  hasMore,
  isLoading,
  onLoadMore,
  onRefresh,
  selectedKeys = [],
  onSelectChange
}: VirtualNewsListProps) {
  // 상태 관리
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '' });
  
  // 참조
  const itemsRef = useRef(items);
  
  // 새로운 참조 추가
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 토스트 메시지 표시 함수
  const showToast = useCallback((message: string, duration = 3000) => {
    setToast({ visible: true, message });
    
    // 자동 숨김
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, duration);
  }, []);
  
  // 결과에서 아이템 추출 유틸리티 함수
  const extractItemsFromResult = (result: any): any[] | null => {
    if (!result) return null;
    
    // 배열인 경우
    if (Array.isArray(result)) {
      return result;
    }
    
    // 객체 내 배열 찾기
    const arrayFields = ['items', 'data', 'news', 'content', 'results'];
    
    for (const field of arrayFields) {
      if (result[field] && Array.isArray(result[field])) {
        return result[field];
      }
    }
    
    return null;
  };
  
  // 새로고침 처리
  const handleRefresh = useCallback(async () => {
    if (refreshing || typeof onRefresh !== 'function') return;
    
    setRefreshing(true);
    showToast('새로고침 중...', 1000);
    
    try {
      console.log('[VirtualNewsList] 데이터 새로고침 시작');
      const result = await onRefresh();
      
      // 결과가 null, undefined인 경우 체크
      if (!result) {
        console.warn('[VirtualNewsList] 새로고침 결과가 없습니다');
        showToast('데이터를 불러올 수 없습니다', 3000);
        return;
      }
      
      // 결과 데이터 추출 시도
      const newItems = extractItemsFromResult(result);
      
      if (newItems && Array.isArray(newItems) && newItems.length > 0) {
        console.log(`[VirtualNewsList] 새로고침 성공: ${newItems.length}개 항목`);
        setLocalItems(newItems);
        showToast('새로고침 완료');
      } else if (Array.isArray(itemsRef.current) && itemsRef.current.length > 0) {
        // 추출 실패했지만 기존 items prop이 있으면 그것을 사용
        console.log('[VirtualNewsList] 데이터 추출 실패, 기존 items 사용');
        setLocalItems(itemsRef.current);
        showToast('새로고침 완료');
      } else {
        // 데이터 없음
        console.warn('[VirtualNewsList] 데이터를 불러올 수 없습니다');
        showToast('데이터를 불러올 수 없습니다', 3000);
        setLocalItems([]); // 명시적으로 빈 배열 설정
      }
    } catch (error) {
      console.error('[VirtualNewsList] 새로고침 오류:', error);
      showToast('새로고침 중 오류가 발생했습니다', 3000);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, onRefresh, showToast]);
  
  // 마운트 처리
  useEffect(() => {
    setMounted(true);
    
    // 초기 데이터 처리
    if (items.length === 0) {
      handleRefresh();
    } else {
      setLocalItems(items);
    }
    
    return () => setMounted(false);
  }, [items, handleRefresh]);
  
  // items prop 변경 감지
  useEffect(() => {
    // 참조 업데이트
    itemsRef.current = items;
    
    if (items.length > 0) {
      console.log('[VirtualNewsList] 새 아이템 업데이트:', items.length);
      setLocalItems(items);
    }
  }, [items]);
  
  // 아이템 선택 처리
  const handleSelectItem = useCallback((id: string | number, isSelected: boolean) => {
    if (!onSelectChange) return;
    
    const itemKey = id.toString();
    let newSelectedKeys: React.Key[];
    
    if (isSelected) {
      newSelectedKeys = [...selectedKeys, itemKey];
    } else {
      newSelectedKeys = selectedKeys.filter(key => key !== itemKey);
    }
    
    const selectedRows = itemsRef.current.filter(item => 
      newSelectedKeys.includes(item.id?.toString() || '')
    );
    
    onSelectChange(newSelectedKeys, selectedRows);
  }, [selectedKeys, onSelectChange]);
  
  // 선택된 항목 복사
  const handleCopySelected = useCallback(async () => {
    if (selectedKeys.length === 0) return;
    
    const selectedItems = itemsRef.current.filter(item => 
      selectedKeys.includes(item.id?.toString() || '')
    );
    
    const success = await copySelectedNewsToClipboard(selectedItems);
    showToast(success 
      ? `${selectedKeys.length}개 항목이 클립보드에 복사되었습니다` 
      : '복사에 실패했습니다'
    );
    
    // 이벤트 트래킹
    trackEvent('copy_selected_news', { count: selectedKeys.length });
  }, [selectedKeys, showToast]);
  
  // 스크롤 방향 변경 처리
  const handleScrollDirectionChange = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up' && window.scrollY < 10) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);
  
  // Pull-to-refresh 로직 개선
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    
    // iOS Safari에서 문서 전체 스크롤 방지
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    let startY = 0;
    let isPulling = false;
    let pullDistance = 0;
    const pullThreshold = 80;
    const maxPull = 120;
    
    // 인디케이터 생성
    const indicator = document.createElement('div');
    indicator.className = 'refresh-indicator';
    indicator.textContent = '당겨서 새로고침';
    containerRef.current.appendChild(indicator);
    
    // Passive: false로 설정하여 preventDefault 허용
    const handleTouchStart = (e: TouchEvent) => {
      // 컨테이너 내부 요소의 스크롤 위치 확인
      const scrollElement = document.querySelector('.window-container') as HTMLElement;
      const scrollTop = scrollElement?.scrollTop || window.scrollY;
      
      if (scrollTop <= 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
        pullDistance = 0;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      
      pullDistance = e.touches[0].clientY - startY;
      
      // 아래로 당기는 경우에만 처리 (위로 스크롤은 무시)
      if (pullDistance > 0) {
        // 브라우저 기본 동작 방지 (중요)
        e.preventDefault();
        
        // 저항 추가 (당길수록 움직임 감소)
        const resistance = 0.4;
        const visualPullDistance = Math.min(pullDistance * resistance, maxPull);
        
        // 시각적 피드백
        if (visualPullDistance > 0) {
          indicator.classList.add('visible');
          indicator.classList.add('pulling');
          indicator.style.transform = `translate(-50%, ${visualPullDistance * 0.5}px)`;
          
          if (visualPullDistance > pullThreshold) {
            indicator.textContent = '놓아서 새로고침';
          } else {
            indicator.textContent = '당겨서 새로고침';
          }
        }
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isPulling) return;
      
      if (pullDistance > pullThreshold && !refreshing && typeof onRefresh === 'function') {
        // 새로고침 애니메이션 표시
        indicator.textContent = '새로고침 중...';
        indicator.classList.add('refreshing');
        
        // 새로고침 실행
        handleRefresh();
      }
      
      // 상태 및 스타일 초기화
      isPulling = false;
      pullDistance = 0;
      indicator.style.transform = '';
      indicator.classList.remove('pulling');
      
      // 새로고침 중이 아닌 경우에만 인디케이터 숨김
      if (!refreshing) {
        indicator.classList.remove('visible');
        indicator.classList.remove('refreshing');
      }
    };
    
    // refreshing 상태가 변경될 때 인디케이터 업데이트
    if (refreshing) {
      indicator.textContent = '새로고침 중...';
      indicator.classList.add('visible');
      indicator.classList.add('refreshing');
    } else {
      indicator.classList.remove('visible');
      indicator.classList.remove('refreshing');
    }
    
    // passive: false 옵션으로 이벤트 등록 (preventDefault 사용 가능)
    containerRef.current.addEventListener('touchstart', handleTouchStart, { passive: false });
    containerRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
    containerRef.current.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      // 이벤트 정리
      if (containerRef.current) {
        containerRef.current.removeEventListener('touchstart', handleTouchStart);
        containerRef.current.removeEventListener('touchmove', handleTouchMove);
        containerRef.current.removeEventListener('touchend', handleTouchEnd);
        
        if (indicator.parentNode === containerRef.current) {
          containerRef.current.removeChild(indicator);
        }
      }
      
      // 문서 스타일 복원
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [handleRefresh, refreshing, onRefresh]);
  
  // 비어있거나 로딩 중일 때 렌더링
  if (!mounted) {
    return <LoadingView />;
  }
  
  // 데이터가 없고 로딩 중이 아닐 때
  if (localItems.length === 0 && !isLoading && !refreshing) {
    return (
      <EmptyView>
        <h3>표시할 뉴스가 없습니다</h3>
        <p>새로고침을 해보거나 다른 카테고리를 선택해보세요.</p>
        <ActionButton 
          color="green" 
          onClick={handleRefresh} 
          aria-label="새로고침"
          style={{ position: 'static', margin: '20px 0' }}
        >
          <RefreshIcon />
        </ActionButton>
      </EmptyView>
    );
  }
  
  // 메인 컴포넌트 렌더링
  return (
    <>
      <GlobalStyle />
      <Container ref={containerRef}>
        <PullToRefreshContainer className="window-container">
          {/* 디버그 정보 (개발 환경) */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              background: 'rgba(0,0,0,0.7)', 
              color: 'white', 
              padding: '4px 8px',
              fontSize: '12px',
              zIndex: 9999
            }}>
              items: {items.length}, local: {localItems.length}, 
              loading: {isLoading.toString()}, refreshing: {refreshing.toString()}
            </div>
          )}
          
          {/* 로딩 상태 또는 가상 목록 */}
          {isLoading && localItems.length === 0 ? (
            <LoadingView />
          ) : (
            <ReactWindowComponents
              items={localItems || []} /* null/undefined 방지 */
              hasMore={hasMore}
              isLoading={isLoading || refreshing}
              onLoadMore={onLoadMore}
              onRefresh={onRefresh}
              selectedItems={(selectedKeys || []).map(key => key.toString())}
              onSelectItem={handleSelectItem}
              onScrollDirectionChange={handleScrollDirectionChange}
            />
          )}
        </PullToRefreshContainer>
        
        {/* 복사 버튼 */}
        <ActionButton
          visible={selectedKeys.length > 0}
          onClick={handleCopySelected}
          aria-label="선택한 뉴스 복사"
        >
          <CopyIcon />
        </ActionButton>
        
        {/* 새로고침 버튼 - 아이콘만 회전하도록 수정 */}
        <ActionButton
          color="green"
          onClick={handleRefresh}
          disabled={refreshing}
          isRefreshing={refreshing}
          aria-label="뉴스 새로고침"
        >
          <RefreshIcon />
        </ActionButton>
        
        {/* 토스트 메시지 */}
        {toast.visible && (
          <Toast>
            {toast.message}
          </Toast>
        )}
      </Container>
    </>
  );
}