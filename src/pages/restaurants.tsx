import React, { useState, useEffect, ReactNode } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { RestaurantItem } from '@/types';
import Image from 'next/image';

import TopNavBar from '@/components/mobile/TopNavBar';
import dynamic from 'next/dynamic';

// SimpleBuildingView를 동적으로 로드
const SimpleBuildingView = dynamic(() => import('@/components/SimpleBuildingView'), {
  ssr: false,
  loading: () => <div>빌딩별 뷰 로딩 중...</div>
});
import { message } from 'antd';
import Alert from 'antd/lib/alert';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Collapse from 'antd/lib/collapse';
import List from 'antd/lib/list';
import Radio from 'antd/lib/radio';
import Spin from 'antd/lib/spin';
import Tag from 'antd/lib/tag';
import Typography from 'antd/lib/typography';
import Tabs from 'antd/lib/tabs';


// 클라이언트 컴포넌트 
const ClientOnly = ({ children, ...delegated }: { children: ReactNode; [key: string]: any }) => {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return <div className="text-center p-20">로딩 중...</div>;
  }
  
  return <div {...delegated}>{children}</div>;
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealData, setIsRealData] = useState<boolean>(true);
  
  const [setupLoading, setSetupLoading] = useState<boolean>(false);
  const [setupSuccess, setSetupSuccess] = useState<boolean>(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [apiMode, setApiMode] = useState<string>('normal');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // 뷰 모드 상태 추가
  const [viewMode, setViewMode] = useState<'category' | 'building'>('category');
  const [allRestaurants, setAllRestaurants] = useState<RestaurantItem[]>([]);
  const [buildingLoading, setBuildingLoading] = useState<boolean>(false);
  
  // 데이터 로드 함수
  const fetchData = async (categoryFilter: string = selectedCategory, page: number = currentPage, size: number = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      console.log(`식당 데이터 요청 시작... (카테고리: ${categoryFilter}, 페이지: ${page}, 크기: ${size})`);
      
      // API 모드에 따라 쿼리 파라미터 조정
      let url = '/api/restaurants';
      const params = new URLSearchParams();
      
      if (apiMode === 'sample') {
        params.append('debug', 'sample');
      } else if (apiMode === 'direct') {
        // 직접 API 호출 테스트는 별도 함수로 처리
        await fetchDirectApiCall();
        return;
      }
      
      // 카테고리 필터 추가 (all이 아닐 경우)
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      // 페이지네이션 매개변수 추가
      params.append('page', page.toString());
      params.append('pageSize', size.toString());
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetch(url);
      console.log('응답 상태:', response.status, response.statusText);
      
      // 응답의 raw 텍스트 추출
      const responseText = await response.text();
      console.log('응답 데이터(raw):', responseText);
      
      // JSON 형식인지 확인
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('파싱된 데이터:', data);
      } catch (e: any) {
        throw new Error(`응답이 유효한 JSON 형식이 아닙니다: ${e.message}`);
      }
      
      // items 필드가 있는지 확인
      if (!data.items) {
        setIsRealData(false);
        throw new Error('응답에 items 필드가 없습니다.');
      }
      
      setRestaurants(data.items || []);
      setTotalCount(data.totalCount || data.items.length);
      setIsRealData(data.source !== 'sample-fallback' && data.source !== 'sample-error');
      
      // 카테고리 목록 추출 및 업데이트 (최초 로드 시 또는 필요 시)
      if (data.items && data.items.length > 0 && categories.length <= 1) {
        // 기본 카테고리 목록
        const defaultCategories = ['all', '한정식', '고깃집', '중식', '일식/해산물', '이탈리안', '기타'];
        
        // API에서 가져온 카테고리 목록
        const apiCategories = data.items.reduce((acc: string[], item: RestaurantItem) => {
          if (item.category && !acc.includes(item.category)) {
            acc.push(item.category);
          }
          return acc;
        }, []);
        
        // 두 목록을 합치고 중복 제거
        let uniqueCategories = ['all'];
        defaultCategories.forEach((cat: string) => {
          if (cat !== 'all' && !uniqueCategories.includes(cat)) {
            uniqueCategories.push(cat);
          }
        });
        apiCategories.forEach((cat: string) => {
          if (cat !== 'all' && !uniqueCategories.includes(cat)) {
            uniqueCategories.push(cat);
          }
        });
        
        setCategories(uniqueCategories);
      }
      
      // 디버그 정보 저장
      if (data.debug) {
        setDebugInfo(data.debug);
      }
      
      if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error('데이터 가져오기 오류:', err);
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
      setRestaurants([]);
      setIsRealData(false);
    } finally {
      setLoading(false);
    }
  };

  // 직접 API 호출 테스트
  const fetchDirectApiCall = async () => {
    try {
      setLoading(true);
      console.log('Supabase 직접 호출 테스트...');
      
      // 클라이언트 측에서 직접 Supabase API 호출
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase 연결 정보가 설정되지 않았습니다.');
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase 클라이언트 생성:', supabase ? '성공' : '실패');
      
      // 테이블명 'nares' 사용
      const tableName = 'nares';
      console.log(`테이블 '${tableName}' 조회 시도...`);
      
      // 데이터 조회
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' });
      
      console.log('데이터 조회 결과:', error ? '오류 발생' : `${count}개 항목 조회됨`);
      console.log('조회된 데이터:', data);
      
      if (error) {
        setDebugInfo({
          error,
          message: '데이터 조회 중 오류가 발생했습니다.',
          tableName,
          supabaseConnected: true
        });
        setError(`데이터 조회 오류: ${error.message}`);
        setIsRealData(false);
        setRestaurants([]);
      } else {
        // 데이터 성공적으로 가져옴(비어있더라도)
        setRestaurants(data || []);
        setIsRealData(true);
        setDebugInfo({
          tableName,
          count,
          supabaseConnected: true,
          dataFound: data?.length > 0,
          rawData: data,
          columns: data && data.length > 0 ? Object.keys(data[0]) : []
        });
      }
    } catch (err: any) {
      console.error('직접 API 호출 오류:', err);
      setError(err.message || '직접 API 호출 중 오류가 발생했습니다.');
      setRestaurants([]);
      setIsRealData(false);
      setDebugInfo({
        error: err.message,
        directApiError: true
      });
    } finally {
      setLoading(false);
    }
  };

  // 빌딩별 보기용 전체 데이터 로드 함수
  const fetchAllRestaurants = async () => {
    try {
      setBuildingLoading(true);
      setError(null);
      console.log('빌딩별 보기용 전체 식당 데이터 요청...');
      
      const response = await fetch('/api/restaurants?all=true');
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e: any) {
        throw new Error(`응답이 유효한 JSON 형식이 아닙니다: ${e.message}`);
      }
      
      if (!data.items) {
        throw new Error('응답에 items 필드가 없습니다.');
      }
      
      setAllRestaurants(data.items || []);
      setIsRealData(data.source !== 'sample-fallback' && data.source !== 'sample-error');
      
      if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error('전체 데이터 가져오기 오류:', err);
      setError(err.message || '전체 데이터 로드 중 오류가 발생했습니다.');
      setAllRestaurants([]);
    } finally {
      setBuildingLoading(false);
    }
  };

  useEffect(() => {
    // apiMode나 selectedCategory가 변경될 때 페이지를 1로 초기화하고 데이터 로드
    // 이제 함수 내부에서 직접 처리하므로 여기서는 기본 호출만 합니다
    if (apiMode !== 'direct') {
      fetchData(selectedCategory, 1, pageSize);
    }
  }, [apiMode]);

  // 뷰 모드 변경 핸들러
  const handleViewModeChange = async (mode: 'category' | 'building') => {
    setViewMode(mode);
    
    if (mode === 'building' && allRestaurants.length === 0) {
      // 빌딩별 보기 선택 시 전체 데이터 로드
      await fetchAllRestaurants();
    }
  };

  const showSuccessMessage = (content: string) => {
    message.success(content);
  };

  const setupTable = async () => {
    try {
      setSetupLoading(true);
      setSetupError(null);
      setSetupSuccess(false);
      
      const response = await fetch('/api/setup-restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('테이블 설정 응답:', data);
      
      if (response.ok) {
        setSetupSuccess(true);
        showSuccessMessage('테이블 설정이 완료되었습니다.');
        
        // 데이터 다시 불러오기
        setTimeout(() => {
          fetchData();
        }, 1000);
      } else {
        setSetupError(data.message || '테이블 설정 중 오류가 발생했습니다.');
        
        // SQL 스크립트가 있는 경우 디버그 정보에 추가
        if (data.sqlScript) {
          setDebugInfo({
            ...debugInfo,
            sqlScript: data.sqlScript,
            setupResponse: data
          });
        }
      }
    } catch (err: any) {
      console.error('테이블 설정 오류:', err);
      setSetupError(err.message || '테이블 설정 중 오류가 발생했습니다.');
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>국회앞 식당정보 - ExNews</title>
        <meta name="description" content="국회 주변 맛집 정보를 제공합니다." />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-between">
        <TopNavBar />
        
        <div className="container mx-auto px-4 py-8 mt-4">
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-8 px-6 rounded-lg shadow-md mb-8">
            <h1 className="text-3xl font-bold mb-2">국회앞 식당정보</h1>
            <p className="text-blue-100">국회앞 식당 정보를 카테고리별로 확인해보세요.</p>
          </div>

          <ClientOnly>
            <div className="w-full">
              {typeof window !== 'undefined' && (
                <RestaurantContent 
                  restaurants={restaurants}
                  loading={loading}
                  error={error}
                  isRealData={isRealData}
                  apiMode={apiMode}
                  setApiMode={setApiMode}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  categories={categories}
                  fetchData={fetchData}
                  setupLoading={setupLoading}
                  setupSuccess={setupSuccess}
                  setupError={setupError}
                  debugInfo={debugInfo}
                  setupTable={setupTable}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  totalCount={totalCount}
                  viewMode={viewMode}
                  setViewMode={handleViewModeChange}
                  allRestaurants={allRestaurants}
                  buildingLoading={buildingLoading}
                  fetchAllRestaurants={fetchAllRestaurants}
                />
              )}
            </div>
          </ClientOnly>
        </div>
      </main>
    </>
  );
}

interface RestaurantContentProps {
  restaurants: RestaurantItem[];
  loading: boolean;
  error: string | null;
  isRealData: boolean;
  apiMode: string;
  setApiMode: (mode: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  fetchData: (categoryFilter?: string, page?: number, size?: number) => Promise<void>;
  setupLoading: boolean;
  setupSuccess: boolean;
  setupError: string | null;
  debugInfo: any;
  setupTable: () => Promise<void>;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalCount: number;
  viewMode: 'category' | 'building';
  setViewMode: (mode: 'category' | 'building') => Promise<void>;
  allRestaurants: RestaurantItem[];
  buildingLoading: boolean;
  fetchAllRestaurants: () => Promise<void>;
}

// 클라이언트 컴포넌트 분리
function RestaurantContent(props: RestaurantContentProps) {

  // 카테고리별 텍스트 색상 매핑 (배경색 제거)
  const getCategoryTextColor = (category: string) => {
    const colorMap: {[key: string]: string} = {
      '전체': '#000000',
      '한정식': '#d4380d',
      '고깃집': '#fa541c',
      '중식': '#cf1322',
      '일식/해산물': '#1677ff',
      '이탈리안': '#389e0d',
      '기타': '#5c6b77'
    };
    return colorMap[category] || '#333';
  };



  const { 
    restaurants, loading, error, isRealData, apiMode, setApiMode,
    selectedCategory, setSelectedCategory, categories,
    fetchData, setupLoading, setupSuccess, setupError, debugInfo, setupTable,
    currentPage, setCurrentPage, pageSize, setPageSize, totalCount,
    viewMode, setViewMode, allRestaurants, buildingLoading, fetchAllRestaurants
  } = props;

  return (
    <>
      {/* 스피너 애니메이션을 위한 스타일 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* 상단 헤더 섹션 */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '24px',
        marginBottom: '32px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          {/* 뷰 모드 선택 및 새로고침 버튼 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            {/* 뷰 모드 선택 - 커스텀 스타일 */}
            <div style={{
              display: 'flex',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '4px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <button
                onClick={() => setViewMode('category')}
                style={{
                  padding: '12px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'category' ? '#3b82f6' : 'transparent',
                  color: viewMode === 'category' ? 'white' : '#6b7280',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginRight: '2px'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'category') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'category') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                📂 카테고리별
              </button>
              <button
                onClick={() => setViewMode('building')}
                style={{
                  padding: '12px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'building' ? '#3b82f6' : 'transparent',
                  color: viewMode === 'building' ? 'white' : '#6b7280',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'building') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'building') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                🏢 빌딩별
              </button>
            </div>
            
            {/* 새로고침 버튼 - 커스텀 스타일 */}
            <button
              onClick={() => viewMode === 'category' ? fetchData(selectedCategory) : fetchAllRestaurants()}
              disabled={viewMode === 'category' ? loading : buildingLoading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#10b981',
                color: 'white',
                fontWeight: '500',
                fontSize: '14px',
                cursor: (viewMode === 'category' ? loading : buildingLoading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px 0 rgba(16, 185, 129, 0.2)',
                opacity: (viewMode === 'category' ? loading : buildingLoading) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!(viewMode === 'category' ? loading : buildingLoading)) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px 0 rgba(16, 185, 129, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!(viewMode === 'category' ? loading : buildingLoading)) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(16, 185, 129, 0.2)';
                }
              }}
            >
              {(viewMode === 'category' ? loading : buildingLoading) ? (
                <>
                  <span style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid #ffffff', 
                    borderTop: '2px solid transparent', 
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite' 
                  }}></span>
                  로딩 중...
                </>
              ) : (
                <>
                  🔄 새로고침
                </>
              )}
            </button>
          </div>
          
          {/* 카테고리 탭 - 카테고리별 뷰일 때만 표시 */}
          {viewMode === 'category' && (
            <Tabs 
              activeKey={selectedCategory} 
              onChange={(key: string) => {
                setSelectedCategory(key);
                setCurrentPage(1); // 카테고리 변경 시 페이지 초기화
                fetchData(key, 1, pageSize);
              }}
              type="card"
              size="large"
              className="custom-tabs"
              items={categories.map(cat => ({ 
                key: cat, 
                label: cat === 'all' ? '전체' : cat,
                className: selectedCategory === cat ? 'font-bold' : ''
              }))}
            />
          )}
          
          {/* 빌딩별 뷰 설명 */}
          {viewMode === 'building' && (
            <div className="text-center py-4">
              <Typography.Title level={4} style={{ marginBottom: '8px' }}>
                🏢 빌딩별 식당 보기
              </Typography.Title>
              <Typography.Text type="secondary">
                식당이 3개 이상인 빌딩부터 탭으로 정렬되어 표시됩니다
              </Typography.Text>
            </div>
          )}
        </div>
      </div>
      
      {/* 상태 표시 */}
      <div style={{ marginTop: '24px' }}>
        {!isRealData && !loading && (
        <Alert
          message="샘플 데이터 표시 중"
          description={
            <div>
              <p>실제 데이터베이스에서 가져온 데이터가 아닌 샘플 데이터를 표시하고 있습니다.</p>
              <p>아래 '테이블 초기화' 버튼을 클릭하여 데이터베이스를 설정하세요.</p>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}
      
      {error && (
        <Alert
          message="오류 발생"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}
      
      {/* 설정 상태 */}
      {setupLoading && (
        <Alert
          message="테이블 설정 중..."
          description="데이터베이스 테이블을 설정하고 있습니다. 잠시만 기다려주세요."
          type="info"
          showIcon
          className="mb-4"
        />
      )}
      
      {setupSuccess && (
        <Alert
          message="설정 완료"
          description="데이터베이스 테이블이 성공적으로 설정되었습니다."
          type="success"
          showIcon
          className="mb-4"
        />
      )}
      
      {setupError && (
        <Alert
          message="설정 오류"
          description={setupError}
          type="error"
          showIcon
          className="mb-4"
        />
      )}
      
      {/* 디버그 정보는 숨김 처리 - 필요시 관리자만 볼 수 있게 */}
      {debugInfo && Collapse && (
        <div className="mb-4 opacity-60 hover:opacity-100 transition-opacity">
          <Collapse>
            <Collapse.Panel header="디버깅 정보 (관리자용)" key="1">
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </Collapse.Panel>
          </Collapse>
        </div>
      )}
      
      {/* 관리자 설정 버튼 */}
      {!isRealData && !setupLoading && Button && Typography && (
        <div className="mb-4">
          <Button 
            type="primary" 
            danger
            onClick={setupTable}
            loading={setupLoading}
          >
            테이블 초기화 (관리자)
          </Button>
          <Typography.Text type="secondary" className="ml-2">
            ※ 이 버튼은 관리자만 사용해야 합니다.
          </Typography.Text>
        </div>
      )}
      
      {/* 로딩 상태 */}
      {(viewMode === 'category' ? loading : buildingLoading) ? (
        <div className="flex justify-center items-center py-20">
          {Spin && <Spin size="large" tip={viewMode === 'category' ? "데이터를 불러오는 중..." : "빌딩별 데이터를 불러오는 중..."} />}
        </div>
      ) : (
        <>
          {/* 카테고리별 보기 */}
          {viewMode === 'category' && (
            <div className="overflow-x-auto px-4">
              {List && (
                <List
              grid={{
                gutter: 24,
                xs: 1,
                sm: 2,
                md: 3,
                lg: 3,
                xl: 4,
                xxl: 5,
              }}
              dataSource={restaurants}
              pagination={{
                position: 'bottom',
                align: 'center',
                current: currentPage,
                pageSize: pageSize,
                total: totalCount,
                showSizeChanger: true,
                showTotal: (total: number, range: [number, number]) => `총 ${total}개 중 ${range[0]}-${range[1]}`,
                pageSizeOptions: ['10', '20', '30', '50'],
                onChange: (page: number, size: number) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                  }
                  fetchData(selectedCategory, page, size);
                },
                onShowSizeChange: (current: number, size: number) => {
                  setPageSize(size);
                  setCurrentPage(1);
                  fetchData(selectedCategory, 1, size);
                }
              }}
              renderItem={(item: RestaurantItem) => (
                <List.Item>
                  {Card && (
                    <Card
                      title={
                        <div className="text-xl font-semibold flex items-center justify-between">
                          {item.link ? (
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#1a73e8' }}
                            >
                              {item.name}
                            </a>
                          ) : (
                            item.name
                          )}
                          {item.category && Tag && (
                            <Tag 
                              color={getCategoryTextColor(item.category)} 
                              className="ml-2 text-sm border-transparent bg-transparent"
                            >
                              {item.category}
                            </Tag>
                          )}
                        </div>
                      }
                      hoverable
                      className="h-full"
                      style={{ 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                        transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
                        backgroundColor: 'white'
                      }}
                      bordered={false}
                      bodyStyle={{ padding: '12px 16px', lineHeight: '1.4' }}
                    >
                      <div style={{ lineHeight: '1.4' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <span role="img" aria-label="location" style={{ marginRight: 8 }}>📍</span>
                          {item.location}
                        </div>
                        
                        {item.pnum && (
                          <div style={{ marginBottom: '4px' }}>
                            <span role="img" aria-label="phone" style={{ marginRight: 8 }}>📞</span>
                            {item.pnum}
                          </div>
                        )}
                        
                        {item.price && (
                          <div style={{ marginBottom: '4px' }}>
                            <span role="img" aria-label="price" style={{ marginRight: 8 }}>💰</span>
                            {item.price}
                          </div>
                        )}
                        
                        {item.remark && (
                          <div style={{ marginBottom: '4px', color: '#666' }}>
                            <span role="img" aria-label="note" style={{ marginRight: 8 }}>💬</span>
                            {item.remark}
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </List.Item>
              )}
                />
              )}
            </div>
          )}
          
          {/* 빌딩별 보기 */}
          {viewMode === 'building' && (
            <div className="px-4">
              <SimpleBuildingView
                items={allRestaurants}
              />
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}

// SSR 설정
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {} // 초기 props 전달
  };
};