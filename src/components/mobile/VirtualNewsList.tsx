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

// 커스텀 새로고침 인디케이터
const PullIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  width: 100%;
  background-color: #f9f9f9;
  color: #333;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIndicatorRef = useRef<HTMLDivElement | null>(null);
  
  // 최초 마운트 시 초기화
  useEffect(() => {
    setIsMounted(true);
    
    // 스크롤 위치 초기화
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      setInitialRender(false);
      
      // 페이지 로드 후 인디케이터 생성
      createRefreshIndicator();
      
      return () => {
        // 컴포넌트 언마운트 시 인디케이터 제거
        if (refreshIndicatorRef.current && refreshIndicatorRef.current.parentNode) {
          refreshIndicatorRef.current.parentNode.removeChild(refreshIndicatorRef.current);
        }
      };
    }
  }, []);
  
  // 새로고침 인디케이터 생성
  const createRefreshIndicator = useCallback(() => {
    // 이미 생성된 경우 제거
    if (refreshIndicatorRef.current && refreshIndicatorRef.current.parentNode) {
      refreshIndicatorRef.current.parentNode.removeChild(refreshIndicatorRef.current);
    }
    
    // 새로고침 인디케이터 엘리먼트 생성
    const indicator = document.createElement('div');
    indicator.textContent = '당겨서 새로고침';
    indicator.className = 'refresh-indicator';
    indicator.style.position = 'absolute';
    indicator.style.top = '0';
    indicator.style.left = '0';
    indicator.style.width = '100%';
    indicator.style.height = '50px';
    indicator.style.backgroundColor = '#f9f9f9';
    indicator.style.color = '#333';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.style.justifyContent = 'center';
    indicator.style.fontWeight = '500';
    indicator.style.zIndex = '1000';
    indicator.style.transform = 'translateY(-100%)';
    indicator.style.transition = 'transform 0.3s ease';
    indicator.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    document.body.insertBefore(indicator, document.body.firstChild);
    refreshIndicatorRef.current = indicator;
    
    // 터치 이벤트 설정
    setupTouchEvents();
  }, []);
  
  // 터치 이벤트 설정
  const setupTouchEvents = useCallback(() => {
    let startY = 0;
    let isActive = false;
    const minPullDistance = 80;
    
    // 터치 시작
    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      
      // 스크롤이 최상단에 있을 때만 작동
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        isActive = true;
      }
    };
    
    // 터치 이동
    const handleTouchMove = (e: TouchEvent) => {
      if (!isActive || isRefreshing) return;
      
      const y = e.touches[0].clientY;
      const pullDistance = y - startY;
      
      // 아래로 당겼을 때만 처리
      if (pullDistance > 0) {
        // 스크롤 방지
        e.preventDefault();
        
        // 인디케이터가 존재하는지 확인
        if (refreshIndicatorRef.current) {
          // 당김 거리에 비례하여 인디케이터 표시 (저항 적용)
          const resistance = 0.4;
          const translateY = Math.min(pullDistance * resistance, 80);
          
          refreshIndicatorRef.current.style.transform = `translateY(${translateY}px)`;
          
          // 충분히 당겼는지 표시
          if (pullDistance > minPullDistance) {
            refreshIndicatorRef.current.textContent = '놓아서 새로고침';
            refreshIndicatorRef.current.style.color = '#1a73e8';
          } else {
            refreshIndicatorRef.current.textContent = '당겨서 새로고침';
            refreshIndicatorRef.current.style.color = '#333';
          }
        }
      }
    };
    
    // 터치 종료
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isActive || isRefreshing) return;
      
      isActive = false;
      
      // 인디케이터가 존재하는지 확인
      if (!refreshIndicatorRef.current) return;
      
      const y = e.changedTouches[0].clientY;
      const pullDistance = y - startY;
      
      // 충분히 당겼는지 확인
      if (pullDistance > minPullDistance) {
        // 새로고침 실행
        performRefresh();
      } else {
        // 인디케이터 원위치
        refreshIndicatorRef.current.style.transform = 'translateY(-100%)';
      }
    };
    
    // 이벤트 리스너 등록
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 정리 함수 반환 (컴포넌트가 언마운트될 때 호출됨)
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing]);
  
  // 실제 새로고침 수행
  const performRefresh = useCallback(async () => {
    // 이미 새로고침 중인 경우 무시
    if (isRefreshing) return;
    
    try {
      // 새로고침 상태 설정
      setIsRefreshing(true);
      
      // 인디케이터가 존재하는지 확인
      if (refreshIndicatorRef.current) {
        // 새로고침 중임을 표시
        refreshIndicatorRef.current.textContent = '새로고침 중...';
        refreshIndicatorRef.current.style.transform = 'translateY(0)';
      }
      
      console.log('새로고침 시작');
      
      // 실제 데이터 새로고침 수행
      try {
        // Promise.resolve()로 감싸서 예외 처리를 더 잘 할 수 있도록 함
        await Promise.resolve(onRefresh());
        
        // 성공 메시지 표시
        if (refreshIndicatorRef.current) {
          refreshIndicatorRef.current.textContent = '새로고침 완료!';
        }
        
        console.log('새로고침 성공');
      } catch (error) {
        // 오류 메시지 표시
        if (refreshIndicatorRef.current) {
          refreshIndicatorRef.current.textContent = '새로고침 실패';
        }
        
        console.error('새로고침 오류:', error);
      }
      
      // 잠시 후 인디케이터 숨기기
      setTimeout(() => {
        if (refreshIndicatorRef.current) {
          refreshIndicatorRef.current.style.transform = 'translateY(-100%)';
        }
        
        // 상태 초기화
        setTimeout(() => {
          setIsRefreshing(false);
        }, 300);
      }, 800);
    } catch (e) {
      console.error('전체 새로고침 오류:', e);
      setIsRefreshing(false);
      if (refreshIndicatorRef.current) {
        refreshIndicatorRef.current.style.transform = 'translateY(-100%)';
      }
    }
  }, [isRefreshing, onRefresh]);
  
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
  if (items.length === 0 && !isLoading && !isRefreshing) {
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
        overflow: 'visible',
        backgroundColor: '#ffffff'
      }}
    >
      <ReactWindowComponents
        items={items}
        hasMore={hasMore}
        isLoading={isLoading || isRefreshing}
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