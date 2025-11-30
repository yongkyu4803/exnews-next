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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {data.casebooks.map((casebook) => (
              <div
                key={casebook.slug}
                onClick={() => router.push(`/casebook/${casebook.slug}`)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.filter = 'brightness(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.filter = 'brightness(1)'
                }}
              >
                {/* 이슈페이퍼 표지 이미지 */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '141.4%', // A4 비율 (1:1.414)
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}>
                    <img
                      src="/ispaperbak.png"
                      alt={casebook.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {/* 제목 오버레이 */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '16px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
                    }}>
                      {casebook.category && (
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: 4,
                          marginBottom: 8,
                          color: 'white',
                        }}>
                          {casebook.category}
                        </div>
                      )}
                      <h3 style={{
                        fontSize: 15,
                        fontWeight: 700,
                        lineHeight: 1.4,
                        margin: '0 0 6px 0',
                        color: 'white',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {casebook.title}
                      </h3>
                      <div style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.8)',
                      }}>
                        {formatDate(casebook.date)}
                      </div>
                    </div>
                  </div>
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
