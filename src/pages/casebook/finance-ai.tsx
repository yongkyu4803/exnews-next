import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import TopNavBar from '@/components/mobile/TopNavBar';

const FinanceAICasebookPage: React.FC = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>금융권 생성형 AI 도입 규제 케이스북 | GQAI</title>
        <meta name="description" content="2024-2025 금융권 생성형 AI 도입 규제 현황 및 전망" />
      </Head>

      <TopNavBar activeTab="home" onTabChange={() => {}} />

      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '40px 24px',
        fontFamily: 'var(--gqai-font-sans)',
        color: '#1f2937',
        lineHeight: 1.8,
      }}>
        {/* 뒤로가기 */}
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: 24,
            padding: 0,
          }}
        >
          ← 돌아가기
        </button>

        {/* 제목 */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#111827',
          marginBottom: 8,
          lineHeight: 1.4,
        }}>
          금융권 생성형 AI 도입 규제 케이스북
        </h1>

        <p style={{
          fontSize: 14,
          color: '#6b7280',
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid #e5e7eb',
        }}>
          2024–2025 기준 | 작성 기준 시점: 2025년 11월
        </p>

        {/* 범례 */}
        <div style={{
          background: '#f9fafb',
          padding: 16,
          borderRadius: 8,
          marginBottom: 32,
          fontSize: 13,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>범례</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span><strong>[팩트]</strong> 공식 확인된 사실</span>
            <span><strong>[계획]</strong> 정책 방향·목표</span>
            <span><strong>[전망]</strong> 시나리오·실무적 판단</span>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            1. Executive Summary
          </h2>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>1-1. 배경 – 규제 전환점</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>[팩트]</strong> 2024년 8월 13일, 금융위원회는 「금융분야 망분리 개선 로드맵」을 발표하고, 샌드박스를 활용해 생성형 AI·SaaS를 금융사 내부망에서 활용할 수 있는 길을 열었다.</li>
            <li><strong>[팩트]</strong> 이는 2013~2015년 전자금융감독규정 개정으로 망분리 의무화 이후, 가장 큰 규제 방향 전환 중 하나로 평가된다.</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>1-2. 시장 반응 – 샌드박스 폭주</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>[팩트]</strong> 2024년 9월 16일~27일 74개 금융사에서 141건의 망분리 특례(생성형 AI·SaaS 관련) 신청이 접수되었다.</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>1-3. 현재 상황(2025.11 기준)</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>[팩트]</strong> 2024년 11월 27일 – 9개 금융회사, 10개 생성형 AI 서비스가 금융혁신서비스(샌드박스)로 지정됨.</li>
            <li><strong>[팩트]</strong> 2024년 12월~2025년 6월 사이 – KB금융 8개 계열사 생성형 AI 서비스, MS 365 Copilot 기반 SaaS·생성형 AI 활용(26개 금융사), SKT·현대카드·우리은행 등 9개사 13건 내부시스템형 생성형 AI 서비스 등이 추가로 승인됨.</li>
            <li><strong>[계획]</strong> 로드맵 기준으로는 2025년 4분기 전자금융감독규정 개정을 통해 '샌드박스→정규 제도' 전환을 목표로 하고 있다.</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>1-4. 핵심 인사이트</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>[팩트]</strong> 샌드박스는 "특례를 통한 시험 운영 단계"로 설계되어 있다.</li>
            <li><strong>[계획]</strong> 정부 로드맵은 1단계(샌드박스) → 2단계(특례 확대) → 3단계(디지털 금융보안법 제정)의 3단계 구조를 목표로 한다.</li>
            <li><strong>[전망]</strong> 계획이 큰 틀에서 유지될 경우 2025년 이후에는 금융사가 일정 보안요건·계약요건을 충족하면, 망분리 환경에서도 상용 GenAI 활용이 '일반적인 옵션'이 될 가능성이 높다.</li>
          </ul>
        </section>

        {/* 2. 규제 변천 타임라인 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            2. 규제 변천 타임라인
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>시점</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>사건</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>의미</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>구분</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: '2013~2015년', event: '전자금융감독규정 개정, 망분리 의무화', meaning: '업무망·대외망 분리, 강한 온프렘 지향 구조 형성', type: '팩트' },
                  { date: '2023년 9월', event: '최초 SaaS 샌드박스 승인', meaning: '망분리 예외를 통해 클라우드 SaaS 내부망 활용 첫 허용', type: '팩트' },
                  { date: '2024년 8월 13일', event: '「금융분야 망분리 개선 로드맵」 발표', meaning: '생성형 AI·SaaS 내부망 활용을 정책적으로 허용하는 방향 제시', type: '팩트' },
                  { date: '2024년 9월', event: '샌드박스 신청 74개사 141건', meaning: '업계의 폭발적인 수요 확인', type: '팩트' },
                  { date: '2024년 11월 27일', event: '생성형 AI 1차 승인 (9개사 10건)', meaning: '최초로 금융권 내부망에서 상용 GenAI 활용 허용', type: '팩트' },
                  { date: '2024년 12월', event: 'KB금융 8개 계열사 GenAI 서비스 지정', meaning: '그룹 단위 GenAI 플랫폼 도입 가속화', type: '팩트' },
                  { date: '2025년 1분기', event: 'MS 365 Copilot 기반 26개 금융사 승인', meaning: '생산성 SaaS+GenAI 조합이 금융 내부망에 본격 도입', type: '팩트' },
                  { date: '2025년 6월 30일', event: 'SKT·현대카드 등 9개사 13건 승인', meaning: '내부 업무시스템과 결합된 GenAI 활용 확산', type: '팩트' },
                  { date: '2025년 4분기', event: '전자금융감독규정 개정 통한 정규 제도화', meaning: '샌드박스에서 일반 규정 체계로 전환', type: '계획' },
                  { date: '2026년 이후', event: '가명정보·개인신용정보까지 처리 범위 확대', meaning: '보다 정교한 개인화 서비스 허용', type: '계획+전망' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{row.date}</td>
                    <td style={{ padding: '10px 12px' }}>{row.event}</td>
                    <td style={{ padding: '10px 12px', color: '#4b5563' }}>{row.meaning}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: row.type === '팩트' ? '#dcfce7' : row.type === '계획' ? '#dbeafe' : '#fef3c7',
                        color: row.type === '팩트' ? '#166534' : row.type === '계획' ? '#1e40af' : '#92400e',
                      }}>
                        {row.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. 규제 장벽의 이해 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            3. 규제 장벽의 이해
          </h2>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>3-1. 망분리란 무엇인가?</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>[팩트]</strong> 2013~2015년 전자금융감독규정 개정으로 업무망(내부 전산망)과 인터넷 접속이 가능한 외부망을 논리적·물리적으로 분리하는 망분리가 금융권에 도입되었다.</li>
            <li><strong>[팩트]</strong> 목적은 금융사 해킹·랜섬웨어·대규모 개인정보 유출 위험을 최소화하는 것.</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>3-2. 왜 생성형 AI에 문제가 되었나?</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>[팩트]</strong> ChatGPT, Claude 등 상용 GenAI는 인터넷을 통해 API·웹으로 접근하는 구조를 기본 전제로 한다.</li>
            <li><strong>[팩트]</strong> 대부분 금융사는 업무망에서 인터넷 접속이 차단되어 있어, 업무망 PC에서 직접 상용 GenAI를 호출하는 것은 구조상 불가능했다.</li>
            <li><strong>[팩트]</strong> 다만, 연구·개발망, 비식별 테스트 환경, 온프렘/프라이빗 모델 등 일부 환경에서는 예외적으로 AI 활용이 가능했다.</li>
          </ul>
        </section>

        {/* 4. 제1차 승인 케이스 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            4. 제1차 승인 케이스 (2024년 11월)
          </h2>

          <p style={{ marginBottom: 16 }}>
            <strong>[팩트]</strong> 2024년 11월 27일, 은행 4사, 증권 2사, 생명보험 2사, 카드 1사 총 9개사 10개 서비스가 혁신금융서비스(생성형 AI 활용)로 지정되었다.
          </p>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4-1. 은행 (4개사)</h3>

          <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>신한은행</h4>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li>서비스: 생성형 AI 기반 AI 은행원, 금융지식·투자 Q&A 서비스</li>
            <li>목적: 창구·콜센터 상담 지원, 금융지식 질의응답, 외국어 번역 및 투자정보 요약</li>
            <li>특징: ChatGPT(OpenAI) 계열 모델 활용, 2025년 상반기 내 실서비스 오픈</li>
          </ul>

          <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>KB국민은행</h4>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li>서비스: 생성형 AI 기반 금융상담 에이전트</li>
            <li>목적: 자연어 기반 고객 상담, 내부 직원 지원</li>
          </ul>

          <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>NH농협은행 / 카카오뱅크</h4>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li>고객 상담·업무 지원형 에이전트 (상세 구조 비공개)</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4-2. 증권 (2개사)</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li><strong>NH투자증권</strong>: 투자 리서치·리포트 요약, 투자정보 Q&A (리테일·PB 상담 효율화)</li>
            <li><strong>KB증권</strong>: 투자 상담·내부 보고 지원용 GenAI 에이전트</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4-3. 보험 (2개사)</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li><strong>교보생명</strong>: 보험 설계·보장분석 지원 AI 서포터 (설계사·FP 대상)</li>
            <li><strong>한화생명</strong>: 고객 맞춤형 화법 생성 및 가상 대화 훈련 솔루션 (상담원 교육)</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4-4. 카드 (1개사)</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li><strong>KB국민카드</strong>: "모두의 카드생활 메이트" 상담·추천 서비스 (이용대금, 혜택, 맞춤형 카드 추천)</li>
          </ul>
        </section>

        {/* 5. 공통 규제 해결 구조 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            5. 공통 규제 해결 구조
          </h2>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>5-1. 대표 기술 아키텍처</h3>
          <div style={{
            background: '#f3f4f6',
            padding: 16,
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 13,
            marginBottom: 16,
            overflowX: 'auto',
          }}>
            [업무망] ← 전용선/VPN → [금융사 클라우드 구간] ← Private Link → [CSP 클라우드 내 LLM]<br/>
            (단말 보안·MFA)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(인터넷 차단, 접속 통제)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(외부 인터넷 직접 연결 차단)
          </div>
          <p style={{ marginBottom: 16 }}>
            <strong>[팩트]</strong> 금융위·금융보안원이 제시하는 원칙은 업무망에서 직접 인터넷으로 나가지 않고, 금융사 제어 하에 있는 클라우드 구간을 거쳐 CSP의 GenAI/LLM에 접속하는 구조를 요구한다.
          </p>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>5-2. 자주 요구되는 보안 조건</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>다중인증(MFA), 일회용 패스워드(OTP) 등 강한 인증</li>
            <li>전 구간 암호화 통신(TLS 등)</li>
            <li>접속·질의·응답에 대한 상세 접근 기록·로그 보관</li>
            <li>단말 보안(백신, DLP, 매체 제어 등)</li>
            <li>금융보안원의 보안성 평가 및 금융감독원 심사를 통한 검증</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>5-3. 해외 AI 사업자와의 계약 조건</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>한국 금융당국(금융위·금감원 등)의 검사·자료 제출 요청에 협조할 의무</li>
            <li>데이터 처리 범위, 보존 기간, 국외 이전 여부를 명시</li>
            <li>보안 사고 발생 시 책임 소재·손해배상 범위 규정</li>
          </ul>
        </section>

        {/* 6. 제2차 이후 승인 현황 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            6. 제2차 이후 승인 현황
          </h2>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>6-1. 2024년 12월 – KB금융 그룹</h3>
          <p style={{ marginBottom: 16 }}>
            <strong>[팩트]</strong> KB국민은행, KB증권, KB손해보험, KB국민카드, KB라이프생명, KB캐피탈, KB저축은행, KB자산운용 등 KB금융 8개 계열사의 생성형 AI 서비스가 혁신금융서비스로 지정되었다.
          </p>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>6-2. 2025년 초 – MS 365 Copilot</h3>
          <p style={{ marginBottom: 16 }}>
            <strong>[팩트]</strong> 2025년 1분기, MS 365 Copilot을 내부 업무망에서 활용할 수 있도록 하는 혁신금융서비스가 지정되었고, 은행·보험·증권·저축은행·카드·캐피탈 등 26개 금융사가 대상이 되었다.
          </p>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>6-3. 2025년 6월 30일 – 내부시스템형 GenAI</h3>
          <p style={{ marginBottom: 16 }}>
            <strong>[팩트]</strong> SK텔레콤, 현대카드, 우리은행, 한국예탁결제원, 제이티친애저축은행, 한국평가데이터(3건), NH투자증권, 웰컴저축은행, 비씨카드(2건), 현대커머셜 등 9개사 13건이 추가로 혁신금융서비스로 지정되었다.
          </p>
        </section>

        {/* 7. 2025년 4분기 정규 제도화 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            7. 2025년 4분기: 정규 제도화 (로드맵 기준)
          </h2>

          <div style={{
            background: '#fffbeb',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            border: '1px solid #fde047',
          }}>
            이 장은 금융위 로드맵·설명자료에 기초한 '정책 설계 방향'을 정리한 것입니다. 실제 내용은 전자금융감독규정 개정안·시행 이후에 확정됩니다.
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>7-1. 로드맵 상의 의미</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>[계획]</strong> 샌드박스 기능: 제한된 수의 금융사·서비스에 대해 예외를 부여하고 성과·리스크를 관찰하는 실험장 역할</li>
            <li><strong>[계획]</strong> 정규 제도화 방향: 일정 기간 샌드박스 운용 → 효과·보안성 검증 후 → 일반 규정(전자금융감독규정)으로 편입</li>
            <li><strong>[계획]</strong> 목표 시점: 2025년 4분기 전후</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>7-2. 정규 제도에서 예상되는 큰 틀</h3>
          <ol style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li style={{ marginBottom: 12 }}>
              <strong>보안성 평가</strong>: 주요 CSP(Azure, AWS, GCP 등)에 대한 기본 보안성 평가를 먼저 해두고, 개별 금융사의 서비스는 이를 참고하여 추가·보완 평가를 하는 구조가 될 가능성
            </li>
            <li style={{ marginBottom: 12 }}>
              <strong>금융사 내부 요건</strong>: 내부 정보보호 체계(ISMS 수준 이상), CISO 및 전담 조직, AI 리스크 관리 정책, 데이터 거버넌스 등
            </li>
            <li style={{ marginBottom: 12 }}>
              <strong>신고·인가 절차</strong>: 샌드박스처럼 "건별 혁신금융서비스 지정"이 아니라, 정해진 보안요건·계약요건을 충족하는지 심사·신고하는 절차로 전환될 것으로 예상
            </li>
          </ol>
        </section>

        {/* 8. 실무 가이드 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            8. 실무 가이드
          </h2>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Q1. 우리 회사도 지금 준비해야 하나?</h3>
          <p style={{ marginBottom: 8 }}><strong>[Yes – 권고]</strong> 다음 중 하나라도 해당하면 2025년 중 준비 착수를 권장:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>2026년 전후로 생성형 AI 기반 상담·내부지원 시스템 도입 계획이 있는 경우</li>
            <li>주요 경쟁사가 이미 샌드박스 지정을 받았거나 PoC를 진행 중인 경우</li>
            <li>고객 접점(콜센터·모바일 앱 등)의 혁신이 시급한 경우</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Q2. 샌드박스 vs 정규 제도, 어느 쪽이 유리한가?</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>샌드박스 활용이 유리한 경우</strong>: 시장에서 "가장 먼저" 레퍼런스를 확보하고 싶은 선도 사업자, 내부 이해관계자 설득을 위한 '공식 허가'가 필요한 경우</li>
            <li><strong>정규 제도를 기다리는 것이 합리적인 경우</strong>: 추종자(fast follower) 전략을 택하는 중소형 금융사, 리스크 대비 당장 차별화 효과가 크지 않은 Use case 위주인 경우</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Q3. 어떤 역량이 필수인가?</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>법률·규제 해석</strong>: 해외 AI 사업자와의 계약서, 국외이전, 데이터 처리 목적·범위 등</li>
            <li><strong>보안·인프라</strong>: CSP 선정 및 아키텍처 설계, 망연계, 단말 보안, 로그·모니터링 체계</li>
            <li><strong>비즈니스·UX</strong>: 실제 고객·직원에게 가치를 주는 Use case 정의, 프롬프트 설계</li>
          </ul>
        </section>

        {/* 9. 향후 전망 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            9. 향후 전망
          </h2>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>9-1. 2단계 개선 – 가명정보 → 개인신용정보</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>[계획]</strong> 정부 로드맵은 1단계(현재)에서 가명정보 중심 AI 활용을 허용하고, 2단계에서 개인신용정보까지 처리 범위를 넓히는 특례를 검토한다고 밝히고 있다.</li>
            <li><strong>[전망]</strong> 빠르면 2025년 이후 일부 개인신용정보 기반 서비스에 특례가 허용될 수 있다.</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>9-2. 최종 목표 – 디지털 금융보안법 (가칭)</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>[계획]</strong> 금융위는 중장기적으로 「디지털 금융보안법(가칭)」 제정을 검토한다고 밝혔으며, 2024년 연구용역, 공청회 등을 로드맵에 포함시켰다.</li>
            <li><strong>[전망]</strong> 업계에서는 2027~2028년 전후를 하나의 시나리오로 보지만, 입법 일정은 정치·입법 환경에 따라 크게 변동 가능하다.</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>9-3. 철학적 전환 방향</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>세부 수단 중심 → <strong>목표·원칙 중심</strong>으로의 전환</li>
            <li>"이 방식만 지키면 면책"에서 "결과에 대한 책임(과징금 등)을 강화하고, 수단은 자율"로</li>
            <li>금융사 자율성·유연성은 확대되지만, 사고 시 책임과 제재 강도는 더 커질 가능성</li>
          </ul>
        </section>

        {/* 10. 부록 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
            10. 부록
          </h2>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>주요 법령·제도</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li><strong>금융혁신지원 특별법</strong> – 금융규제 샌드박스의 근거법</li>
            <li><strong>전자금융거래법 및 전자금융감독규정</strong> – 망분리·보안 의무 규정</li>
            <li><strong>개인정보 보호법</strong></li>
            <li><strong>신용정보의 이용 및 보호에 관한 법률</strong></li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>주요 참고 채널</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>금융위원회 보도자료: 금융위 홈페이지</li>
            <li>금융규제 샌드박스 포털: sandbox.fintech.or.kr</li>
            <li>규제정보포털: sandbox.go.kr</li>
            <li>금융보안원: 보안성 평가 관련 자료</li>
          </ul>
        </section>

        {/* About This Report */}
        <section style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
            About This Report
          </h2>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: '#6b7280' }}>
            <li>작성 기준 시점: 2025년 11월</li>
            <li>근거 자료: 금융위원회·금융감독원·금융보안원 공식 자료 및 주요 언론 보도</li>
            <li>본 보고서의 [팩트]·[계획]·[전망] 구분을 유지한 채 활용하는 것을 권장합니다.</li>
          </ul>
        </section>
      </div>
    </>
  );
};

export default FinanceAICasebookPage;
