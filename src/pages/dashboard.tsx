import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import {
  FileTextOutlined,
  FireOutlined,
  FileProtectOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import TopNavBar from '@/components/mobile/TopNavBar';
import StatsCard from '@/components/Dashboard/Widgets/StatsCard';
import CategoryFilter from '@/components/Dashboard/Widgets/CategoryFilter';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Pages:Dashboard');

const DashboardPage = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const activeTab: string = 'home'; // 대시보드는 항상 home 탭
  const [activeCategory, setActiveCategory] = useState('all');
  const [randomRankingIndices, setRandomRankingIndices] = useState<number[]>([]);
  const [randomBillIndex, setRandomBillIndex] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    async () => {
      const [newsRes, rankingRes, editorialRes, billsRes] = await Promise.all([
        fetch('/api/news?page=1&pageSize=1'),
        fetch('/api/ranking-news?page=1&pageSize=1'),
        fetch('/api/editorials?landing=true'),
        fetch('/api/bills?landing=true'),
      ]);

      const [newsData, rankingData, editorialData, billsData] = await Promise.all([
        newsRes.json(),
        rankingRes.json(),
        editorialRes.json(),
        billsRes.json(),
      ]);

      return {
        news: newsData.totalCount || 0,
        ranking: rankingData.totalCount || 0,
        editorial: editorialData.totalCount || 0,
        bills: billsData.totalCount || 0,
      };
    },
    {
      enabled: isMounted,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Fetch news by category (for home and exclusive tabs)
  const { data: newsData, isLoading: newsLoading } = useQuery(
    ['dashboard-news', activeCategory, activeTab],
    async () => {
      const categoryParam = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
      const response = await fetch(`/api/news?page=1&pageSize=20${categoryParam}`);
      return response.json();
    },
    {
      enabled: isMounted && (activeTab === 'home' || activeTab === 'exclusive'),
      staleTime: 1 * 60 * 1000,
    }
  );

  // Fetch ranking news
  const { data: rankingData, isLoading: rankingLoading } = useQuery(
    'dashboard-ranking',
    async () => {
      const response = await fetch('/api/ranking-news?page=1&pageSize=20');
      return response.json();
    },
    {
      enabled: isMounted && (activeTab === 'home' || activeTab === 'ranking'),
      staleTime: 1 * 60 * 1000,
    }
  );

  // 랭킹뉴스 랜덤 로테이션 (5초마다)
  useEffect(() => {
    if (!rankingData?.items || rankingData.items.length === 0) return;

    const getRandomIndices = () => {
      const totalItems = rankingData.items.length;
      const indices: number[] = [];
      const used = new Set<number>();

      while (indices.length < Math.min(4, totalItems)) {
        const randomIndex = Math.floor(Math.random() * totalItems);
        if (!used.has(randomIndex)) {
          indices.push(randomIndex);
          used.add(randomIndex);
        }
      }

      return indices;
    };

    // 초기 랜덤 인덱스 설정
    setRandomRankingIndices(getRandomIndices());

    // 5초마다 랜덤 인덱스 갱신
    const interval = setInterval(() => {
      setRandomRankingIndices(getRandomIndices());
    }, 5000);

    return () => clearInterval(interval);
  }, [rankingData?.items]);

  // Fetch editorials
  const { data: editorialData, isLoading: editorialLoading } = useQuery(
    'dashboard-editorials',
    async () => {
      const response = await fetch('/api/editorials?page=1&pageSize=20');
      return response.json();
    },
    {
      enabled: isMounted && (activeTab === 'home' || activeTab === 'editorial'),
      staleTime: 1 * 60 * 1000,
    }
  );

  // Fetch political reports
  const { data: politicalData, isLoading: politicalLoading } = useQuery(
    'dashboard-political',
    async () => {
      const response = await fetch('/api/political-reports?page=1&pageSize=20');
      return response.json();
    },
    {
      enabled: isMounted && (activeTab === 'home' || activeTab === 'political'),
      staleTime: 1 * 60 * 1000,
    }
  );

  // Fetch bills (landing mode for dashboard)
  const { data: billsData, isLoading: billsLoading } = useQuery(
    'dashboard-bills',
    async () => {
      const response = await fetch('/api/bills?landing=true');
      return response.json();
    },
    {
      enabled: isMounted && (activeTab === 'home' || activeTab === 'bills'),
      staleTime: 1 * 60 * 1000,
    }
  );

  // 법안 랜덤 로테이션 (5초마다)
  useEffect(() => {
    const bills = billsData?.latest?.bills;
    if (!bills || bills.length === 0) return;

    const getRandomIndex = () => {
      return Math.floor(Math.random() * bills.length);
    };

    // 초기 랜덤 인덱스 설정
    setRandomBillIndex(getRandomIndex());

    // 5초마다 랜덤 인덱스 갱신
    const interval = setInterval(() => {
      setRandomBillIndex(getRandomIndex());
    }, 5000);

    return () => clearInterval(interval);
  }, [billsData?.latest?.bills?.length]);

  // Fetch restaurants
  const { data: restaurantData, isLoading: restaurantLoading } = useQuery(
    'dashboard-restaurants',
    async () => {
      const response = await fetch('/api/restaurants?page=1&pageSize=20');
      return response.json();
    },
    {
      enabled: isMounted && (activeTab === 'home' || activeTab === 'restaurant'),
      staleTime: 1 * 60 * 1000,
    }
  );

  const categories = [
    { key: 'all', label: '전체', count: stats?.news || 0 },
    { key: '정치', label: '정치' },
    { key: '경제', label: '경제' },
    { key: '사회', label: '사회' },
    { key: '국제', label: '국제' },
    { key: '문화', label: '문화' },
    { key: '연예/스포츠', label: '연예/스포츠' },
    { key: '기타', label: '기타' },
  ];

  // Left Panel
  const leftPanel = (
    <>
      <StatsCard
        title="단독 뉴스"
        value={stats?.news || 0}
        trend="up"
        change={12}
        icon={<FileTextOutlined />}
        color="#1a4b8c"
      />
      <StatsCard
        title="랭킹 뉴스"
        value={stats?.ranking || 0}
        trend="stable"
        change={0}
        icon={<FireOutlined />}
        color="#ff6b35"
      />
      <StatsCard
        title="사설 분석"
        value={stats?.editorial || 0}
        trend="up"
        change={3}
        icon={<FileProtectOutlined />}
        color="#06d6a0"
      />
      <StatsCard
        title="법안 모니터링"
        value={stats?.bills || 0}
        trend="down"
        change={5}
        icon={<BarChartOutlined />}
        color="#2d5aa0"
      />

      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    </>
  );

  // Render content based on active tab
  const renderMainContent = () => {
    const containerStyle = {
      background: 'var(--gqai-bg-card)',
      borderRadius: 'var(--gqai-radius-lg)',
      boxShadow: 'var(--gqai-shadow-sm)',
      padding: 'var(--gqai-space-lg)',
      minHeight: '600px',
    };

    const titleStyle = {
      fontSize: 24,
      fontWeight: 700,
      color: 'var(--gqai-text-primary)',
      marginBottom: 'var(--gqai-space-lg)',
      fontFamily: 'var(--gqai-font-display)',
    };

    switch (activeTab) {
      case 'exclusive':
        return (
          <div style={containerStyle}>
            <h2 style={{
              ...titleStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <img
                src="/icons/icon-exnews.png"
                alt="단독"
                style={{ width: 42, height: 42, objectFit: 'contain' }}
              />
              단독 뉴스
            </h2>
            {newsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-secondary)' }}>
                로딩 중...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gqai-space-md)' }}>
                {newsData?.items?.map((item: any, index: number) => renderNewsCard(item, index))}
              </div>
            )}
          </div>
        );

      case 'ranking':
        return (
          <div style={containerStyle}>
            <h2 style={{
              ...titleStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <img
                src="/icons/icon-lankingnews.png"
                alt="랭킹"
                style={{ width: 42, height: 42, objectFit: 'contain' }}
              />
              랭킹 뉴스
            </h2>
            {rankingLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-secondary)' }}>
                로딩 중...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gqai-space-md)' }}>
                {rankingData?.items?.map((item: any, index: number) => renderRankingCard(item, index))}
              </div>
            )}
          </div>
        );

      case 'editorial':
        return (
          <div style={containerStyle}>
            <h2 style={titleStyle}>📰 사설 분석</h2>
            {editorialLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-secondary)' }}>
                로딩 중...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gqai-space-md)' }}>
                {editorialData?.items?.map((item: any, index: number) => renderEditorialCard(item, index))}
              </div>
            )}
          </div>
        );

      case 'political':
        return (
          <div style={containerStyle}>
            <h2 style={titleStyle}>🏛️ 정치 브리핑</h2>
            {politicalLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-secondary)' }}>
                로딩 중...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gqai-space-md)' }}>
                {politicalData?.reports?.map((item: any, index: number) => renderPoliticalCard(item, index))}
              </div>
            )}
          </div>
        );

      case 'bills':
        return (
          <div style={containerStyle}>
            <h2 style={titleStyle}>⚖️ 법안 모니터링</h2>
            {billsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-secondary)' }}>
                로딩 중...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gqai-space-md)' }}>
                {billsData?.data?.map((item: any, index: number) => renderBillCard(item, index))}
              </div>
            )}
          </div>
        );

      case 'restaurant':
        return (
          <div style={containerStyle}>
            <h2 style={titleStyle}>🍽️ 레스토랑 정보</h2>
            {restaurantLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-secondary)' }}>
                로딩 중...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gqai-space-md)' }}>
                {restaurantData?.restaurants?.map((item: any, index: number) => renderRestaurantCard(item, index))}
              </div>
            )}
          </div>
        );

      default: // home - 종합 대시보드
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 메인 그리드 - 4/6 레이아웃 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '4fr 6fr',
              gridTemplateRows: 'auto auto',
              gap: 20,
            }}>
              {/* 첫 번째 열 - 오늘의 법안 (4칼럼, 2행 병합) */}
              <div style={{
                gridRow: '1 / 3',
                ...containerStyle,
                padding: 'var(--gqai-space-lg)',
                minHeight: 'auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <h3 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--gqai-text-primary)',
                    margin: 0,
                  }}>
                    ⚖️ 어제 발의된 법안
                  </h3>
                  <button
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#6b7280',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e5e7eb';
                      e.currentTarget.style.color = '#374151';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                    onClick={() => router.push('/?tab=bills')}
                  >
                    이전 리포트 →
                  </button>
                </div>
                {billsLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-tertiary)' }}>
                    로딩 중...
                  </div>
                ) : billsData?.latest ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    {/* 최신 리포트 미리보기 */}
                    <div
                      style={{
                        padding: 9,
                        borderRadius: 'var(--gqai-radius-lg)',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '2px solid #10b981',
                        cursor: 'pointer',
                        transition: 'all var(--gqai-transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onClick={() => router.push(`/bills/${billsData.latest.slug}`)}
                    >
                      {/* 날짜와 법안 건수 */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 9,
                      }}>
                        <div style={{
                          fontSize: 15,
                          color: '#047857',
                          fontWeight: 700,
                        }}>
                          📅 {new Date(billsData.latest.report_date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} ({billsData.latest.total_bills}건)
                        </div>
                        <button
                          style={{
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#6b7280',
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e5e7eb';
                            e.currentTarget.style.color = '#374151';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                          onClick={() => router.push(`/bills/${billsData.latest.slug}`)}
                        >
                          전체보기 →
                        </button>
                      </div>

                      {/* 주요 동향 태그 */}
                      {billsData.latest.key_trends && billsData.latest.key_trends.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 5,
                          marginTop: 2,
                        }}>
                          {billsData.latest.key_trends.map((trend: string, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: 14,
                                color: '#1f2937',
                                background: 'white',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                fontWeight: 500,
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                                lineHeight: 1.6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <span style={{
                                fontSize: 8,
                                color: '#10b981',
                                opacity: 0.4,
                              }}>●</span>
                              {trend}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 랜덤 법안 표시 */}
                      {billsData.latest.bills && billsData.latest.bills.length > 0 && (() => {
                        const randomBill = billsData.latest.bills[randomBillIndex];
                        if (!randomBill) return null;

                        return (
                          <div style={{
                            marginTop: 10,
                            padding: 8,
                            background: 'white',
                            borderRadius: 'var(--gqai-radius-md)',
                            border: '2px solid #d1fae5',
                            cursor: 'pointer',
                            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
                            opacity: 1,
                            minHeight: '180px',
                            maxHeight: '180px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                          onClick={() => {
                            if (randomBill.link_url) {
                              window.open(randomBill.link_url, '_blank');
                            }
                          }}
                          >
                            {/* 법안명과 규제 배지 */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 4,
                              marginBottom: 6,
                            }}>
                              <span style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#047857',
                                flex: 1,
                                lineHeight: 1.5,
                              }}>
                                {randomBill.bill_name}
                              </span>
                              {randomBill.regulation_type && (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: 'var(--gqai-radius-sm)',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  background: randomBill.regulation_type === '신설' ? '#fef2f2' :
                                              randomBill.regulation_type === '강화' ? '#fffbeb' :
                                              randomBill.regulation_type === '완화' ? '#f0fdf4' : '#f9fafb',
                                  color: randomBill.regulation_type === '신설' ? '#dc2626' :
                                         randomBill.regulation_type === '강화' ? '#d97706' :
                                         randomBill.regulation_type === '완화' ? '#16a34a' : '#6b7280',
                                  border: `1px solid ${
                                    randomBill.regulation_type === '신설' ? '#fecaca' :
                                    randomBill.regulation_type === '강화' ? '#fde68a' :
                                    randomBill.regulation_type === '완화' ? '#bbf7d0' : '#e5e7eb'
                                  }`,
                                }}>
                                  {randomBill.regulation_type}
                                </span>
                              )}
                            </div>

                            {/* 메타 정보 */}
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 5,
                              marginBottom: 5,
                              fontSize: 11,
                              color: '#059669',
                            }}>
                              {randomBill.committee && (
                                <span>🏛️ {randomBill.committee}</span>
                              )}
                              {randomBill.proposer && (
                                <span>👤 {randomBill.proposer}</span>
                              )}
                              {randomBill.proposal_date && (
                                <span>📅 {randomBill.proposal_date}</span>
                              )}
                            </div>

                            {/* 한줄 요약 */}
                            {randomBill.summary_one_sentence && (
                              <div style={{
                                fontSize: 12,
                                color: '#065f46',
                                lineHeight: 1.6,
                                background: '#f0fdf4',
                                padding: 10,
                                borderRadius: 'var(--gqai-radius-sm)',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                flex: 1,
                              }}>
                                📝 {randomBill.summary_one_sentence}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* "이 법안 언제 통과될까?" 배너 */}
                    <div style={{
                      marginTop: 16,
                      width: '100%',
                      borderRadius: 'var(--gqai-radius-md)',
                      overflow: 'hidden',
                    }}>
                      <img
                        src="/when_bill.png"
                        alt="이 법안 언제 통과될까?"
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-tertiary)' }}>
                    법안 리포트가 없습니다
                  </div>
                )}
              </div>

              {/* 오른쪽 영역 전체를 감싸는 컨테이너 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 첫 번째 행 - 오늘의 정치 (최신 1개만 표시) */}
                <div style={{
                  ...containerStyle,
                  padding: 'var(--gqai-space-lg)',
                  minHeight: 280,
                }}>
                  <h3 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--gqai-text-primary)',
                    margin: 0,
                    marginBottom: 16,
                  }}>
                    🏛️ 오늘의 정치
                  </h3>
                  {politicalLoading ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--gqai-text-tertiary)' }}>
                      로딩 중...
                    </div>
                  ) : politicalData?.reports?.[0] ? (
                    <div>
                      {/* 최신 리포트 1개만 표시 */}
                      {renderCompactPoliticalCard(politicalData.reports[0], 0)}

                      {/* 이전 리포트 보러가기 버튼 */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                        <button
                          onClick={() => router.push('/?tab=political')}
                          style={{
                            padding: '4px 10px',
                            background: '#f3f4f6',
                            color: '#6b7280',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e5e7eb';
                            e.currentTarget.style.color = '#374151';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          이전 리포트 →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-tertiary)' }}>
                      정치 리포트가 없습니다
                    </div>
                  )}
                </div>

                {/* 배너 영역 */}
                <a
                  href="https://gqai.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    width: '100%',
                    margin: '8px 0',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src="/GQAIKR.png"
                    alt="공공부문 생성형AI 학습플랫폼 GQAI.kr"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: '12px',
                    }}
                  />
                </a>

                {/* 두 번째 행 - 3칼럼 (단독뉴스 | 랭킹뉴스 | 사설) */}
                <div style={{ display: 'grid', gridTemplateColumns: '4fr 4fr 2fr', gap: 20 }}>
                  {/* 단독 뉴스 (4개) */}
                  <div style={{
                    ...containerStyle,
                    padding: 'var(--gqai-space-md)',
                    minHeight: 'auto',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                      <h3 style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--gqai-text-primary)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <img
                          src="/icons/icon-exnews.png"
                          alt="단독"
                          style={{ width: 32, height: 32, objectFit: 'contain' }}
                        />
                        단독 뉴스
                      </h3>
                      <button
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          color: 'var(--gqai-primary)',
                          background: 'transparent',
                          border: '1px solid var(--gqai-border)',
                          borderRadius: 'var(--gqai-radius-sm)',
                          cursor: 'pointer',
                          letterSpacing: '-2px',
                        }}
                        onClick={() => router.push('/?tab=exclusive')}
                      >
                        ▶
                      </button>
                    </div>
                    {newsLoading ? (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--gqai-text-tertiary)' }}>
                        로딩 중...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {newsData?.items?.slice(0, 4).map((item: any, index: number) =>
                          renderCompactNewsCard(item, index)
                        )}
                      </div>
                    )}
                  </div>

                  {/* 랭킹 뉴스 (4개) */}
                  <div style={{
                    ...containerStyle,
                    padding: 'var(--gqai-space-md)',
                    minHeight: 'auto',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                      <h3 style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--gqai-text-primary)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <img
                          src="/icons/icon-lankingnews.png"
                          alt="랭킹"
                          style={{ width: 32, height: 32, objectFit: 'contain' }}
                        />
                        랭킹 뉴스
                      </h3>
                      <button
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          color: 'var(--gqai-primary)',
                          background: 'transparent',
                          border: '1px solid var(--gqai-border)',
                          borderRadius: 'var(--gqai-radius-sm)',
                          cursor: 'pointer',
                          letterSpacing: '-2px',
                        }}
                        onClick={() => router.push('/?tab=ranking')}
                      >
                        ▶
                      </button>
                    </div>
                    {rankingLoading ? (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--gqai-text-tertiary)' }}>
                        로딩 중...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {randomRankingIndices.slice(0, 4).map((randomIndex: number, displayIndex: number) => {
                          const item = rankingData?.items?.[randomIndex];
                          return item ? renderCompactRankingCard(item, displayIndex) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* 오늘의 사설 (2개) */}
                  <div style={{
                    ...containerStyle,
                    padding: 'var(--gqai-space-md)',
                    minHeight: 'auto',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                      <h3 style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--gqai-text-primary)',
                        margin: 0,
                      }}>
                        📰 오늘의 사설
                      </h3>
                      <button
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          color: 'var(--gqai-primary)',
                          background: 'transparent',
                          border: '1px solid var(--gqai-border)',
                          borderRadius: 'var(--gqai-radius-sm)',
                          cursor: 'pointer',
                          letterSpacing: '-2px',
                        }}
                        onClick={() => router.push('/?tab=editorial')}
                      >
                        ▶
                      </button>
                    </div>
                    {editorialLoading ? (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--gqai-text-tertiary)' }}>
                        로딩 중...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {editorialData?.items?.slice(0, 2).map((item: any, index: number) =>
                          renderCompactEditorialCard(item, index)
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 세 번째 행 - 인사이트 & 트렌딩 토픽 (3/3 레이아웃) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              marginTop: 20,
            }}>
              {/* 인사이트 (3칼럼) */}
              <div style={{
                background: 'var(--gqai-bg-card)',
                borderRadius: 'var(--gqai-radius-lg)',
                boxShadow: 'var(--gqai-shadow-sm)',
                padding: 'var(--gqai-space-lg)',
              }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--gqai-text-primary)',
                  marginBottom: 'var(--gqai-space-md)',
                  fontFamily: 'var(--gqai-font-display)',
                }}>
                  🤖 GQAI 인사이트
                </h3>
                <div style={{
                  padding: 'var(--gqai-space-md)',
                  borderRadius: 'var(--gqai-radius-md)',
                  backgroundColor: 'var(--gqai-bg-main)',
                }}>
                  <p style={{ fontSize: 14, color: 'var(--gqai-text-secondary)', lineHeight: 1.6 }}>
                    오늘의 주요 정책 트렌드를 분석 중입니다...
                  </p>
                </div>
              </div>

              {/* 트렌딩 토픽 (3칼럼) */}
              <div style={{
                background: 'var(--gqai-bg-card)',
                borderRadius: 'var(--gqai-radius-lg)',
                boxShadow: 'var(--gqai-shadow-sm)',
                padding: 'var(--gqai-space-lg)',
              }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--gqai-text-primary)',
                  marginBottom: 'var(--gqai-space-md)',
                  fontFamily: 'var(--gqai-font-display)',
                }}>
                  🔥 트렌딩 토픽
                </h3>
                <div style={{
                  padding: 'var(--gqai-space-md)',
                  borderRadius: 'var(--gqai-radius-md)',
                  backgroundColor: 'var(--gqai-bg-main)',
                }}>
                  <p style={{ fontSize: 14, color: 'var(--gqai-text-secondary)', lineHeight: 1.6 }}>
                    인기 토픽을 집계 중입니다...
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // Render news card
  const renderNewsCard = (item: any, index: number) => (
    <div
      key={item.id || index}
      style={{
        padding: 'var(--gqai-space-md)',
        borderRadius: 'var(--gqai-radius-md)',
        border: '1px solid var(--gqai-border-light)',
        transition: 'all var(--gqai-transition-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-primary)';
        e.currentTarget.style.boxShadow = 'var(--gqai-shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={() => window.open(item.original_link, '_blank')}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gqai-space-sm)',
        marginBottom: 'var(--gqai-space-sm)',
      }}>
        <span style={{
          padding: '2px 8px',
          borderRadius: 'var(--gqai-radius-sm)',
          fontSize: 12,
          fontWeight: 600,
          color: 'white',
          backgroundColor: 'var(--gqai-accent)',
        }}>
          {item.category}
        </span>
        <span style={{ fontSize: 13, color: 'var(--gqai-text-secondary)' }}>
          {item.media_name || '출처 미상'}
        </span>
        <span style={{ fontSize: 12, color: 'var(--gqai-text-tertiary)' }}>
          {new Date(item.pub_date).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--gqai-text-primary)',
        marginBottom: 'var(--gqai-space-xs)',
        lineHeight: 1.5,
      }}>
        {item.title}
      </h3>
      {item.description && (
        <p style={{
          fontSize: 14,
          color: 'var(--gqai-text-secondary)',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}>
          {item.description}
        </p>
      )}
    </div>
  );

  // Render ranking card
  const renderRankingCard = (item: any, index: number) => (
    <div
      key={item.id || index}
      style={{
        padding: 'var(--gqai-space-md)',
        borderRadius: 'var(--gqai-radius-md)',
        border: '1px solid var(--gqai-border-light)',
        transition: 'all var(--gqai-transition-fast)',
        cursor: 'pointer',
        display: 'flex',
        gap: 'var(--gqai-space-md)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-primary)';
        e.currentTarget.style.boxShadow = 'var(--gqai-shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={() => window.open(item.link, '_blank')}
    >
      <div style={{
        fontSize: 24,
        fontWeight: 700,
        color: 'var(--gqai-accent)',
        minWidth: 40,
        textAlign: 'center',
      }}>
        {index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--gqai-text-secondary)', marginBottom: 4 }}>
          {item.media_name}
        </div>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--gqai-text-primary)',
          lineHeight: 1.5,
          margin: 0,
        }}>
          {item.title}
        </h3>
      </div>
    </div>
  );

  // Render editorial card - simplified list view that navigates to detail page
  const renderEditorialCard = (item: any, index: number) => {
    const editorialId = item.id || `editorial-${index}`;
    const date = item.analyzed_at || item.published_at;
    const topicCount = item.topics?.length || 0;
    const articleCount = item.topics?.reduce((sum: number, topic: any) => sum + (topic.articles?.length || 0), 0) || 0;

    return (
      <div
        key={editorialId}
        style={{
          padding: 'var(--gqai-space-md)',
          borderRadius: 'var(--gqai-radius-md)',
          border: '1px solid var(--gqai-border-light)',
          transition: 'all var(--gqai-transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-primary)';
          e.currentTarget.style.boxShadow = 'var(--gqai-shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onClick={() => router.push(`/editorial/${editorialId}`)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              padding: '4px 8px',
              borderRadius: 'var(--gqai-radius-sm)',
              fontSize: 12,
              fontWeight: 600,
              color: 'white',
              backgroundColor: '#ef4444',
            }}>
              사설 분석
            </span>
            <span style={{ fontSize: 12, color: 'var(--gqai-text-tertiary)' }}>
              {date ? new Date(date).toLocaleDateString('ko-KR') : ''}
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: 8,
            fontSize: 12,
            color: 'var(--gqai-text-secondary)',
          }}>
            <span>📑 {topicCount}개 주제</span>
            <span>📰 {articleCount}개 사설</span>
          </div>
        </div>
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--gqai-text-primary)',
          marginBottom: 'var(--gqai-space-sm)',
          lineHeight: 1.5,
        }}>
          {item.title || `${date ? new Date(date).toLocaleDateString('ko-KR') : ''} 사설 분석`}
        </h3>
        {item.summary && (
          <p style={{
            fontSize: 14,
            color: 'var(--gqai-text-secondary)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}>
            {item.summary}
          </p>
        )}
        {item.topics && item.topics.length > 0 && (
          <div style={{
            marginTop: 12,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}>
            {item.topics.slice(0, 3).map((topic: any, idx: number) => (
              <span
                key={idx}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--gqai-radius-sm)',
                  fontSize: 12,
                  backgroundColor: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                }}
              >
                {topic.title}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render political card - simplified list view that navigates to detail page
  const renderPoliticalCard = (item: any, index: number) => {
    const slug = item.metadata?.slug || item.slug || `report-${index}`;
    const title = item.metadata?.topic || item.title;
    const date = item.metadata?.timestamp || item.published_at;
    const summary = item.summary;
    const category = item.metadata?.category || '정치뉴스';

    return (
      <div
        key={slug}
        style={{
          padding: 'var(--gqai-space-md)',
          borderRadius: 'var(--gqai-radius-md)',
          border: '1px solid var(--gqai-border-light)',
          transition: 'all var(--gqai-transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-primary)';
          e.currentTarget.style.boxShadow = 'var(--gqai-shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onClick={() => router.push(`/political-report/${slug}`)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: 'var(--gqai-radius-sm)',
            fontSize: 12,
            fontWeight: 600,
            color: 'white',
            backgroundColor: 'var(--gqai-primary)',
          }}>
            {category}
          </span>
          <span style={{ fontSize: 12, color: 'var(--gqai-text-tertiary)' }}>
            {date ? new Date(date).toLocaleDateString('ko-KR') : ''}
          </span>
        </div>
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--gqai-text-primary)',
          marginBottom: 'var(--gqai-space-sm)',
          lineHeight: 1.5,
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: 14,
          color: 'var(--gqai-text-secondary)',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}>
          {summary}
        </p>
      </div>
    );
  };

  // Render bill card
  const renderBillCard = (item: any, index: number) => {
    const billId = item.id || item.slug || `bill-${index}`;

    return (
      <div
        key={item.slug || index}
        style={{
          padding: 'var(--gqai-space-md)',
          borderRadius: 'var(--gqai-radius-md)',
          border: '1px solid var(--gqai-border-light)',
          transition: 'all var(--gqai-transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-primary)';
          e.currentTarget.style.boxShadow = 'var(--gqai-shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onClick={() => router.push(`/bills/${billId}`)}
      >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: 'var(--gqai-radius-sm)',
            fontSize: 12,
            fontWeight: 600,
            color: 'white',
            backgroundColor: 'var(--gqai-success)',
          }}>
            법안 분석
          </span>
          <span style={{ fontSize: 12, color: 'var(--gqai-text-tertiary)' }}>
            {item.report_date ? new Date(item.report_date).toLocaleDateString('ko-KR') : ''}
          </span>
        </div>
        <span style={{
          fontSize: 12,
          color: 'var(--gqai-text-secondary)',
          fontWeight: 600,
        }}>
          📋 {item.total_bills}건
        </span>
      </div>
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--gqai-text-primary)',
        marginBottom: 'var(--gqai-space-sm)',
        lineHeight: 1.5,
      }}>
        {item.headline}
      </h3>
      <p style={{
        fontSize: 14,
        color: 'var(--gqai-text-secondary)',
        lineHeight: 1.6,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        margin: 0,
      }}>
        {item.overview}
      </p>
      {item.key_trends && item.key_trends.length > 0 && (
        <div style={{
          marginTop: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}>
          {item.key_trends.slice(0, 2).map((trend: string, idx: number) => (
            <span
              key={idx}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--gqai-radius-sm)',
                fontSize: 12,
                backgroundColor: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
              }}
            >
              {trend.length > 40 ? trend.substring(0, 40) + '...' : trend}
            </span>
          ))}
        </div>
      )}
      </div>
    );
  };

  // Render restaurant card
  const renderRestaurantCard = (item: any, index: number) => (
    <div
      key={item.id || index}
      style={{
        padding: 'var(--gqai-space-md)',
        borderRadius: 'var(--gqai-radius-md)',
        border: '1px solid var(--gqai-border-light)',
        transition: 'all var(--gqai-transition-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-primary)';
        e.currentTarget.style.boxShadow = 'var(--gqai-shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
      }}>
        <div>
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--gqai-text-primary)',
            marginBottom: 4,
          }}>
            {item.name}
          </h3>
          <div style={{ fontSize: 14, color: 'var(--gqai-text-secondary)' }}>
            {item.location}
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: 'var(--gqai-radius-sm)',
          fontSize: 12,
          fontWeight: 600,
          color: 'white',
          backgroundColor: 'var(--gqai-accent)',
        }}>
          {item.category}
        </span>
      </div>
      <div style={{
        display: 'flex',
        gap: 16,
        fontSize: 13,
        color: 'var(--gqai-text-secondary)',
        marginTop: 12,
      }}>
        <div>📞 {item.pnum}</div>
        <div>💰 {item.price}</div>
      </div>
    </div>
  );

  // Compact card renderers for landing page dashboard

  const renderCompactNewsCard = (item: any, index: number) => (
    <div
      key={item.id || index}
      style={{
        padding: '12px',
        borderRadius: 'var(--gqai-radius-md)',
        border: '1px solid var(--gqai-border-light)',
        transition: 'all var(--gqai-transition-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-primary)';
        e.currentTarget.style.backgroundColor = 'var(--gqai-bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={() => item.original_link && window.open(item.original_link, '_blank')}
    >
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--gqai-text-primary)',
        marginBottom: 6,
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {item.title}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: 'var(--gqai-text-tertiary)',
      }}>
        <span>{item.media_name || '출처 미상'}</span>
        <span>{new Date(item.pub_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );

  const renderCompactRankingCard = (item: any, index: number) => (
    <div
      key={item.id || index}
      style={{
        padding: '12px',
        borderRadius: 'var(--gqai-radius-md)',
        border: '1px solid var(--gqai-border-light)',
        transition: 'all var(--gqai-transition-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#ef4444';
        e.currentTarget.style.backgroundColor = '#fef2f2';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={() => item.link && window.open(item.link, '_blank')}
    >
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--gqai-text-primary)',
        marginBottom: 4,
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {item.title}
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--gqai-text-tertiary)',
      }}>
        {item.media_name}
      </div>
    </div>
  );

  const renderCompactEditorialCard = (item: any, index: number) => {
    const editorialId = item.id || `editorial-${index}`;
    const date = item.analyzed_at || item.published_at;
    const topicCount = item.topics?.length || 0;

    return (
      <div
        key={editorialId}
        style={{
          padding: '12px',
          borderRadius: 'var(--gqai-radius-md)',
          border: '1px solid var(--gqai-border-light)',
          transition: 'all var(--gqai-transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.backgroundColor = '#eff6ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onClick={() => router.push(`/editorial/${editorialId}`)}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{
            fontSize: 11,
            color: 'var(--gqai-text-tertiary)',
          }}>
            {date ? new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}
          </span>
          <span style={{
            fontSize: 11,
            color: '#3b82f6',
            fontWeight: 600,
          }}>
            📑 {topicCount}개 주제
          </span>
        </div>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--gqai-text-primary)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.title || `${date ? new Date(date).toLocaleDateString('ko-KR') : ''} 사설 분석`}
        </div>
      </div>
    );
  };

  const renderCompactPoliticalCard = (item: any, index: number) => {
    // item.report_data가 실제 리포트 데이터를 포함
    const reportData = item.report_data || item;
    const slug = item.slug || reportData.metadata?.slug || `report-${index}`;
    const title = reportData.metadata?.topic || item.topic || '제목 없음';
    const date = reportData.metadata?.timestamp || item.created_at;
    const category = reportData.metadata?.category || '정치뉴스';
    const summary = item.summary || reportData.summary;

    return (
      <div
        key={slug}
        style={{
          padding: '12px',
          borderRadius: 'var(--gqai-radius-md)',
          border: '1px solid var(--gqai-border-light)',
          transition: 'all var(--gqai-transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-primary)';
          e.currentTarget.style.backgroundColor = 'var(--gqai-bg-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onClick={() => router.push(`/political-report/${slug}`)}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{
            fontSize: 11,
            color: 'var(--gqai-text-tertiary)',
          }}>
            {date ? new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}
          </span>
          <span style={{
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 'var(--gqai-radius-sm)',
            backgroundColor: 'var(--gqai-accent)',
            color: 'white',
            fontWeight: 600,
          }}>
            {category}
          </span>
        </div>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--gqai-text-primary)',
          lineHeight: 1.4,
          marginBottom: summary ? 8 : 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {title}
        </div>
        {summary && (
          <div style={{
            fontSize: 16,
            color: 'var(--gqai-text-secondary)',
            lineHeight: 1.6,
            background: '#f8fafc',
            padding: 10,
            borderRadius: 'var(--gqai-radius-sm)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 9,
            WebkitBoxOrient: 'vertical',
          }}>
            📝 {summary}
          </div>
        )}
      </div>
    );
  };

  const renderCompactBillCard = (item: any, index: number) => {
    const slug = item.slug || `bill-${index}`;
    const date = item.report_date || item.published_at;

    return (
      <div
        key={slug}
        style={{
          padding: '12px',
          borderRadius: 'var(--gqai-radius-md)',
          border: '1px solid var(--gqai-border-light)',
          transition: 'all var(--gqai-transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#10b981';
          e.currentTarget.style.backgroundColor = '#f0fdf4';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onClick={() => router.push(`/bills/${slug}`)}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{
            fontSize: 11,
            color: 'var(--gqai-text-tertiary)',
          }}>
            {date ? new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}
          </span>
          <span style={{
            fontSize: 11,
            color: '#10b981',
            fontWeight: 600,
          }}>
            📋 {item.total_bills}건
          </span>
        </div>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--gqai-text-primary)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.headline}
        </div>
      </div>
    );
  };

  const renderCompactRestaurantCard = (item: any, index: number) => (
    <div
      key={item.id || index}
      style={{
        padding: '12px',
        borderRadius: 'var(--gqai-radius-md)',
        border: '1px solid var(--gqai-border-light)',
        transition: 'all var(--gqai-transition-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-accent)';
        e.currentTarget.style.backgroundColor = '#fffbeb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--gqai-text-primary)',
          lineHeight: 1.4,
        }}>
          {item.name}
        </div>
        <span style={{
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 'var(--gqai-radius-sm)',
          backgroundColor: 'var(--gqai-accent)',
          color: 'white',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {item.category}
        </span>
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--gqai-text-secondary)',
        marginBottom: 4,
      }}>
        📍 {item.location}
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--gqai-text-tertiary)',
      }}>
        💰 {item.price}
      </div>
    </div>
  );

  // Main Panel
  const mainPanel = renderMainContent();

  // Right Panel
  const rightPanel = (
    <>
      <div style={{
        background: 'var(--gqai-bg-card)',
        borderRadius: 'var(--gqai-radius-lg)',
        boxShadow: 'var(--gqai-shadow-sm)',
        padding: 'var(--gqai-space-lg)',
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--gqai-text-primary)',
          marginBottom: 'var(--gqai-space-md)',
          fontFamily: 'var(--gqai-font-display)',
        }}>
          🤖 GQAI 인사이트
        </h3>
        <div style={{
          padding: 'var(--gqai-space-md)',
          borderRadius: 'var(--gqai-radius-md)',
          backgroundColor: 'var(--gqai-bg-main)',
        }}>
          <p style={{ fontSize: 14, color: 'var(--gqai-text-secondary)', lineHeight: 1.6 }}>
            오늘의 주요 정책 트렌드를 분석 중입니다...
          </p>
        </div>
      </div>

      <div style={{
        background: 'var(--gqai-bg-card)',
        borderRadius: 'var(--gqai-radius-lg)',
        boxShadow: 'var(--gqai-shadow-sm)',
        padding: 'var(--gqai-space-lg)',
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--gqai-text-primary)',
          marginBottom: 'var(--gqai-space-md)',
          fontFamily: 'var(--gqai-font-display)',
        }}>
          🔥 트렌딩 토픽
        </h3>
        <div style={{
          padding: 'var(--gqai-space-md)',
          borderRadius: 'var(--gqai-radius-md)',
          backgroundColor: 'var(--gqai-bg-main)',
        }}>
          <p style={{ fontSize: 14, color: 'var(--gqai-text-secondary)', lineHeight: 1.6 }}>
            인기 토픽을 집계 중입니다...
          </p>
        </div>
      </div>
    </>
  );

  if (!isMounted) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        로딩 중...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>GQAI 대시보드 - 정책 인텔리전스 플랫폼</title>
        <meta name="description" content="GQAI 뉴스 및 정책 대시보드" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <TopNavBar
        activeTab="exclusive"
        onTabChange={(_tab) => {
          // TopNavBar가 내부적으로 라우팅을 처리함
        }}
      />

      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--gqai-bg-main)',
        fontFamily: 'var(--gqai-font-sans)',
        padding: '24px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {mainPanel}
      </div>
    </>
  );
};

export default dynamic(() => Promise.resolve(DashboardPage), { ssr: false });
