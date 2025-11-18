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

const logger = createLogger('Pages:Dashboard:Modern');

/**
 * Modern Gradient Theme
 * Colors: Purple-Blue gradient with vibrant accents
 * Fonts: Inter for headings, SF Pro Text for body
 * Style: Clean, modern, tech-focused with subtle animations
 */
const DashboardModernPage = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const activeTab: string = 'home';
  const [activeCategory, setActiveCategory] = useState('all');
  const [randomRankingIndices, setRandomRankingIndices] = useState<number[]>([]);
  const [randomBillIndex, setRandomBillIndex] = useState<number>(0);
  const [currentNewsPage, setCurrentNewsPage] = useState<number>(0);

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
      staleTime: 2 * 60 * 1000,
    }
  );

  // Fetch news by category
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

  // 랭킹뉴스 랜덤 로테이션
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

    setRandomRankingIndices(getRandomIndices());

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
      const response = await fetch('/api/political-reports?landing=true');
      return response.json();
    },
    {
      enabled: isMounted && (activeTab === 'home' || activeTab === 'political'),
      staleTime: 1 * 60 * 1000,
    }
  );

  // Fetch bills
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

  // 법안 랜덤 로테이션
  useEffect(() => {
    const bills = billsData?.latest?.bills;
    if (!bills || bills.length === 0) return;

    const getRandomIndex = () => Math.floor(Math.random() * bills.length);
    setRandomBillIndex(getRandomIndex());

    const interval = setInterval(() => {
      setRandomBillIndex(getRandomIndex());
    }, 5000);

    return () => clearInterval(interval);
  }, [billsData?.latest?.bills?.length]);

  // 정치 뉴스 기사 자동 슬라이드
  useEffect(() => {
    const latestReport = politicalData?.latest;
    const newsSections = latestReport?.report_data?.newsSections || [];
    const allArticles: any[] = [];

    newsSections.forEach((section: any) => {
      if (section.articles && Array.isArray(section.articles)) {
        allArticles.push(...section.articles);
      }
    });

    if (allArticles.length <= 5) return;

    const totalPages = Math.ceil(allArticles.length / 5);
    const interval = setInterval(() => {
      setCurrentNewsPage((prevPage) => (prevPage + 1) % totalPages);
    }, 10000);

    return () => clearInterval(interval);
  }, [politicalData?.latest?.report_data?.newsSections]);

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

  // Render main content
  const renderMainContent = () => {
    const containerStyle = {
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
      padding: '32px',
      border: '1px solid rgba(99, 102, 241, 0.1)',
      backdropFilter: 'blur(10px)',
    };

    const titleStyle = {
      fontSize: '28px',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '24px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      letterSpacing: '-0.02em',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 메인 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '4fr 6fr',
          gridTemplateRows: 'auto auto',
          gap: 24,
        }}>
          {/* 오늘의 법안 */}
          <div style={{
            gridRow: '1 / 3',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{
              ...containerStyle,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <h3 style={{
                  ...titleStyle,
                  fontSize: '22px',
                  margin: 0,
                }}>
                  ⚖️ 어제 발의된 법안
                </h3>
                <button
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#6366f1',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => router.push('/?tab=bills')}
                >
                  이전 리포트 →
                </button>
              </div>
              {billsLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  로딩 중...
                </div>
              ) : billsData?.latest ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                      border: '2px solid #8b5cf6',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => router.push(`/bills/${billsData.latest.slug}`)}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                      <div style={{
                        fontSize: 16,
                        color: '#5b21b6',
                        fontWeight: 700,
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        📅 {new Date(billsData.latest.report_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} ({billsData.latest.total_bills}건)
                      </div>
                      <button
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#8b5cf6',
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                        }}
                        onClick={() => router.push(`/bills/${billsData.latest.slug}`)}
                      >
                        전체보기 →
                      </button>
                    </div>

                    {billsData.latest.key_trends && billsData.latest.key_trends.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginTop: 4,
                      }}>
                        {billsData.latest.key_trends.map((trend: string, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: 14,
                              color: '#1f2937',
                              background: 'white',
                              padding: '10px 14px',
                              borderRadius: '12px',
                              fontWeight: 500,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                              lineHeight: 1.6,
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            }}
                          >
                            <span style={{
                              fontSize: 10,
                              color: '#8b5cf6',
                              opacity: 0.5,
                              marginRight: 8,
                            }}>●</span>
                            {trend}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Banner image */}
                  <div style={{
                    marginTop: 16,
                    width: '100%',
                    borderRadius: '16px',
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
                    <button
                      style={{
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                        padding: '14px 28px',
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'white',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.01em',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.35)';
                      }}
                      onClick={() => router.push('/coming-soon')}
                    >
                      자세히 보러가기 (beta)
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  법안 리포트가 없습니다
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 컨테이너 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 오늘의 정치 */}
            <div style={{
              ...containerStyle,
              minHeight: 'auto',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <h3 style={{
                  ...titleStyle,
                  fontSize: '22px',
                  margin: 0,
                }}>
                  🏛️ 오늘의 정치
                </h3>
                <button
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#6366f1',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  }}
                  onClick={() => router.push('/?tab=political')}
                >
                  이전 리포트 →
                </button>
              </div>
              {politicalLoading ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                  로딩 중...
                </div>
              ) : politicalData?.latest ? (
                <div>컴팩트 정치 카드 렌더링</div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  정치 리포트가 없습니다
                </div>
              )}
            </div>

            {/* GQAI Banner */}
            <a
              href="https://gqai.kr"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
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
                  borderRadius: '20px',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
                }}
              />
            </a>

            {/* 3칼럼 균등 배치 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              {/* 단독 뉴스 */}
              <div style={{
                ...containerStyle,
                padding: '20px',
                minHeight: 'auto',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    <img
                      src="/icons/icon-exnews.png"
                      alt="단독"
                      style={{ width: 28, height: 28, objectFit: 'contain' }}
                    />
                    단독 뉴스
                  </h3>
                </div>
                <div>뉴스 컴팩트 카드</div>
              </div>

              {/* 랭킹 뉴스 */}
              <div style={{
                ...containerStyle,
                padding: '20px',
                minHeight: 'auto',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    <img
                      src="/icons/icon-lankingnews.png"
                      alt="랭킹"
                      style={{ width: 28, height: 28, objectFit: 'contain' }}
                    />
                    랭킹 뉴스
                  </h3>
                </div>
                <div>랭킹 컴팩트 카드</div>
              </div>

              {/* 오늘의 사설 */}
              <div style={{
                ...containerStyle,
                padding: '20px',
                minHeight: 'auto',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    📰 오늘의 사설
                  </h3>
                </div>
                <div>사설 토픽 카드</div>
              </div>
            </div>
          </div>
        </div>

        {/* 인사이트 & 트렌딩 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}>
          <div style={{
            ...containerStyle,
          }}>
            <h3 style={{
              ...titleStyle,
              fontSize: '20px',
            }}>
              🤖 GQAI 인사이트
            </h3>
            <div style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <p style={{
                fontSize: 15,
                color: '#047857',
                lineHeight: 1.7,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              }}>
                오늘의 주요 정책 트렌드를 분석 중입니다...
              </p>
            </div>
          </div>

          <div style={{
            ...containerStyle,
          }}>
            <h3 style={{
              ...titleStyle,
              fontSize: '20px',
            }}>
              🔥 트렌딩 토픽
            </h3>
            <div style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <p style={{
                fontSize: 15,
                color: '#dc2626',
                lineHeight: 1.7,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              }}>
                인기 토픽을 집계 중입니다...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        <title>GQAI 대시보드 - Modern Gradient</title>
        <meta name="description" content="GQAI 뉴스 및 정책 대시보드 - Modern Gradient Theme" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <TopNavBar
        activeTab="exclusive"
        onTabChange={(_tab) => {}}
      />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #f0f9ff 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
        padding: '32px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {renderMainContent()}
      </div>
    </>
  );
};

export default dynamic(() => Promise.resolve(DashboardModernPage), { ssr: false });