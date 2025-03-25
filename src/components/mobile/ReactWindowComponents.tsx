import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import PullToRefresh from 'react-pull-to-refresh';
import NewsCard from './NewsCard';
import styled from '@emotion/styled';

const ListContainer = styled.div`
  height: calc(100vh - 180px);
  width: 100%;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
  -webkit-tap-highlight-color: transparent;
  will-change: transform; /* 성능 최적화 */
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

// 당겨서 새로고침 스타일 
const PullIndicator = styled.div`
  text-align: center;
  padding: 12px;
  color: #666;
  font-size: 14px;
`;

// ReactWindow 스크롤 컨테이너 스타일
const WindowContainer = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  
  .ReactVirtualized__List::-webkit-scrollbar {
    display: none;
  }
  
  .ReactVirtualized__List {
    scrollbar-width: none;
    -ms-overflow-style: none;
    overflow-anchor: none !important;
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
  const [listHeight, setListHeight] = useState(600); 
  const listRef = React.useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const lastScrollTop = useRef(0);
  const preventScrollReset = useRef(false);
  
  // 아이템 고정 높이 설정
  const ITEM_HEIGHT = 220;
  const LOADING_ITEM_HEIGHT = 100;
  
  // 메모이제이션된 리사이즈 핸들러
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      setListHeight(containerHeight);
    } else {
      setListHeight(window.innerHeight - 180);
    }
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      
      // 스크롤 락 방지를 위한 이벤트 처리
      const preventDefaultTouchMove = (e: TouchEvent) => {
        if (refreshing) {
          e.preventDefault();
        }
      };
      
      window.addEventListener('touchmove', preventDefaultTouchMove, { passive: false });
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('touchmove', preventDefaultTouchMove);
      };
    }
  }, [handleResize, refreshing]);

  // 초기 렌더링 시 height 강제 재계산
  useEffect(() => {
    setTimeout(handleResize, 100);
  }, [handleResize]);

  // 아이템이 변경될 때만 리스트 캐시 리셋
  useEffect(() => {
    setTimeout(() => {
      if (listRef.current) {
        // FixedSizeList에는 resetAfterIndex 대신 scrollTo 사용
        listRef.current.scrollTo(0);
      }
    }, 10);
  }, [items.length]);
  
  const itemCount = hasMore ? items.length + 1 : items.length;
  const loadMoreItems = isLoading ? () => {} : onLoadMore;
  const isItemLoaded = (index: number) => !hasMore || index < items.length;
  
  // 스크롤 이벤트 핸들러 - 간소화하여 스크롤 방향만 감지
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number, scrollDirection: string, scrollUpdateWasRequested: boolean }) => {
    const currentScrollTop = scrollOffset;
    
    // 스크롤 방향 감지 및 알림
    if (currentScrollTop > lastScrollTop.current) {
      // 아래로 스크롤
      if (onScrollDirectionChange) {
        onScrollDirectionChange('down');
      }
    } else if (currentScrollTop < lastScrollTop.current) {
      // 위로 스크롤
      if (onScrollDirectionChange) {
        onScrollDirectionChange('up');
      }
      
      // 상단 근처에서 스크롤 위치 보정
      if (currentScrollTop < 10 && !preventScrollReset.current) {
        requestAnimationFrame(() => {
          if (listRef.current) {
            listRef.current.scrollTo(0);
          }
        });
      }
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
  
  // 당겨서 새로고침 처리 - 동작 중 플래그 관리 추가
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      preventScrollReset.current = true;
      
      await onRefresh();
      
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTo(0);
        }
        setRefreshing(false);
        preventScrollReset.current = false;
      }, 300);
      
      return Promise.resolve();
    } catch (error) {
      setRefreshing(false);
      preventScrollReset.current = false;
      return Promise.reject(error);
    }
  };

  return (
    <ListContainer ref={containerRef}>
      <PullToRefresh
        onRefresh={handleRefresh}
        resistance={2.5}
        pullDownContent={<PullIndicator>↓ 당겨서 새로고침</PullIndicator>}
        releaseContent={<PullIndicator>↑ 놓아서 새로고침</PullIndicator>}
        refreshContent={<PullIndicator>새로고침 중...</PullIndicator>}
      >
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
                }}
                useIsScrolling={false}
                className="ReactVirtualizedList"
              >
                {Row}
              </List>
            )}
          </InfiniteLoader>
        </WindowContainer>
      </PullToRefresh>
    </ListContainer>
  );
} 