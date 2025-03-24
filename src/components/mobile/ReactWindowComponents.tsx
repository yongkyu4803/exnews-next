import React, { useState, useEffect, useCallback } from 'react';
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
  
  // 스크롤 최적화를 위한 상태
  const [scrolling, setScrolling] = useState(false);
  const scrollTimeout = React.useRef<number | null>(null);
  
  // 메모이제이션된 리사이즈 핸들러
  const handleResize = useCallback(() => {
    setListHeight(window.innerHeight - 180);
  }, []);
  
  useEffect(() => {
    // 클라이언트 사이드에서 실행되는 코드
    if (typeof window !== 'undefined') {
      // 초기 높이 설정
      handleResize();
      
      // 리사이즈 이벤트 리스너
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [handleResize]);

  // 아이템이 변경될 때 리스트 캐시 리셋
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [items]);
  
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
    let height = 180;
    
    // 제목과 설명 길이에 따라 높이 조정
    if (titleLength > 50) height += 24;
    if (descLength > 100) height += 40;
    if (descLength > 200) height += 40;

    // 버튼 영역과 여백을 위한 추가 공간
    height += 20;
    
    // 안전 마진 추가 (겹침 방지)
    height += 16;
    
    return height;
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    setScrolling(true);
    
    // 기존 타임아웃 클리어
    if (scrollTimeout.current !== null) {
      window.clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }
    
    // 스크롤이 멈춘 후 200ms 후에 scrolling 상태를 false로 설정
    scrollTimeout.current = window.setTimeout(() => {
      setScrolling(false);
      scrollTimeout.current = null;
    }, 200);
  }, []);

  interface RowProps {
    index: number;
    style: React.CSSProperties;
  }

  const Row = ({ index, style }: RowProps) => {
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
      <div style={{
        ...style, 
        padding: '8px 12px',
        height: 'auto', // 높이를 자동으로 조정
        paddingBottom: '16px' // 하단 여백 추가
      }}>
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
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return (
    <ListContainer>
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
          threshold={3} // 미리 로드할 항목 수
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
              onItemsRendered={onItemsRendered}
              onScroll={handleScroll}
              width="100%"
              overscanCount={5} // 오버스캔으로 스크롤 성능 향상 (값 증가)
              style={{ 
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: '50px' // 추가 하단 여백
              }}
              useIsScrolling={true} // 스크롤 상태 추적
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      </PullToRefresh>
    </ListContainer>
  );
} 