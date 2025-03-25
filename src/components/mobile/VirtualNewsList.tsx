import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import NewsCard from './NewsCard';
import styled from '@emotion/styled';
import { trackEvent } from '@/utils/analyticsUtils';

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

// 새로고침 인디케이터
const RefreshIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background-color: #f9f9f9;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  z-index: 10;
  
  &.visible {
    transform: translateY(0);
  }
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
  const touchStartY = useRef(0);
  const refreshThreshold = 80;

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    setIsMounted(true);
    
    // 스크롤 위치 초기화 - 안정적인 시점에 실행
    if (typeof window !== 'undefined') {
      // iOS Safari에서 스크롤 위치 리셋을 위한 딜레이 추가
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
        setInitialRender(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // 스크롤 방향 변경 핸들러 - 간소화 및 최적화
  const handleScrollDirectionChange = useCallback((direction: 'up' | 'down') => {
    if (initialRender) return; // 초기 렌더링 시 스크롤 이벤트 무시
    
    if (direction === 'up' && window.scrollY < 10) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      });
    }
  }, [initialRender]);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY.current;
    
    // 스크롤 위치가 맨 위에 있고, 아래로 당길 때
    if (window.scrollY === 0 && diff > 0) {
      if (diff > refreshThreshold) {
        setIsRefreshing(true);
        handleRefresh();
      }
    }
  }, [isRefreshing]);

  // 새로고침 처리
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    trackEvent('refresh_news', {});
    
    try {
      setIsRefreshing(true);
      await onRefresh();
      
      // 새로고침 완료 후 처리
      setTimeout(() => {
        setIsRefreshing(false);
        window.scrollTo(0, 0);
      }, 500);
    } catch (error) {
      setIsRefreshing(false);
    }
  };

  // 아이템 선택 처리
  const handleSelectItem = useCallback((id: string | number) => {
    if (!onSelectChange) return;
    
    const itemKey = id.toString();
    let newSelectedKeys: React.Key[];
    
    if (selectedKeys.includes(itemKey)) {
      newSelectedKeys = selectedKeys.filter(key => key !== itemKey);
    } else {
      newSelectedKeys = [...selectedKeys, itemKey];
    }
    
    const selectedRows = items.filter(item => 
      newSelectedKeys.includes(item.id?.toString() || '')
    );
    
    onSelectChange(newSelectedKeys, selectedRows);
  }, [items, selectedKeys, onSelectChange]);

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
        overflow: 'auto'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <RefreshIndicator className={isRefreshing ? 'visible' : ''}>
        {isRefreshing ? '새로고침 중...' : '당겨서 새로고침'}
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
    </div>
  );
}