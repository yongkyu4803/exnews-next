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
  
  // 실제 새로고침 수행 함수
  const performRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    if (refreshIndicatorRef.current) {
      refreshIndicatorRef.current.textContent = '새로고침 중...';
      refreshIndicatorRef.current.style.transform = 'translateY(0)';
      refreshIndicatorRef.current.style.color = '#1a73e8';
    }
    
    console.log('새로고침 시작');
    
    try {
      // 최대 3번까지 재시도
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await onRefresh();
          
          // 데이터가 성공적으로 반환되었는지 확인
          if (items.length > 0) {
            if (refreshIndicatorRef.current) {
              refreshIndicatorRef.current.textContent = '새로고침 완료!';
            }
            console.log('새로고침 성공적으로 완료');
            break;
          }
          
          // 데이터가 없으면 재시도
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`데이터 없음, 재시도 ${retryCount}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
          }
        } catch (error) {
          console.error(`새로고침 시도 ${retryCount + 1} 실패:`, error);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // 모든 재시도 후에도 데이터가 없는 경우
      if (retryCount === maxRetries && items.length === 0) {
        console.log('모든 재시도 실패, 페이지 새로고침');
        if (refreshIndicatorRef.current) {
          refreshIndicatorRef.current.textContent = '새로고침 실패';
        }
        setToastMessage('데이터를 불러오는데 실패했습니다. 페이지를 새로고침합니다.');
        setShowToast(true);
        
        // 2초 후 페이지 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('새로고침 오류:', error);
      
      if (refreshIndicatorRef.current) {
        refreshIndicatorRef.current.textContent = '새로고침 실패';
      }
      
      setToastMessage('새로고침 중 오류가 발생했습니다.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setTimeout(() => {
        if (refreshIndicatorRef.current) {
          refreshIndicatorRef.current.style.transform = 'translateY(-100%)';
        }
        
        setTimeout(() => {
          setIsRefreshing(false);
        }, 300);
      }, 800);
    }
  }, [isRefreshing, onRefresh, setToastMessage, items]);
  
  // 새로고침 인디케이터 생성 - 이제 setupTouchEvents를 직접 호출하지 않고 인디케이터만 반환
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
    indicator.style.zIndex = '9999';
    indicator.style.transform = 'translateY(-100%)';
    indicator.style.transition = 'transform 0.3s ease';
    indicator.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    document.body.insertBefore(indicator, document.body.firstChild);
    refreshIndicatorRef.current = indicator;
    
    return indicator;
  }, []);
  
  // 터치 이벤트 설정 - 이제 인디케이터를 매개변수로 받음
  const setupTouchEvents = useCallback((indicator: HTMLDivElement) => {
    let startY = 0;
    let isActive = false;
    const minPullDistance = 80;
    
    // 이벤트 리스너 제거 함수
    const removeListeners = () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    // 터치 시작
    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      
      // 스크롤이 최상단에 있을 때만 작동
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        isActive = true;
        
        // 디버깅 로그
        console.log('터치 시작 위치:', startY);
      }
    };
    
    // 터치 이동
    const handleTouchMove = (e: TouchEvent) => {
      if (!isActive || isRefreshing) return;
      
      const y = e.touches[0].clientY;
      const pullDistance = y - startY;
      
      // 디버깅 로그
      if (pullDistance > 10) {
        console.log('당김 거리:', pullDistance);
      }
      
      // 아래로 당겼을 때만 처리
      if (pullDistance > 0) {
        // 스크롤 방지 - preventDefault는 passive: false 옵션이 있어야 작동
        e.preventDefault();
        
        // 당김 거리에 비례하여 인디케이터 표시 (저항 적용)
        const resistance = 0.4;
        const translateY = Math.min(pullDistance * resistance, 80);
        
        // 인라인 스타일 직접 적용 (중요)
        indicator.style.transform = `translateY(${translateY}px)`;
        indicator.style.transition = 'none'; // 당기는 동안 전환 효과 없음
        
        // 충분히 당겼는지 표시
        if (pullDistance > minPullDistance) {
          indicator.textContent = '놓아서 새로고침';
          indicator.style.color = '#1a73e8';
        } else {
          indicator.textContent = '당겨서 새로고침';
          indicator.style.color = '#333';
        }
      }
    };
    
    // 터치 종료
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isActive) return;
      
      isActive = false;
      
      // 인디케이터에 전환 효과 다시 적용
      indicator.style.transition = 'transform 0.3s ease';
      
      // 마지막 터치 위치 가져오기
      const y = e.changedTouches[0].clientY;
      const pullDistance = y - startY;
      
      console.log('터치 종료, 당김 거리:', pullDistance, '최소 필요 거리:', minPullDistance);
      
      // 충분히 당겼는지 확인
      if (pullDistance > minPullDistance) {
        // 새로고침 실행
        console.log('충분히 당겨서 새로고침 시작');
        performRefresh();
      } else {
        // 인디케이터 원위치 - 충분히 당기지 않은 경우
        console.log('충분히 당기지 않아 원위치');
        indicator.style.transform = 'translateY(-100%)';
      }
    };
    
    // 이벤트 리스너 등록 - passive: false 설정은 필수!
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 이벤트 리스너 제거 함수 반환
    return removeListeners;
  }, [isRefreshing, performRefresh]);
  
  // 최초 마운트 시 초기화 - 여기서 함수를 호출하는 useEffect를 맨 뒤로 이동
  useEffect(() => {
    setIsMounted(true);
    
    // 스크롤 위치 초기화
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      setInitialRender(false);
      
      // 인디케이터 생성 및 이벤트 리스너 설정
      const indicator = createRefreshIndicator();
      const cleanupListeners = setupTouchEvents(indicator);
      
      return () => {
        // 컴포넌트 언마운트 시 정리
        cleanupListeners();
        if (indicator && indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      };
    }
  }, [createRefreshIndicator, setupTouchEvents]);

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