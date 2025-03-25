import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import NewsCard from './NewsCard';
import styled from '@emotion/styled';
import { trackEvent } from '@/utils/analyticsUtils';
import { copySelectedNewsToClipboard } from '@/utils/clipboardUtils';

// 클라이언트 사이드에서만 로드되는 컴포넌트
const ReactWindowComponents = dynamic(() => import('./ReactWindowComponents'), {
  ssr: false,
  loading: () => <ListLoadingState />
});

const ListContainer = styled.div`
  height: calc(100vh - 180px);
  width: 100%;
  overflow: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
`;

// 새로고침 인디케이터 - 기본적으로 완전히 숨겨짐
const RefreshIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-weight: 500;
  background-color: #f9f9f9;
  transform: translateY(-100%);
  transition: transform 0.3s ease, opacity 0.3s ease;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  opacity: 0;
  pointer-events: none;
  visibility: hidden; /* 완전히 숨기기 위해 visibility 추가 */
`;

// 로딩 컴포넌트
const LoadingContainer = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: var(--card-border-radius, 16px);
  flex-direction: column;
`;

// 스켈레톤 로딩 상태
const SkeletonCard = styled.div`
  height: 145px;
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 16px;
  border-radius: var(--card-border-radius, 16px);
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.1));
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
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

// 스켈레톤 로딩 상태
const ListLoadingState = () => (
  <LoadingContainer>
    {[1, 2, 3, 4, 5].map((i) => (
      <SkeletonCard key={i} />
    ))}
    <div style={{ textAlign: 'center', marginTop: '16px', color: '#666' }}>
      뉴스를 불러오는 중입니다...
    </div>
  </LoadingContainer>
);

// 데이터 없음 상태
const EmptyState = styled.div`
  height: 300px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  border-radius: var(--card-border-radius, 16px);
  color: #666;
  font-size: 16px;
  margin-top: 32px;
  flex-direction: column;
  text-align: center;
  padding: 0 16px;
  
  h3 {
    margin-bottom: 8px;
    font-size: 18px;
    color: #444;
  }
`;

// 복사 버튼 스타일
const CopyButton = styled.button<{ visible: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: ${props => props.visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
  z-index: 100;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
    background-color: #1562c5;
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

// 복사 아이콘 컴포넌트
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

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
  const [isMounted, setIsMounted] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const [initialRender, setInitialRender] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0); // 당김 진행도 (0-100)
  const [refreshText, setRefreshText] = useState('당겨서 새로고침');
  const refreshThreshold = 70;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // 터치 관련 ref
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const pullDistance = useRef(0);
  const isPulling = useRef(false);
  const readyToRefresh = useRef(false);
  const indicatorRef = useRef<HTMLDivElement>(null);
  
  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    setIsMounted(true);
    
    // 스크롤 위치 초기화
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
        setInitialRender(false);
      }, 100);
      
      // CSS 컨트롤 - 클래스 통해 인디케이터 강제 숨김
      const refreshIndicator = document.querySelector('.virtual-news-list-container > div:first-of-type');
      if (refreshIndicator) {
        (refreshIndicator as HTMLElement).style.transform = 'translateY(-100%)';
        (refreshIndicator as HTMLElement).style.opacity = '0';
        (refreshIndicator as HTMLElement).style.visibility = 'hidden';
      }
      
      return () => {
        clearTimeout(timer);
        // 당기기 클래스 정리
        document.body.classList.remove('is-pulling');
      };
    }
  }, []);

  // 터치 시작 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    // 스크롤 위치가 최상단인 경우에만 pull-to-refresh 동작 시작
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      touchCurrentY.current = e.touches[0].clientY;
      isPulling.current = true;
      pullDistance.current = 0;
      readyToRefresh.current = false;
      
      // 문서에 당김 클래스 추가
      document.body.classList.add('is-pulling');
    }
  }, [isRefreshing]);

  // 터치 이동 이벤트 핸들러
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing || !isPulling.current) return;
    
    // 현재 스크롤 위치가 0이 아니면 pull-to-refresh 동작 중단
    if (window.scrollY > 0) {
      isPulling.current = false;
      setRefreshProgress(0);
      document.body.classList.remove('is-pulling');
      return;
    }
    
    touchCurrentY.current = e.touches[0].clientY;
    pullDistance.current = Math.max(0, touchCurrentY.current - touchStartY.current);
    
    // 당김 거리가 있는 경우에만 기본 동작 방지
    if (pullDistance.current > 10) { // 작은 임계값 추가하여 우발적 당김 방지
      e.preventDefault();
      e.stopPropagation(); // 이벤트 전파 중지
      
      // 당김 진행도 계산 (0-100%)
      const progress = Math.min(100, (pullDistance.current / refreshThreshold) * 100);
      setRefreshProgress(progress);
      
      // 인디케이터 상태 업데이트 - 최대한 직접 DOM 조작
      if (indicatorRef.current) {
        const translateY = Math.min(0, -100 + progress);
        const opacity = progress / 100;
        
        indicatorRef.current.style.transform = `translateY(${translateY}%)`;
        indicatorRef.current.style.opacity = opacity.toString();
        indicatorRef.current.style.visibility = opacity > 0 ? 'visible' : 'hidden';
        
        // 하드웨어 가속 강제
        indicatorRef.current.style.willChange = 'transform, opacity';
      }
      
      // 새로고침 준비 상태 업데이트
      const wasReadyToRefresh = readyToRefresh.current;
      readyToRefresh.current = progress >= 100;
      
      // 상태가 변경된 경우에만 텍스트 업데이트
      if (readyToRefresh.current !== wasReadyToRefresh) {
        setRefreshText(readyToRefresh.current ? '놓아서 새로고침' : '당겨서 새로고침');
      }
    }
  }, [isRefreshing, refreshThreshold]);

  // 터치 종료 이벤트 핸들러
  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    
    // 문서에서 당김 클래스 제거
    document.body.classList.remove('is-pulling');
    isPulling.current = false;
    
    // 이미 새로고침 중이면 무시
    if (isRefreshing) return;
    
    // 새로고침 실행
    if (readyToRefresh.current) {
      setIsRefreshing(true);
      setRefreshText('새로고침 중...');
      
      // 인디케이터 완전히 표시 - DOM 직접 조작
      if (indicatorRef.current) {
        indicatorRef.current.style.transform = 'translateY(0)';
        indicatorRef.current.style.opacity = '1';
        indicatorRef.current.style.visibility = 'visible';
      }
      
      // 새로고침 함수 실행
      onRefresh()
        .then(() => {
          setRefreshText('새로고침 완료!');
          
          // 인디케이터 숨기기
          setTimeout(() => {
            hideRefreshIndicator();
          }, 800);
        })
        .catch(() => {
          setRefreshText('새로고침 실패');
          
          // 인디케이터 숨기기
          setTimeout(() => {
            hideRefreshIndicator();
          }, 800);
        });
    } else {
      // 새로고침 취소 - 인디케이터 숨기기
      hideRefreshIndicator();
    }
  }, [isRefreshing, onRefresh]);
  
  // 인디케이터 숨기기 함수
  const hideRefreshIndicator = () => {
    if (indicatorRef.current) {
      indicatorRef.current.style.transform = 'translateY(-100%)';
      indicatorRef.current.style.opacity = '0';
      indicatorRef.current.style.visibility = 'hidden';
      
      // 상태 초기화
      setTimeout(() => {
        setIsRefreshing(false);
        readyToRefresh.current = false;
        setRefreshProgress(0);
        setRefreshText('당겨서 새로고침');
      }, 300);
    }
  };

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
    
    const selectedRows = items.filter(item => 
      newSelectedKeys.includes(item.id?.toString() || '')
    );
    
    onSelectChange(newSelectedKeys, selectedRows);
  }, [items, selectedKeys, onSelectChange]);

  // 선택된 항목 복사 처리
  const handleCopySelected = async () => {
    if (selectedKeys.length === 0) return;
    
    const selectedItems = items.filter(item => 
      selectedKeys.includes(item.id?.toString() || '')
    );
    
    const success = await copySelectedNewsToClipboard(selectedItems);
    
    setToastMessage(success 
      ? `${selectedKeys.length}개 항목이 클립보드에 복사되었습니다` 
      : '복사에 실패했습니다'
    );
    setShowToast(true);
    
    // 3초 후 토스트 메시지 숨기기
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // 스크롤 방향 변경 핸들러
  const handleScrollDirectionChange = useCallback((direction: 'up' | 'down') => {
    if (initialRender) return;
    
    if (direction === 'up' && window.scrollY < 10) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [initialRender]);

  // 서버 사이드 렌더링 시 로딩 UI 표시
  if (!isMounted) {
    return <ListLoadingState />;
  }
  
  // 아이템이 없고 로딩 중이 아닌 경우
  if (items.length === 0 && !isLoading) {
    return (
      <EmptyState>
        <h3>표시할 뉴스가 없습니다</h3>
        <p>다른 카테고리를 선택하거나 나중에 다시 확인해주세요.</p>
      </EmptyState>
    );
  }

  return (
    <div 
      ref={divRef} 
      className="virtual-news-list-container"
      style={{ 
        margin: 0, 
        padding: 0, 
        position: 'relative',
        height: 'calc(100vh - 180px)',
        overflow: 'auto',
        touchAction: isPulling.current ? 'none' : 'auto'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd} // 터치 취소 이벤트도 처리
    >
      {/* 새로고침 인디케이터 */}
      <RefreshIndicator 
        ref={indicatorRef}
        style={{
          transform: 'translateY(-100%)',
          opacity: '0',
          visibility: 'hidden',
          willChange: 'transform, opacity' // 하드웨어 가속
        }}
      >
        {refreshText}
      </RefreshIndicator>
      
      <ReactWindowComponents
        items={items}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        selectedItems={selectedKeys.map(key => key.toString())}
        onSelectItem={handleSelectItem}
        onScrollDirectionChange={handleScrollDirectionChange}
      />
      
      {/* 선택된 항목 복사 버튼 */}
      <CopyButton 
        visible={selectedKeys.length > 0}
        onClick={handleCopySelected}
        aria-label="선택한 뉴스 복사"
      >
        <CopyIcon />
      </CopyButton>
      
      {/* 토스트 메시지 */}
      {showToast && (
        <div 
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            zIndex: 1000,
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}