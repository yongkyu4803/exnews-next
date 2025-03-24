import React, { useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import PullToRefresh from 'react-pull-to-refresh';
import NewsCard from './NewsCard';
import styled from '@emotion/styled';

const ListContainer = styled.div`
  height: calc(100vh - 180px);
  width: 100%;
  overflow: hidden;
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
  const [listHeight, setListHeight] = useState(600); // 기본값 설정
  
  useEffect(() => {
    // 클라이언트 사이드에서 실행되는 코드
    if (typeof window !== 'undefined') {
      setListHeight(window.innerHeight - 180);
      
      const handleResize = () => {
        setListHeight(window.innerHeight - 180);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  const itemCount = hasMore ? items.length + 1 : items.length;
  const loadMoreItems = isLoading ? () => {} : onLoadMore;
  const isItemLoaded = (index: number) => !hasMore || index < items.length;

  const Row = ({ index, style }: any) => {
    if (!isItemLoaded(index)) {
      return <div style={style}>Loading...</div>;
    }

    const item = items[index];
    return (
      <div style={style}>
        <NewsCard
          title={item.title}
          description={item.description || ''}
          date={new Date(item.pub_date).toLocaleString('ko-KR')}
          category={item.category}
          original_link={item.original_link}
          id={item.id}
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.open(item.original_link, '_blank');
            }
          }}
        />
      </div>
    );
  };

  return (
    <ListContainer>
      <PullToRefresh
        onRefresh={onRefresh}
        resistance={2.5}
      >
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              height={listHeight}
              itemCount={itemCount}
              itemSize={150}
              onItemsRendered={onItemsRendered}
              ref={ref}
              width="100%"
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      </PullToRefresh>
    </ListContainer>
  );
} 