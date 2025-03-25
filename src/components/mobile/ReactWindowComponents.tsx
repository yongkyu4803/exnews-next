import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import NewsCard from './NewsCard';
import styled from '@emotion/styled';

const ListContainer = styled.div`
  height: calc(100vh - 180px);
  width: 100%;
  overflow: auto;
  position: relative;
  z-index: 1;
  -webkit-overflow-scrolling: touch;
`;

// 로딩 인디케이터
const LoadingIndicator = styled.div`
  padding: 16px;
  text-align: center;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  
  &::after {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid #ddd;
    border-radius: 50%;
    border-top-color: var(--primary-color, #1a4b8c);
    animation: spin 0.8s linear infinite;
    margin-left: 8px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ReactWindow 스크롤 컨테이너 스타일
const WindowContainer = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  overflow: visible;
  
  .ReactVirtualized__List::-webkit-scrollbar {
    display: none;
  }
  
  .ReactVirtualized__List {
    scrollbar-width: none;
    -ms-overflow-style: none;
    overflow-y: auto !important;
  }
`;

// 카드 컨테이너 스타일
const CardContainer = styled.div`
  padding: 6px 10px;
  width: 100%;
  box-sizing: border-box;
  height: 220px !important; /* 명시적 고정 높이 */
  position: relative;
  contain: content;
  overflow: visible;
`;

interface ReactWindowComponentsProps {
  items: any[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onRefresh: () => Promise<any>;
  selectedItems?: string[];
  onSelectItem?: (id: string | number) => void;
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
  const [listHeight, setListHeight] = useState(window.innerHeight - 180); 
  const listRef = React.useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  
  // 아이템 고정 높이 설정
  const ITEM_HEIGHT = 220;
  const LOADING_ITEM_HEIGHT = 100;
  
  // 메모이제이션된 리사이즈 핸들러
  const handleResize = useCallback(() => {
    const height = typeof window !== 'undefined' ? 
      (containerRef.current?.clientHeight || window.innerHeight - 180) : 600;
    setListHeight(height);
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [handleResize]);

  // 초기 렌더링 시 height 강제 재계산
  useEffect(() => {
    setTimeout(handleResize, 100);
  }, [handleResize]);

  // 아이템이 변경될 때만 리스트 캐시 리셋
  useEffect(() => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTo(0);
      }
    }, 10);
  }, [items.length]);
  
  const itemCount = hasMore ? items.length + 1 : items.length;
  const loadMoreItems = isLoading ? () => {} : onLoadMore;
  const isItemLoaded = (index: number) => !hasMore || index < items.length;
  
  // 스크롤 이벤트 핸들러 - 간소화
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number, scrollDirection: string, scrollUpdateWasRequested: boolean }) => {
    const currentScrollTop = scrollOffset;
    
    // 스크롤 방향 감지 및 알림
    if (currentScrollTop > lastScrollTop.current) {
      if (onScrollDirectionChange) onScrollDirectionChange('down');
    } else if (currentScrollTop < lastScrollTop.current) {
      if (onScrollDirectionChange) onScrollDirectionChange('up');
    }
    
    // 현재 스크롤 위치 저장
    lastScrollTop.current = currentScrollTop;
  }, [onScrollDirectionChange]);

  // Row 컴포넌트 - 높이 일관성 보장
  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const rowStyle: React.CSSProperties = {
      ...style,
      height: isItemLoaded(index) ? ITEM_HEIGHT : LOADING_ITEM_HEIGHT,
      padding: 0,
      margin: 0,
      position: 'absolute',
      top: style.top as number,
      left: 0,
      width: '100%',
      contain: 'layout',
    };
    
    if (!isItemLoaded(index)) {
      return (
        <div style={rowStyle}>
          <LoadingIndicator>더 불러오는 중...</LoadingIndicator>
        </div>
      );
    }

    const item = items[index];
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <CardContainer style={rowStyle}>
        <NewsCard
          title={item.title}
          description={item.description || ''}
          date={new Date(item.pub_date).toLocaleString('ko-KR')}
          category={item.category}
          original_link={item.original_link}
          id={item.id}
          isSelected={isSelected}
          onSelect={onSelectItem}
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.open(item.original_link, '_blank', 'noopener,noreferrer');
            }
          }}
        />
      </CardContainer>
    );
  };

  return (
    <ListContainer ref={containerRef}>
      <WindowContainer>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          threshold={5}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(list) => {
                listRef.current = list;
                if (typeof ref === 'function') ref(list);
              }}
              height={listHeight}
              itemCount={itemCount}
              itemSize={ITEM_HEIGHT}
              onItemsRendered={onItemsRendered}
              onScroll={handleScroll}
              width="100%"
              overscanCount={3}
              style={{ 
                WebkitOverflowScrolling: 'touch',
                width: '100%',
                height: '100%',
                outline: 'none',
                overscrollBehavior: 'none',
                willChange: 'transform',
                contain: 'size layout',
                overflow: 'auto'
              }}
              useIsScrolling={false}
              className="ReactVirtualizedList"
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      </WindowContainer>
    </ListContainer>
  );
} 