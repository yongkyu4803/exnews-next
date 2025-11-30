import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from 'react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import TopNavBar from '@/components/mobile/TopNavBar'
import { CasebookContent } from '@/types/casebook'
import { formatDate } from '@/utils/casebookHelpers'

const CasebookDetailPage: React.FC = () => {
  const router = useRouter()
  const { slug } = router.query
  const [showScrollTop, setShowScrollTop] = useState(false)

  // API에서 케이스북 상세 데이터 가져오기
  const { data, isLoading, error } = useQuery<CasebookContent>(
    ['casebook', slug],
    () => fetch(`/api/casebooks/${slug}`).then(r => r.json()),
    {
      enabled: !!slug,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000,
    }
  )

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to top 함수
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 커스텀 마크다운 컴포넌트
  const customComponents = {
    // 헤딩 스타일
    h1: ({ children }: any) => (
      <h1 style={{
        fontSize: 32,
        fontWeight: 700,
        marginBottom: 20,
        marginTop: 40,
        color: '#1e40af',
        borderBottom: '3px solid #3b82f6',
        paddingBottom: 12,
      }}>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 style={{
        fontSize: 26,
        fontWeight: 700,
        marginBottom: 16,
        marginTop: 32,
        color: '#1f2937',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: 10,
      }}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 style={{
        fontSize: 22,
        fontWeight: 600,
        marginBottom: 14,
        marginTop: 24,
        color: '#374151',
      }}>
        {children}
      </h3>
    ),

    // 문단 스타일
    p: ({ children }: any) => {
      // [팩트], [계획], [전망] 태그 감지 및 커스텀 렌더링
      const childText = typeof children === 'string' ? children : children?.[0]

      if (typeof childText === 'string') {
        // [팩트] 태그 처리
        if (childText.includes('[팩트]')) {
          return (
            <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              border: '2px solid #3b82f6',
              borderRadius: 8,
              padding: '16px 20px',
              marginBottom: 20,
              marginTop: 20,
            }}>
              <span style={{
                display: 'inline-block',
                background: '#1e40af',
                color: 'white',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                marginRight: 12,
              }}>
                팩트
              </span>
              <span style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: '#1e40af',
                fontWeight: 500,
              }}>
                {childText.replace('[팩트]', '').trim()}
              </span>
            </div>
          )
        }

        // [계획] 태그 처리
        if (childText.includes('[계획]')) {
          return (
            <div style={{
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              border: '2px solid #22c55e',
              borderRadius: 8,
              padding: '16px 20px',
              marginBottom: 20,
              marginTop: 20,
            }}>
              <span style={{
                display: 'inline-block',
                background: '#15803d',
                color: 'white',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                marginRight: 12,
              }}>
                계획
              </span>
              <span style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: '#15803d',
                fontWeight: 500,
              }}>
                {childText.replace('[계획]', '').trim()}
              </span>
            </div>
          )
        }

        // [전망] 태그 처리
        if (childText.includes('[전망]')) {
          return (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #f59e0b',
              borderRadius: 8,
              padding: '16px 20px',
              marginBottom: 20,
              marginTop: 20,
            }}>
              <span style={{
                display: 'inline-block',
                background: '#d97706',
                color: 'white',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                marginRight: 12,
              }}>
                전망
              </span>
              <span style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: '#d97706',
                fontWeight: 500,
              }}>
                {childText.replace('[전망]', '').trim()}
              </span>
            </div>
          )
        }
      }

      return (
        <p style={{
          fontSize: 15,
          lineHeight: 1.8,
          color: '#374151',
          marginBottom: 16,
        }}>
          {children}
        </p>
      )
    },

    // 리스트 스타일
    ul: ({ children }: any) => (
      <ul style={{
        fontSize: 15,
        lineHeight: 1.8,
        color: '#374151',
        marginBottom: 16,
        paddingLeft: 24,
      }}>
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol style={{
        fontSize: 15,
        lineHeight: 1.8,
        color: '#374151',
        marginBottom: 16,
        paddingLeft: 24,
      }}>
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li style={{ marginBottom: 8 }}>{children}</li>
    ),

    // 테이블 스타일
    table: ({ children }: any) => (
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead style={{ background: '#f3f4f6' }}>{children}</thead>
    ),
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => (
      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>{children}</tr>
    ),
    th: ({ children }: any) => (
      <th style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontWeight: 600,
        color: '#1f2937',
        borderBottom: '2px solid #d1d5db',
      }}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td style={{
        padding: '12px 16px',
        color: '#374151',
      }}>
        {children}
      </td>
    ),

    // 코드 블록 스타일
    code: ({ inline, children }: any) => {
      if (inline) {
        return (
          <code style={{
            background: '#f3f4f6',
            color: '#ef4444',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 14,
            fontFamily: 'monospace',
          }}>
            {children}
          </code>
        )
      }
      return (
        <code style={{
          display: 'block',
          background: '#1f2937',
          color: '#f9fafb',
          padding: 16,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'monospace',
          overflow: 'auto',
          marginBottom: 16,
        }}>
          {children}
        </code>
      )
    },

    // 인용구 스타일
    blockquote: ({ children }: any) => (
      <blockquote style={{
        borderLeft: '4px solid #3b82f6',
        background: '#f9fafb',
        padding: '12px 20px',
        marginBottom: 20,
        fontStyle: 'italic',
        color: '#6b7280',
      }}>
        {children}
      </blockquote>
    ),

    // 링크 스타일
    a: ({ children, href }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#3b82f6',
          textDecoration: 'underline',
          fontWeight: 500,
        }}
      >
        {children}
      </a>
    ),

    // 구분선 스타일
    hr: () => (
      <hr style={{
        border: 'none',
        borderTop: '2px solid #e5e7eb',
        marginTop: 32,
        marginBottom: 32,
      }} />
    ),
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <TopNavBar />
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '60px 20px',
          textAlign: 'center',
          color: '#6b7280',
        }}>
          로딩 중...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <TopNavBar />
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '60px 20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            border: '1px solid #fecaca',
            padding: 40,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, color: '#ef4444', marginBottom: 12 }}>
              케이스북을 불러올 수 없습니다.
            </div>
            <button
              onClick={() => router.back()}
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
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { metadata, content } = data || {}

  // 첫 번째 H1 헤딩 제거 (이미 metadata.title로 렌더링되므로)
  const processedContent = content ? content.replace(/^#\s+.+\n/, '') : ''

  // metadata가 없으면 로딩 상태로 표시
  if (!metadata) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <TopNavBar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh'
        }}>
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            로딩 중...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <TopNavBar />

      {/* 뒤로가기 버튼 */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
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
          }}
        >
          ← 돌아가기
        </button>
      </div>

      {/* 본문 콘텐츠 */}
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '0 20px 80px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '40px',
        }}>
          {/* 제목 */}
          <h1 style={{
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 16,
            color: '#1e40af',
            lineHeight: 1.3,
          }}>
            {metadata.title}
          </h1>

          {/* 메타 정보 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: '2px solid #e5e7eb',
          }}>
            {metadata.category && (
              <span style={{
                padding: '4px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: '#3b82f6',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 6,
              }}>
                {metadata.category}
              </span>
            )}
            <span style={{
              fontSize: 14,
              color: '#6b7280',
            }}>
              {formatDate(metadata.date)}
            </span>
          </div>

          {/* 일러두기: 팩트/계획/전망 */}
          <div style={{
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
            border: '2px solid #e5e7eb',
            borderRadius: 12,
            padding: '24px',
            marginBottom: 40,
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: 16,
            }}>
              📌 일러두기
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  display: 'inline-block',
                  background: '#1e40af',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  minWidth: 50,
                  textAlign: 'center',
                }}>
                  팩트
                </span>
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  정부·감독당국·언론에 공식적으로 확인된 사실
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  display: 'inline-block',
                  background: '#15803d',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  minWidth: 50,
                  textAlign: 'center',
                }}>
                  계획
                </span>
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  정부가 로드맵·설명자료 등으로 제시한 정책 방향·목표
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  display: 'inline-block',
                  background: '#d97706',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  minWidth: 50,
                  textAlign: 'center',
                }}>
                  전망
                </span>
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  보고서 작성자의 시나리오·실무적 판단
                </span>
              </div>
            </div>
          </div>


          {/* 마크다운 콘텐츠 */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={customComponents}
          >
            {processedContent}
          </ReactMarkdown>

          {/* 태그 */}
          {metadata.tags && metadata.tags.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid #e5e7eb',
            }}>
              {metadata.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#3b82f6',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 6,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top 버튼 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          ↑
        </button>
      )}
    </div>
  )
}

export default CasebookDetailPage
