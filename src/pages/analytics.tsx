import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { AnalyticsResponse, TabStats } from '@/types';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Pages:Analytics');

// Dynamic imports for Ant Design components
import type {
  DynamicCard,
  DynamicRow,
  DynamicCol,
  DynamicStatistic,
  DynamicDatePicker,
  DynamicSpace,
  DynamicButton,
  DynamicSpin,
  DynamicAlert
} from '@/types/antd-dynamic';

const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as DynamicCard;
const Row = dynamic(() => import('antd/lib/row'), { ssr: false }) as DynamicRow;
const Col = dynamic(() => import('antd/lib/col'), { ssr: false }) as DynamicCol;
const Statistic = dynamic(() => import('antd/lib/statistic'), { ssr: false }) as DynamicStatistic;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as DynamicSpace;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as DynamicButton;
const Spin = dynamic(() => import('antd/lib/spin'), { ssr: false }) as DynamicSpin;
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as DynamicAlert;
const RangePicker = dynamic(() => import('antd/lib/date-picker').then(mod => mod.default.RangePicker), { ssr: false }) as any;

const AnalyticsPage = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [dateRange, setDateRange] = useState<[string?, string?]>([undefined, undefined]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 미디어 쿼리 처리
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(max-width: 768px)');
      const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
        setIsMobile(e.matches);
      };

      handleResize(mediaQuery);
      mediaQuery.addEventListener('change', handleResize);

      return () => mediaQuery.removeEventListener('change', handleResize);
    }
  }, []);

  // Fetch analytics stats
  const { data, isLoading, error, refetch } = useQuery<AnalyticsResponse, Error>(
    ['analyticsStats', dateRange[0], dateRange[1]],
    async () => {
      const params = new URLSearchParams();
      if (dateRange[0]) params.append('startDate', dateRange[0]);
      if (dateRange[1]) params.append('endDate', dateRange[1]);
      params.append('trend', 'true');

      const response = await fetch(`/api/analytics/stats?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics data');
      }
      return response.json();
    },
    {
      enabled: isMounted,
      retry: 2,
      refetchOnWindowFocus: true, // 탭 전환 시 자동 업데이트
      refetchInterval: 30000, // 30초마다 자동 새로고침
      staleTime: 10000, // 10초 후 데이터를 stale로 간주
      cacheTime: 60000, // 1분 동안 캐시 유지
      onError: (error) => {
        logger.error('Failed to fetch analytics stats', error);
      }
    }
  );

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      setDateRange([dateStrings[0], dateStrings[1]]);
    } else {
      setDateRange([undefined, undefined]);
    }
  };

  if (!isMounted) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>방문자 통계 - NEWS-GQAI</title>
        <meta name="description" content="NEWS-GQAI 방문자 통계 대시보드" />
      </Head>

      <h1 style={{ marginBottom: '24px', fontFamily: "'Cafe24Anemone', sans-serif" }}>
        📊 방문자 통계
      </h1>

      <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <RangePicker
            onChange={handleDateRangeChange}
            style={{ width: isMobile ? '100%' : 'auto' }}
          />
          <Button onClick={() => refetch()} loading={isLoading}>
            새로고침
          </Button>
        </div>

        {error && (
          <Alert
            message="오류"
            description={error.message}
            type="error"
            showIcon
          />
        )}
      </Space>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : stats ? (
        <>
          {/* 기본 통계 카드 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="총 방문자"
                  value={stats.total_visitors}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="총 세션"
                  value={stats.total_sessions}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="총 페이지뷰"
                  value={stats.total_pageviews}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 탭별 통계 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card title="탭별 방문 통계">
                <Row gutter={[16, 16]}>
                  {stats.tab_stats.map((tab: TabStats) => (
                    <Col xs={12} sm={6} key={tab.tab_name}>
                      <Statistic
                        title={getTabNameKorean(tab.tab_name)}
                        value={tab.count}
                        suffix={`(${tab.percentage}%)`}
                      />
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>

          {/* 디바이스별 통계 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="모바일"
                  value={stats.device_stats.mobile}
                  suffix={`(${Math.round((stats.device_stats.mobile / (stats.device_stats.mobile + stats.device_stats.desktop)) * 100)}%)`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="데스크톱"
                  value={stats.device_stats.desktop}
                  suffix={`(${Math.round((stats.device_stats.desktop / (stats.device_stats.mobile + stats.device_stats.desktop)) * 100)}%)`}
                />
              </Card>
            </Col>
          </Row>

          {/* Phase 2: 고급 통계 (데이터가 있는 경우만 표시) */}
          {(stats.avg_duration || stats.avg_scroll_depth || stats.bounce_rate !== undefined) && (
            <Row gutter={[16, 16]}>
              {stats.avg_duration && (
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="평균 체류시간"
                      value={stats.avg_duration}
                      suffix="초"
                    />
                  </Card>
                </Col>
              )}
              {stats.avg_scroll_depth && (
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="평균 스크롤 깊이"
                      value={stats.avg_scroll_depth}
                      suffix="%"
                    />
                  </Card>
                </Col>
              )}
              {stats.bounce_rate !== undefined && (
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="이탈률"
                      value={stats.bounce_rate}
                      suffix="%"
                    />
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </>
      ) : (
        <Card>
          <p>통계 데이터가 없습니다.</p>
        </Card>
      )}
    </div>
  );
};

// Helper function to get Korean tab name
function getTabNameKorean(tabName: string): string {
  const tabNames: Record<string, string> = {
    'exclusive': '단독 뉴스',
    'ranking': '랭킹 뉴스',
    'editorial': '오늘의 사설',
    'restaurant': '식당'
  };
  return tabNames[tabName] || tabName;
}

export default dynamic(() => Promise.resolve(AnalyticsPage), { ssr: false });
