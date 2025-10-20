import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { trackEvent } from '@/utils/analyticsUtils';
import RankingNewsCard from './RankingNewsCard';
import { RankingNewsItem } from '@/types';
import MicroButton from '@/components/common/MicroButton';
import FloatingButtonWrapper from '@/components/common/FloatingButtonWrapper';
import RefreshIcon from '@/components/common/RefreshIcon';
import { Pagination } from 'antd';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(7); // 모바일에서 한 페이지당 7개 아이템
  const listRef = useRef<any>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 현재 페이지의 아이템만 필터링
  const paginatedItems = React.useMemo(() => {
    if (!items) return [];
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  // 전체 페이지 수 계산
  const totalPages = React.useMemo(() => {
    if (!items) return 0;
    return Math.ceil(items.length / pageSize);
  }, [items, pageSize]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    console.log(`랭킹 뉴스 페이지 변경: ${currentPage} -> ${page} (전체 ${totalPages} 페이지)`);
    
    // 페이지 상태 업데이트
    setCurrentPage(page);
    
    // 페이지 변경 시 스크롤을 맨 위로 - 동기화 문제 해결을 위해 타이밍 조정
    setTimeout(() => {
      if (listContainerRef.current) {
        // 컨테이너로 스크롤
        listContainerRef.current.scrollIntoView({ behavior: 'auto' });
      }
      
      // 페이지 상단으로 스크롤
      window.scrollTo({ 
        top: 0, 
        behavior: 'auto' // smooth 대신 auto 사용하여 즉시 스크롤
      });
      
      console.log('랭킹 뉴스 스크롤 초기화 완료');
    }, 10);
  };

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
  const listHeight = React.useMemo(() => {
    if (typeof window === 'undefined') return 400;
    
    // 고정 높이 접근 방식 (페이지네이션 문제 해결용)
    const standardHeight = 600; // 기본 고정 높이
    
    // 아이템 수에 따라 계산하되 최소 높이 설정
    const itemSize = 86; // 카드 높이(80px) + 여백(6px)
    const calculatedHeight = Math.max(
      paginatedItems.length * itemSize + 5, // 현재 아이템에 맞는 높이
      standardHeight * 0.5 // 최소 화면 높이의 50%
    );
    
    console.log('랭킹 뉴스 리스트 높이 계산 (개선됨):', {
      paginatedItemsLength: paginatedItems.length,
      calculatedHeight
    });
    
    return calculatedHeight;
  }, [paginatedItems.length]);
  
  console.log('랭킹 뉴스 목록 렌더링:', { 
    itemsLength: items.length, 
    paginatedItemsLength: paginatedItems.length,
    listHeight 
  });

  return (
    <Container ref={listContainerRef}>
      <div style={{ height: '100%', width: '100%', padding: '0 8px' }}>
        {paginatedItems.length > 0 && (
          <FixedSizeList
            ref={listRef}
            height={listHeight}
            width="100%"
            itemSize={86} // 카드 높이(80px) + 여백(6px)
            itemCount={paginatedItems.length}
            overscanCount={5}
            style={{ paddingBottom: '16px', overflow: 'hidden' }}
          >
            {({ index, style }: { index: number; style: React.CSSProperties }) => {
              const item = paginatedItems[index];
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
            }}
          </FixedSizeList>
        )}

        {/* 페이지네이션 UI */}
        {totalPages > 1 && (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '16px',
              padding: '8px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <Pagination
                current={currentPage}
                total={items?.length || 0}
                pageSize={pageSize}
                onChange={handlePageChange}
                size="small"
                showSizeChanger={false}
                simple
              />
            </div>
            
            {/* 하단 메뉴바 공간 - 현재 기능 없음 */}
            {/* <div style={{ height: '60px' }}></div> */}
          </>
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