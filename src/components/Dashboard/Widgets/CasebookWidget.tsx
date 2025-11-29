import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from 'react-query'
import { CasebooksListResponse } from '@/types/casebook'
import { formatDate } from '@/utils/casebookHelpers'
import Image from 'next/image'

const CasebookWidget: React.FC = () => {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)

  // API에서 케이스북 목록 가져오기
  const { data, isLoading, error } = useQuery<CasebooksListResponse>(
    'casebooks',
    () => fetch('/api/casebooks').then(r => r.json()),
    {
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10분
    }
  )

  // 전체 케이스북 리스트 (날짜순 정렬)
  const allCasebooks = data?.casebooks || []

  // 캐러셀 네비게이션
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allCasebooks.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < allCasebooks.length - 1 ? prev + 1 : 0))
  }

  if (isLoading) {
    return (
      <div style={{
        background: 'var(--gqai-bg-card)',
        borderRadius: 'var(--gqai-radius-lg)',
        boxShadow: 'var(--gqai-shadow-sm)',
        padding: 'var(--gqai-space-lg)',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 14, color: '#6b7280' }}>로딩 중...</div>
      </div>
    )
  }

  if (error || !data || data.casebooks.length === 0) {
    return (
      <div style={{
        background: 'var(--gqai-bg-card)',
        borderRadius: 'var(--gqai-radius-lg)',
        boxShadow: 'var(--gqai-shadow-sm)',
        padding: 'var(--gqai-space-lg)',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 14, color: '#ef4444' }}>
          케이스북을 불러올 수 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
        borderRadius: 'var(--gqai-radius-lg)',
        boxShadow: 'var(--gqai-shadow-sm)',
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        color: 'white',
      }}>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
        }}>
          🔥 Issue Paper
        </div>

        {/* 전체보기 버튼 */}
        <button
          onClick={() => router.push('/casebook')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            color: '#1e40af',
            background: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          전체보기
          <span style={{ fontSize: 14 }}>→</span>
        </button>
      </div>

      {/* 케이스북 캐러셀 */}
      {allCasebooks.length > 0 && (
        <div style={{ position: 'relative' }}>
          {/* 캐러셀 컨테이너 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 16,
          }}>
            {allCasebooks.slice(currentIndex, currentIndex + 2).map((casebook) => (
              <div
                key={casebook.slug}
                onClick={() => router.push(`/casebook/${casebook.slug}`)}
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.95) 100%)',
                  borderRadius: 'var(--gqai-radius-md)',
                  padding: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
                  e.currentTarget.style.background = 'rgba(255,255,255,1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.95) 100%)'
                }}
              >
                {/* 이슈페이퍼 표지 */}
                <div style={{ position: 'relative', width: '100%', height: 200 }}>
                  <Image
                    src="/ispaperbak.png"
                    alt={casebook.title}
                    fill
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                  />
                  {/* 제목 오버레이 */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '12px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
                    borderRadius: '0 0 8px 8px',
                  }}>
                    <div style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {casebook.title}
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 11,
                      marginTop: 4,
                    }}>
                      {casebook.category} · {formatDate(casebook.date)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 네비게이션 버튼 */}
          {allCasebooks.length > 2 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
            }}>
              <button
                onClick={handlePrev}
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.9)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                ←
              </button>

              {/* 인디케이터 */}
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: Math.ceil(allCasebooks.length / 2) }).map((_, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentIndex(index * 2)}
                    style={{
                      width: currentIndex === index * 2 ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: currentIndex === index * 2
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.9)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CasebookWidget
