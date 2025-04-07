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
  
  // 데이터 로드 함수
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      console.log('식당 데이터 요청 시작...');
      
      // API 모드에 따라 쿼리 파라미터 조정
      let url = '/api/restaurants';
      if (apiMode === 'sample') {
        url += '?debug=sample';
      } else if (apiMode === 'direct') {
        // 직접 API 호출 테스트는 별도 함수로 처리
        await fetchDirectApiCall();
        return;
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
      setIsRealData(data.source !== 'sample-fallback');
      
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
      console.log('Supabase URL:', supabaseUrl);
      
      // 테이블 목록 확인
      try {
        const { data: tableList, error: tableListError } = await supabase
          .from('_tables')
          .select('*');
        
        console.log('가능한 테이블 목록:', tableList || '조회 실패', tableListError);
      } catch (tableErr) {
        console.log('테이블 목록 조회 오류:', tableErr);
      }
      
      // 다양한 테이블명 시도
      const tableNames = ['na-res', 'na_res', 'nares', 'restaurants'];
      let foundTable = false;
      let tableData = null;
      let tableError = null;
      
      for (const tableName of tableNames) {
        console.log(`테이블 '${tableName}' 확인 중...`);
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select('id', { count: 'exact', head: true });
        
        if (!testError) {
          console.log(`테이블 '${tableName}' 존재함!`);
          foundTable = true;
          tableData = testData;
          
          // 이 테이블에서 데이터 조회
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' });
          
          console.log(`'${tableName}' 데이터 조회 결과:`, error ? '오류 발생' : `${count}개 항목 조회됨`);
          console.log('조회된 데이터:', data);
          
          if (!error && data) {
            setRestaurants(data);
            setIsRealData(true);
            setDebugInfo({
              tableName,
              count,
              supabaseConnected: true,
              dataFound: data?.length > 0,
              rawData: data,
              columns: data && data.length > 0 ? Object.keys(data[0]) : []
            });
            setLoading(false);
            return;
          }
        }
      }
      
      // 테이블 존재 확인
      const { data: testData, error: testError } = await supabase
        .from('na-res')
        .select('id', { count: 'exact', head: true });
      
      console.log('테이블 확인 결과:', testError ? '테이블 없음' : '테이블 존재');
      console.log('테이블 확인 세부 정보:', { testData, testError });
      
      if (testError) {
        // 테이블 없음 오류 처리
        setDebugInfo({
          error: testError,
          message: '테이블이 존재하지 않습니다.',
          supabaseConnected: true
        });
        setError('테이블이 존재하지 않습니다. 관리자에게 문의하세요.');
        setIsRealData(false);
        setRestaurants([]);
        return;
      }
      
      // 실제 데이터 조회
      const { data, error, count } = await supabase
        .from('na-res')
        .select('*', { count: 'exact' });
      
      console.log('데이터 조회 결과:', error ? '오류 발생' : `${count}개 항목 조회됨`);
      console.log('조회된 데이터:', data);
      console.log('데이터 조회 오류:', error);
      
      if (error) {
        setDebugInfo({
          error,
          message: '데이터 조회 중 오류가 발생했습니다.',
          supabaseConnected: true
        });
        setError(`데이터 조회 오류: ${error.message}`);
        setIsRealData(false);
        setRestaurants([]);
      } else {
        // 데이터 성공적으로 가져옴
        setRestaurants(data || []);
        setIsRealData(true);
        setDebugInfo({
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
    // 데이터 로드
    fetchData();
  }, [apiMode]);

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
          <h1 className="text-3xl font-bold mb-6">국회 주변 맛집</h1>

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
  fetchData: () => Promise<void>;
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
    Spin, Tag, Typography 
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
        Typography: require('antd/lib/typography').default
      };
    }
    return {};
  }, []);

  if (!Alert || !Radio || !Button) return null;

  const { 
    restaurants, loading, error, isRealData, apiMode, setApiMode,
    fetchData, setupLoading, setupSuccess, setupError, debugInfo, setupTable
  } = props;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Radio.Group 
            value={apiMode} 
            onChange={(e: any) => {
              if (e.target) {
                setApiMode(e.target.value);
              }
            }}
            buttonStyle="solid"
          >
            <Radio.Button value="normal">기본 모드</Radio.Button>
            <Radio.Button value="sample">샘플 데이터</Radio.Button>
            <Radio.Button value="direct">직접 API</Radio.Button>
          </Radio.Group>
          
          <Button 
            type="primary" 
            onClick={fetchData}
            loading={loading}
          >
            새로고침
          </Button>
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
      
      {/* 디버그 정보 */}
      {debugInfo && Collapse && (
        <Collapse className="mb-4">
          <Collapse.Panel header="디버깅 정보" key="1">
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </Collapse.Panel>
        </Collapse>
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
                gutter: 16,
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
                          <span>{item.name}</span>
                          {item.category && Tag && (
                            <Tag color="blue">{item.category}</Tag>
                          )}
                        </div>
                      }
                      hoverable
                    >
                      <p><strong>위치:</strong> {item.location}</p>
                      {item.pnum && <p><strong>전화:</strong> {item.pnum}</p>}
                      {item.price && <p><strong>가격대:</strong> {item.price}</p>}
                      {item.remark && <p><strong>비고:</strong> {item.remark}</p>}
                      {item.link && (
                        <p>
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            식당 정보 바로가기
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