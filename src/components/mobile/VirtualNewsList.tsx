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

// 새로고침 버튼 스타일
const RefreshButton = styled.button<{ loading: boolean }>`
  position: fixed;
  bottom: 20px;
  right: ${props => props.loading ? '20px' : '80px'};
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
  z-index: 100;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
    background-color: #3e8e41;
  }
  
  svg {
    width: 24px;
    height: 24px;
    transition: transform 0.5s ease;
    transform: ${props => props.loading ? 'rotate(360deg)' : 'rotate(0)'};
    animation: ${props => props.loading ? 'spin 1s linear infinite' : 'none'};
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// 새로고침 아이콘 컴포넌트
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
    <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

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
  // 로컬 데이터 관리를 위한 상태 추가
  const [localItems, setLocalItems] = useState<any[]>([]);
  
  // items prop이 변경될 때 localItems 업데이트
  useEffect(() => {
    if (items.length > 0) {
      console.log('부모로부터 새 아이템 수신:', items.length);
      setLocalItems(items);
    }
  }, [items]);
  
  // 실제 새로고침 수행 함수
  const performRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log('새로고침 시작', { currentItems: items.length });
    setToastMessage('새로고침 중...');
    setShowToast(true);
    
    try {
      // 최대 3번까지 재시도
      let retryCount = 0;
      const maxRetries = 3;
      let initialItemCount = items.length;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`새로고침 시도 ${retryCount + 1} 시작`);
          
          // onRefresh 함수가 Promise를 반환하는지 확인
          if (typeof onRefresh !== 'function') {
            console.error('onRefresh is not a function:', onRefresh);
            throw new Error('onRefresh is not a function');
          }
          
          // onRefresh 호출 및 결과 캡처
          const result = await onRefresh();
          console.log(`새로고침 응답 받음:`, result);
          
          // 결과에서 아이템 추출 시도 (onRefresh가 다양한 형태의 응답을 반환할 수 있음)
          let newItems = [];
          if (result) {
            if (Array.isArray(result)) {
              newItems = result;
            } else if (result.items && Array.isArray(result.items)) {
              newItems = result.items;
            } else if (result.data && Array.isArray(result.data)) {
              newItems = result.data;
            }
          }
          
          // 새 아이템이 있으면 로컬 상태 업데이트
          if (newItems.length > 0) {
            console.log(`새로 받은 아이템 수: ${newItems.length}`);
            setLocalItems(newItems);
            
            console.log('새로고침 성공적으로 완료');
            setToastMessage('새로고침 완료!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 1500);
            break;
          }
          
          // 데이터 로드 후 1초 대기 (상태 업데이트 확인)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log(`새로고침 후 아이템 수: ${items.length}, 이전: ${initialItemCount}`);
          
          // items 업데이트 확인 (부모 컴포넌트에서 업데이트되었을 경우)
          if (items.length > 0 && (items.length !== initialItemCount || items !== localItems)) {
            console.log('부모 컴포넌트에서 아이템 업데이트됨');
            setLocalItems(items);
            
            console.log('새로고침 성공적으로 완료');
            setToastMessage('새로고침 완료!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 1500);
            break;
          }
          
          // 데이터가 없으면 재시도
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`데이터 없음, 재시도 ${retryCount}/${maxRetries}`);
            setToastMessage(`데이터 로딩 중... (${retryCount}/${maxRetries})`);
            setShowToast(true);
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
      if (retryCount === maxRetries && localItems.length === 0) {
        console.log('모든 재시도 실패, 페이지 새로고침');
        setToastMessage('데이터를 불러오는데 실패했습니다. 페이지를 새로고침합니다.');
        setShowToast(true);
        
        // 2초 후 페이지 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('새로고침 오류:', error);
      setToastMessage('새로고침 중 오류가 발생했습니다.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  }, [isRefreshing, onRefresh, items, localItems]);
  
  // 최초 마운트 시 초기화
  useEffect(() => {
    setIsMounted(true);
    
    // 스크롤 위치 초기화
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      setInitialRender(false);
    }
  }, []);

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
      {/* 디버그 정보 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          background: 'rgba(0,0,0,0.7)', 
          color: 'white', 
          padding: '4px 8px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          items: {items.length}, localItems: {localItems.length}, 
          isLoading: {isLoading.toString()}, isRefreshing: {isRefreshing.toString()}
        </div>
      )}
      
      <ReactWindowComponents
        items={localItems.length > 0 ? localItems : items}
        hasMore={hasMore}
        isLoading={isLoading || isRefreshing}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        selectedItems={selectedKeys.map(key => key.toString())}
        onSelectItem={handleSelectItem}
        onScrollDirectionChange={handleScrollDirectionChange}
      />
      
      {/* 새로고침 버튼 */}
      <RefreshButton 
        loading={isRefreshing}
        onClick={performRefresh}
        disabled={isRefreshing}
        aria-label="뉴스 새로고침"
      >
        <RefreshIcon />
      </RefreshButton>
      
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