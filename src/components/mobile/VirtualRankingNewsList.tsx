import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { trackEvent } from '@/utils/analyticsUtils';
import RankingNewsCard from './RankingNewsCard';
import { RankingNewsItem } from '@/types';
import MicroButton from '@/components/common/MicroButton';
import FloatingButtonWrapper from '@/components/common/FloatingButtonWrapper';

// 클라이언트 사이드에서만 로드되는 컴포넌트
const FixedSizeList = dynamic(
  () => import('react-window').then(mod => mod.FixedSizeList),
  { ssr: false }
) as any;

// 스타일 컴포넌트 정의
const Container = styled.div`
  position: relative;
  height: calc(100vh - 200px);
  width: 100%;
  overflow: visible;
  background-color: #ffffff;
`;

const LoadingContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 20px;
`;

const SkeletonCard = styled.div`
  height: 70px;
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 6px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const EmptyView = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  height: 100%;
  padding: 20px;
  
  h3 {
    margin-bottom: 8px;
    font-size: 18px;
    color: #333;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
`;

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  z-index: 1000;
  max-width: 80%;
  text-align: center;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`;

// 아이콘 컴포넌트
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
  </svg>
);

// 로딩 뷰 컴포넌트
const LoadingView = () => (
  <LoadingContainer>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <SkeletonCard key={i} />)}
    <div style={{ color: '#666', marginTop: '8px', fontSize: '12px' }}>랭킹 뉴스를 불러오는 중입니다...</div>
  </LoadingContainer>
);

// 인터페이스 정의
interface VirtualRankingNewsListProps {
  items: RankingNewsItem[];
  isLoading: boolean;
  onRefresh: () => Promise<any>;
  selectedKeys?: React.Key[];
  onSelectChange?: (keys: React.Key[], rows: RankingNewsItem[]) => void;
}

export default function VirtualRankingNewsList({
  items,
  isLoading,
  onRefresh,
  selectedKeys = [],
  onSelectChange
}: VirtualRankingNewsListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const listRef = useRef<any>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 항목 수 확인을 위한 디버깅 로그
  useEffect(() => {
    console.log('VirtualRankingNewsList 렌더링:', { 
      itemCount: items.length, 
      isLoading, 
      selectedKeysCount: selectedKeys.length 
    });
  }, [items, isLoading, selectedKeys]);

  // 토스트 메시지 표시 함수
  const showToast = useCallback((message: string, duration = 2000) => {
    setToastMessage(message);
    
    // 이전 타이머 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 지정된 시간 후 토스트 메시지 숨기기
    timeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 새로고침 처리 함수
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      showToast('새로고침 완료');
    } catch (error) {
      console.error('새로고침 실패:', error);
      showToast('새로고침 실패');
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, showToast]);

  // 아이템 선택 처리 함수
  const handleSelectItem = useCallback((id: string, selected: boolean) => {
    if (!onSelectChange) return;
    
    const newKeys = selected
      ? [...selectedKeys, id]
      : selectedKeys.filter(key => key !== id);
    
    const selectedRows = items.filter(item => newKeys.includes(String(item.id)));
    onSelectChange(newKeys, selectedRows);
  }, [items, selectedKeys, onSelectChange]);

  // 아이템 렌더링 함수
  const renderNewsItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;
    
    // null check 추가 - 아이템이 유효한지 먼저 확인
    if (!item.id || !item.title || !item.link) {
      console.warn('유효하지 않은 랭킹 뉴스 아이템:', item);
      return (
        <div style={{ ...style, paddingRight: '8px', paddingLeft: '8px' }}>
          <div style={{ 
            height: '80px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '8px', 
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#666'
          }}>
            데이터 오류
          </div>
        </div>
      );
    }
    
    const isSelected = selectedKeys.includes(String(item.id));
    
    return (
      <div style={{ ...style, paddingRight: '8px', paddingLeft: '8px' }}>
        <RankingNewsCard
          key={item.id}
          id={String(item.id)}
          title={item.title || ''}
          link={item.link || '#'}
          media_name={item.media_name || '알 수 없는 매체'}
          isSelected={isSelected}
          onSelect={handleSelectItem}
        />
      </div>
    );
  }, [items, selectedKeys, handleSelectItem]);

  // 데이터가 없는 경우
  if (items.length === 0 && !isLoading) {
    console.log('랭킹 뉴스 데이터 없음 표시');
    return (
      <Container>
        <EmptyView>
          <h3>랭킹 뉴스가 없습니다.</h3>
          <p>새로운 뉴스가 업데이트되면 이곳에 표시됩니다.</p>
          <button 
            onClick={handleRefresh}
            style={{ 
              marginTop: '16px', 
              padding: '8px 16px', 
              background: 'var(--primary-color, #1a73e8)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            새로고침
          </button>
        </EmptyView>
      </Container>
    );
  }

  // 로딩 중인 경우
  if (isLoading) {
    console.log('랭킹 뉴스 로딩 표시');
    return <LoadingView />;
  }

  // 화면에 표시할 고정 높이 값 사용
  const listHeight = typeof window !== 'undefined' ? 
    Math.max(400, window.innerHeight - 280) : 400;
  
  console.log('랭킹 뉴스 목록 렌더링:', { 
    itemsLength: items.length, 
    listHeight 
  });

  return (
    <Container ref={listContainerRef}>
      <div style={{ height: '100%', width: '100%', padding: '0 8px' }}>
        {items.length > 0 && (
          <FixedSizeList
            ref={listRef}
            height={listHeight} // 고정 높이 값 사용
            width="100%"
            itemSize={86} // 카드 높이 + 마진
            itemCount={items.length}
            overscanCount={5}
            style={{ paddingBottom: '16px' }}
          >
            {renderNewsItem}
          </FixedSizeList>
        )}
      </div>
      
      {/* 새로고침 버튼 */}
      <FloatingButtonWrapper position="primary">
        <MicroButton
          onClick={handleRefresh}
          icon={<RefreshIcon />}
          label="새로고침"
          color="#4CAF50"
          disabled={isRefreshing}
          style={{
            animation: isRefreshing ? 'rotate 1s linear infinite' : 'none'
          }}
        />
      </FloatingButtonWrapper>
      
      {/* 토스트 메시지 */}
      {toastMessage && <Toast>{toastMessage}</Toast>}
      
      {/* 회전 애니메이션 스타일 */}
      <style jsx global>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
} 