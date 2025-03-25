import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// 새로고침 인디케이터
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
  transition: transform 0.3s ease;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  
  &.visible {
    transform: translateY(0);
  }
  
  &.pulling {
    transform: translateY(-70%);
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
  const touchStartY = useRef(0);
  const refreshThreshold = 80;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  // 새로고침 처리
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      
      const indicator = document.querySelector('.refresh-indicator') as HTMLElement;
      if (indicator) {
        indicator.classList.remove('pulling');
        indicator.textContent = '새로고침 중...';
        indicator.style.transform = 'translateY(0)';
      }
      
      await onRefresh();
      
      // 새로고침 완료 표시 후 숨기기
      setTimeout(() => {
        if (indicator) {
          indicator.textContent = '새로고침 완료!';
        }
        
        setTimeout(() => {
          if (indicator) {
            indicator.style.transform = 'translateY(-100%)';
          }
          setIsRefreshing(false);
          window.scrollTo(0, 0);
        }, 500);
      }, 500);
    } catch (error) {
      console.error('새로고침 실패:', error);
      
      const indicator = document.querySelector('.refresh-indicator') as HTMLElement;
      if (indicator) {
        indicator.textContent = '새로고침 실패';
        
        setTimeout(() => {
          if (indicator) {
            indicator.style.transform = 'translateY(-100%)';
          }
          setIsRefreshing(false);
        }, 1000);
      }
    }
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY.current;
    
    // 스크롤 위치가 맨 위에 있을 때만 당겨서 새로고침 동작
    if (window.scrollY <= 5 && diff > 0) {
      e.preventDefault(); // 스크롤 방지
      
      const indicator = document.querySelector('.refresh-indicator') as HTMLElement;
      if (indicator) {
        if (diff > refreshThreshold) {
          indicator.classList.add('pulling');
          indicator.textContent = '놓아서 새로고침';
        } else {
          indicator.classList.remove('pulling');
          indicator.textContent = '당겨서 새로고침';
        }
        
        // 부분적으로 표시
        const translateY = Math.min(diff * 0.5, 50) - 100;
        indicator.style.transform = `translateY(${translateY}%)`;
      }
      
      // 임계값을 넘으면 리프레시 플래그 설정
      const target = e.currentTarget as HTMLElement;
      if (diff > refreshThreshold) {
        target.dataset.readyToRefresh = 'true';
      } else {
        target.dataset.readyToRefresh = 'false';
      }
    }
  }, [isRefreshing, refreshThreshold]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    // 임계값을 넘었는지 확인
    const target = e.currentTarget as HTMLElement;
    if (target.dataset.readyToRefresh === 'true') {
      handleRefresh();
    } else {
      // 임계값에 도달하지 않았을 때 인디케이터 숨기기
      const indicator = document.querySelector('.refresh-indicator') as HTMLElement;
      if (indicator) {
        indicator.style.transform = 'translateY(-100%)';
      }
    }
    
    // 플래그 초기화
    target.dataset.readyToRefresh = 'false';
  }, [isRefreshing, handleRefresh]);

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
      onTouchEnd={handleTouchEnd}
      data-ready-to-refresh="false"
    >
      <RefreshIndicator className="refresh-indicator">
        당겨서 새로고침
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