import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import NewsCard from './NewsCard';
import styled from '@emotion/styled';

// 클라이언트 사이드에서만 로드되는 컴포넌트
const ReactWindowComponents = dynamic(() => import('./ReactWindowComponents'), {
  ssr: false,
  loading: () => <ListLoadingState />
});

const ListContainer = styled.div`
  height: calc(100vh - 180px);
  width: 100%;
  overflow: hidden;
  position: relative;
`;

// 로딩 컴포넌트
const LoadingContainer = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: var(--card-border-radius, 16px);
  flex-direction: column;
`;

// 스켈레톤 로딩 상태
const SkeletonCard = styled.div`
  height: 145px;
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 16px;
  border-radius: var(--card-border-radius, 16px);
  box-shadow: var(--card-shadow, 0 2px 12px rgba(0, 0, 0, 0.1));
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

// 스켈레톤 로딩 상태
const ListLoadingState = () => (
  <LoadingContainer>
    {[1, 2, 3, 4, 5].map((i) => (
      <SkeletonCard key={i} />
    ))}
    <div style={{ textAlign: 'center', marginTop: '16px', color: '#666' }}>
      뉴스를 불러오는 중입니다...
    </div>
  </LoadingContainer>
);

// 데이터 없음 상태
const EmptyState = styled.div`
  height: 300px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  border-radius: var(--card-border-radius, 16px);
  color: #666;
  font-size: 16px;
  margin-top: 32px;
  flex-direction: column;
  text-align: center;
  padding: 0 16px;
  
  h3 {
    margin-bottom: 8px;
    font-size: 18px;
    color: #444;
  }
`;

interface VirtualNewsListProps {
  items: any[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onRefresh: () => Promise<any>;
  selectedKeys?: React.Key[];
  onSelectChange?: (keys: React.Key[], rows: any[]) => void;
}

export default function VirtualNewsList({ 
  items, 
  hasMore, 
  isLoading, 
  onLoadMore,
  onRefresh,
  selectedKeys = [],
  onSelectChange
}: VirtualNewsListProps) {
  const [isMounted, setIsMounted] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    setIsMounted(true);
    // 스크롤 위치 초기화
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    
    // 스크롤 처리 관련 기본 스타일 추가
    const addStyles = () => {
      const style = document.createElement('style');
      style.textContent = `
        .ptr-element {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          color: #aaa;
          z-index: 10;
          text-align: center;
          height: 50px;
          transition: all .25s ease;
        }
        .ptr-element .ptr-content {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .ptr-element svg {
          transform-origin: center center;
          transition: all .25s ease;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    };
    
    const cleanup = addStyles();
    return () => {
      cleanup();
    };
  }, []);

  // 스크롤 방향 변경 핸들러
  const handleScrollDirectionChange = useCallback((direction: 'up' | 'down') => {
    // 스크롤 방향이 변경될 때마다 체크
    if (direction === 'up') {
      // 현재 스크롤 위치가 상단 근처인지 확인
      if (window.scrollY < 50) {
        // 스크롤 위치 리셋
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
    }
  }, []);

  // 아이템 선택 처리
  const handleSelectItem = (id: string | number) => {
    if (!onSelectChange) return;
    
    let newSelectedKeys: React.Key[];
    const itemKey = id.toString();
    
    if (selectedKeys.includes(itemKey)) {
      // 이미 선택된 항목이면 제거
      newSelectedKeys = selectedKeys.filter(key => key !== itemKey);
    } else {
      // 선택되지 않은 항목이면 추가
      newSelectedKeys = [...selectedKeys, itemKey];
    }
    
    // 선택된 행 데이터 찾기
    const selectedRows = items.filter(item => newSelectedKeys.includes(item.id.toString()));
    
    // 부모 컴포넌트에 선택 변경 알림
    onSelectChange(newSelectedKeys, selectedRows);
  };

  // 서버 사이드 렌더링 시 로딩 UI 표시
  if (!isMounted) {
    return <ListLoadingState />;
  }
  
  // 아이템이 없고 로딩 중이 아닌 경우
  if (items.length === 0 && !isLoading) {
    return (
      <EmptyState>
        <h3>표시할 뉴스가 없습니다</h3>
        <p>다른 카테고리를 선택하거나 나중에 다시 확인해주세요.</p>
      </EmptyState>
    );
  }

  return (
    <div 
      ref={divRef} 
      className="virtual-news-list" 
      style={{ margin: 0, padding: 0 }}
    >
      <ReactWindowComponents
        items={items}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        selectedItems={selectedKeys.map(key => key.toString())}
        onSelectItem={handleSelectItem}
        onScrollDirectionChange={handleScrollDirectionChange}
      />
    </div>
  );
}