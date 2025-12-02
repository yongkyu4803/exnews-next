import React, { useState, useEffect } from 'react';
import PageFooter from '@/components/common/PageFooter';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import TopNavBar from '@/components/mobile/TopNavBar';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Pages:Dashboard:Warm');

/**
 * Warm Minimalist Theme
 * Colors: Soft beiges, warm terracotta with sage green accents
 * Fonts: Poppins for headings, Nunito for body
 * Style: Friendly, approachable with rounded corners and soft shadows
 */
const DashboardWarmPage = () => {
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

  // Data fetching
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

  // 법안 랜덤 로테이션 (5초마다)
  useEffect(() => {
    const bills = billsData?.latest?.bills;
    if (!bills || bills.length === 0) return;

    const getRandomIndex = () => Math.floor(Math.random() * bills.length);
    setRandomBillIndex(getRandomIndex());

    const interval = setInterval(() => {
      setRandomBillIndex(getRandomIndex());
    }, 5000);

    return () => clearInterval(interval);
  }, [billsData?.latest?.bills]);

  const renderMainContent = () => {
    const containerStyle = {
      background: 'linear-gradient(135deg, #fefcfb 0%, #fff5eb 100%)',
      borderRadius: '32px',
      boxShadow: '0 8px 32px rgba(210, 105, 70, 0.12), 0 2px 8px rgba(0, 0, 0, 0.02)',
      padding: '36px',
      border: '2px solid #f4e6d8',
    };

    const titleStyle = {
      fontSize: '30px',
      fontWeight: 700,
      color: '#d26946',
      marginBottom: '24px',
      fontFamily: 'Poppins, sans-serif',
      letterSpacing: '-0.01em',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '4fr 6fr',
          gap: 28,
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
              marginBottom: 24,
            }}>
              <h3 style={{
                ...titleStyle,
                fontSize: '24px',
                margin: 0,
              }}>
                ⚖️ 어제 발의된 법안
              </h3>
              <button
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#d26946',
                  background: '#fef3ed',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Nunito, sans-serif',
                  boxShadow: '0 2px 8px rgba(210, 105, 70, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fde8da';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(210, 105, 70, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fef3ed';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(210, 105, 70, 0.15)';
                }}
                onClick={() => router.push('/?tab=bills')}
              >
                이전 리포트 보기
              </button>
            </div>
            {billsLoading ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#a0826d',
                fontFamily: 'Nunito, sans-serif',
              }}>
                로딩 중...
              </div>
            ) : billsData?.latest ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div
                  style={{
                    padding: 20,
                    borderRadius: '28px',
                    background: 'linear-gradient(135deg, #f0ebe6 0%, #e8dfd6 100%)',
                    border: '2px solid #d4c5b9',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(210, 105, 70, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => router.push(`/bills/${billsData.latest.slug}`)}
                >
                  <div style={{
                    fontSize: 17,
                    color: '#8b6f47',
                    fontWeight: 700,
                    marginBottom: 14,
                    fontFamily: 'Poppins, sans-serif',
                  }}>
                    📅 {new Date(billsData.latest.report_date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} ({billsData.latest.total_bills}건)
                  </div>

                  {billsData.latest.key_trends && billsData.latest.key_trends.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}>
                      {billsData.latest.key_trends.map((trend: string, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: 15,
                            color: '#5d4a3a',
                            background: '#fefcfb',
                            padding: '12px 16px',
                            borderRadius: '18px',
                            fontWeight: 500,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                            lineHeight: 1.6,
                            fontFamily: 'Nunito, sans-serif',
                          }}
                        >
                          <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#d26946',
                            marginRight: 10,
                          }}></span>
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
                        marginTop: 14,
                        padding: 18,
                        background: 'linear-gradient(135deg, #f0ebe6 0%, #fef3ed 100%)',
                        borderRadius: '24px',
                        border: '2px solid #d4c5b9',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        minHeight: '180px',
                        maxHeight: '180px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(210, 105, 70, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
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
                          gap: 8,
                          marginBottom: 10,
                        }}>
                          <span style={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#8b6f47',
                            flex: 1,
                            lineHeight: 1.5,
                            fontFamily: 'Poppins, sans-serif',
                          }}>
                            {randomBill.bill_name}
                          </span>
                          {randomBill.regulation_type && (
                            <span style={{
                              padding: '6px 14px',
                              borderRadius: '16px',
                              fontSize: 12,
                              fontWeight: 700,
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
                              fontFamily: 'Nunito, sans-serif',
                            }}>
                              {randomBill.regulation_type}
                            </span>
                          )}
                        </div>

                        {/* 메타 정보 */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          marginBottom: 10,
                          fontSize: 11,
                          color: '#a0826d',
                          fontFamily: 'Nunito, sans-serif',
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
                            color: '#5d4a3a',
                            lineHeight: 1.6,
                            background: '#fefcfb',
                            padding: 12,
                            borderRadius: '18px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            flex: 1,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                            fontFamily: 'Nunito, sans-serif',
                          }}>
                            📝 {randomBill.summary_one_sentence}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div style={{
                  marginTop: 18,
                  width: '100%',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid #f4e6d8',
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
                      bottom: '18px',
                      right: '18px',
                      padding: '14px 32px',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'white',
                      background: 'linear-gradient(135deg, #d26946 0%, #b85a3a 100%)',
                      border: 'none',
                      borderRadius: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 24px rgba(210, 105, 70, 0.35)',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(210, 105, 70, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(210, 105, 70, 0.35)';
                    }}
                    onClick={() => router.push('/coming-soon')}
                  >
                    자세히 보러가기 (beta)
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* 오른쪽 컨테이너 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* 오늘의 정치 */}
            <div style={{ ...containerStyle }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}>
                <h3 style={{
                  ...titleStyle,
                  fontSize: '24px',
                  margin: 0,
                }}>
                  🏛️ 오늘의 정치
                </h3>
                <button
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#d26946',
                    background: '#fef3ed',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                  onClick={() => router.push('/?tab=political')}
                >
                  이전 리포트 보기
                </button>
              </div>
              {politicalLoading ? (
                <div style={{ color: '#a0826d', fontFamily: 'Nunito, sans-serif' }}>로딩 중...</div>
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
                  borderRadius: '28px',
                  boxShadow: '0 8px 24px rgba(210, 105, 70, 0.15)',
                  border: '2px solid #f4e6d8',
                }}
              />
            </a>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
              <div style={{ ...containerStyle, padding: '24px' }}>
                <h3 style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: '#6b8e6f',
                  margin: 0,
                  marginBottom: 16,
                  fontFamily: 'Poppins, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <img src="/icons/icon-exnews.png" alt="단독" style={{ width: 28, height: 28 }} />
                  단독 뉴스
                </h3>
                <div>뉴스 카드</div>
              </div>

              <div style={{ ...containerStyle, padding: '24px' }}>
                <h3 style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: '#c9746a',
                  margin: 0,
                  marginBottom: 16,
                  fontFamily: 'Poppins, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <img src="/icons/icon-lankingnews.png" alt="랭킹" style={{ width: 28, height: 28 }} />
                  랭킹 뉴스
                </h3>
                <div>랭킹 카드</div>
              </div>

              <div style={{ ...containerStyle, padding: '24px' }}>
                <h3 style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: '#8b7355',
                  margin: 0,
                  marginBottom: 16,
                  fontFamily: 'Poppins, sans-serif',
                }}>
                  📰 오늘의 사설
                </h3>
                <div>사설 카드</div>
              </div>
            </div>
          </div>
        </div>

        {/* 인사이트 & 트렌딩 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div style={{ ...containerStyle }}>
            <h3 style={{ ...titleStyle, fontSize: '22px' }}>
              🤖 GQAI 인사이트
            </h3>
            <div style={{
              padding: '22px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #f0f4f1 0%, #e6ede8 100%)',
              border: '2px solid #c8d4ca',
            }}>
              <p style={{
                fontSize: 16,
                color: '#5d6b5e',
                lineHeight: 1.7,
                fontFamily: 'Nunito, sans-serif',
                margin: 0,
              }}>
                오늘의 주요 정책 트렌드를 분석 중입니다...
              </p>
            </div>
          </div>

          <div style={{ ...containerStyle }}>
            <h3 style={{ ...titleStyle, fontSize: '22px' }}>
              🔥 트렌딩 토픽
            </h3>
            <div style={{
              padding: '22px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #f7ede8 0%, #f0e4dd 100%)',
              border: '2px solid #e6d2c6',
            }}>
              <p style={{
                fontSize: 16,
                color: '#7a655a',
                lineHeight: 1.7,
                fontFamily: 'Nunito, sans-serif',
                margin: 0,
              }}>
                인기 토픽을 집계 중입니다...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isMounted) return <div style={{ padding: 20, color: '#a0826d' }}>로딩 중...</div>;

  return (
    <>
      <Head>
        <title>GQAI 대시보드 - Warm Minimalist</title>
        <meta name="description" content="GQAI 뉴스 및 정책 대시보드 - Warm Minimalist Theme" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <TopNavBar activeTab="exclusive" onTabChange={(_tab) => {}} />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #faf7f5 0%, #f5ede4 50%, #f9f3ed 100%)',
        fontFamily: 'Nunito, sans-serif',
        padding: '36px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {renderMainContent()}
      </div>
      <PageFooter isMobile={isMounted && window.matchMedia('(max-width: 768px)').matches} />
    </>
  );
};

export default dynamic(() => Promise.resolve(DashboardWarmPage), { ssr: false });