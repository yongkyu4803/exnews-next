import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import styled from '@emotion/styled';
import InfiniteLoader from 'react-window-infinite-loader';
import NewsCard from './NewsCard';

// 상수 정의
const ITEM_HEIGHT = 86; // 카드 높이(80px) + 여백(6px)
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
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  
  /* Chrome, Safari 등에서 스크롤바 숨기기 */
  &::-webkit-scrollbar {
    display: none;
  }
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
  
  // 페이지당 7개 아이템에 맞춰 높이 계산 - 스크롤바 없애기
  const listHeight = React.useMemo(() => {
    // 기본 높이 설정 (모바일 환경은 100vh - 헤더/푸터 등 공간)
    if (typeof window !== 'undefined') {
      // 고정 높이 사용하여 페이지네이션 문제 해결
      const standardHeight = 600; // 기본 고정 높이
      
      // 아이템 수에 따른 높이 계산 (최소 높이 설정)
      const calculatedHeight = Math.max(
        Math.min(7, itemCount) * ITEM_HEIGHT + 5, // 최소 1개 아이템 높이
        standardHeight * 0.5 // 최소 화면 높이의 50%
      );
      
      console.log('ReactWindowComponents 높이 계산 (개선됨):', {
        itemCount,
        calculatedHeight
      });
      
      return calculatedHeight;
    }
    
    // SSR 환경에서는 기본값 반환
    return 600;
  }, [itemCount]);
  
  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log('ReactWindowComponents 마운트됨. 아이템 수:', Array.isArray(items) ? items.length : 0);
    setIsFirstRender(false);
    
    // 아이템 참조 업데이트
    if (Array.isArray(items)) {
      itemsRef.current = items;
    }
    
    // 초기 리사이즈 실행 및 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [items]);
  
  // 리사이즈 핸들러
  const handleResize = useCallback(() => {
    if (listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
      listRef.current.resetAfterIndex(0);
    }
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
    
    // 카테고리 변경 또는 데이터 갱신 시 스크롤 초기화
    if (!isFirstRender && listRef.current) {
      console.log('아이템 목록 변경됨. 스크롤 리셋');
      
      // 스크롤 리셋 - setTimeout으로 지연 실행하여 동기화 문제 해결
      setTimeout(() => {
        if (listRef.current) {
          // 스크롤 리셋
          if (typeof listRef.current.scrollTo === 'function') {
            listRef.current.scrollTo(0);
          }
          
          // 리스트 강제 업데이트
          if (typeof listRef.current.resetAfterIndex === 'function') {
            listRef.current.resetAfterIndex(0);
          }
        }
      }, 50);
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
    if (!isLoading && hasMore) {
      console.log('추가 아이템 로드 요청');
      return Promise.resolve(onLoadMore());
    }
    return Promise.resolve();
  }, [isLoading, onLoadMore, hasMore]);
  
  // 아이템이 로드되었는지 확인하는 함수
  const isItemLoaded = useCallback((index: number) => {
    // 마지막 아이템이고 더 로드할 항목이 있으면 false 반환
    if (hasMore && index === itemCount - 1) {
      return false;
    }
    // 그 외의 경우 모두 로드된 것으로 처리
    return true;
  }, [hasMore, itemCount]);
  
  // 행 렌더링 함수
  const Row = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    // 먼저 items 배열 유효성 검사
    const currentItems = Array.isArray(itemsRef.current) && itemsRef.current.length > 0 
      ? itemsRef.current 
      : Array.isArray(items) ? items : [];
    
    // 로딩 상태 확인 - hasMore가 true이고 마지막 인덱스보다 크면 로딩 표시
    if (index === currentItems.length && hasMore) {
      return (
        <div style={{ ...style, height: LOADING_ITEM_HEIGHT }}>
          <LoadingIndicator>데이터를 불러오는 중...</LoadingIndicator>
        </div>
      );
    }
    
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
          <div style={{ ...style, height: ITEM_HEIGHT, padding: '4px 12px' }}>
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '8px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px'
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
        <div style={{ ...style, height: ITEM_HEIGHT, padding: '4px 12px' }}>
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
  }, [items, isLoading, selectedItems, onSelectItem, hasMore]);
  
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
          itemCount={hasMore ? itemCount + 1 : itemCount}
          loadMoreItems={loadMoreItems}
          threshold={3}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(list) => {
                // 리스트 참조 저장
                if (list) {
                  listRef.current = list;
                  if (typeof ref === 'function') ref(list);
                }
              }}
              onItemsRendered={onItemsRendered}
              onScroll={handleScroll}
              height={listHeight}
              width="100%"
              itemCount={hasMore ? itemCount + 1 : itemCount}
              itemSize={ITEM_HEIGHT}
              overscanCount={3}
              style={{
                willChange: 'transform',
                transform: 'translateZ(0)',
                overflowX: 'hidden',
                overflowY: 'hidden', // 항상 스크롤바 숨김으로 변경
                WebkitOverflowScrolling: 'touch',
                overflow: 'hidden' // 항상 스크롤바 숨김으로 변경, 페이지 스크롤바만 사용
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