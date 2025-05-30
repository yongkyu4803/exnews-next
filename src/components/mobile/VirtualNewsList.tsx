import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { trackEvent } from '@/utils/analyticsUtils';
import { copySelectedNewsToClipboard } from '@/utils/clipboardUtils';
import MicroButton from '@/components/common/MicroButton';
import FloatingButtonWrapper from '@/components/common/FloatingButtonWrapper';

// 클라이언트 사이드에서만 로드되는 컴포넌트
const ReactWindowComponents = dynamic(() => import('./ReactWindowComponents'), {
  ssr: false,
  loading: () => <LoadingView />
});

// 스타일 컴포넌트 정의
const Container = styled.div`
  position: relative;
  height: auto; /* 고정 높이 대신 자동 높이 사용 */
  width: 100%;
  overflow: visible;
  background-color: #ffffff;
`;

const PullToRefreshContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  -webkit-overflow-scrolling: touch;
  overflow: hidden; /* 컨테이너 자체의 스크롤바 숨김 */
  
  /* 스크롤바 숨기기 */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
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
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

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
    <div style={{ color: '#666', marginTop: '8px', fontSize: '12px' }}>뉴스를 불러오는 중입니다...</div>
  </LoadingContainer>
);

// 인터페이스 정의
interface VirtualNewsListProps {
  items: any[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onRefresh: () => Promise<any>;
  selectedKeys?: React.Key[];
  onSelectChange?: (keys: React.Key[], rows: any[]) => void;
}

// 콘솔 로그 시각화 컴포넌트
const VisualConsole = styled.div<{ visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: auto;
  max-height: 40vh;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  font-family: monospace;
  z-index: 9999;
  padding: 8px;
  transform: translateY(${props => props.visible ? '0' : '-100%'});
  transition: transform 0.3s ease;
  
  .log-entry {
    margin-bottom: 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 4px;
    
    &.log { color: #ffffff; }
    &.info { color: #7fdbff; }
    &.warn { color: #ffdc00; }
    &.error { color: #ff4136; }
  }
  
  .clear-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(255, 255, 255, 0.3);
    border: none;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
  }
`;

export default function VirtualNewsList({
  items,
  hasMore,
  isLoading,
  onLoadMore,
  onRefresh,
  selectedKeys = [],
  onSelectChange
}: VirtualNewsListProps) {
  // 상태 관리
  const [mounted, setMounted] = useState(false);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [consoleVisible, setConsoleVisible] = useState(false);
  const [logs, setLogs] = useState<{type: string; message: string; timestamp: string}[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  
  // 참조
  const itemsRef = useRef(items);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const listRef = useRef<any>(null);
  
  // DOM 요소 직접 조작을 위한 참조
  const refreshBtnRef = useRef<HTMLButtonElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  
  // 시각적 콘솔 로그 함수
  const visualLog = useCallback((message: any, type?: 'log' | 'info' | 'warn' | 'error') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = typeof message === 'object' 
      ? JSON.stringify(message) 
      : String(message);
    
    const logType = type || 'log';
    setLogs(prev => [...prev, { type: logType, message: formattedMessage, timestamp }]);
    
    // 원래 콘솔에도 출력
    if (logType === 'log') console.log(message);
    if (logType === 'info') console.info(message);
    if (logType === 'warn') console.warn(message);
    if (logType === 'error') console.error(message);
  }, []);
  
  // 콘솔 지우기
  const clearConsole = useCallback(() => {
    setLogs([]);
  }, []);
  
  // 토스트 메시지 표시 함수
  const showToast = useCallback((message: string, duration = 3000) => {
    setToast({ visible: true, message });
    
    // 자동 숨김
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, duration);
  }, []);
  
  // 마운트 처리
  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);
    
    // 초기 데이터 처리
    if (items.length > 0) {
      setLocalItems(items);
    }
    
    // 초기 렌더링 플래그 설정
    setIsFirstRender(true);
    // 렌더링 후 플래그 해제를 위한 타이머 설정
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setIsFirstRender(false);
      }
    }, 500);
    
    return () => {
      mountedRef.current = false;
      setMounted(false);
      clearTimeout(timer);
    };
  }, [items]);
  
  // items prop 변경 감지
  useEffect(() => {
    if (!mountedRef.current) return;
    
    // 참조 업데이트
    itemsRef.current = items;
    
    // 즉시 상태 업데이트하도록 수정
    visualLog('[VirtualNewsList] 아이템 업데이트: ' + items.length, 'info');
    setLocalItems(items);
    
    // 리스트 참조가 있으면 스크롤 초기화 시도
    // 실제 스크롤 처리는 ReactWindowComponents 내부에서 수행되므로
    // 여기서는 로그만 출력
    if (!isFirstRender) {
      visualLog('아이템 목록 변경됨. 스크롤 리셋 필요', 'info');
    }
  }, [items, isFirstRender, visualLog]);
  
  // items prop 변경 감지
  useEffect(() => {
    if (!mountedRef.current) return;
    
    // 참조 업데이트
    itemsRef.current = items;
    
    // 즉시 상태 업데이트하도록 수정
    visualLog('[VirtualNewsList] 아이템 업데이트: ' + items.length, 'info');
    setLocalItems(items);
    
    // 페이지네이션 동작과 함께 활용할 수 있도록 즉시 처리 (지연 없이)
    visualLog('아이템 목록 변경됨. 페이지네이션과 스크롤 상태 확인', 'info');
    
    // DOM 요소로 스크롤 이동
    if (containerRef.current) {
      try {
        // 스크롤 초기화를 위해 컨테이너 상단으로 이동
        window.scrollTo({
          top: 0,
          behavior: 'auto' // 즉시 스크롤 (부드러운 전환 없이)
        });
        
        visualLog('컨테이너 상단으로 스크롤 이동 완료', 'info');
      } catch (error) {
        visualLog('스크롤 이동 실패: ' + (error as Error).message, 'error');
      }
    }
  }, [items, isFirstRender, visualLog]);
  
  // DOM 요소 크기 직접 설정
  useEffect(() => {
    // 함수 정의 및 호출
    const applyButtonStyles = (element: HTMLElement | null) => {
      if (!element) return;
      
      // 인라인 스타일 직접 적용
      element.style.cssText = `
        width: 40px !important; 
        height: 40px !important; 
        min-width: 40px !important; 
        min-height: 40px !important;
        max-width: 40px !important;
        max-height: 40px !important;
        padding: 8px !important;
        border-radius: 50% !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important;
      `;
      
      // 아이콘 크기 조정
      const svg = element.querySelector('svg');
      if (svg) {
        svg.style.cssText = `
          width: 20px !important;
          height: 20px !important;
        `;
      }
    };
    
    applyButtonStyles(refreshBtnRef.current);
    applyButtonStyles(copyBtnRef.current);
  }, []);
  
  // 아이템 선택 처리
  const handleSelectItem = useCallback((id: string | number, isSelected: boolean) => {
    if (!onSelectChange) return;
    
    const itemKey = id.toString();
    let newSelectedKeys: React.Key[];
    
    if (isSelected) {
      newSelectedKeys = [...selectedKeys, itemKey];
    } else {
      newSelectedKeys = selectedKeys.filter(key => key !== itemKey);
    }
    
    const selectedRows = itemsRef.current.filter(item => 
      newSelectedKeys.includes(item.id?.toString() || '')
    );
    
    onSelectChange(newSelectedKeys, selectedRows);
  }, [selectedKeys, onSelectChange]);
  
  // 선택된 항목 복사
  const handleCopySelected = useCallback(async () => {
    if (selectedKeys.length === 0) return;
    
    const selectedItems = itemsRef.current.filter(item => 
      selectedKeys.includes(item.id?.toString() || '')
    );
    
    const success = await copySelectedNewsToClipboard(selectedItems);
    showToast(success 
      ? `${selectedKeys.length}개 항목이 클립보드에 복사되었습니다` 
      : '복사에 실패했습니다'
    );
    
    // 이벤트 트래킹
    trackEvent('copy_selected_news', { count: selectedKeys.length });
  }, [selectedKeys, showToast]);
  
  // 스크롤 방향 변경 처리
  const handleScrollDirectionChange = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up' && window.scrollY < 10) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);
  
  // 새로고침 처리 함수
  const handleRefresh = useCallback(async () => {
    if (refreshing || isLoading || !mountedRef.current) return;
    
    try {
      setRefreshing(true);
      visualLog('[VirtualNewsList] 새로고침 시작', 'info');
      showToast('새로고침 중...');
      
      // onRefresh 함수를 Promise로 래핑
      const refreshPromise = Promise.resolve().then(() => onRefresh());
      
      // 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('새로고침 시간 초과')), 10000);
      });
      
      // Promise.race를 사용하여 타임아웃 처리
      await Promise.race([refreshPromise, timeoutPromise]);
      
      if (mountedRef.current) {
        showToast('새로고침 완료');
        visualLog('[VirtualNewsList] 새로고침 완료', 'info');
        trackEvent('refresh_news_list', {});
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('새로고침 오류:', error);
        
        const errorMessage = error instanceof Error 
          ? `${error.name}: ${error.message}` 
          : String(error);
        
        visualLog(`[VirtualNewsList] 새로고침 실패: ${errorMessage}`, 'error');
        showToast(`새로고침 실패: ${errorMessage}`);
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [refreshing, isLoading, onRefresh, showToast, visualLog]);
  
  // 무한 스크롤 로드 함수 개선
  const loadMoreItems = useCallback(() => {
    if (!isLoading && hasMore) {
      console.log('추가 아이템 로드 요청');
      return Promise.resolve(onLoadMore());
    }
    return Promise.resolve();
  }, [isLoading, hasMore, onLoadMore]);
  
  // 비어있거나 로딩 중일 때 렌더링
  if (!mounted) {
    return <LoadingView />;
  }
  
  // 데이터가 없고 로딩 중이 아닐 때
  if (localItems.length === 0 && !isLoading) {
    return (
      <EmptyView>
        <h3>표시할 뉴스가 없습니다</h3>
        <p>다른 카테고리를 선택해보세요.</p>
      </EmptyView>
    );
  }
  
  // 메인 컴포넌트 렌더링
  return (
    <>
      {/* 시각적 콘솔 */}
      <VisualConsole visible={consoleVisible}>
        <button className="clear-btn" onClick={clearConsole}>지우기</button>
        {logs.map((log, index) => (
          <div key={index} className={`log-entry ${log.type}`}>
            [{log.timestamp}] {log.message}
          </div>
        ))}
      </VisualConsole>
      <button 
        style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          zIndex: 9999, 
          width: '30px', 
          height: '30px',
          background: '#333',
          color: 'white',
          border: 'none',
          fontSize: '16px',
          borderRadius: '0 0 0 8px',
          opacity: 0.8
        }}
        onClick={() => setConsoleVisible(!consoleVisible)}
      >
        {consoleVisible ? '×' : '디버그'}
      </button>
      
      <Container ref={containerRef}>
        <PullToRefreshContainer className="window-container">
          {/* 로딩 상태 또는 가상 목록 */}
          {isLoading && localItems.length === 0 ? (
            <LoadingView />
          ) : (
            <>
              {/* 페이지네이션 디버깅 정보 */}
              {consoleVisible && (
                <div style={{ 
                  padding: '4px 8px', 
                  backgroundColor: '#f0f8ff', 
                  fontSize: '10px',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  아이템: {localItems.length}개, 페이지 변경 감지: {Date.now()}
                </div>
              )}
              <ReactWindowComponents
                key={`list-${localItems.length}-${JSON.stringify(selectedKeys)}`}
                items={localItems || []}
                hasMore={hasMore}
                isLoading={isLoading}
                onLoadMore={onLoadMore}
                onRefresh={onRefresh}
                selectedItems={(selectedKeys || []).map(key => key.toString())}
                onSelectItem={handleSelectItem}
                onScrollDirectionChange={handleScrollDirectionChange}
              />
            </>
          )}
        </PullToRefreshContainer>
        
        {/* 새로고침 버튼 */}
        <FloatingButtonWrapper position="primary">
          <MicroButton 
            onClick={handleRefresh}
            icon={<RefreshIcon />}
            label="새로고침"
            color="#4CAF50"
            style={{
              animation: refreshing ? 'rotate 1s linear infinite' : 'none'
            }}
            disabled={refreshing}
          />
        </FloatingButtonWrapper>
        
        {/* 복사 버튼 */}
        {selectedKeys.length > 0 && (
          <FloatingButtonWrapper position="secondary">
            <MicroButton
              onClick={handleCopySelected}
              icon={<CopyIcon />}
              label="선택한 뉴스 복사"
            />
          </FloatingButtonWrapper>
        )}
        
        {/* 토스트 메시지 */}
        {toast.visible && (
          <Toast>
            {toast.message}
          </Toast>
        )}
      </Container>
      
      {/* 회전 애니메이션 스타일 */}
      <style jsx global>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}