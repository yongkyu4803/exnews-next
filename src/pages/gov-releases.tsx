import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import Head from 'next/head';
import TopNavBar from '@/components/mobile/TopNavBar';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Pages:GovReleases');

interface PressRelease {
  id: number | string;
  title: string;
  link: string;
  release_date: string;
  department?: string;
  summary?: string;
  agency_code: string;
  created_at: string;
}

interface AgencyData {
  agency_code: string;
  agency_name: string;
  agency_name_en?: string;
  agency_url?: string;
  items: PressRelease[];
  error?: string;
}

const GovReleasesPage: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery<{ data: AgencyData[] }, Error>(
    'govReleases',
    async () => {
      const response = await fetch('/api/gov-releases');
      if (!response.ok) {
        throw new Error('Failed to fetch government press releases');
      }
      return response.json();
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        logger.info('Government press releases loaded', {
          agencies: data.data.length,
          total: data.data.reduce((sum, agency) => sum + agency.items.length, 0),
        });
      },
      onError: (err) => {
        logger.error('Failed to load government press releases', err);
      },
    }
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>정부기관 보도자료 | EXNEWS</title>
        <meta name="description" content="공정거래위원회, 한국소비자원, 금융위원회, 금융감독원의 최신 보도자료" />
      </Head>

      <TopNavBar />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'var(--gqai-space-xl)',
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--gqai-bg-main)',
      }}>
        {/* 페이지 헤더 */}
        <div style={{
          marginBottom: 'var(--gqai-space-xl)',
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--gqai-text-primary)',
            marginBottom: 'var(--gqai-space-sm)',
            fontFamily: 'var(--gqai-font-display)',
          }}>
            🏛️ 정부기관 보도자료
          </h1>
          <p style={{
            fontSize: 16,
            color: 'var(--gqai-text-secondary)',
            margin: 0,
          }}>
            4개 주요 정부기관의 최신 보도자료를 확인하세요
          </p>
        </div>

        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '100px 0',
          }}>
            <div style={{
              display: 'inline-block',
              width: 40,
              height: 40,
              border: '4px solid var(--gqai-border)',
              borderTopColor: 'var(--gqai-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{
              marginTop: 'var(--gqai-space-md)',
              color: 'var(--gqai-text-secondary)',
            }}>
              정부기관 보도자료를 불러오는 중...
            </p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: 'var(--gqai-radius-md)',
            padding: 'var(--gqai-space-lg)',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#c33',
              marginBottom: 'var(--gqai-space-sm)',
            }}>
              ⚠️ 오류 발생
            </p>
            <p style={{
              fontSize: 14,
              color: '#666',
              margin: 0,
            }}>
              정부기관 보도자료를 불러오는데 실패했습니다.
            </p>
          </div>
        )}

        {/* 데이터 없음 */}
        {!isLoading && !error && (!data || !data.data || data.data.length === 0) && (
          <div style={{
            background: 'var(--gqai-bg-card)',
            border: '1px solid var(--gqai-border)',
            borderRadius: 'var(--gqai-radius-md)',
            padding: 'var(--gqai-space-lg)',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: 16,
              color: 'var(--gqai-text-secondary)',
              margin: 0,
            }}>
              표시할 보도자료가 없습니다.
            </p>
          </div>
        )}

        {/* 기관별 보도자료 표시 */}
        {!isLoading && !error && data?.data && data.data.length > 0 && (
          <div style={{
            display: 'grid',
            gap: 'var(--gqai-space-xl)',
          }}>
            {data.data.map((agency) => (
              <div
                key={agency.agency_code}
                style={{
                  background: 'var(--gqai-bg-card)',
                  borderRadius: 'var(--gqai-radius-lg)',
                  boxShadow: 'var(--gqai-shadow-sm)',
                  padding: 'var(--gqai-space-lg)',
                  border: '1px solid var(--gqai-border-light)',
                }}
              >
                {/* 기관 헤더 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--gqai-space-lg)',
                  paddingBottom: 'var(--gqai-space-md)',
                  borderBottom: '2px solid var(--gqai-primary)',
                }}>
                  <div>
                    <h2 style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: 'var(--gqai-primary)',
                      margin: 0,
                      marginBottom: 4,
                      fontFamily: 'var(--gqai-font-display)',
                    }}>
                      {agency.agency_name}
                    </h2>
                    {agency.agency_name_en && (
                      <p style={{
                        fontSize: 13,
                        color: 'var(--gqai-text-tertiary)',
                        margin: 0,
                      }}>
                        {agency.agency_name_en}
                      </p>
                    )}
                  </div>
                  {agency.agency_url && (
                    <a
                      href={agency.agency_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        color: 'var(--gqai-primary)',
                        textDecoration: 'none',
                        padding: '6px 12px',
                        border: '1px solid var(--gqai-primary)',
                        borderRadius: 'var(--gqai-radius-sm)',
                        transition: 'all var(--gqai-transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--gqai-primary)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--gqai-primary)';
                      }}
                    >
                      공식 홈페이지 →
                    </a>
                  )}
                </div>

                {/* 에러 또는 보도자료 목록 */}
                {agency.error ? (
                  <div style={{
                    background: '#fff9e6',
                    border: '1px solid #ffe58f',
                    borderRadius: 'var(--gqai-radius-md)',
                    padding: 'var(--gqai-space-md)',
                  }}>
                    <p style={{
                      fontSize: 14,
                      color: '#ad6800',
                      margin: 0,
                    }}>
                      ⚠️ {agency.agency_name} 데이터 오류: {agency.error}
                    </p>
                  </div>
                ) : agency.items.length === 0 ? (
                  <p style={{
                    fontSize: 14,
                    color: 'var(--gqai-text-tertiary)',
                    textAlign: 'center',
                    padding: 'var(--gqai-space-lg)',
                    margin: 0,
                  }}>
                    최근 보도자료가 없습니다.
                  </p>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--gqai-space-md)',
                  }}>
                    {agency.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: 'var(--gqai-space-md)',
                          borderRadius: 'var(--gqai-radius-md)',
                          border: '1px solid var(--gqai-border-light)',
                          transition: 'all var(--gqai-transition-fast)',
                          cursor: 'pointer',
                          background: 'var(--gqai-bg-main)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--gqai-primary)';
                          e.currentTarget.style.boxShadow = 'var(--gqai-shadow-sm)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--gqai-border-light)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={() => window.open(item.link, '_blank')}
                      >
                        {/* 제목 */}
                        <h3 style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: 'var(--gqai-text-primary)',
                          margin: 0,
                          marginBottom: 8,
                          lineHeight: 1.5,
                        }}>
                          {item.title}
                        </h3>

                        {/* 메타 정보 */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          fontSize: 13,
                          color: 'var(--gqai-text-secondary)',
                          marginBottom: item.summary ? 8 : 0,
                        }}>
                          {item.release_date && (
                            <span>📅 {formatDate(item.release_date)}</span>
                          )}
                          {item.department && (
                            <>
                              <span style={{ color: 'var(--gqai-border)' }}>|</span>
                              <span>🏢 {item.department}</span>
                            </>
                          )}
                        </div>

                        {/* 요약 */}
                        {item.summary && (
                          <p style={{
                            fontSize: 14,
                            color: 'var(--gqai-text-tertiary)',
                            lineHeight: 1.6,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {item.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default GovReleasesPage;
