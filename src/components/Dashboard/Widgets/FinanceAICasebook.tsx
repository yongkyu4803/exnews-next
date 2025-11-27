import React from 'react';
import { useRouter } from 'next/router';

// interface TimelineItem {
//   date: string;
//   event: string;
//   meaning: string;
//   type: 'fact' | 'plan' | 'forecast';
// }

// interface CaseItem {
//   company: string;
//   service: string;
//   purpose: string;
//   type: 'bank' | 'securities' | 'insurance' | 'card';
// }

const FinanceAICasebook: React.FC = () => {
  const router = useRouter();
  // const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'cases'>('summary');
  // const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);

  // // 핵심 통계
  // const stats = {
  //   totalApplications: 141,
  //   approvedCompanies: 74,
  //   firstApprovalDate: '2024-11-27',
  //   targetRegulation: '2025년 4분기',
  // };

  // // 주요 타임라인 (최신 순)
  // const timeline: TimelineItem[] = [
  //   {
  //     date: '2025년 6월 30일',
  //     event: 'SKT·현대카드·우리은행 등 9개사 13건 승인',
  //     meaning: '내부 업무시스템과 결합된 GenAI 활용 확산',
  //     type: 'fact',
  //   },
  //   {
  //     date: '2025년 1분기',
  //     event: 'MS 365 Copilot 기반 26개 금융사 승인',
  //     meaning: '생산성 SaaS+GenAI 조합이 금융 내부망에 본격 도입',
  //     type: 'fact',
  //   },
  //   {
  //     date: '2024년 12월',
  //     event: 'KB금융 8개 계열사 GenAI 서비스 지정',
  //     meaning: '그룹 단위 GenAI 플랫폼 도입 가속화',
  //     type: 'fact',
  //   },
  //   {
  //     date: '2024년 11월 27일',
  //     event: '생성형 AI 1차 승인 (9개사 10건)',
  //     meaning: '최초 금융권 내부망 상용 GenAI 활용 허용',
  //     type: 'fact',
  //   },
  //   {
  //     date: '2025년 4분기',
  //     event: '전자금융감독규정 개정 통한 정규 제도화',
  //     meaning: '샌드박스에서 일반 규정 체계로 전환 목표',
  //     type: 'plan',
  //   },
  // ];

  // // 주요 승인 사례
  // const cases: CaseItem[] = [
  //   { company: '신한은행', service: 'AI 은행원, 금융지식 Q&A', purpose: '창구·콜센터 상담 지원', type: 'bank' },
  //   { company: 'KB국민은행', service: '금융상담 에이전트', purpose: '자연어 기반 고객 상담', type: 'bank' },
  //   { company: 'NH투자증권', service: '투자 리서치 요약', purpose: 'PB 상담 효율화', type: 'securities' },
  //   { company: '교보생명', service: '보험 설계 AI 서포터', purpose: '설계사 보장분석 지원', type: 'insurance' },
  //   { company: 'KB국민카드', service: '카드생활 메이트', purpose: '맞춤형 카드 추천', type: 'card' },
  // ];

  // const getTypeColor = (type: string) => {
  //   switch (type) {
  //     case 'fact': return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
  //     case 'plan': return { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' };
  //     case 'forecast': return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
  //     case 'bank': return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
  //     case 'securities': return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
  //     case 'insurance': return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
  //     case 'card': return { bg: '#fdf4ff', color: '#86198f', border: '#f5d0fe' };
  //     default: return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  //   }
  // };

  // const getTypeLabel = (type: string) => {
  //   switch (type) {
  //     case 'fact': return '팩트';
  //     case 'plan': return '계획';
  //     case 'forecast': return '전망';
  //     case 'bank': return '은행';
  //     case 'securities': return '증권';
  //     case 'insurance': return '보험';
  //     case 'card': return '카드';
  //     default: return type;
  //   }
  // };

  return (
    <div style={{
      background: 'var(--gqai-bg-card)',
      borderRadius: 'var(--gqai-radius-lg)',
      boxShadow: 'var(--gqai-shadow-sm)',
      padding: 'var(--gqai-space-lg)',
      height: '100%',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#1e40af',
          margin: 0,
          fontFamily: 'KimjungchulGothic, var(--gqai-font-display)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          🔥 트렌딩 토픽
        </h3>
      </div>

      {/* 토픽 타이틀 - 전체보기 버튼 포함 */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        borderRadius: 'var(--gqai-radius-md)',
        padding: '20px',
        color: 'white',
        position: 'relative',
      }}>
        <div style={{
          fontSize: 12,
          opacity: 0.9,
          marginBottom: 6,
        }}>
          금융 규제 동향
        </div>
        <div style={{
          fontSize: 20,
          fontWeight: 700,
          lineHeight: 1.4,
          marginBottom: 8,
        }}>
          금융권 생성형 AI 도입 규제 케이스북
        </div>
        <div style={{
          fontSize: 12,
          opacity: 0.8,
          marginBottom: 16,
        }}>
          2024-2025 기준 | 금융위원회 로드맵 기반
        </div>

        {/* 전체보기 버튼 */}
        <button
          onClick={() => router.push('/casebook/finance-ai')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: '#1e40af',
            background: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          }}
        >
          전체보기
          <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>

      {/* 탭 네비게이션 - 주석처리 */}
      {/*
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 12,
      }}>
        {[
          { key: 'summary', label: '요약' },
          { key: 'timeline', label: '타임라인' },
          { key: 'cases', label: '승인 사례' },
        ].map((tab) => (
          <button
            key={tab.key}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 500,
              color: activeTab === tab.key ? '#1e40af' : '#6b7280',
              background: activeTab === tab.key ? '#eff6ff' : 'transparent',
              border: activeTab === tab.key ? '1px solid #bfdbfe' : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      */}

      {/* 탭 콘텐츠 - 주석처리 */}
      {/*
      <div style={{ minHeight: 180 }}>
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              <div style={{
                padding: 12,
                background: '#f0fdf4',
                borderRadius: 8,
                border: '1px solid #bbf7d0',
              }}>
                <div style={{ fontSize: 11, color: '#166534', marginBottom: 4 }}>샌드박스 신청</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>{stats.totalApplications}건</div>
                <div style={{ fontSize: 10, color: '#15803d' }}>74개 금융사</div>
              </div>
              <div style={{
                padding: 12,
                background: '#eff6ff',
                borderRadius: 8,
                border: '1px solid #bfdbfe',
              }}>
                <div style={{ fontSize: 11, color: '#1e40af', marginBottom: 4 }}>정규 제도화 목표</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e40af' }}>2025</div>
                <div style={{ fontSize: 10, color: '#2563eb' }}>4분기 규정 개정</div>
              </div>
            </div>

            <div style={{
              padding: 14,
              background: '#fefce8',
              borderRadius: 8,
              border: '1px solid #fde047',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#854d0e', marginBottom: 8 }}>
                💡 핵심 인사이트
              </div>
              <div style={{ fontSize: 13, color: '#713f12', lineHeight: 1.6 }}>
                2025년 이후 금융사가 보안요건·계약요건을 충족하면, 망분리 환경에서도 상용 GenAI 활용이
                <span style={{ fontWeight: 600 }}> '일반적인 옵션'</span>이 될 가능성이 높습니다.
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setIsRoadmapOpen(!isRoadmapOpen)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  📋 정부 로드맵 3단계
                </span>
                <span style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  transform: isRoadmapOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}>
                  ▼
                </span>
              </button>
              {isRoadmapOpen && (
                <div style={{ padding: '0 14px 14px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { step: '1단계', label: '샌드박스', status: '진행중' },
                      { step: '2단계', label: '특례 확대', status: '예정' },
                      { step: '3단계', label: '디지털 금융보안법', status: '예정' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          background: idx === 0 ? '#dbeafe' : 'white',
                          borderRadius: 6,
                          border: `1px solid ${idx === 0 ? '#93c5fd' : '#e2e8f0'}`,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{item.step}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: idx === 0 ? '#1e40af' : '#475569' }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {timeline.slice(0, 5).map((item, idx) => {
              const typeStyle = getTypeColor(item.type);
              return (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    background: 'white',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    borderLeft: `3px solid ${typeStyle.border}`,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                      {item.date}
                    </span>
                    <span style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: typeStyle.bg,
                      color: typeStyle.color,
                      fontWeight: 600,
                    }}>
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                    {item.event}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                    {item.meaning}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'cases' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cases.map((item, idx) => {
              const typeStyle = getTypeColor(item.type);
              return (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    background: 'white',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e40af' }}>
                      {item.company}
                    </span>
                    <span style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: typeStyle.bg,
                      color: typeStyle.color,
                      fontWeight: 600,
                    }}>
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                    📱 {item.service}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    🎯 {item.purpose}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      */}
    </div>
  );
};

export default FinanceAICasebook;
