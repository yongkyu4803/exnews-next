import React, { useState, useEffect, useCallback } from 'react';
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
}

export default function ReactWindowComponents({ 
  items, 
  hasMore, 
  isLoading, 
  onLoadMore,
  onRefresh 
}: ReactWindowComponentsProps) {
  const [listHeight, setListHeight] = useState(600); 
  
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
  
  const itemCount = hasMore ? items.length + 1 : items.length;
  const loadMoreItems = isLoading ? () => {} : onLoadMore;
  const isItemLoaded = (index: number) => !hasMore || index < items.length;
  
  // 아이템 높이 계산 함수
  const getItemHeight = (index: number) => {
    if (!isItemLoaded(index)) return 80; // 로딩 인디케이터 높이
    
    // 설명이 길거나 제목이 길면 높이 증가
    const item = items[index];
    const titleLength = item.title.length;
    const descLength = item.description?.length || 0;
    
    if (titleLength > 50 || descLength > 100) {
      return 170; // 더 큰 높이
    }
    
    return 150; // 기본 높이
  };

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
    return (
      <div style={{...style, padding: '0 8px'}}>
        <NewsCard
          title={item.title}
          description={item.description || ''}
          date={new Date(item.pub_date).toLocaleString('ko-KR')}
          category={item.category}
          original_link={item.original_link}
          id={item.id}
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
              height={listHeight}
              itemCount={itemCount}
              itemSize={getItemHeight}
              onItemsRendered={onItemsRendered}
              ref={ref}
              width="100%"
              overscanCount={2} // 오버스캔으로 스크롤 성능 향상
              style={{ scrollbarWidth: 'none' }} // Firefox
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      </PullToRefresh>
    </ListContainer>
  );
} 