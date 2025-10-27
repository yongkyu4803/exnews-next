import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { AnalyticsResponse, TabStats } from '@/types';
import { createLogger } from '@/utils/logger';
import { isAuthenticated, clearAuth, getAuthTimeRemaining } from '@/utils/adminAuth';

const logger = createLogger('Pages:Admin:Analytics');

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
  DynamicAlert,
  DynamicSelect
} from '@/types/antd-dynamic';

const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as DynamicCard;
const Row = dynamic(() => import('antd/lib/row'), { ssr: false }) as DynamicRow;
const Col = dynamic(() => import('antd/lib/col'), { ssr: false }) as DynamicCol;
const Statistic = dynamic(() => import('antd/lib/statistic'), { ssr: false }) as DynamicStatistic;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as DynamicSpace;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as DynamicButton;
const Spin = dynamic(() => import('antd/lib/spin'), { ssr: false }) as DynamicSpin;
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as DynamicAlert;
const Select = dynamic(() => import('antd/lib/select'), { ssr: false }) as DynamicSelect;
const RangePicker = dynamic(() => import('antd/lib/date-picker').then(mod => mod.default.RangePicker), { ssr: false }) as any;

const AdminAnalyticsPage = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [dateRange, setDateRange] = useState<[string?, string?]>([undefined, undefined]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [authTimeLeft, setAuthTimeLeft] = useState<string>('');

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    setIsMounted(true);

    // Update auth time remaining
    const updateAuthTime = () => {
      const remaining = getAuthTimeRemaining();
      if (remaining <= 0) {
        clearAuth();
        router.push('/admin/login');
        return;
      }

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      setAuthTimeLeft(`${hours}시간 ${minutes}분`);
    };

    updateAuthTime();
    const interval = setInterval(updateAuthTime, 60000); // Update every minute

    // 미디어 쿼리 처리
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(max-width: 768px)');
      const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
        setIsMobile(e.matches);
      };

      handleResize(mediaQuery);
      mediaQuery.addEventListener('change', handleResize);

      return () => {
        mediaQuery.removeEventListener('change', handleResize);
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [router]);

  // Fetch analytics stats
  const { data, isLoading, error, refetch } = useQuery<AnalyticsResponse, Error>(
    ['adminAnalyticsStats', dateRange[0], dateRange[1], selectedTab],
    async () => {
      const params = new URLSearchParams();
      if (dateRange[0]) params.append('startDate', dateRange[0]);
      if (dateRange[1]) params.append('endDate', dateRange[1]);
      if (selectedTab !== 'all') params.append('tabName', selectedTab);
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

  const handleLogout = () => {
    clearAuth();
    router.push('/admin/login');
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
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Head>
        <title>관리자 통계 대시보드 - EXNEWS</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Cafe24Anemone', sans-serif", fontSize: isMobile ? '24px' : '32px' }}>
            📊 관리자 통계 대시보드
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
            세션 만료: {authTimeLeft}
          </p>
        </div>
        <Button danger onClick={handleLogout}>
          로그아웃
        </Button>
      </div>

      {/* 필터 및 안내 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f5ff', borderRadius: '4px', border: '1px solid #adc6ff' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1890ff' }}>
            💡 통계 데이터 설명
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
            <li><strong>방문자</strong>: localStorage 기반 고유 ID로 식별된 순수 방문자 수 (중복 제거)</li>
            <li><strong>세션</strong>: 30분 타임아웃 기준, 하나의 방문 단위 (재방문 시 새 세션)</li>
            <li><strong>페이지뷰</strong>: 실제 페이지 로드 횟수 (탭 변경은 별도 카운트)</li>
            <li><strong>날짜 범위</strong>: 특정 기간의 데이터만 필터링 (기본: 전체 기간)</li>
            <li><strong>탭 필터</strong>: 특정 탭의 방문 데이터만 확인 (기본: 전체 탭)</li>
          </ul>
        </div>

        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }} size="middle">
          <div style={{ width: isMobile ? '100%' : 'auto' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
              📅 날짜 범위 (선택 시 해당 기간만 표시)
            </label>
            <RangePicker
              onChange={handleDateRangeChange}
              style={{ width: isMobile ? '100%' : '300px' }}
              placeholder={['시작일', '종료일']}
            />
          </div>

          <div style={{ width: isMobile ? '100%' : 'auto' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
              🔍 탭 필터 (특정 탭만 보기)
            </label>
            <Select
              value={selectedTab}
              onChange={setSelectedTab}
              style={{ width: isMobile ? '100%' : '200px' }}
              options={[
                { value: 'all', label: '전체 탭' },
                { value: 'exclusive', label: '단독 뉴스' },
                { value: 'ranking', label: '랭킹 뉴스' },
                { value: 'editorial', label: '오늘의 사설' },
                { value: 'restaurant', label: '식당' }
              ]}
            />
          </div>

          <div style={{ width: isMobile ? '100%' : 'auto', alignSelf: 'flex-end' }}>
            <Button onClick={() => refetch()} loading={isLoading} type="primary">
              🔄 새로고침
            </Button>
          </div>
        </Space>
      </Card>

      {error && (
        <Alert
          message="오류"
          description={error.message}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
          closable
        />
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : stats ? (
        <>
          {/* 주요 지표 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="총 방문자"
                  value={stats.total_visitors}
                  valueStyle={{ color: '#3f8600', fontSize: isMobile ? '24px' : '32px' }}
                  prefix="👥"
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999', lineHeight: '1.5' }}>
                  고유 visitor_id 기준<br/>
                  (localStorage 저장)
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="총 세션"
                  value={stats.total_sessions}
                  valueStyle={{ color: '#1890ff', fontSize: isMobile ? '24px' : '32px' }}
                  prefix="🔄"
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999', lineHeight: '1.5' }}>
                  30분 이내 활동 = 1세션<br/>
                  (sessionStorage 기준)
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="총 페이지뷰"
                  value={stats.total_pageviews}
                  valueStyle={{ color: '#cf1322', fontSize: isMobile ? '24px' : '32px' }}
                  prefix="📄"
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999', lineHeight: '1.5' }}>
                  event_type='page_view'<br/>
                  카운트 (탭 변경 제외)
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="세션당 페이지뷰"
                  value={stats.total_sessions > 0 ? (stats.total_pageviews / stats.total_sessions).toFixed(2) : 0}
                  valueStyle={{ color: '#722ed1', fontSize: isMobile ? '24px' : '32px' }}
                  prefix="📊"
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999', lineHeight: '1.5' }}>
                  사용자 참여도 지표<br/>
                  (높을수록 많은 페이지 탐색)
                </div>
              </Card>
            </Col>
          </Row>

          {/* 탭별 통계 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24}>
              <Card
                title="📑 탭별 방문 통계"
                extra={
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    총 {stats.tab_stats.reduce((sum, tab) => sum + tab.count, 0)}회
                  </span>
                }
              >
                <div style={{ marginBottom: '12px', padding: '8px', background: '#fffbe6', borderRadius: '4px', fontSize: '12px', color: '#ad6800', border: '1px solid #ffe58f' }}>
                  💡 <strong>tab_name</strong> 필드 기준으로 집계 | 페이지뷰 + 탭변경 이벤트 모두 포함 | 클릭하면 해당 탭만 필터링됩니다
                </div>
                <Row gutter={[16, 16]}>
                  {stats.tab_stats.map((tab: TabStats) => (
                    <Col xs={12} sm={6} key={tab.tab_name}>
                      <Card
                        size="small"
                        style={{
                          background: selectedTab === tab.tab_name ? '#f0f5ff' : '#fafafa',
                          border: selectedTab === tab.tab_name ? '2px solid #1890ff' : '1px solid #d9d9d9',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedTab(tab.tab_name)}
                      >
                        <Statistic
                          title={getTabNameKorean(tab.tab_name)}
                          value={tab.count}
                          suffix={
                            <span style={{ fontSize: '14px', color: '#666' }}>
                              ({tab.percentage}%)
                            </span>
                          }
                          valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>

          {/* 디바이스별 통계 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} md={12}>
              <Card title="📱 디바이스별 통계">
                <div style={{ marginBottom: '12px', padding: '8px', background: '#f6ffed', borderRadius: '4px', fontSize: '12px', color: '#389e0d', border: '1px solid #b7eb8f' }}>
                  💡 <strong>window.innerWidth ≤ 768px</strong> = 모바일 | 그 외 = 데스크톱 | 브라우저 크기 변경 시 재분류
                </div>
                <Row gutter={[16, 16]}>
                  <Col xs={12}>
                    <Statistic
                      title="모바일"
                      value={stats.device_stats.mobile}
                      suffix={
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          ({Math.round((stats.device_stats.mobile / (stats.device_stats.mobile + stats.device_stats.desktop)) * 100)}%)
                        </span>
                      }
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                      iOS, Android 포함
                    </div>
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="데스크톱"
                      value={stats.device_stats.desktop}
                      suffix={
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          ({Math.round((stats.device_stats.desktop / (stats.device_stats.mobile + stats.device_stats.desktop)) * 100)}%)
                        </span>
                      }
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                      PC, 태블릿 포함
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Phase 2: 고급 통계 */}
            {(stats.avg_duration || stats.avg_scroll_depth || stats.bounce_rate !== undefined) && (
              <Col xs={24} md={12}>
                <Card title="📈 고급 지표 (Phase 2)">
                  <div style={{ marginBottom: '12px', padding: '8px', background: '#fff1f0', borderRadius: '4px', fontSize: '12px', color: '#cf1322', border: '1px solid #ffccc7' }}>
                    ⚠️ Phase 2 기능 | 현재 데이터 수집 중이 아님 | 구현 후 활성화 예정
                  </div>
                  <Row gutter={[16, 16]}>
                    {stats.avg_duration && (
                      <Col xs={8}>
                        <Statistic
                          title="평균 체류시간"
                          value={stats.avg_duration}
                          suffix="초"
                          valueStyle={{ fontSize: '18px' }}
                        />
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                          페이지 진입~이탈
                        </div>
                      </Col>
                    )}
                    {stats.avg_scroll_depth && (
                      <Col xs={8}>
                        <Statistic
                          title="평균 스크롤"
                          value={stats.avg_scroll_depth}
                          suffix="%"
                          valueStyle={{ fontSize: '18px' }}
                        />
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                          페이지 스크롤 깊이
                        </div>
                      </Col>
                    )}
                    {stats.bounce_rate !== undefined && (
                      <Col xs={8}>
                        <Statistic
                          title="이탈률"
                          value={stats.bounce_rate}
                          suffix="%"
                          valueStyle={{ fontSize: '18px' }}
                        />
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                          1페이지만 보고 나감
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card>
              </Col>
            )}
          </Row>

          {/* 트렌드 데이터 (있는 경우) */}
          {data?.trend && data.trend.length > 0 && (
            <Card title="📅 일별 트렌드">
              <div style={{ marginBottom: '16px', padding: '8px', background: '#e6f7ff', borderRadius: '4px', fontSize: '12px', color: '#0050b3', border: '1px solid #91d5ff' }}>
                💡 선택한 날짜 범위 내 일별 통계 | <strong>created_at</strong> 기준으로 날짜별 그룹화 | 트렌드 분석 및 비교에 활용
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>📆 날짜</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>👥 방문자</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>🔄 세션</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>📄 페이지뷰</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trend.map((item, index) => (
                      <tr
                        key={item.date}
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          background: index % 2 === 0 ? 'white' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '12px', fontWeight: '500' }}>{item.date}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#3f8600' }}>{item.total_visitors}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#1890ff' }}>{item.total_sessions}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#cf1322' }}>{item.total_pageviews}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #f0f0f0', background: '#fafafa', fontWeight: '600' }}>
                      <td style={{ padding: '12px' }}>📊 합계</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#3f8600' }}>
                        {data.trend.reduce((sum, item) => sum + item.total_visitors, 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#1890ff' }}>
                        {data.trend.reduce((sum, item) => sum + item.total_sessions, 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#cf1322' }}>
                        {data.trend.reduce((sum, item) => sum + item.total_pageviews, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <p style={{ textAlign: 'center', color: '#999' }}>통계 데이터가 없습니다.</p>
        </Card>
      )}
    </div>
  );
};

// Helper function to get Korean tab name
function getTabNameKorean(tabName: string): string {
  const tabNames: Record<string, string> = {
    'exclusive': '🚨 단독 뉴스',
    'ranking': '🔥 랭킹 뉴스',
    'editorial': '📰 오늘의 사설',
    'restaurant': '🍽️ 식당'
  };
  return tabNames[tabName] || tabName;
}

export default dynamic(() => Promise.resolve(AdminAnalyticsPage), { ssr: false });
