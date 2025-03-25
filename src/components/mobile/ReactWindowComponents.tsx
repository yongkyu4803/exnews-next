import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';
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
  contain: content; /* 렌더링 최적화 */
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

// PullToRefresh 래퍼 스타일 수정
const PullToRefreshWrapper = styled.div`
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: hidden;
  
  .ptr__children {
    height: 100%;
    width: 100%;
    overflow: visible !important;
  }
  
  .ptr__pull-down {
    position: absolute;
    top: -50px;
    height: 50px;
  }
  
  /* 스크롤 빈 공간 방지를 위한 추가 스타일 */
  .ptr__pull-down--transition {
    transition: all 0.3s;
  }
  
  /* react-window 스크롤 컨테이너 오버라이드 */
  .ReactVirtualized__List {
    overflow-anchor: auto !important;
    contain: none !important;
  }
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
  const lastItemsLength = useRef(items.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const ptrRef = useRef<any>(null);
  
  // 스크롤 최적화를 위한 상태
  const [scrolling, setScrolling] = useState(false);
  const scrollTimeout = React.useRef<number | null>(null);
  // 스크롤 방향 추적
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollTop = useRef(0);
  
  // 메모이제이션된 리사이즈 핸들러
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      // 컨테이너의 실제 높이를 측정하여 사용
      const containerHeight = containerRef.current.clientHeight;
      setListHeight(containerHeight);
    } else {
      // 폴백으로 window 높이 기반 계산
      setListHeight(window.innerHeight - 180);
    }
  }, []);
  
  useEffect(() => {
    // 클라이언트 사이드에서 실행되는 코드
    if (typeof window !== 'undefined') {
      // 초기 높이 설정
      handleResize();
      
      // 리사이즈 이벤트 리스너
      window.addEventListener('resize', handleResize);
      
      // 10ms 후 다시 한번 높이 계산 (초기 렌더링 이후)
      const timer = setTimeout(() => {
        handleResize();
      }, 10);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timer);
      };
    }
  }, [handleResize]);

  // 리스트가 마운트된 후 높이 재계산
  useEffect(() => {
    const timer = setTimeout(() => {
      handleResize();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [handleResize]);

  // 아이템이 변경될 때 리스트 캐시 리셋
  useEffect(() => {
    if (listRef.current) {
      // 아이템 길이가 변경된 경우에만 전체 리스트 리셋
      if (items.length !== lastItemsLength.current) {
        listRef.current.resetAfterIndex(0);
        lastItemsLength.current = items.length;
      } else {
        // 같은 길이지만 내용이 변경된 경우 (선택 상태 등)
        // 각 아이템을 개별적으로 업데이트
        items.forEach((_, index) => {
          listRef.current.resetAfterIndex(index, false);
        });
      }
    }
  }, [items, selectedItems]);
  
  const itemCount = hasMore ? items.length + 1 : items.length;
  const loadMoreItems = isLoading ? () => {} : onLoadMore;
  const isItemLoaded = (index: number) => !hasMore || index < items.length;
  
  // 아이템 높이 계산 함수 - 고정 값 사용으로 안정성 향상
  const getItemHeight = (index: number) => {
    if (!isItemLoaded(index)) return 100; // 로딩 인디케이터 높이
    
    // 모든 카드를 같은 크기로 처리해 렌더링 안정성 확보
    return 220;
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(({ scrollOffset, scrollDirection: direction, scrollUpdateWasRequested }: { scrollOffset: number, scrollDirection: string, scrollUpdateWasRequested: boolean }) => {
    // 현재 스크롤 위치 추적
    const currentScrollTop = scrollOffset;
    
    // 스크롤 방향 감지
    if (currentScrollTop > lastScrollTop.current) {
      if (scrollDirection !== 'down') {
        setScrollDirection('down');
        // 방향 변경 알림
        if (onScrollDirectionChange) {
          onScrollDirectionChange('down');
        }
      }
    } else if (currentScrollTop < lastScrollTop.current) {
      if (scrollDirection !== 'up') {
        setScrollDirection('up');
        // 방향 변경 알림
        if (onScrollDirectionChange) {
          onScrollDirectionChange('up');
        }
      }
    }
    
    // 스크롤 위치 저장
    lastScrollTop.current = currentScrollTop;
    
    // 스크롤 중 상태 설정
    setScrolling(true);
    
    // 기존 타임아웃 클리어
    if (scrollTimeout.current !== null) {
      window.clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }
    
    // 스크롤이 멈춘 후 처리
    scrollTimeout.current = window.setTimeout(() => {
      setScrolling(false);
      scrollTimeout.current = null;
      
      // 방향 전환 후 리스트 조정
      if (scrollDirection === 'up' && currentScrollTop <= 50) {
        // 상단 영역에서 스크롤 방향이 위에서 아래로 바뀔 때 강제 조정
        requestAnimationFrame(() => {
          if (listRef.current) {
            // 전체 리스트 강제 재계산
            listRef.current.resetAfterIndex(0);
            
            // 첫 번째 아이템이 상단에 정확히 위치하도록 조정
            if (currentScrollTop < 5) {
              listRef.current.scrollToItem(0, 'start');
            }
          }
        });
      }
    }, 50);
    
    // 스크롤 요청이 외부에서 온 경우(예: scrollToItem)
    if (scrollUpdateWasRequested) {
      // 강제로 높이 재계산 트리거
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.resetAfterIndex(0);
        }
      });
    }
  }, [scrollDirection, onScrollDirectionChange]);

  interface RowProps {
    index: number;
    style: React.CSSProperties;
    isScrolling?: boolean;
  }

  const Row = ({ index, style, isScrolling }: RowProps) => {
    const itemRef = useRef<HTMLDivElement>(null);
    
    // 아이템이 뷰포트에 표시되면 확인
    useEffect(() => {
      if (itemRef.current && !isScrolling) {
        // 스크롤이 멈추면 비동기적으로 높이 재계산 트리거
        const timer = setTimeout(() => {
          if (listRef.current) {
            listRef.current.resetAfterIndex(index, false);
          }
        }, 50);
        
        return () => clearTimeout(timer);
      }
    }, [index, isScrolling]);
    
    if (!isItemLoaded(index)) {
      return (
        <div style={{...style, height: 100}}>
          <LoadingIndicator>더 불러오는 중...</LoadingIndicator>
        </div>
      );
    }

    const item = items[index];
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <div 
        ref={itemRef}
        style={{
          ...style, 
          padding: '6px 10px',
        }}
        data-index={index}
      >
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
      </div>
    );
  };
  
  // 당겨서 새로고침 처리
  const handleRefresh = async () => {
    try {
      await onRefresh();
      // 새로고침 후 리스트 강제 리셋
      if (listRef.current) {
        setTimeout(() => {
          listRef.current.resetAfterIndex(0);
          listRef.current.scrollToItem(0, 'start');
          // 높이 재계산
          handleResize();
        }, 100);
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // 스크롤 방지 레이어 스타일
  const FixedLayer = styled.div({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: -1
  });

  return (
    <ListContainer ref={containerRef}>
      <FixedLayer />
      <PullToRefreshWrapper ref={ptrRef}>
        <PullToRefresh
          onRefresh={handleRefresh}
          resistance={2.5}
          pullDownContent={<PullIndicator>↓ 당겨서 새로고침</PullIndicator>}
          releaseContent={<PullIndicator>↑ 놓아서 새로고침</PullIndicator>}
          refreshContent={<PullIndicator>새로고침 중...</PullIndicator>}
        >
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
            threshold={5}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={(list) => {
                  // 두 개의 ref 합치기
                  listRef.current = list;
                  if (typeof ref === 'function') ref(list);
                }}
                height={listHeight}
                itemCount={itemCount}
                itemSize={getItemHeight}
                onItemsRendered={(props) => {
                  // 상단 아이템에 대한 특별 처리
                  if (props.visibleStartIndex === 0 && listRef.current) {
                    // 첫 번째 아이템이 보이면 강제로 높이 재계산
                    requestAnimationFrame(() => {
                      listRef.current.resetAfterIndex(0, false);
                    });
                  }
                  onItemsRendered(props);
                }}
                onScroll={handleScroll}
                width="100%"
                overscanCount={10}
                style={{ 
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch',
                  paddingBottom: '50px',
                  willChange: 'transform',
                  position: 'relative',
                  zIndex: 1,
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  marginTop: 0, // 상단 여백 제거
                  overscrollBehavior: 'none', // iOS에서 스크롤 바운스 효과 제어
                }}
                useIsScrolling={true}
                className="ReactVirtualizedList"
              >
                {Row}
              </List>
            )}
          </InfiniteLoader>
        </PullToRefresh>
      </PullToRefreshWrapper>
    </ListContainer>
  );
} 