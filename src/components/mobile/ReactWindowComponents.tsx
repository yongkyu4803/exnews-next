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

// PullToRefresh 래퍼 스타일 - 추가
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
`;

interface ReactWindowComponentsProps {
  items: any[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onRefresh: () => Promise<any>;
  selectedItems?: string[];
  onSelectItem?: (id: string | number) => void;
}

export default function ReactWindowComponents({ 
  items, 
  hasMore, 
  isLoading, 
  onLoadMore,
  onRefresh,
  selectedItems = [],
  onSelectItem
}: ReactWindowComponentsProps) {
  const [listHeight, setListHeight] = useState(600); 
  const listRef = React.useRef<any>(null);
  const lastItemsLength = useRef(items.length);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 스크롤 최적화를 위한 상태
  const [scrolling, setScrolling] = useState(false);
  const scrollTimeout = React.useRef<number | null>(null);
  
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
  
  // 아이템 높이 계산 함수
  const getItemHeight = (index: number) => {
    if (!isItemLoaded(index)) return 100; // 로딩 인디케이터 높이
    
    // 설명이 길거나 제목이 길면 높이 증가
    const item = items[index];
    const titleLength = item.title?.length || 0;
    const descLength = item.description?.length || 0;
    
    // 기본 높이
    let height = 160; // 기본 높이 축소
    
    // 제목과 설명 길이에 따라 높이 조정
    if (titleLength > 50) height += 20;
    if (descLength > 100) height += 30;
    if (descLength > 200) height += 30;

    // 버튼 영역과 여백을 위한 추가 공간
    height += 20;
    
    // 안전 마진 추가 (겹침 방지)
    height += 12;
    
    return height;
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(({ scrollOffset, scrollDirection }: { scrollOffset: number, scrollDirection: string }) => {
    setScrolling(true);
    
    // 기존 타임아웃 클리어
    if (scrollTimeout.current !== null) {
      window.clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }
    
    // 스크롤이 멈춘 후 100ms 후에 scrolling 상태를 false로 설정
    scrollTimeout.current = window.setTimeout(() => {
      setScrolling(false);
      scrollTimeout.current = null;
      
      // 스크롤이 멈추면 보이는 영역의 아이템들 강제 재계산
      if (listRef.current) {
        // 모든 아이템 강제 재계산 (특히 상단 아이템 문제 해결)
        listRef.current.resetAfterIndex(0, false);
        
        // 추가로 스크롤 영역의 아이템들 특별히 처리
        const visibleStartIndex = Math.max(0, Math.floor(scrollOffset / 100) - 3); // 더 위쪽부터 계산
        const visibleEndIndex = Math.min(visibleStartIndex + 15, items.length - 1); // 더 많은 항목 포함
        
        for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
          if (i >= 0 && i < items.length) {
            listRef.current.resetAfterIndex(i, false);
          }
        }
      }
    }, 50); // 시간 더 짧게 설정
  }, [items.length]);

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
        <div style={style}>
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
          height: 'auto', // 높이를 자동으로 조정
        }}
        data-index={index} // 디버깅용 인덱스 추가
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
      <FixedLayer /> {/* 스크롤 이슈 방지를 위한 투명 레이어 */}
      <PullToRefreshWrapper>
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
            threshold={5} // 미리 로드할 항목 수 증가
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
                overscanCount={10} // 오버스캔 값 증가
                style={{ 
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch',
                  paddingBottom: '50px', 
                  willChange: 'transform',
                  position: 'relative',
                  zIndex: 1,
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)' // 하드웨어 가속
                }}
                useIsScrolling={true}
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