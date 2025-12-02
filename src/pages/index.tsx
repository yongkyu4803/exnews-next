import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import VirtualNewsList from '@/components/mobile/VirtualNewsList';
import VirtualRankingNewsList from '@/components/mobile/VirtualRankingNewsList';
import PageFooter from '@/components/common/PageFooter';
import { CopyOutlined, ShopOutlined } from '@ant-design/icons';
// import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import { NewsItem, NewsResponse, RankingNewsItem, RankingNewsResponse, EditorialResponse, EditorialAnalysis } from '@/types';
import { Pagination } from 'antd';
import BottomNav from '@/components/mobile/BottomNav';
import TopNavBar from '@/components/mobile/TopNavBar';
import CanvaBanner from '@/components/common/CanvaBanner';
import NewsletterButton from '@/components/common/NewsletterButton';
import FloatingButtonWrapper from '@/components/common/FloatingButtonWrapper';
import MicroButton from '@/components/common/MicroButton';
import RefreshIcon from '@/components/common/RefreshIcon';
import { createLogger } from '@/utils/logger';
import { trackPageView, trackTabChange } from '@/utils/analytics';
import { TabName } from '@/types';
import { usePageTracking } from '@/hooks/usePageTracking';

const logger = createLogger('Pages:Home');

// 동적으로 Ant Design 컴포넌트 임포트 - 번들 최적화
import { Typography, Space, Alert, Button, Tabs } from 'antd';

const { Title } = Typography;

// 테이블 컴포넌트를 동적으로 불러옴
const NewsTable = dynamic(() => import('@/components/NewsTable'), {
  ssr: false,
  loading: () => <div style={{ height: '600px', width: '100%' }}>테이블 로딩 중...</div>
});

// 랭킹 뉴스 테이블 컴포넌트를 동적으로 불러옴
const RankingNewsTable = dynamic(() => import('@/components/RankingNewsTable'), {
  ssr: false,
  loading: () => <div style={{ height: '600px', width: '100%' }}>테이블 로딩 중...</div>
});

// 사설 분석 테이블 컴포넌트를 동적으로 불러옴
const EditorialTable = dynamic(() => import('@/components/EditorialTable'), {
  ssr: false,
  loading: () => <div style={{ height: '600px', width: '100%' }}>테이블 로딩 중...</div>
});

// 사설 분석 모바일 컴포넌트를 동적으로 불러옴
const VirtualEditorialList = dynamic(() => import('@/components/mobile/VirtualEditorialList'), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
});

// 정치 리포트 컴포넌트를 동적으로 불러옴
const PoliticalReportsList = dynamic(() => import('@/components/mobile/PoliticalReportsList'), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
});

const PoliticalReportDetail = dynamic(() => import('@/components/mobile/PoliticalReportDetail'), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
});

// 법안 모니터링 컴포넌트를 동적으로 불러옴
const BillsReportsList = dynamic(() => import('@/components/mobile/BillsReportsList'), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>
});

// 전체 컴포넌트 - SSR 지원으로 AdSense 크롤러 호환성 개선
const HomePage = ({ initialNewsData }: { initialNewsData?: NewsResponse }) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = isMobile ? 7 : 12; // 모바일 7개, 웹 12개
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedRows, setSelectedRows] = useState<NewsItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [activeTab, setActiveTab] = useState<string>('exclusive');
  const [rankingSelectedRows, setRankingSelectedRows] = useState<RankingNewsItem[]>([]);
  const [rankingSelectedKeys, setRankingSelectedKeys] = useState<React.Key[]>([]);
  const [rankingCurrentPage, setRankingCurrentPage] = useState(1);
  const rankingPageSize = isMobile ? 7 : 12; // 모바일 7개, 웹 12개
  const [editorialCurrentPage, setEditorialCurrentPage] = useState(1);
  const [editorialPageSize] = useState(6); // 한 페이지에 6개 (2열 그리드 x 3행)
  const [useEditorialLandingMode, setUseEditorialLandingMode] = useState(true);
  const [selectedPoliticalReport, setSelectedPoliticalReport] = useState<string | null>(null);
  const [selectedBillsReport, setSelectedBillsReport] = useState<string | null>(null);
  const [selectedEditorialAnalysis, setSelectedEditorialAnalysis] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // activeTab을 TabName 타입으로 변환
  const currentTabName: TabName = React.useMemo(() => {
    const tabMap: Record<string, TabName> = {
      'exclusive': 'exclusive',
      'ranking': 'ranking',
      'editorial': 'editorial',
      'political': 'political',
      'restaurant': 'restaurant'
    };
    return tabMap[activeTab] || 'exclusive';
  }, [activeTab]);

  // Phase 2: 페이지 추적 (체류시간, 스크롤 깊이, 상호작용)
  usePageTracking({
    tabName: currentTabName,
    enableScrollTracking: true,
    enableInteractionTracking: true,
    scrollThrottleMs: 500
  });

  // URL에서 tab 파라미터 체크
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const validTabs = ['exclusive', 'ranking', 'editorial', 'political', 'bills', 'restaurant'];

      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }

      // 정치 리포트 상세 페이지
      const reportId = urlParams.get('id');
      if (tabParam === 'political' && reportId) {
        setSelectedPoliticalReport(reportId);
      }

      // 법안 리포트 상세 페이지
      if (tabParam === 'bills' && reportId) {
        setSelectedBillsReport(reportId);
      }

      // 사설 분석 상세 페이지
      if (tabParam === 'editorial' && reportId) {
        setSelectedEditorialAnalysis(reportId);
      }
    }
  }, []);

  // 클라이언트 사이드 마운트 체크 및 초기 페이지뷰 트래킹
  useEffect(() => {
    setIsMounted(true);

    // 페이지 마운트 시 페이지뷰 트래킹
    if (typeof window !== 'undefined') {
      const tabMap: Record<string, TabName> = {
        'exclusive': 'exclusive',
        'ranking': 'ranking',
        'editorial': 'editorial',
        'restaurant': 'restaurant'
      };
      const currentTab = tabMap[activeTab] || 'exclusive';
      trackPageView(currentTab);
    }
  }, []);

  // 미디어 쿼리 처리를 위한 useEffect
  useEffect(() => {
    // 클라이언트 사이드에서만 실행되도록 체크
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(max-width: 768px)');
      const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
        setIsMobile(e.matches);
      };

      // Initial check
      handleResize(mediaQuery);

      // Add listener for window resize
      mediaQuery.addEventListener('change', handleResize);

      // Cleanup
      return () => mediaQuery.removeEventListener('change', handleResize);
    }
  }, []);

  // Categories query - always load as it's lightweight
  const { data: categories = [] } = useQuery<string[], Error>(
    'categories',
    async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    {
      enabled: isMounted, // 클라이언트 사이드에서만 실행
      staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  // News items query - server-side pagination with lazy loading
  const { data, isLoading, error } = useQuery<NewsResponse, Error>(
    ['newsItems', selectedCategory, currentPage, pageSize],
    async () => {
      logger.debug('뉴스 데이터 요청 시작', { category: selectedCategory, page: currentPage, pageSize });
      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : '';
      const response = await fetch(`/api/news?page=${currentPage}&pageSize=${pageSize}${categoryParam}`);
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('뉴스 API 응답 오류', { status: response.status, errorText });
        throw new Error(`Failed to fetch news items: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      logger.info('뉴스 API 응답', { itemCount: result?.items?.length || 0, totalCount: result?.totalCount || 0 });
      return result;
    },
    {
      initialData: initialNewsData, // SSR에서 전달받은 초기 데이터 사용
      keepPreviousData: true,
      enabled: isMounted && activeTab === 'exclusive', // Only load when exclusive tab is active
      staleTime: 1 * 60 * 1000, // 1 minute - 뉴스는 실시간성이 중요
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true, // 탭 전환 시 항상 새로고침
      refetchOnWindowFocus: true, // 윈도우 포커스 시 새로고침
      retry: 2,
      onError: (error) => {
        logger.error('뉴스 쿼리 오류', error);
      }
    }
  );

  // Ranking news items query - server-side pagination with lazy loading
  const { data: rankingData, isLoading: rankingIsLoading, error: rankingError } = useQuery<RankingNewsResponse, Error>(
    ['rankingNewsItems', rankingCurrentPage, rankingPageSize],
    async () => {
      console.log('랭킹 뉴스 데이터 요청 시작', { page: rankingCurrentPage, pageSize: rankingPageSize });
      const response = await fetch(`/api/ranking-news?page=${rankingCurrentPage}&pageSize=${rankingPageSize}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('랭킹 뉴스 API 응답 오류:', response.status, errorText);
        throw new Error(`Failed to fetch ranking news items: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      console.log('랭킹 API 응답:', result?.items?.length || 0, '개 항목, 총:', result?.totalCount || 0);
      return result;
    },
    {
      keepPreviousData: true,
      enabled: isMounted && activeTab === 'ranking', // Only load when ranking tab is active
      staleTime: 1 * 60 * 1000, // 1 minute - 뉴스는 실시간성이 중요
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true, // 탭 전환 시 항상 새로고침
      refetchOnWindowFocus: true, // 윈도우 포커스 시 새로고침
      retry: 2,
      onError: (error) => {
        console.error('랭킹 뉴스 쿼리 오류:', error);
      }
    }
  );

  // Editorial analysis items query - lazy load only when tab is active
  const { data: editorialData, isLoading: editorialIsLoading, error: editorialError } = useQuery<EditorialResponse | { latest?: EditorialAnalysis; previous?: Array<{ id: string; analyzed_at: string }>; totalCount: number }, Error>(
    useEditorialLandingMode ? 'editorialItemsLandingV2' : ['editorialItemsPaginationV2', editorialCurrentPage, editorialPageSize],
    async () => {
      if (useEditorialLandingMode) {
        logger.debug('사설 분석 랜딩 모드 요청 시작');
        const response = await fetch(`/api/editorials?landing=true&_t=${Date.now()}`);
        if (!response.ok) {
          let errorMessage = `Failed to fetch editorial items: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
          logger.error('사설 분석 API 응답 오류', { status: response.status, message: errorMessage });
          throw new Error(errorMessage);
        }
        const result = await response.json();
        console.log('Editorial Landing API Response:', result);
        return result;
      } else {
        logger.debug('사설 분석 데이터 요청 시작', { page: editorialCurrentPage, pageSize: editorialPageSize });
        const response = await fetch(`/api/editorials?page=${editorialCurrentPage}&pageSize=${editorialPageSize}&_t=${Date.now()}`);
        if (!response.ok) {
          let errorMessage = `Failed to fetch editorial items: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
          logger.error('사설 분석 API 응답 오류', { status: response.status, message: errorMessage });
          throw new Error(errorMessage);
        }
        const result = await response.json();
        console.log('Editorial Pagination API Response:', result);
        logger.info('사설 분석 API 응답', { itemCount: result?.items?.length || 0, totalCount: result?.totalCount || 0 });
        return result;
      }
    },
    {
      keepPreviousData: true,
      enabled: isMounted && activeTab === 'editorial', // Only load when editorial tab is active
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      onError: (error) => {
        logger.error('사설 분석 쿼리 오류', error);
      }
    }
  );

  // Server-side pagination - items already paginated by API
  const paginatedItems = React.useMemo(() => {
    return data?.items || [];
  }, [data?.items]);

  // Calculate total pages from server response
  const totalPages = React.useMemo(() => {
    if (!data?.totalCount) return 0;
    return Math.ceil(data.totalCount / pageSize);
  }, [data?.totalCount, pageSize]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    console.log('페이지 변경:', page, '전체 페이지:', totalPages);
    if (page < 1 || page > totalPages) return;
    
    // 페이지 변경 시 데이터 갱신을 확실히 인식하도록 로깅 추가
    console.log(`페이지 변경 처리: ${currentPage} -> ${page}`);
    
    // 페이지 상태 업데이트
    setCurrentPage(page);
    
    // 페이지 변경 시 스크롤을 맨 위로 - 동기화 문제 해결을 위해 타이밍 조정
    setTimeout(() => {
      window.scrollTo({ 
        top: 0, 
        behavior: 'auto' // smooth 대신 auto 사용하여 즉시 스크롤
      });
      console.log('스크롤 초기화 완료');
    }, 10); // 최소 지연으로 상태 업데이트 후 스크롤 실행
  };

  // Server-side pagination for ranking news - items already paginated by API
  const paginatedRankingItems = React.useMemo(() => {
    if (!rankingData?.items) return [];
    // Filter out invalid items just in case
    return rankingData.items.filter(item => item && item.id && item.title && item.link);
  }, [rankingData?.items]);

  // Calculate total pages from server response
  const rankingTotalPages = React.useMemo(() => {
    if (!rankingData?.totalCount) return 0;
    return Math.ceil(rankingData.totalCount / rankingPageSize);
  }, [rankingData?.totalCount, rankingPageSize]);

  // 랭킹 뉴스 페이지 변경 핸들러
  const handleRankingPageChange = (page: number) => {
    if (page < 1 || page > rankingTotalPages) return;
    setRankingCurrentPage(page);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);
  };

  // 사설 데이터 처리
  const editorialLatest = editorialData && 'latest' in editorialData ? editorialData.latest : null;
  const editorialPrevious = editorialData && 'previous' in editorialData ? (editorialData.previous || []) : [];
  const editorialPaginationItems = editorialData && 'items' in editorialData ? (editorialData.items || []) : [];
  const editorialTotalCount = editorialData?.totalCount || 0;

  // 사설 페이지네이션된 아이템
  const paginatedEditorialItems = React.useMemo(() => {
    if (useEditorialLandingMode) {
      return editorialLatest ? [editorialLatest] : [];
    } else {
      return editorialPaginationItems;
    }
  }, [useEditorialLandingMode, editorialLatest, editorialPaginationItems]);

  // 사설 전체 페이지 수
  const editorialTotalPages = React.useMemo(() => {
    if (!editorialTotalCount) return 0;
    return Math.ceil(editorialTotalCount / editorialPageSize);
  }, [editorialTotalCount, editorialPageSize]);

  // 사설 페이지 변경 핸들러
  const handleEditorialPageChange = (page: number) => {
    if (page < 1 || page > editorialTotalPages) return;
    setEditorialCurrentPage(page);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);
  };

  // 카테고리 변경 시 페이지 초기화
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === 'all' ? undefined : category);
    setCurrentPage(1);
  };

  // 탭 변경 핸들러
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1);
    setSelectedKeys([]);
    setSelectedRows([]);
    setRankingSelectedKeys([]);
    setRankingSelectedRows([]);
    setSelectedPoliticalReport(null);
    setSelectedBillsReport(null);
    setSelectedEditorialAnalysis(null);

    // URL 업데이트
    router.push(`/?tab=${key}`, undefined, { shallow: true });

    // Phase 2: 탭 변경 추적
    const tabMap: Record<string, TabName> = {
      'exclusive': 'exclusive',
      'ranking': 'ranking',
      'editorial': 'editorial',
      'political': 'political',
      'bills': 'bills',
      'restaurant': 'restaurant'
    };
    if (tabMap[key]) {
      trackTabChange(tabMap[key]);
    }
  };

  const handleCopyToClipboard = () => {
    if (selectedRows.length === 0) {
      if (typeof window !== 'undefined') {
        // 클라이언트 사이드에서만 실행
        import('antd/lib/message').then((message) => {
          (message.default as any).warning('선택된 기사가 없습니다.');
        });
      }
      return;
    }

    const textToCopy = selectedRows
      .map(item => `${item.title}\n${item.original_link}\n${new Date(item.pub_date).toLocaleString('ko-KR')}\n`)
      .join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          if (typeof window !== 'undefined') {
            import('antd/lib/message').then((message) => {
              (message.default as any).success('클립보드에 복사되었습니다.');
            });
          }
        })
        .catch(() => {
          if (typeof window !== 'undefined') {
            import('antd/lib/message').then((message) => {
              (message.default as any).error('클립보드 복사에 실패했습니다.');
            });
          }
        });
    } else {
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((message) => {
          (message.default as any).error('클립보드 접근이 지원되지 않는 환경입니다.');
        });
      }
    }
  };

  // 랭킹 뉴스 복사 핸들러
  const handleCopyRankingToClipboard = () => {
    if (rankingSelectedRows.length === 0) {
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((message) => {
          (message.default as any).warning('선택된 기사가 없습니다.');
        });
      }
      return;
    }

    const textToCopy = rankingSelectedRows
      .map(item => `${item.title}\n${item.link}\n${item.media_name}\n`)
      .join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          if (typeof window !== 'undefined') {
            import('antd/lib/message').then((message) => {
              (message.default as any).success('클립보드에 복사되었습니다.');
            });
          }
        })
        .catch(() => {
          if (typeof window !== 'undefined') {
            import('antd/lib/message').then((message) => {
              (message.default as any).error('클립보드 복사에 실패했습니다.');
            });
          }
        });
    } else {
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((message) => {
          (message.default as any).error('클립보드 접근이 지원되지 않는 환경입니다.');
        });
      }
    }
  };

  // 안전하게 hasMore 계산
  const hasMore = React.useMemo(() => {
    // 모든 데이터를 한 번에 로드하므로 더 이상 로드할 데이터가 없음
    return false;
  }, [data]);

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries(['newsItems', selectedCategory]);
      return Promise.resolve();
    } catch (error) {
      console.error('새로고침 중 오류 발생:', error);
      return Promise.reject(error);
    }
  };

  const handleRankingRefresh = async () => {
    try {
      await queryClient.invalidateQueries('rankingNewsItems');
      return Promise.resolve();
    } catch (error) {
      console.error('랭킹 새로고침 중 오류 발생:', error);
      return Promise.reject(error);
    }
  };

  const handleEditorialRefresh = async () => {
    try {
      await queryClient.invalidateQueries('editorialItems');
      return Promise.resolve();
    } catch (error) {
      logger.error('사설 분석 새로고침 중 오류 발생', error);
      return Promise.reject(error);
    }
  };

  // 렌더링 전 랭킹 뉴스 데이터 상태 확인
  useEffect(() => {
    if (activeTab === 'ranking') {
      console.log('랭킹 뉴스 데이터 상태:', {
        hasData: !!rankingData,
        itemCount: rankingData?.items?.length || 0,
        isLoading: rankingIsLoading,
        hasError: !!rankingError
      });
    }
  }, [activeTab, rankingData, rankingIsLoading, rankingError]);

  // 서버 사이드 렌더링 시 로딩 UI 표시
  if (!isMounted) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ height: '600px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <Head>
        <title>NEWS-GQAI</title>
        <meta name="description" content="GQAI- 뉴스 플랫폼" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      
      {isMounted && (
        <>
          {/* 모바일에 최적화된 상단 네비게이션 바 */}
          <TopNavBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Canva 배너 */}
          <CanvaBanner />

          {/* 뉴스레터 구독 버튼 */}
          <NewsletterButton />

          <div style={{ paddingBottom: isMobile ? '76px' : '20px' }}>
            <style jsx global>{`
              /* 작은 버튼 스타일 오버라이드 */
              .small-action-button {
                min-width: 8px !important;
                min-height: 8px !important;
                width: 8px !important;
                height: 8px !important;
                padding: 0 !important;
                border: none !important;
              }
              
              .small-action-button svg {
                width: 4px !important;
                height: 4px !important;
              }
              
              /* 터치 영역 최적화 수정 */
              @media (hover: none) {
                .micro-button {
                  min-height: 8px !important;
                  min-width: 8px !important;
                  padding: 0 !important;
                }
              }
            `}</style>
            
            <div style={{
              padding: isMobile ? '16px' : '20px',
              maxWidth: isMobile ? '100%' : '1000px',
              margin: '0 auto'
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* <PwaInstallPrompt /> */}

                {activeTab === 'exclusive' && (
                  <>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: '12px'
                    }}>
                      <Title level={isMobile ? 4 : 3} style={{ fontFamily: "'Cafe24Anemone', sans-serif" }}>🚨 단독 뉴스</Title>
                      <Button 
                        icon={<CopyOutlined />} 
                        onClick={handleCopyToClipboard}
                        disabled={selectedRows.length === 0}
                        size={isMobile ? 'small' : 'middle'}
                      >
                        선택 기사 복사 ({selectedRows.length})
                      </Button>
                    </div>

                    <Tabs
                      defaultActiveKey="all"
                      onChange={handleCategoryChange}
                      items={[
                        { key: 'all', label: '전체', className: 'tab-all' },
                        { key: '정치', label: '정치', className: 'tab-politics' },
                        { key: '경제', label: '경제', className: 'tab-economy' },
                        { key: '사회', label: '사회', className: 'tab-social' },
                        { key: '국제', label: '국제', className: 'tab-international' },
                        { key: '문화', label: '문화', className: 'tab-culture' },
                        { key: '연예/스포츠', label: '연예/스포츠', className: 'tab-entertainment' },
                        { key: '기타', label: '기타', className: 'tab-etc' }
                      ]}
                      style={{
                        marginBottom: '12px',
                        backgroundColor: '#ffffff',
                        padding: isMobile ? '4px' : '8px',
                        borderRadius: '4px'
                      }}
                      size={isMobile ? 'small' : 'large'}
                      className="category-tabs"
                    />

                    {error && (
                      <Alert
                        message="데이터 로딩 오류"
                        description={error.message}
                        type="error"
                        showIcon
                        style={{ marginBottom: '16px' }}
                      />
                    )}

                    {isMobile ? (
                      <>
                        <VirtualNewsList
                          items={paginatedItems}
                          hasMore={false}
                          isLoading={isLoading}
                          onLoadMore={() => {}}
                          onRefresh={handleRefresh}
                          selectedKeys={selectedKeys}
                          onSelectChange={(keys, rows) => {
                            setSelectedKeys(keys);
                            setSelectedRows(rows);
                          }}
                        />
                        
                        {/* 모바일 페이지네이션 */}
                        {totalPages > 1 && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '12px',
                            padding: '16px',
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }}>
                            {/* <div style={{
                              fontSize: '13px',
                              color: '#666',
                              fontWeight: '600',
                              fontFamily: "'Cafe24Anemone', sans-serif"
                            }}>
                              {currentPage} / {totalPages} 페이지
                            </div> */}
                            <Pagination
                              current={currentPage}
                              total={data?.totalCount || 0}
                              pageSize={pageSize}
                              onChange={handlePageChange}
                              size="small"
                              showSizeChanger={false}
                              simple
                            />
                            {/* <div style={{
                              fontSize: '12px',
                              color: '#999'
                            }}>
                              총 {data?.items?.length || 0}개
                            </div> */}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <NewsTable
                          items={paginatedItems}
                          selectedKeys={selectedKeys}
                          onSelectChange={(keys, rows) => {
                            setSelectedKeys(keys);
                            setSelectedRows(rows);
                          }}
                        />

                        {/* 데스크톱 페이지네이션 */}
                        {totalPages > 1 && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '12px',
                            padding: '16px',
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }}>
                            {/* <div style={{
                              fontSize: '13px',
                              color: '#666',
                              fontWeight: '600',
                              fontFamily: "'Cafe24Anemone', sans-serif"
                            }}>
                              {currentPage} / {totalPages} 페이지
                            </div> */}
                            <Pagination
                              current={currentPage}
                              total={data?.totalCount || 0}
                              pageSize={pageSize}
                              onChange={handlePageChange}
                              size="small"
                              showSizeChanger={false}
                              simple
                            />
                            {/* <div style={{
                              fontSize: '12px',
                              color: '#999'
                            }}>
                              총 {data?.items?.length || 0}개
                            </div> */}
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* 데스크탑 새로고침 버튼 - 단독 뉴스 */}
                    {!isMobile && activeTab === 'exclusive' && (
                      <FloatingButtonWrapper position="primary" bottom={100}>
                        <MicroButton 
                          onClick={handleRefresh}
                          icon={<RefreshIcon />}
                          label="단독 뉴스 새로고침"
                          color="#4CAF50"
                          style={{
                            animation: isLoading ? 'rotate 1s linear infinite' : 'none'
                          }}
                          disabled={isLoading}
                        />
                      </FloatingButtonWrapper>
                    )}
                  </>
                )}
                
                {activeTab === 'ranking' && (
                  <>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: '12px'
                    }}>
                      <Title level={isMobile ? 4 : 3} style={{ fontFamily: "'Cafe24Anemone', sans-serif" }}>🔥 랭킹 뉴스</Title>
                      <Button 
                        icon={<CopyOutlined />} 
                        onClick={handleCopyRankingToClipboard}
                        disabled={rankingSelectedRows.length === 0}
                        size={isMobile ? 'small' : 'middle'}
                      >
                        선택 기사 복사 ({rankingSelectedRows.length})
                      </Button>
                    </div>
                    
                    {rankingError && (
                      <Alert
                        message="데이터 로딩 오류"
                        description={rankingError.message}
                        type="error"
                        showIcon
                        style={{ marginBottom: '16px' }}
                      />
                    )}
                    
                    {isMobile ? (
                      <>
                        <VirtualRankingNewsList
                          items={paginatedRankingItems}
                          isLoading={rankingIsLoading}
                          onRefresh={handleRankingRefresh}
                          selectedKeys={rankingSelectedKeys}
                          onSelectChange={(keys, rows) => {
                            setRankingSelectedKeys(keys);
                            setRankingSelectedRows(rows);
                          }}
                        />

                        {/* 모바일 페이지네이션 */}
                        {rankingTotalPages > 1 && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '12px',
                            padding: '16px',
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }}>
                            {/* <div style={{
                              fontSize: '13px',
                              color: '#666',
                              fontWeight: '600',
                              fontFamily: "'Cafe24Anemone', sans-serif"
                            }}>
                              {rankingCurrentPage} / {rankingTotalPages} 페이지
                            </div> */}
                            <Pagination
                              current={rankingCurrentPage}
                              total={rankingData?.totalCount || 0}
                              pageSize={rankingPageSize}
                              onChange={handleRankingPageChange}
                              size="small"
                              showSizeChanger={false}
                              simple
                            />
                            {/* <div style={{
                              fontSize: '12px',
                              color: '#999'
                            }}>
                              총 {rankingData?.items?.filter(item => item && item.id && item.title && item.link).length || 0}개
                            </div> */}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {rankingIsLoading ? (
                          <div style={{ padding: '20px', textAlign: 'center' }}>
                            <div>데이터를 불러오는 중입니다...</div>
                          </div>
                        ) : (
                          <>
                            <RankingNewsTable
                              items={paginatedRankingItems}
                              selectedKeys={rankingSelectedKeys}
                              onSelectChange={(keys, rows) => {
                                setRankingSelectedKeys(keys);
                                setRankingSelectedRows(rows);
                              }}
                            />

                            {/* 데스크톱 페이지네이션 */}
                            {rankingTotalPages > 1 && (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px',
                                marginTop: '12px',
                                padding: '16px',
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                              }}>
                                {/* <div style={{
                                  fontSize: '13px',
                                  color: '#666',
                                  fontWeight: '600',
                                  fontFamily: "'Cafe24Anemone', sans-serif"
                                }}>
                                  {rankingCurrentPage} / {rankingTotalPages} 페이지
                                </div> */}
                                <Pagination
                                  current={rankingCurrentPage}
                                  total={rankingData?.totalCount || 0}
                                  pageSize={rankingPageSize}
                                  onChange={handleRankingPageChange}
                                  size="small"
                                  showSizeChanger={false}
                                  simple
                                />
                                {/* <div style={{
                                  fontSize: '12px',
                                  color: '#999'
                                }}>
                                  총 {rankingData?.items?.filter(item => item && item.id && item.title && item.link).length || 0}개
                                </div> */}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                    
                    {/* 데스크탑 새로고침 버튼 - 랭킹 뉴스 */}
                    {!isMobile && activeTab === 'ranking' && (
                      <FloatingButtonWrapper position="primary" bottom={100}>
                        <MicroButton
                          onClick={handleRankingRefresh}
                          icon={<RefreshIcon />}
                          label="랭킹 뉴스 새로고침"
                          color="#4CAF50"
                          style={{
                            animation: rankingIsLoading ? 'rotate 1s linear infinite' : 'none'
                          }}
                          disabled={rankingIsLoading}
                        />
                      </FloatingButtonWrapper>
                    )}
                  </>
                )}

                {activeTab === 'editorial' && (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: '12px'
                    }}>
                      <Title level={isMobile ? 4 : 3} style={{ fontFamily: "'Cafe24Anemone', sans-serif" }}>📰 오늘의 사설</Title>
                    </div>

                    {editorialError && (
                      <Alert
                        message="데이터 로딩 오류"
                        description={editorialError.message}
                        type="error"
                        showIcon
                        style={{ marginBottom: '16px' }}
                      />
                    )}

                    <VirtualEditorialList
                      items={paginatedEditorialItems}
                      isLoading={editorialIsLoading}
                      selectedEditorialId={selectedEditorialAnalysis}
                      onEditorialClick={(id) => {
                        setSelectedEditorialAnalysis(id);
                        router.push(`/?tab=editorial&id=${id}`, undefined, { shallow: true });
                      }}
                      onBack={() => {
                        setSelectedEditorialAnalysis(null);
                        router.push('/?tab=editorial', undefined, { shallow: true });
                      }}
                    />

                    {/* 랜딩 모드: 이전 리포트 섹션 + 더 보기 버튼 */}
                    {useEditorialLandingMode && editorialPrevious.length > 0 && (
                      <>
                        <div style={{
                          marginTop: '32px',
                          paddingTop: '24px',
                          borderTop: '1px solid #e5e7eb'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#374151',
                            margin: '0 0 16px 0'
                          }}>이전 리포트</h3>
                          {editorialPrevious.map((report: any) => (
                            <div
                              key={report.id}
                              onClick={() => {
                                setSelectedEditorialAnalysis(report.id);
                                router.push(`/?tab=editorial&id=${report.id}`, undefined, { shallow: true });
                              }}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                marginBottom: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.transform = 'translateX(4px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f9fafb';
                                e.currentTarget.style.transform = 'translateX(0)';
                              }}
                            >
                              <span style={{
                                fontSize: '14px',
                                color: '#4b5563',
                                fontWeight: 500
                              }}>
                                {new Date(report.analyzed_at).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              <span style={{
                                fontSize: '13px',
                                color: '#3b82f6',
                                fontWeight: 500
                              }}>자세히 보기 →</span>
                            </div>
                          ))}
                        </div>

                        {/* 더 보기 버튼 */}
                        {(() => {
                          console.log('Editorial ViewMore Button Check:', { totalCount: editorialTotalCount, shouldShow: editorialTotalCount > 5 });
                          return editorialTotalCount > 5 && (
                            <button
                              onClick={() => {
                                console.log('Switching to pagination mode');
                                setUseEditorialLandingMode(false);
                              }}
                              style={{
                                width: '100%',
                                padding: '14px',
                                marginTop: '24px',
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                color: '#3b82f6',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f9fafb';
                                e.currentTarget.style.borderColor = '#3b82f6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                              }}
                            >
                              전체 리포트 보기 ({editorialTotalCount}개) →
                            </button>
                          );
                        })()}
                      </>
                    )}

                    {/* 페이지네이션 모드: 페이지네이션 UI */}
                    {!useEditorialLandingMode && editorialTotalPages > 1 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '12px',
                        padding: '16px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}>
                        <Pagination
                          current={editorialCurrentPage}
                          total={editorialTotalCount}
                          pageSize={editorialPageSize}
                          onChange={handleEditorialPageChange}
                          size="small"
                          showSizeChanger={false}
                          simple
                        />
                      </div>
                    )}

                    {/* 데스크탑 새로고침 버튼 - 사설 분석 */}
                    {!isMobile && activeTab === 'editorial' && (
                      <FloatingButtonWrapper position="primary" bottom={100}>
                        <MicroButton
                          onClick={handleEditorialRefresh}
                          icon={<RefreshIcon />}
                          label="사설 분석 새로고침"
                          color="#4CAF50"
                          style={{
                            animation: editorialIsLoading ? 'rotate 1s linear infinite' : 'none'
                          }}
                          disabled={editorialIsLoading}
                        />
                      </FloatingButtonWrapper>
                    )}
                  </>
                )}

                {activeTab === 'political' && (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: '12px'
                    }}>
                      <Title level={isMobile ? 4 : 3} style={{ fontFamily: "'Cafe24Anemone', sans-serif" }}>📰 정치 리포트</Title>
                    </div>
                    {selectedPoliticalReport ? (
                      <PoliticalReportDetail
                        slug={selectedPoliticalReport}
                        onBack={() => {
                          setSelectedPoliticalReport(null);
                          router.push('/?tab=political', undefined, { shallow: true });
                        }}
                      />
                    ) : (
                      <PoliticalReportsList
                        onReportClick={(slug) => {
                          setSelectedPoliticalReport(slug);
                          router.push(`/?tab=political&id=${slug}`, undefined, { shallow: true });
                        }}
                      />
                    )}
                  </>
                )}

                {activeTab === 'bills' && (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: '12px'
                    }}>
                      <Title level={isMobile ? 4 : 3} style={{ fontFamily: "'Cafe24Anemone', sans-serif" }}>📜 오늘의 법안</Title>
                    </div>
                    <BillsReportsList
                      selectedSlug={selectedBillsReport}
                      onReportClick={(slug) => {
                        setSelectedBillsReport(slug);
                        router.push(`/?tab=bills&id=${slug}`, undefined, { shallow: true });
                      }}
                      onBack={() => {
                        setSelectedBillsReport(null);
                        router.push('/?tab=bills', undefined, { shallow: true });
                      }}
                    />
                  </>
                )}
              </Space>
            </div>
          </div>

          {/* 모바일 하단 네비게이션 */}
          {isMobile && (
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              zIndex: 1000,
              backgroundColor: 'white'
            }}>
              <BottomNav
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
      <PageFooter isMobile={isMobile} />
    </div>
  );
};

// SSR 지원 - AdSense 크롤러가 실제 콘텐츠를 볼 수 있도록 초기 데이터 제공
export async function getServerSideProps() {
  try {
    // 서버에서 초기 뉴스 데이터 가져오기
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://news.gqai.kr';

    const response = await fetch(`${baseUrl}/api/news?page=1&pageSize=12`, {
      headers: {
        'User-Agent': 'Next.js SSR',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }

    const newsData = await response.json();

    return {
      props: {
        initialNewsData: newsData,
      },
    };
  } catch (error) {
    console.error('SSR 데이터 로딩 실패:', error);
    // 에러 시 빈 데이터 반환하여 클라이언트에서 재시도
    return {
      props: {
        initialNewsData: {
          items: [],
          totalCount: 0,
        },
      },
    };
  }
}

export default HomePage;