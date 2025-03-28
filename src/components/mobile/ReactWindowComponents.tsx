import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import styled from '@emotion/styled';
import InfiniteLoader from 'react-window-infinite-loader';
import NewsCard from './NewsCard';

// 상수 정의
const ITEM_HEIGHT = 120; // 새로운 카드 높이에 맞춤
const LOADING_ITEM_HEIGHT = 60; // 로딩 아이템 높이 조정

const WindowContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: visible; /* 필수: 스크롤을 부모 컨테이너로 위임 */
  position: relative;
  contain: layout style;
`;

const ListContainer = styled.div`
  width: 100%;
  background-color: #f9f9f9;
  height: 100%;
  overflow: visible;
  position: relative;
  will-change: transform;
  transform: translateZ(0);
  padding-bottom: 16px; // 하단 여백 추가
`;

// 로딩 인디케이터 스타일
const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${LOADING_ITEM_HEIGHT}px;
  padding: 16px;
  background-color: transparent;
  color: #666;
  font-size: 14px;
  width: 100%;
`;

interface ReactWindowComponentsProps {
  items: any[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onRefresh?: () => Promise<any>;
  selectedItems?: string[];
  onSelectItem?: (id: string | number, isSelected: boolean) => void;
  onScrollDirectionChange?: (direction: 'up' | 'down') => void;
}

export default function ReactWindowComponents({
  items,
  hasMore,
  isLoading,
  onLoadMore,
  onRefresh,
  selectedItems = [],
  onSelectItem,
  onScrollDirectionChange
}: ReactWindowComponentsProps) {
  const listRef = useRef<any>(null);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight - 180 : 600);
  const [lastScrollOffset, setLastScrollOffset] = useState(0);
  const itemCount = Array.isArray(items) ? items.length : 0;
  const [isFirstRender, setIsFirstRender] = useState(true);
  const itemsRef = useRef<any[]>([]); // 아이템 참조 저장
  
  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log('ReactWindowComponents 마운트됨. 아이템 수:', Array.isArray(items) ? items.length : 0);
    setIsFirstRender(false);
    
    // 초기 리사이즈 처리
    const handleResize = () => {
      setWindowHeight(window.innerHeight - 180);
      if (listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
        listRef.current.resetAfterIndex(0);
      }
    };
    
    // 초기 리사이즈 실행 및 이벤트 리스너 등록
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // items 변경 감지 및 처리
  useEffect(() => {
    // 배열 확인
    if (!Array.isArray(items)) {
      console.warn('ReactWindowComponents - items가 배열이 아닙니다:', items);
      itemsRef.current = [];
      return;
    }
    
    console.log('ReactWindowComponents - items 변경됨:', items.length);
    itemsRef.current = items;
    
    if (!isFirstRender && listRef.current) {
      console.log('아이템 목록 변경됨. 스크롤 리셋');
      listRef.current.scrollTo(0);
      
      // 리스트 강제 업데이트
      if (typeof listRef.current.resetAfterIndex === 'function') {
        listRef.current.resetAfterIndex(0);
      }
    }
  }, [items, isFirstRender]);
  
  // 스크롤 이벤트 처리
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    // 스크롤 방향 감지 및 전달
    if (onScrollDirectionChange) {
      const direction = scrollOffset > lastScrollOffset ? 'down' : 'up';
      onScrollDirectionChange(direction);
    }
    
    setLastScrollOffset(scrollOffset);
  }, [lastScrollOffset, onScrollDirectionChange]);
  
  // 무한 스크롤 로드 함수
  const loadMoreItems = useCallback(() => {
    if (!isLoading) {
      console.log('추가 아이템 로드 요청');
      return onLoadMore();
    }
    return Promise.resolve();
  }, [isLoading, onLoadMore]);
  
  // 아이템이 로드되었는지 확인하는 함수 - 페이지네이션에서는 항상 true
  const isItemLoaded = useCallback(() => {
    return true;
  }, []);
  
  // 행 렌더링 함수
  const Row = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    // 먼저 items 배열 유효성 검사
    const currentItems = Array.isArray(itemsRef.current) && itemsRef.current.length > 0 
      ? itemsRef.current 
      : Array.isArray(items) ? items : [];
    
    // 아이템이 없는 경우 로딩 표시
    if (!currentItems || currentItems.length === 0) {
      if (isLoading) {
        return (
          <div style={{ ...style, height: LOADING_ITEM_HEIGHT }}>
            <LoadingIndicator>데이터를 불러오는 중...</LoadingIndicator>
          </div>
        );
      } else {
        return (
          <div style={{ ...style, height: LOADING_ITEM_HEIGHT }}>
            <LoadingIndicator>데이터가 없습니다</LoadingIndicator>
          </div>
        );
      }
    }
    
    // 일반 아이템 렌더링
    if (index < currentItems.length) {
      const item = currentItems[index];
      if (!item) {
        console.warn('유효하지 않은 아이템', { index, itemsLength: currentItems.length });
        return (
          <div style={{ ...style, height: ITEM_HEIGHT, padding: '3px 12px' }}>
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '8px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              항목 로드 오류
            </div>
          </div>
        );
      }
      
      const isSelected = selectedItems.includes(item.id?.toString() || '');
      
      // 디버깅용 로그 추가
      if (index === 0) {
        console.log('첫 번째 아이템 렌더링:', item);
      }
      
      return (
        <div style={{ ...style, height: ITEM_HEIGHT, padding: '3px 12px' }}>
          <NewsCard 
            key={item.id} 
            title={item.title || '제목 없음'}
            description={item.description || '내용 없음'}
            date={item.pub_date ? new Date(item.pub_date).toLocaleString('ko-KR') : new Date().toLocaleString('ko-KR')}
            category={item.category || '일반'}
            original_link={item.original_link || '#'}
            id={item.id?.toString() || `item-${index}`}
            isSelected={isSelected}
            onSelect={() => onSelectItem?.(item.id || `item-${index}`, !isSelected)}
          />
        </div>
      );
    }
    
    return null;
  }, [items, isLoading, loadMoreItems, selectedItems, onSelectItem]);
  
  // 아이템이 없는 경우의 처리
  if (!Array.isArray(items) || items.length === 0 && !isLoading) {
    return (
      <div style={{ 
        padding: '32px 16px', 
        textAlign: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        margin: '16px',
        color: '#666' 
      }}>
        <h3 style={{ marginBottom: '8px', color: '#333' }}>데이터가 없습니다</h3>
        <p>새로고침 버튼을 눌러 다시 시도해보세요.</p>
      </div>
    );
  }
  
  return (
    <WindowContainer>
      <ListContainer>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          threshold={3}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(list) => {
                if (list) {
                  listRef.current = list;
                  if (typeof ref === 'function') ref(list);
                }
              }}
              onItemsRendered={onItemsRendered}
              onScroll={handleScroll}
              height={windowHeight}
              width="100%"
              itemCount={itemCount}
              itemSize={ITEM_HEIGHT}
              overscanCount={3}
              style={{
                willChange: 'transform',
                transform: 'translateZ(0)',
                overflowX: 'hidden',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      </ListContainer>
    </WindowContainer>
  );
} 