import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
// Remove unused import since LoadMoreButton component is not being used
import VirtualNewsList from '@/components/mobile/VirtualNewsList';
import VirtualRankingNewsList from '@/components/mobile/VirtualRankingNewsList';
import { CopyOutlined, ShopOutlined } from '@ant-design/icons';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import { NewsItem, NewsResponse, RankingNewsItem, RankingNewsResponse } from '@/types';
import { Pagination } from 'antd';
import BottomNav from '@/components/mobile/BottomNav';
import TopNavBar from '@/components/mobile/TopNavBar';

// 동적으로 Ant Design 컴포넌트 임포트
import type {
  DynamicTypography,
  DynamicTitle,
  DynamicSpace,
  DynamicAlert,
  DynamicButton,
  DynamicTabs
} from '@/types/antd-dynamic';

const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as DynamicTypography;
const Title = dynamic(() => import('antd/lib/typography/Title'), { ssr: false }) as DynamicTitle;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as DynamicSpace;
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as DynamicAlert;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as DynamicButton;
const Tabs = dynamic(() => import('antd/lib/tabs'), { ssr: false }) as DynamicTabs;

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

// 전체 컴포넌트를 클라이언트 사이드에서만 렌더링
const HomePage = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(7); // 모바일에서 한 페이지당 7개 아이템
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedRows, setSelectedRows] = useState<NewsItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [activeTab, setActiveTab] = useState<string>('exclusive');
  const [rankingSelectedRows, setRankingSelectedRows] = useState<RankingNewsItem[]>([]);
  const [rankingSelectedKeys, setRankingSelectedKeys] = useState<React.Key[]>([]);
  const queryClient = useQueryClient();
  const router = useRouter();

  // URL에서 tab 파라미터 체크
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'ranking') {
        setActiveTab('ranking');
      }
    }
  }, []);

  // 클라이언트 사이드 마운트 체크
  useEffect(() => {
    setIsMounted(true);
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

  // Categories query
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
      enabled: isMounted // 클라이언트 사이드에서만 실행
    }
  );

  // News items query
  const { data, isLoading, error } = useQuery<NewsResponse, Error>(
    ['newsItems', selectedCategory],
    async () => {
      console.log('뉴스 데이터 요청 시작:', { category: selectedCategory });
      const response = await fetch(`/api/news?all=true${selectedCategory ? `&category=${selectedCategory}` : ''}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('뉴스 API 응답 오류:', response.status, errorText);
        throw new Error(`Failed to fetch news items: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      console.log('뉴스 API 응답:', result?.items?.length || 0, '개 항목');
      return result;
    },
    { 
      keepPreviousData: true,
      enabled: isMounted, // 클라이언트 사이드에서만 실행
      retry: 2, // 재시도 횟수 추가
      onError: (error) => {
        console.error('뉴스 쿼리 오류:', error);
      }
    }
  );

  // Ranking news items query
  const { data: rankingData, isLoading: rankingIsLoading, error: rankingError } = useQuery<RankingNewsResponse, Error>(
    'rankingNewsItems',
    async () => {
      console.log('랭킹 뉴스 데이터 요청 시작');
      const response = await fetch('/api/ranking-news?all=true');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('랭킹 뉴스 API 응답 오류:', response.status, errorText);
        throw new Error(`Failed to fetch ranking news items: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      console.log('랭킹 API 응답:', result?.items?.length || 0, '개 항목');
      return result;
    },
    {
      keepPreviousData: true,
      enabled: isMounted, // 항상 로드되도록 수정
      // 재시도 옵션 추가
      retry: 2,
      onError: (error) => {
        console.error('랭킹 뉴스 쿼리 오류:', error);
      }
    }
  );

  // 현재 페이지의 아이템만 필터링
  const paginatedItems = React.useMemo(() => {
    if (!data?.items) return [];
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.items.slice(startIndex, endIndex);
  }, [data?.items, currentPage, pageSize]);

  // 전체 페이지 수 계산
  const totalPages = React.useMemo(() => {
    if (!data?.items) return 0;
    return Math.ceil(data.items.length / pageSize);
  }, [data?.items, pageSize]);

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
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>EXNEWS</title>
        <meta name="description" content="EXNEWS - 뉴스 플랫폼" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      
      {isMounted && (
        <>
          {/* 모바일에 최적화된 상단 네비게이션 바 */}
          <TopNavBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          
          <div style={{ paddingBottom: isMobile ? '16px' : '20px' }}>
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
            
            <div style={{ padding: isMobile ? '16px' : '20px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <PwaInstallPrompt />
                
                {activeTab === 'exclusive' && (
                  <>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: '12px'
                    }}>
                      <Title level={isMobile ? 4 : 3}>🚨 단독 뉴스</Title>
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
                      size={isMobile ? 'small' : 'middle'}
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
                                total={data?.items?.length || 0}
                                pageSize={pageSize}
                                onChange={handlePageChange}
                                size="small"
                                showSizeChanger={false}
                                simple
                              />
                            </div>
                            
                            {/* 페이지 정보 표시 */}
                            <div style={{
                              textAlign: 'center',
                              fontSize: '12px',
                              color: '#666',
                              marginTop: '4px'
                            }}>
                              {currentPage} / {totalPages} 페이지
                            </div>
                            
                            {/* 하단 메뉴바 공간 - 현재 기능 없음 */}
                            {/* <div style={{ height: '60px' }}></div> */}
                          </>
                        )}
                      </>
                    ) : (
                      <NewsTable 
                        items={data?.items || []}
                        selectedKeys={selectedKeys}
                        onSelectChange={(keys, rows) => {
                          setSelectedKeys(keys);
                          setSelectedRows(rows);
                        }}
                      />
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
                      <Title level={isMobile ? 4 : 3}>📊 랭킹 뉴스</Title>
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
                      <VirtualRankingNewsList 
                        items={(rankingData && rankingData.items) ? 
                          // 유효하지 않은 아이템 필터링 (필터링 결과 로깅 추가)
                          rankingData.items.filter(item => {
                            const isValid = item && item.id && item.title && item.link;
                            if (!isValid) {
                              console.warn('유효하지 않은 랭킹 뉴스 아이템 필터링:', item);
                            }
                            return isValid;
                          }) : 
                          []
                        }
                        isLoading={rankingIsLoading}
                        onRefresh={handleRankingRefresh}
                        selectedKeys={rankingSelectedKeys}
                        onSelectChange={(keys, rows) => {
                          setRankingSelectedKeys(keys);
                          setRankingSelectedRows(rows);
                        }}
                      />
                    ) : (
                      <div>
                        {rankingIsLoading ? (
                          <div style={{ padding: '20px', textAlign: 'center' }}>
                            <div>데이터를 불러오는 중입니다...</div>
                          </div>
                        ) : (
                          <RankingNewsTable 
                            items={(rankingData && rankingData.items) ? 
                              rankingData.items.filter(item => item && item.id && item.title && item.link) : 
                              []
                            }
                            selectedKeys={rankingSelectedKeys}
                            onSelectChange={(keys, rows) => {
                              setRankingSelectedKeys(keys);
                              setRankingSelectedRows(rows);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </Space>
            </div>
          </div>
        </>
      )}
      {/* 푸터 추가 */}
      <footer style={{
        width: '100%',
        padding: '16px',
        textAlign: 'center',
        borderTop: '1px solid #eaeaea',
        marginTop: '32px',
        color: '#666',
        fontSize: isMobile ? '12px' : '14px',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ marginBottom: '8px' }}>
          © {new Date().getFullYear()} 단독뉴스 - 모든 권리 보유
        </div>
        <div>
          <a href="mailto:gq.newslens@gmail.com" style={{ 
            color: '#1a4b8c', 
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            문의: gq.newslens@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
};

// SSR 비활성화
export default dynamic(() => Promise.resolve(HomePage), { ssr: false });