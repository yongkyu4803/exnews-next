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
import CasebookWidget from '@/components/Dashboard/Widgets/CasebookWidget';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Pages:Dashboard');

const DashboardPage = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const activeTab: string = 'home'; // 대시보드는 항상 home 탭
  const [activeCategory, setActiveCategory] = useState('all');
  const [randomRankingIndices, setRandomRankingIndices] = useState<number[]>([]);
  const [randomBillIndex, setRandomBillIndex] = useState<number>(0);
  const [currentNewsPage, setCurrentNewsPage] = useState<number>(0); // 뉴스 기사 페이지 인덱스
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [activePollTab, setActivePollTab] = useState<'realmeter' | 'nbs' | 'ksoi' | 'gallup'>('realmeter');

  useEffect(() => {
    setIsMounted(true);

    // 모바일 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  // Fetch editorials (landing mode: 최신 1개만)
  const { data: editorialData, isLoading: editorialLoading } = useQuery(
    'dashboard-editorials-landing',
    async () => {
      const response = await fetch('/api/editorials?landing=true');
      return response.json();
    },
    {
      enabled: isMounted && (activeTab === 'home' || activeTab === 'editorial'),
      staleTime: 1 * 60 * 1000,
    }
  );

  // Fetch political reports (landing mode)
  const { data: politicalData, isLoading: politicalLoading } = useQuery(
    'dashboard-political',
    async () => {
      const response = await fetch('/api/political-reports?landing=true');
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
  }, [billsData?.latest?.bills]);

  // Fetch weekly poll data (탭별로 source 필터링)
  const { data: pollData, isLoading: pollLoading } = useQuery(
    ['dashboard-polls', activePollTab],
    async () => {
      const response = await fetch(`/api/polls?landing=true&source=${activePollTab}`);
      return response.json();
    },
    {
      enabled: isMounted && activeTab === 'home',
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // 정치 뉴스 기사 자동 슬라이드 (10초마다)
  useEffect(() => {
    const latestReport = politicalData?.latest;
    const newsSections = latestReport?.report_data?.newsSections || [];

    // 모든 섹션의 모든 기사를 하나의 배열로 통합
    const allArticles: any[] = [];
    newsSections.forEach((section: any) => {
      if (section.articles && Array.isArray(section.articles)) {
        allArticles.push(...section.articles);
      }
    });

    if (allArticles.length <= 5) return; // 5개 이하면 슬라이드 불필요

    const totalPages = Math.ceil(allArticles.length / 5);

    // 10초마다 페이지 변경
    const interval = setInterval(() => {
      setCurrentNewsPage((prevPage) => (prevPage + 1) % totalPages);
    }, 10000);

    return () => clearInterval(interval);
  }, [politicalData?.latest]);

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

  // Fetch government press releases
  const { data: govReleasesData, isLoading: govReleasesLoading } = useQuery(
    'dashboard-gov-releases',
    async () => {
      const response = await fetch('/api/gov-releases');
      return response.json();
    },
    {
      enabled: isMounted && activeTab === 'home',
      staleTime: 5 * 60 * 1000, // 5 minutes
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
      padding: isMobile ? '12px' : 'var(--gqai-space-lg)',
      minHeight: isMobile ? 'auto' : '600px',
    };

    const titleStyle = {
      fontSize: isMobile ? 18 : 24,
      fontWeight: 700,
      color: '#1e40af',
      marginBottom: isMobile ? '12px' : 'var(--gqai-space-lg)',
      fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
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
                {editorialData?.latest && renderEditorialCard(editorialData.latest, 0)}
                {editorialData?.previous?.map((item: any, index: number) => renderEditorialCard(item, index + 1))}
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

      default:
        // home - 종합 대시보드
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
            {/* 메인 그리드 - 4/6 레이아웃 (모바일: 단일 컬럼) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '4fr 6fr',
              gridTemplateRows: 'auto auto',
              gap: isMobile ? 16 : 20,
            }}>
              {/* 첫 번째 열 - 오늘의 법안 + 배너 버튼 */}
              <div style={{
                gridRow: isMobile ? 'auto' : '1 / 3',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? 12 : 12,
              }}>
                {/* 오늘의 법안 섹션 */}
                <div style={{
                  ...containerStyle,
                  padding: 'var(--gqai-space-lg)',
                  minHeight: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: isMobile ? 12 : 16,
                }}>
                  <h3 style={{
                    fontSize: isMobile ? 16 : 20,
                    fontWeight: 700,
                    color: '#1e40af',
                    margin: 0,
                    fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
                  }}>
                    ⚖️ 어제 발의된 법안
                  </h3>
                  <button
                    style={{
                      padding: isMobile ? '8px 12px' : '4px 10px',
                      fontSize: isMobile ? 13 : 12,
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
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        border: '2px solid #3b82f6',
                        cursor: 'pointer',
                        transition: 'all var(--gqai-transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)';
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
                          color: '#1e40af',
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
                                color: '#3b82f6',
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
                            border: '2px solid #bfdbfe',
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
                                fontSize: 17,
                                fontWeight: 700,
                                color: '#1e40af',
                                flex: 1,
                                lineHeight: 1.5,
                              }}>
                                {randomBill.bill_name}
                              </span>
                              {randomBill.regulation_type && (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: 'var(--gqai-radius-sm)',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  background: randomBill.regulation_type === '신설' ? '#fef2f2' :
                                              randomBill.regulation_type === '강화' ? '#fffbeb' :
                                              randomBill.regulation_type === '완화' ? '#eff6ff' : '#f9fafb',
                                  color: randomBill.regulation_type === '신설' ? '#dc2626' :
                                         randomBill.regulation_type === '강화' ? '#d97706' :
                                         randomBill.regulation_type === '완화' ? '#3b82f6' : '#6b7280',
                                  border: `1px solid ${
                                    randomBill.regulation_type === '신설' ? '#fecaca' :
                                    randomBill.regulation_type === '강화' ? '#fde68a' :
                                    randomBill.regulation_type === '완화' ? '#bfdbfe' : '#e5e7eb'
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
                              color: '#2563eb',
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
                                fontSize: 14,
                                color: '#1e40af',
                                lineHeight: 1.6,
                                background: '#eff6ff',
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
                      position: 'relative',
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

                      {/* 자세히 보러가기 버튼 - 배너 위 우측 하단 */}
                      <button
                        style={{
                          position: 'absolute',
                          bottom: '16px',
                          right: '16px',
                          padding: '12px 24px',
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'white',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          border: 'none',
                          borderRadius: 'var(--gqai-radius-lg)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                        onClick={() => router.push('/coming-soon')}
                      >
                        자세히 보러가기 (beta)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-tertiary)' }}>
                    법안 리포트가 없습니다
                  </div>
                )}
                </div>
              </div>

              {/* 오른쪽 영역 전체를 감싸는 컨테이너 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
                {/* 첫 번째 행 - 오늘의 정치 (최신 1개만 표시) */}
                <div style={{
                  ...containerStyle,
                  padding: isMobile ? '12px' : 'var(--gqai-space-lg)',
                  minHeight: 'auto',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isMobile ? 12 : 16,
                  }}>
                    <h3 style={{
                      fontSize: isMobile ? 16 : 20,
                      fontWeight: 700,
                      color: '#1e40af',
                      margin: 0,
                      fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
                    }}>
                      🏛️ 오늘의 정치
                    </h3>
                    <button
                      style={{
                        padding: isMobile ? '8px 12px' : '4px 10px',
                        fontSize: isMobile ? 13 : 12,
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
                      onClick={() => router.push('/?tab=political')}
                    >
                      이전 리포트 →
                    </button>
                  </div>
                  {politicalLoading ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--gqai-text-tertiary)' }}>
                      로딩 중...
                    </div>
                  ) : politicalData?.latest ? (
                    <div>
                      {/* 최신 리포트 1개만 표시 */}
                      {renderCompactPoliticalCard(politicalData.latest, 0)}
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
                    margin: '2px 0',
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

                {/* 두 번째 행 - 3칼럼 균등 배치 (단독뉴스 | 랭킹뉴스 | 사설) - 모바일: 단일 컬럼 */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 16 : 20 }}>
                  {/* 단독 뉴스 (4개) */}
                  <div style={{
                    ...containerStyle,
                    padding: isMobile ? '12px' : 'var(--gqai-space-md)',
                    minHeight: 'auto',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: isMobile ? 10 : 12,
                    }}>
                      <h3 style={{
                        fontSize: isMobile ? 15 : 18,
                        fontWeight: 700,
                        color: '#1e40af',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? 6 : 8,
                        fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
                      }}>
                        <img
                          src="/icons/icon-exnews.png"
                          alt="단독"
                          style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, objectFit: 'contain' }}
                        />
                        단독 뉴스
                      </h3>
                      <button
                        style={{
                          padding: isMobile ? '8px 14px' : '6px 12px',
                          fontSize: isMobile ? 14 : 12,
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
                    padding: isMobile ? '12px' : 'var(--gqai-space-md)',
                    minHeight: 'auto',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: isMobile ? 10 : 12,
                    }}>
                      <h3 style={{
                        fontSize: isMobile ? 15 : 18,
                        fontWeight: 700,
                        color: '#1e40af',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? 6 : 8,
                        fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
                      }}>
                        <img
                          src="/icons/icon-lankingnews.png"
                          alt="랭킹"
                          style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, objectFit: 'contain' }}
                        />
                        랭킹 뉴스
                      </h3>
                      <button
                        style={{
                          padding: isMobile ? '8px 14px' : '6px 12px',
                          fontSize: isMobile ? 14 : 12,
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

                  {/* 오늘의 사설 (최신 1개 주제) */}
                  <div style={{
                    ...containerStyle,
                    padding: isMobile ? '12px' : 'var(--gqai-space-md)',
                    minHeight: 'auto',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: isMobile ? 10 : 12,
                    }}>
                      <h3 style={{
                        fontSize: isMobile ? 15 : 18,
                        fontWeight: 700,
                        color: '#1e40af',
                        margin: 0,
                        fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
                      }}>
                        📰 오늘의 사설
                      </h3>
                      <button
                        style={{
                          padding: isMobile ? '8px 14px' : '6px 12px',
                          fontSize: isMobile ? 14 : 12,
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
                    ) : editorialData?.latest ? (
                      renderEditorialTopicCard(editorialData.latest)
                    ) : (
                      <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-tertiary)' }}>
                        사설이 없습니다
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 세 번째 행 - 인사이트 & 트렌딩 토픽 (3/3 레이아웃) - 모바일: 단일 컬럼 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 16 : 20,
              marginTop: isMobile ? 16 : 20,
            }}>
              {/* 여론조사 동향 */}
              <div style={{
                background: '#fef9e7',
                backgroundImage: `
                  repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(252, 211, 77, 0.03) 10px, rgba(252, 211, 77, 0.03) 20px),
                  repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(254, 230, 138, 0.03) 10px, rgba(254, 230, 138, 0.03) 20px)
                `,
                borderRadius: 'var(--gqai-radius-lg)',
                boxShadow: 'var(--gqai-shadow-sm)',
                padding: isMobile ? '12px' : 'var(--gqai-space-lg)',
              }}>
                {/* 헤더: 제목 + 4개 탭 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#92400e',
                    margin: 0,
                    fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
                  }}>
                    📊 여론조사 동향
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { key: 'realmeter' as const, label: '리얼미터' },
                      { key: 'nbs' as const, label: '지표조사' },
                      { key: 'ksoi' as const, label: 'KSOI' },
                      { key: 'gallup' as const, label: '갤럽' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActivePollTab(tab.key)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 14,
                          fontWeight: activePollTab === tab.key ? 600 : 400,
                          color: activePollTab === tab.key ? 'white' : '#6b7280',
                          background: activePollTab === tab.key ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                          border: activePollTab === tab.key ? 'none' : '1px solid #e5e7eb',
                          borderRadius: 'var(--gqai-radius-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {pollLoading ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--gqai-text-tertiary)' }}>
                    로딩 중...
                  </div>
                ) : pollData?.latest ? (
                  <div
                    style={{ cursor: 'pointer' }}
                    onClick={() => setPollModalOpen(true)}
                  >
                    {/* 3열 레이아웃: 조사정보 | 대통령 지지율 | 정당 지지율 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {/* 첫번째 열: 조사 정보 */}
                      <div style={{
                        padding: '12px',
                        borderRadius: 'var(--gqai-radius-md)',
                        background: 'linear-gradient(135deg, #f3f4ff 0%, #faf5ff 100%)',
                        color: '#4b5563',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 8,
                        border: '1px solid #f2a54cff',
                      }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>📍 {pollData.latest.source_name}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>
                            {new Date(pollData.latest.publish_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, opacity: 0.85 }}>
                          <div>조사: {pollData.latest.survey_period}</div>
                          <div>표본: {Number(pollData.latest.sample_size).toLocaleString()}명</div>
                          <div>방법: {pollData.latest.method}</div>
                        </div>
                      </div>

                      {/* 두번째 열: 대통령 지지율 */}
                      <div style={{
                        padding: '12px',
                        borderRadius: 'var(--gqai-radius-md)',
                        background: 'linear-gradient(135deg, #f3f4ff 0%, #faf5ff 100%)',
                        border: '1px solid #f2a54cff',
                      }}>
                        <div style={{ fontSize: 14, color: 'var(--gqai-text-secondary)', marginBottom: 10, fontWeight: 600 }}>
                          📍 대통령 지지율
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--gqai-text-tertiary)' }}>긍정</span>
                            <span style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{pollData.latest.pres_positive}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--gqai-text-tertiary)' }}>부정</span>
                            <span style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{pollData.latest.pres_negative}%</span>
                          </div>
                          <div style={{
                            marginTop: 4,
                            paddingTop: 8,
                            borderTop: '1px solid var(--gqai-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <span style={{ fontSize: 11, color: 'var(--gqai-text-tertiary)' }}>전주 대비</span>
                            <span style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: pollData.latest.pres_change > 0 ? '#ef4444' : pollData.latest.pres_change < 0 ? '#3b82f6' : '#6b7280'
                            }}>
                              {pollData.latest.pres_change > 0 ? '▲' : pollData.latest.pres_change < 0 ? '▼' : '−'} {Math.abs(pollData.latest.pres_change)}%p
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 세번째 열: 정당 지지율 (5개) */}
                      {(() => {
                        const parties = [
                          { name: '민주당', value: pollData.latest.party_democratic, color: '#3b82f6' },
                          { name: '국민의힘', value: pollData.latest.party_ppp, color: '#ef4444' },
                          { name: '조국혁신당', value: pollData.latest.party_rebuild, color: '#f59e0b' },
                          { name: '개혁신당', value: pollData.latest.party_reform, color: '#10b981' },
                          { name: '지지없음', value: 100 - pollData.latest.party_democratic - pollData.latest.party_ppp - pollData.latest.party_rebuild - pollData.latest.party_reform - pollData.latest.party_progressive, color: '#9ca3af' },
                        ];

                        return (
                          <div style={{
                            padding: '12px',
                            borderRadius: 'var(--gqai-radius-md)',
                            background: 'linear-gradient(135deg, #f3f4ff 0%, #faf5ff 100%)',
                            border: '1px solid #f2a54cff',
                          }}>
                            <div style={{ fontSize: 14, color: 'var(--gqai-text-secondary)', marginBottom: 10, fontWeight: 600 }}>
                              📍 정당 지지율
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {parties.map((party) => (
                                <div key={party.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 12, color: 'var(--gqai-text-primary)', minWidth: 60, flexShrink: 0 }}>
                                    {party.name}
                                  </span>
                                  <div style={{ flex: 1, height: 18, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{
                                      height: '100%',
                                      width: `${party.value}%`,
                                      background: party.color,
                                      transition: 'width 0.3s ease',
                                    }} />
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: party.color, minWidth: 35, textAlign: 'right', flexShrink: 0 }}>
                                    {Math.round(party.value)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: 'var(--gqai-space-md)',
                    borderRadius: 'var(--gqai-radius-md)',
                    backgroundColor: 'var(--gqai-bg-main)',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: 14, color: 'var(--gqai-text-secondary)', lineHeight: 1.6 }}>
                      여론조사 데이터가 없습니다.
                    </p>
                  </div>
                )}
              </div>

              {/* 트렌딩 토픽 (3칼럼) - 케이스북 */}
              <CasebookWidget />

            </div>

          {/* 정부기관 보도자료 - 4칼럼 (모바일: 2칼럼) */}
          <div style={{
            background: 'var(--gqai-bg-card)',
            borderRadius: 'var(--gqai-radius-lg)',
            boxShadow: 'var(--gqai-shadow-sm)',
            padding: isMobile ? '12px' : 'var(--gqai-space-lg)',
            marginTop: isMobile ? 16 : 0,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isMobile ? 12 : 16,
            }}>
              <h3 style={{
                fontSize: isMobile ? 15 : 18,
                fontWeight: 700,
                color: '#1e40af',
                margin: 0,
                fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
              }}>
                🏛️ 정부기관 보도자료
              </h3>
              <button
                style={{
                  padding: isMobile ? '8px 14px' : '6px 12px',
                  fontSize: isMobile ? 13 : 12,
                  color: 'var(--gqai-primary)',
                  background: 'transparent',
                  border: '1px solid var(--gqai-border)',
                  borderRadius: 'var(--gqai-radius-sm)',
                  cursor: 'pointer',
                }}
                onClick={() => router.push('/gov-releases')}
              >
                더보기 →
              </button>
            </div>
            {govReleasesLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--gqai-text-tertiary)' }}>
                로딩 중...
              </div>
            ) : govReleasesData?.data ? (() => {
              const ftcAgency = govReleasesData.data.find((a: any) => a.agency_code === 'ftc');
              const kcaAgency = govReleasesData.data.find((a: any) => a.agency_code === 'kca');
              const fscAgency = govReleasesData.data.find((a: any) => a.agency_code === 'fsc');
              const fssAgency = govReleasesData.data.find((a: any) => a.agency_code === 'fss');

              const ftcItems = ftcAgency?.items?.slice(0, 5) || [];
              const kcaItems = kcaAgency?.items?.slice(0, 5) || [];
              const fscItems = fscAgency?.items?.slice(0, 5) || [];
              const fssItems = fssAgency?.items?.slice(0, 5) || [];

              const renderAgencySection = (code: string, name: string, items: any[]) => (
                <div key={code}>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#3b82f6',
                    marginBottom: 8,
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: 6,
                  }}>
                    {name}
                  </div>
                  {items.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {items.map((item: any, index: number) => (
                        <div
                          key={`${code}-${item.id}-${index}`}
                          style={{
                            padding: 10,
                            borderRadius: 6,
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.backgroundColor = '#f0f9ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={() => window.open(item.link, '_blank')}
                        >
                          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{
                              fontSize: 11,
                              color: '#6b7280',
                              minWidth: 50,
                              flexShrink: 0,
                            }}>
                              {item.release_date ? new Date(item.release_date).toLocaleDateString('ko-KR', {
                                month: '2-digit',
                                day: '2-digit',
                              }) : ''}
                            </span>
                            <span style={{
                              fontSize: 13,
                              color: '#1f2937',
                              flex: 1,
                              lineHeight: 1.4,
                            }}>
                              {item.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 12 }}>
                      보도자료가 없습니다
                    </div>
                  )}
                </div>
              );

              return (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 16 }}>
                  {renderAgencySection('ftc', '공정거래위원회', ftcItems)}
                  {renderAgencySection('kca', '한국소비자원', kcaItems)}
                  {renderAgencySection('fsc', '금융위원회', fscItems)}
                  {renderAgencySection('fss', '금융감독원', fssItems)}
                </div>
              );
            })() : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gqai-text-tertiary)' }}>
                보도자료가 없습니다
              </div>
            )}
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
        onClick={() => router.push(`/?tab=political&id=${slug}`)}
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
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
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

  const renderEditorialTopicCard = (item: any) => {
    const editorialId = item.id || 'latest-editorial';
    const topics = item.topics || [];

    return (
      <div
        key={editorialId}
        style={{
          padding: '20px',
          borderRadius: 'var(--gqai-radius-lg)',
          transition: 'all var(--gqai-transition-fast)',
          cursor: 'pointer',
          minHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={() => router.push(`/editorial/${editorialId}`)}
      >
        {/* 주제 목록 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          flex: 1,
        }}>
          {topics.slice(0, 3).map((topic: any, idx: number) => {
            const topicTitle = typeof topic === 'string'
              ? topic
              : (topic.topic_title || topic.title || '주제 없음');

            return (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--gqai-radius-md)',
                  background: 'white',
                  border: '1px solid #bfdbfe',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1e40af',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {topicTitle}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCompactPoliticalCard = (item: any, index: number) => {
    // item.report_data가 실제 리포트 데이터를 포함
    const reportData = item.report_data || item;
    const slug = item.slug || reportData.metadata?.slug || `report-${index}`;
    const title = reportData.metadata?.topic || item.topic || '제목 없음';
    const date = item.created_at || reportData.metadata?.timestamp;
    const category = reportData.metadata?.category || '정치뉴스';
    const summary = item.summary || reportData.summary;
    const keywords = reportData.keywords || item.keywords || [];
    const newsSections = reportData.newsSections || [];

    // 모든 섹션의 모든 기사를 하나의 배열로 통합
    const allArticles: any[] = [];
    newsSections.forEach((section: any) => {
      if (section.articles && Array.isArray(section.articles)) {
        allArticles.push(...section.articles);
      }
    });

    // 디버깅: 전체 기사 개수 확인
    console.log('정치 리포트 전체 기사 개수:', allArticles.length, allArticles);

    // 요약 텍스트를 문장 단위로 분리 (마침표, 물음표, 느낌표 기준)
    const formatSummary = (text: string) => {
      if (!text) return [];
      // 문장 부호 뒤에 줄바꿈 추가
      const sentences = text.split(/(?<=[.?!])\s+/);
      return sentences;
    };

    return (
      <div
        key={slug}
        style={{
          padding: '12px',
          borderRadius: 'var(--gqai-radius-md)',
          border: '1px solid var(--gqai-border-light)',
          backgroundColor: 'var(--gqai-bg-hover)',
          transition: 'all var(--gqai-transition-fast)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
        }}
        onClick={() => router.push(`/?tab=political&id=${slug}`)}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <span style={{
            fontSize: 12,
            color: '#6b7280',
            fontWeight: 500,
          }}>
            📅 {date ? new Date(date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : ''}
          </span>
          <span style={{
            fontSize: 10,
            padding: '3px 8px',
            borderRadius: 'var(--gqai-radius-sm)',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontWeight: 600,
          }}>
            {category}
          </span>
        </div>
        <div style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--gqai-text-primary)',
          lineHeight: 1.4,
          marginBottom: summary ? 8 : 0,
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {title}
        </div>
        {keywords && keywords.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginBottom: summary ? 8 : 0,
          }}>
            {keywords.slice(0, 3).map((keyword: any, idx: number) => (
              <span
                key={idx}
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 'var(--gqai-radius-sm)',
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  fontWeight: 500,
                }}
              >
                #{typeof keyword === 'string' ? keyword : keyword.term || keyword.keyword}
              </span>
            ))}
          </div>
        )}
        {summary && (
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--gqai-text-secondary)',
            lineHeight: 1.4,
            background: '#f8fafc',
            padding: 5,
            borderRadius: 'var(--gqai-radius-sm)',
            marginBottom: newsSections.length > 0 ? 10 : 0,
          }}>
            {formatSummary(summary).map((sentence, idx) => (
              <div key={idx} style={{ marginBottom: idx < formatSummary(summary).length - 1 ? 8 : 0 }}>
                {sentence}
              </div>
            ))}
          </div>
        )}
        {/* 주요 기사 섹션 */}
        {allArticles.length > 0 && (
          <div>
            <div style={{
              marginTop: 8,
              marginLeft: 15,
              marginRight: 15,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              minHeight: 145, // 5개 기사 높이 고정 (각 29px * 5)
            }}>
              {allArticles.slice(currentNewsPage * 5, currentNewsPage * 5 + 5).map((article: any, articleIdx: number) => {
                if (!article) return null;

                return (
                  <a
                    key={articleIdx}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      overflow: 'hidden',
                      padding: '4px 0',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    <span style={{
                      fontSize: 13,
                      color: '#1f2937',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}>
                      • {article.title}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: '#6b7280',
                      whiteSpace: 'nowrap',
                    }}>
                      {article.source}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: '#6b7280',
                    }}>
                      •
                    </span>
                    <span style={{
                      fontSize: 10,
                      color: '#6b7280',
                      whiteSpace: 'nowrap',
                    }}>
                      {article.date}
                    </span>
                  </a>
                );
              })}
            </div>
            {/* 페이지 인디케이터 */}
            {allArticles.length > 5 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 6,
                marginTop: 12,
                paddingBottom: 4,
              }}>
                {Array.from({ length: Math.ceil(allArticles.length / 5) }).map((_, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentNewsPage(idx);
                    }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: idx === currentNewsPage ? '#3b82f6' : '#d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </div>
            )}
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
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.backgroundColor = '#eff6ff';
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
            color: '#3b82f6',
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
        padding: isMobile ? '12px' : '24px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {mainPanel}
      </div>

      {/* 여론조사 자세히 보기 모달 */}
      {pollModalOpen && pollData?.latest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '16px' : '24px',
          }}
          onClick={() => setPollModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div style={{
              padding: isMobile ? '16px' : '24px',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px 12px 0 0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0 }}>
                  {pollData.latest.source_name} 여론조사
                </h2>
                <button
                  onClick={() => setPollModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: 20,
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 12 : 14, opacity: 0.95, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>📅 조사기간: {pollData.latest.survey_period}</div>
                <div>📊 표본: {Number(pollData.latest.sample_size).toLocaleString()}명 (오차범위 ±{pollData.latest.margin_of_error}%p)</div>
                <div>📞 조사방법: {pollData.latest.method === 'CATI' ? '전화면접조사 (CATI)' : '자동응답조사 (ARS)'}</div>
                <div>📄 발행일: {new Date(pollData.latest.publish_date).toLocaleDateString('ko-KR')}</div>
                {pollData.latest.commissioned_by && (
                  <div>🏢 의뢰처: {pollData.latest.commissioned_by}</div>
                )}
              </div>
            </div>

            {/* 모달 본문 */}
            <div style={{ padding: isMobile ? '16px' : '24px' }}>
              {/* 대통령 지지율 */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, marginBottom: 16, color: '#1f2937' }}>
                  대통령 지지율
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <div style={{
                    padding: 20,
                    borderRadius: 8,
                    backgroundColor: '#fef2f2',
                    border: '2px solid #fecaca',
                  }}>
                    <div style={{ fontSize: 14, color: '#991b1b', marginBottom: 8, fontWeight: 600 }}>긍정 평가</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#ef4444' }}>{pollData.latest.pres_positive}%</div>
                  </div>
                  <div style={{
                    padding: 20,
                    borderRadius: 8,
                    backgroundColor: '#eff6ff',
                    border: '2px solid #bfdbfe',
                  }}>
                    <div style={{ fontSize: 14, color: '#1e40af', marginBottom: 8, fontWeight: 600 }}>부정 평가</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#3b82f6' }}>{pollData.latest.pres_negative}%</div>
                  </div>
                </div>
                <div style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: '#f9fafb',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: 14, color: '#6b7280', marginRight: 8 }}>전주 대비</span>
                  <span style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: pollData.latest.pres_change > 0 ? '#ef4444' : pollData.latest.pres_change < 0 ? '#3b82f6' : '#6b7280'
                  }}>
                    {pollData.latest.pres_change > 0 ? '▲' : pollData.latest.pres_change < 0 ? '▼' : '−'} {Math.abs(pollData.latest.pres_change)}%p
                  </span>
                </div>
              </div>

              {/* 정당 지지율 */}
              <div>
                <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, marginBottom: 16, color: '#1f2937' }}>
                  정당 지지율
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(() => {
                    const parties = [
                      { name: '더불어민주당', value: pollData.latest.party_democratic, color: '#3b82f6' },
                      { name: '국민의힘', value: pollData.latest.party_ppp, color: '#ef4444' },
                      { name: '조국혁신당', value: pollData.latest.party_rebuild, color: '#f59e0b' },
                      { name: '개혁신당', value: pollData.latest.party_reform, color: '#10b981' },
                      { name: '진보당', value: pollData.latest.party_progressive, color: '#8b5cf6' },
                      { name: '지지 정당 없음', value: 100 - pollData.latest.party_democratic - pollData.latest.party_ppp - pollData.latest.party_rebuild - pollData.latest.party_reform - pollData.latest.party_progressive, color: '#9ca3af' },
                    ];

                    return parties.map((party) => (
                      <div key={party.name} style={{
                        padding: 16,
                        borderRadius: 8,
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{party.name}</span>
                          <span style={{ fontSize: 24, fontWeight: 700, color: party.color }}>
                            {Math.round(party.value * 10) / 10}%
                          </span>
                        </div>
                        <div style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${party.value}%`,
                            backgroundColor: party.color,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* 원문 링크 */}
              {(pollData.latest.source_url || pollData.latest.pdf_url) && (
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {pollData.latest.source_url && (
                      <a
                        href={pollData.latest.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '10px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          borderRadius: 6,
                          textDecoration: 'none',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        🔗 원문 보기
                      </a>
                    )}
                    {pollData.latest.pdf_url && (
                      <a
                        href={pollData.latest.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '10px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          borderRadius: 6,
                          textDecoration: 'none',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        📄 PDF 다운로드
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 푸터 추가 */}
      <footer style={{
        width: '100%',
        padding: '16px',
        textAlign: 'center',
        borderTop: '1px solid #eaeaea',
        marginTop: '32px',
        color: '#666',
        fontSize: isMobile ? '12px' : '16px',
        backgroundColor: '#f9f9f9',
        fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', sans-serif"
      }}>
        <div style={{ marginBottom: '8px' }}>
          <a
            href="https://gqai.kr"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1a4b8c',
              textDecoration: 'none',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}
          >
            GQAI.kr
          </a>
        </div>
        <div>
          <a href="mailto:gq.newslens@gmail.com" style={{
            color: '#1a4b8c',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            gq.newslens@gmail.com
          </a>
        </div>
      </footer>
    </>
  );
};

export default DashboardPage;
