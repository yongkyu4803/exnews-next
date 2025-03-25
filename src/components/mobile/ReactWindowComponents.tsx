import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import styled from '@emotion/styled';
import InfiniteLoader from 'react-window-infinite-loader';
import NewsCard from './NewsCard';

// 상수 정의
const ITEM_HEIGHT = 220; // 카드 아이템 높이 (픽셀)
const LOADING_ITEM_HEIGHT = 100; // 로딩 아이템 높이 (픽셀)

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
  const [windowHeight, setWindowHeight] = useState(window.innerHeight - 180);
  const [lastScrollOffset, setLastScrollOffset] = useState(0);
  const itemCount = hasMore ? items.length + 1 : items.length;
  
  // 화면 크기 변경 시 리스트 높이 조정
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight - 180);
      if (listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
        listRef.current.resetAfterIndex(0);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 스크롤 이벤트 처리
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    // 스크롤 방향 감지 및 전달
    if (onScrollDirectionChange) {
      const direction = scrollOffset > lastScrollOffset ? 'down' : 'up';
      onScrollDirectionChange(direction);
    }
    
    setLastScrollOffset(scrollOffset);
  }, [lastScrollOffset, onScrollDirectionChange]);
  
  // 행 렌더링 함수
  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    // 마지막 아이템이면서 hasMore이면 로딩 인디케이터 표시
    if (index === items.length) {
      if (!isLoading) {
        setTimeout(() => {
          onLoadMore();
        }, 100);
      }
      
      return (
        <div style={{ ...style, height: LOADING_ITEM_HEIGHT }}>
          <LoadingIndicator>
            더 불러오는 중...
          </LoadingIndicator>
        </div>
      );
    }
    
    const item = items[index];
    const isSelected = selectedItems.includes(item.id?.toString() || '');
    
    return (
      <div style={{ ...style, height: ITEM_HEIGHT, paddingBottom: '16px' }}>
        <NewsCard 
          key={item.id} 
          title={item.title}
          description={item.description || ''}
          date={new Date(item.pub_date).toLocaleString('ko-KR')}
          category={item.category}
          original_link={item.original_link}
          id={item.id}
          isSelected={isSelected}
          onSelect={() => onSelectItem?.(item.id, !isSelected)}
        />
      </div>
    );
  };
  
  // 아이템이 로드되었는지 확인하는 함수
  const isItemLoaded = (index: number) => {
    return !hasMore || index < items.length;
  };
  
  return (
    <WindowContainer>
      <ListContainer>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={isLoading ? () => {} : onLoadMore}
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