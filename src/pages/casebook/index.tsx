import React from 'react'
import { useRouter } from 'next/router'
import { useQuery } from 'react-query'
import TopNavBar from '@/components/mobile/TopNavBar'
import { CasebooksListResponse } from '@/types/casebook'
import { formatDate } from '@/utils/casebookHelpers'

const CasebookIndexPage: React.FC = () => {
  const router = useRouter()

  const { data, isLoading, error } = useQuery<CasebooksListResponse>(
    'casebooks',
    () => fetch('/api/casebooks').then(r => r.json()),
    {
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000,
    }
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <TopNavBar />

      {/* 뒤로가기 버튼 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            fontSize: 14,
            color: '#374151',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            cursor: 'pointer',
            marginBottom: 20,
          }}
        >
          ← 돌아가기
        </button>
      </div>

      {/* 히어로 섹션 */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
        padding: '60px 20px',
        marginBottom: 40,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', color: 'white' }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>케이스북</h1>
          <p style={{ fontSize: 16, opacity: 0.9 }}>금융 규제 및 정책 동향 심층 분석</p>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px' }}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            로딩 중...
          </div>
        )}

        {error ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            background: 'white',
            borderRadius: 12,
            border: '1px solid #fecaca',
          }}>
            <div style={{ fontSize: 16, color: '#ef4444', marginBottom: 12 }}>
              케이스북을 불러올 수 없습니다.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                color: 'white',
                background: '#3b82f6',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </div>
        ) : null}

        {data && data.casebooks.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            아직 등록된 케이스북이 없습니다.
          </div>
        )}

        {data && data.casebooks.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {data.casebooks.map((casebook) => (
              <div
                key={casebook.slug}
                onClick={() => router.push(`/casebook/${casebook.slug}`)}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e5e7eb',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* 헤더 */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                  padding: '20px',
                  color: 'white',
                }}>
                  {casebook.category && (
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 4,
                      marginBottom: 12,
                    }}>
                      {casebook.category}
                    </div>
                  )}
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1.4,
                    margin: 0,
                  }}>
                    {casebook.title}
                  </h3>
                </div>

                {/* 본문 */}
                <div style={{ padding: 20 }}>
                  <div style={{
                    fontSize: 14,
                    color: '#374151',
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}>
                    {casebook.description}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      {formatDate(casebook.date)}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: '#3b82f6',
                      fontWeight: 600,
                    }}>
                      자세히 보기 →
                    </div>
                  </div>

                  {/* 태그 */}
                  {casebook.tags && casebook.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 16,
                    }}>
                      {casebook.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '4px 8px',
                            fontSize: 11,
                            color: '#6b7280',
                            background: '#f3f4f6',
                            borderRadius: 4,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CasebookIndexPage
