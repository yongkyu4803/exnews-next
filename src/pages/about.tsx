import React from 'react'
import Head from 'next/head'

const About: React.FC = () => {
  return (
    <>
      <Head>
        <title>소개 - GQ AI</title>
        <meta name="description" content="GQ AI는 AI 기반 뉴스 분석 플랫폼입니다" />
      </Head>

      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: 20, fontSize: 32, fontWeight: 700 }}>
          GQ AI 소개
        </h1>

        <p style={{ textAlign: 'center', fontSize: 16, color: '#666', marginBottom: 60 }}>
          AI 기반 뉴스 정보 분석 플랫폼
        </p>

        <section style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
            ℹ️ 서비스 소개
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: '#333' }}>
            GQ AI는 대한민국의 정치, 경제, 사회 전반의 뉴스 정보를 AI 기술을 활용하여 분석하고 제공하는 뉴스 정보 플랫폼입니다.
            실시간으로 업데이트되는 단독 뉴스, 사설 분석, 법안 모니터링, 정치 리포트 등 다양한 형태의 정보를 통해
            사용자들이 빠르고 정확하게 정보를 파악할 수 있도록 돕습니다.
          </p>
        </section>

        <section style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>주요 서비스</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>📰 단독 뉴스</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#666' }}>
                각 언론사의 단독 뉴스를 실시간으로 수집하여 카테고리별로 제공합니다.
                정치, 경제, 사회, 국제, 문화 등 다양한 분야의 단독 뉴스를 한눈에 확인할 수 있습니다.
              </p>
            </div>

            <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>📊 사설 분석</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#666' }}>
                주요 언론사의 사설을 AI가 분석하여 핵심 주제와 논점을 정리합니다.
                다양한 관점의 사설을 비교 분석하여 이슈에 대한 균형 잡힌 시각을 제공합니다.
              </p>
            </div>

            <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>⚖️ 법안 모니터링</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#666' }}>
                국회에 발의된 법안들을 모니터링하고 분석합니다.
                법안의 주요 내용과 영향을 쉽게 이해할 수 있도록 정리하여 제공합니다.
              </p>
            </div>

            <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>📈 정치 리포트</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#666' }}>
                정치 동향과 여론조사 결과를 종합적으로 분석한 리포트를 제공합니다.
                정치 이슈에 대한 심층 분석과 인사이트를 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>기술 스택</h2>
          <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <ul style={{ fontSize: 15, lineHeight: 2, paddingLeft: 20 }}>
              <li><strong>Frontend</strong>: Next.js 15, React 18, TypeScript, Ant Design</li>
              <li><strong>Backend</strong>: Next.js API Routes, Supabase</li>
              <li><strong>AI/ML</strong>: Claude AI, Natural Language Processing</li>
              <li><strong>Infrastructure</strong>: Vercel, Supabase Cloud</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
            ✉️ 연락처
          </h2>
          <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 15, lineHeight: 2.5 }}>
              <p>
                🏠 <strong>웹사이트</strong>:{' '}
                <a href="https://gqai.kr" target="_blank" rel="noopener noreferrer">
                  https://gqai.kr
                </a>
              </p>
              <p>
                ✉️ <strong>이메일</strong>: contact@gqai.kr
              </p>
              <p>
                <strong>개인정보 문의</strong>: privacy@gqai.kr
              </p>
            </div>
          </div>
        </section>

        <div style={{
          marginTop: 80,
          padding: 30,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
          color: 'white',
          textAlign: 'center',
        }}>
          <h3 style={{ color: 'white', marginBottom: 15, fontSize: 22, fontWeight: 600 }}>
            더 나은 정보, 더 나은 세상
          </h3>
          <p style={{ color: 'white', fontSize: 16, margin: 0, lineHeight: 1.6 }}>
            GQ AI는 AI 기술을 활용하여 사회 각 분야의 정보를 분석하고 제공함으로써
            <br />
            시민들의 알 권리를 실현하고 더 나은 의사결정에 기여하고자 합니다.
          </p>
        </div>
      </div>
    </>
  )
}

export default About
