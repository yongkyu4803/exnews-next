import React, { useState, useEffect, ReactNode } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { RestaurantItem } from '@/types';
import Header from '@/components/Layout/Header';
import Image from 'next/image';

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
  
  // 데이터 로드 함수
  const fetchData = async (categoryFilter: string = selectedCategory) => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      console.log(`식당 데이터 요청 시작... (카테고리: ${categoryFilter})`);
      
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
      setIsRealData(data.source !== 'sample-fallback' && data.source !== 'sample-error');
      
      // 카테고리 목록 추출 및 업데이트 (최초 로드 시 또는 필요 시)
      if (data.items && data.items.length > 0 && categories.length <= 1) {
        // 기본 카테고리 목록
        const defaultCategories = ['all', '한식', '중식', '일식/해산물', '이탈리안', '카페', '기타'];
        
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

  useEffect(() => {
    fetchData(selectedCategory);
  }, [apiMode, selectedCategory]);

  const showSuccessMessage = (content: string) => {
    if (typeof window !== 'undefined') {
      // 동적 import 후 message 사용
      import('antd/lib/message').then(mod => {
        const message = mod.default;
        message.success(content);
      });
    }
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
        <title>국회 주변 맛집 - ExNews</title>
        <meta name="description" content="국회 주변 맛집 정보를 제공합니다." />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-between">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-8 px-6 rounded-lg shadow-md mb-8">
            <h1 className="text-3xl font-bold mb-2">국회 주변 맛집</h1>
            <p className="text-blue-100">국회 주변의 다양한 맛집 정보를 카테고리별로 확인해보세요.</p>
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
  fetchData: (categoryFilter?: string) => Promise<void>;
  setupLoading: boolean;
  setupSuccess: boolean;
  setupError: string | null;
  debugInfo: any;
  setupTable: () => Promise<void>;
}

// 클라이언트 컴포넌트 분리
function RestaurantContent(props: RestaurantContentProps) {
  // 클라이언트 사이드에서만 import 
  const { 
    Alert, Button, Card, Collapse, List, Radio, 
    Spin, Tag, Typography, Tabs
  } = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      return {
        Alert: require('antd/lib/alert').default,
        Button: require('antd/lib/button').default,
        Card: require('antd/lib/card').default,
        Collapse: require('antd/lib/collapse').default,
        List: require('antd/lib/list').default,
        Radio: require('antd/lib/radio').default,
        Spin: require('antd/lib/spin').default,
        Tag: require('antd/lib/tag').default,
        Typography: require('antd/lib/typography').default,
        Tabs: require('antd/lib/tabs').default
      };
    }
    return {};
  }, []);

  // Tabs 컴포넌트 로드 확인
  if (!Alert || !Button || !Tabs) return null; 

  const { 
    restaurants, loading, error, isRealData, apiMode, setApiMode,
    selectedCategory, setSelectedCategory, categories,
    fetchData, setupLoading, setupSuccess, setupError, debugInfo, setupTable
  } = props;

  return (
    <>
      {/* 상단 헤더 섹션 */}
      <div className="bg-gray-50 py-6 mb-8 rounded-lg shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">국회 주변 맛집 카테고리</h2>
              <p className="text-gray-600 mb-4">원하시는 카테고리를 선택하여 맛집 정보를 확인하세요</p>
            </div>
            
            {/* 새로고침 버튼 - 헤더 영역으로 이동 */}
            <Button
              onClick={() => fetchData(selectedCategory)}
              loading={loading}
              type="primary"
              icon={<span className="mr-1">🔄</span>}
            >
              새로고침
            </Button>
          </div>
          
          {/* 카테고리 탭 */}
          <Tabs 
            activeKey={selectedCategory} 
            onChange={(key: string) => setSelectedCategory(key)}
            type="card"
            size="large"
            className="custom-tabs"
            items={categories.map(cat => ({ 
              key: cat, 
              label: cat === 'all' ? '전체' : cat,
              className: selectedCategory === cat ? 'font-bold' : ''
            }))}
          />
        </div>
      </div>
      
      {/* 상태 표시 */}
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
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          {Spin && <Spin size="large" tip="데이터를 불러오는 중..." />}
        </div>
      ) : (
        <div className="overflow-x-auto">
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
              renderItem={(item: RestaurantItem) => (
                <List.Item>
                  {Card && (
                    <Card
                      title={
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">{item.name}</span>
                          {item.category && Tag && (
                            <Tag color="blue">{item.category}</Tag>
                          )}
                        </div>
                      }
                      hoverable
                      className="h-full shadow-md hover:shadow-lg transition-shadow"
                      bordered={false}
                    >
                      <p className="mb-2"><strong>위치:</strong> {item.location}</p>
                      {item.pnum && <p className="mb-2"><strong>전화:</strong> {item.pnum}</p>}
                      {item.price && <p className="mb-2"><strong>가격대:</strong> {item.price}</p>}
                      {item.remark && <p className="mb-2"><strong>비고:</strong> {item.remark}</p>}
                      {item.link && (
                        <p className="mt-4">
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 flex items-center"
                          >
                            <span>식당 정보 바로가기</span>
                            <span className="ml-1">→</span>
                          </a>
                        </p>
                      )}
                    </Card>
                  )}
                </List.Item>
              )}
            />
          )}
        </div>
      )}
    </>
  );
}

// SSR 설정
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {} // 초기 props 전달
  };
}; 