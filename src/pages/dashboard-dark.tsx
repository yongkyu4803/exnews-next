import React, { useState, useEffect } from 'react';
import PageFooter from '@/components/common/PageFooter';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import TopNavBar from '@/components/mobile/TopNavBar';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Pages:Dashboard:Dark');

/**
 * Dark Professional Theme
 * Colors: Deep blacks, charcoal grays with cyan/amber accents
 * Fonts: JetBrains Mono for headings, Roboto Mono for body
 * Style: Professional, terminal-inspired with high contrast
 */
const DashboardDarkPage = () => {
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

  // Data fetching hooks (same as original)
  const { data: stats } = useQuery('dashboard-stats', async () => {
    const [newsRes, rankingRes, editorialRes, billsRes] = await Promise.all([
      fetch('/api/news?page=1&pageSize=1'),
      fetch('/api/ranking-news?page=1&pageSize=1'),
      fetch('/api/editorials?landing=true'),
      fetch('/api/bills?landing=true'),
    ]);
    const [newsData, rankingData, editorialData, billsData] = await Promise.all([
      newsRes.json(), rankingRes.json(), editorialRes.json(), billsRes.json(),
    ]);
    return {
      news: newsData.totalCount || 0,
      ranking: rankingData.totalCount || 0,
      editorial: editorialData.totalCount || 0,
      bills: billsData.totalCount || 0,
    };
  }, { enabled: isMounted, staleTime: 2 * 60 * 1000 });

  const { data: billsData, isLoading: billsLoading } = useQuery(
    'dashboard-bills',
    async () => {
      const response = await fetch('/api/bills?landing=true');
      return response.json();
    },
    { enabled: isMounted, staleTime: 1 * 60 * 1000 }
  );

  const { data: politicalData, isLoading: politicalLoading } = useQuery(
    'dashboard-political',
    async () => {
      const response = await fetch('/api/political-reports?landing=true');
      return response.json();
    },
    { enabled: isMounted, staleTime: 1 * 60 * 1000 }
  );

  // Render main content
  const renderMainContent = () => {
    const containerStyle = {
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      borderRadius: '8px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      padding: '28px',
      border: '1px solid rgba(34, 211, 238, 0.2)',
    };

    const titleStyle = {
      fontSize: '26px',
      fontWeight: 700,
      color: '#22d3ee',
      marginBottom: '20px',
      fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
      letterSpacing: '-0.03em',
      textShadow: '0 0 20px rgba(34, 211, 238, 0.4)',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '4fr 6fr',
          gap: 20,
        }}>
          {/* 오늘의 법안 */}
          <div style={{
            gridRow: '1 / 3',
            ...containerStyle,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
            }}>
              <h3 style={{
                ...titleStyle,
                fontSize: '20px',
                margin: 0,
              }}>
                <span style={{ color: '#fbbf24' }}>{'>'}</span> 어제 발의된 법안
              </h3>
              <button
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#22d3ee',
                  background: 'rgba(34, 211, 238, 0.1)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: '"Roboto Mono", monospace',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 211, 238, 0.2)';
                  e.currentTarget.style.borderColor = '#22d3ee';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)';
                }}
                onClick={() => router.push('/?tab=bills')}
              >
                [이전 리포트]
              </button>
            </div>
            {billsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <span style={{ fontFamily: '"Roboto Mono", monospace' }}>Loading...</span>
              </div>
            ) : billsData?.latest ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{
                    padding: 14,
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
                    border: '1px solid #22c55e',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4ade80';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#22c55e';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => router.push(`/bills/${billsData.latest.slug}`)}
                >
                  <div style={{
                    fontSize: 14,
                    color: '#86efac',
                    fontWeight: 700,
                    marginBottom: 10,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}>
                    📅 {new Date(billsData.latest.report_date).toLocaleDateString('ko-KR')} | {billsData.latest.total_bills} bills
                  </div>

                  {billsData.latest.key_trends && billsData.latest.key_trends.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}>
                      {billsData.latest.key_trends.map((trend: string, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: 13,
                            color: '#e5e7eb',
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontWeight: 500,
                            borderLeft: '3px solid #22c55e',
                            fontFamily: '"Roboto Mono", monospace',
                            lineHeight: 1.5,
                          }}
                        >
                          <span style={{ color: '#22c55e', marginRight: 6 }}>▸</span>
                          {trend}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{
                  marginTop: 14,
                  width: '100%',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                }}>
                  <img
                    src="/when_bill.png"
                    alt="이 법안 언제 통과될까?"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      filter: 'brightness(0.85) contrast(1.1)',
                    }}
                  />
                  <button
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      padding: '12px 24px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#000',
                      background: '#22d3ee',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
                      fontFamily: '"JetBrains Mono", monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#06b6d4';
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(34, 211, 238, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#22d3ee';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 211, 238, 0.5)';
                    }}
                    onClick={() => router.push('/coming-soon')}
                  >
                    [ Enter Beta ]
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* 오른쪽 컨테이너 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 오늘의 정치 */}
            <div style={{ ...containerStyle }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}>
                <h3 style={{
                  ...titleStyle,
                  fontSize: '20px',
                  margin: 0,
                }}>
                  <span style={{ color: '#fbbf24' }}>{'>'}</span> 오늘의 정치
                </h3>
                <button
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#22d3ee',
                    background: 'rgba(34, 211, 238, 0.1)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: '"Roboto Mono", monospace',
                  }}
                  onClick={() => router.push('/?tab=political')}
                >
                  [이전 리포트]
                </button>
              </div>
              {politicalLoading ? (
                <div style={{ color: '#6b7280', fontFamily: '"Roboto Mono", monospace' }}>Loading...</div>
              ) : politicalData?.latest ? (
                <div>정치 카드</div>
              ) : null}
            </div>

            <a
              href="https://gqai.kr"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', width: '100%' }}
            >
              <img
                src="/GQAIKR.png"
                alt="GQAI.kr"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                  filter: 'brightness(0.9) contrast(1.1)',
                }}
              />
            </a>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ ...containerStyle, padding: '18px' }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#22d3ee',
                  margin: 0,
                  marginBottom: 14,
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  <span style={{ color: '#fbbf24' }}>▸</span> 단독 뉴스
                </h3>
                <div>뉴스 카드</div>
              </div>

              <div style={{ ...containerStyle, padding: '18px' }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#f87171',
                  margin: 0,
                  marginBottom: 14,
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  <span style={{ color: '#fbbf24' }}>▸</span> 랭킹 뉴스
                </h3>
                <div>랭킹 카드</div>
              </div>

              <div style={{ ...containerStyle, padding: '18px' }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#4ade80',
                  margin: 0,
                  marginBottom: 14,
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  <span style={{ color: '#fbbf24' }}>▸</span> 오늘의 사설
                </h3>
                <div>사설 카드</div>
              </div>
            </div>
          </div>
        </div>

        {/* 인사이트 & 트렌딩 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ ...containerStyle }}>
            <h3 style={{ ...titleStyle, fontSize: '18px' }}>
              <span style={{ color: '#fbbf24' }}>{'>'}</span> GQAI 인사이트
            </h3>
            <div style={{
              padding: '16px',
              borderRadius: '4px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderLeft: '3px solid #22d3ee',
            }}>
              <p style={{
                fontSize: 14,
                color: '#9ca3af',
                lineHeight: 1.6,
                fontFamily: '"Roboto Mono", monospace',
              }}>
                {'> '} 오늘의 주요 정책 트렌드를 분석 중입니다...
              </p>
            </div>
          </div>

          <div style={{ ...containerStyle }}>
            <h3 style={{ ...titleStyle, fontSize: '18px' }}>
              <span style={{ color: '#fbbf24' }}>{'>'}</span> 트렌딩 토픽
            </h3>
            <div style={{
              padding: '16px',
              borderRadius: '4px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderLeft: '3px solid #f87171',
            }}>
              <p style={{
                fontSize: 14,
                color: '#9ca3af',
                lineHeight: 1.6,
                fontFamily: '"Roboto Mono", monospace',
              }}>
                {'> '} 인기 토픽을 집계 중입니다...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isMounted) return <div style={{ padding: 20, color: '#9ca3af' }}>Loading...</div>;

  return (
    <>
      <Head>
        <title>GQAI 대시보드 - Dark Professional</title>
        <meta name="description" content="GQAI 뉴스 및 정책 대시보드 - Dark Professional Theme" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <TopNavBar activeTab="exclusive" onTabChange={(_tab) => {}} />

      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        fontFamily: '"Roboto Mono", monospace',
        padding: '28px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {renderMainContent()}
      </div>

      <PageFooter isMobile={isMounted && window.matchMedia('(max-width: 768px)').matches} />
    </>
  );
};

export default dynamic(() => Promise.resolve(DashboardDarkPage), { ssr: false });