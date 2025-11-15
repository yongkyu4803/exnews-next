import React from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Head from 'next/head';
import PasswordProtection from '@/components/PasswordProtection';

const BusinessContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #dbeafe 100%);
  font-family: 'Pretendard', -apple-system, sans-serif;
`;

const Header = styled.header`
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 32px;
  font-weight: 700;
  color: white;
  cursor: pointer;

  span {
    color: #fbbf24;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px;
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 80px;
`;

const MainTitle = styled.h1`
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 48px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 24px;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const SubTitle = styled.p`
  font-size: 24px;
  color: #3b82f6;
  font-weight: 600;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ExperienceBadge = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #3b82f6;
  border-radius: 50px;
  padding: 12px 32px;
  font-size: 18px;
  font-weight: 700;
  color: #1e40af;
  margin-top: 24px;

  @media (max-width: 768px) {
    font-size: 16px;
    padding: 10px 24px;
  }
`;

const ContentSection = styled.section`
  margin-bottom: 60px;
`;

const SectionTitle = styled.h2`
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 32px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 3px solid #3b82f6;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const CardTitle = styled.h3`
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 24px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const CardContent = styled.div`
  font-size: 17px;
  line-height: 1.9;
  color: #334155;

  p {
    margin-bottom: 16px;
  }

  strong {
    color: #1e40af;
    font-weight: 700;
  }

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const HighlightBox = styled.div`
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-left: 4px solid #3b82f6;
  padding: 24px;
  margin: 24px 0;
  border-radius: 8px;

  p {
    margin: 8px 0;
    font-size: 16px;
    color: #1e40af;
    line-height: 1.8;
  }

  strong {
    font-weight: 700;
    font-size: 18px;
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 24px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ColumnCard = styled.div`
  background: #f8fafc;
  padding: 24px;
  border-radius: 12px;
  border: 2px solid #e0f2fe;

  h4 {
    font-family: 'KimjungchulGothic', var(--gqai-font-display);
    font-size: 20px;
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 16px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 8px 0;
    color: #334155;
    font-size: 16px;
    line-height: 1.7;
    display: flex;
    align-items: flex-start;
    gap: 8px;

    &:before {
      content: '•';
      color: #3b82f6;
      font-weight: 700;
      font-size: 20px;
    }
  }
`;

const FrameworkSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 24px 0;
`;

const FrameworkCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 2px solid #bfdbfe;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  h4 {
    font-family: 'KimjungchulGothic', var(--gqai-font-display);
    font-size: 18px;
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 12px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 6px 0;
    color: #334155;
    font-size: 15px;
    line-height: 1.6;
    display: flex;
    align-items: flex-start;
    gap: 8px;

    &:before {
      content: '▸';
      color: #3b82f6;
      font-weight: 700;
    }
  }
`;

const DifferentiatorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin: 24px 0;
`;

const DifferentiatorCard = styled.div`
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #3b82f6;
  text-align: center;

  h4 {
    font-family: 'KimjungchulGothic', var(--gqai-font-display);
    font-size: 20px;
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 12px;
  }

  p {
    font-size: 15px;
    color: #334155;
    line-height: 1.7;
    margin: 0;
  }
`;

const CTASection = styled.section`
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  border-radius: 24px;
  padding: 60px 40px;
  text-align: center;
  color: white;
  margin-top: 80px;

  @media (max-width: 768px) {
    padding: 40px 24px;
  }
`;

const CTATitle = styled.h2`
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const CTADescription = styled.p`
  font-size: 20px;
  line-height: 1.8;
  margin-bottom: 40px;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const CTAButton = styled.button`
  background: white;
  color: #1e40af;
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 20px;
  font-weight: 700;
  padding: 18px 48px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    font-size: 18px;
    padding: 16px 32px;
  }
`;

const BusinessPage: React.FC = () => {
  const router = useRouter();

  return (
    <PasswordProtection>
      <Head>
        <title>GQAI 비즈니스 모델 - 정책환경 분석 전문 컨설팅</title>
        <meta name="description" content="14년 정책 실무 경험 기반의 GQAI 입법영향 평가 프레임워크와 솔루션" />
      </Head>

      <BusinessContainer>
        <Header>
          <Logo onClick={() => router.push('/')}>
            GQ<span>AI</span>
          </Logo>
        </Header>

        <MainContent>
          <HeroSection>
            <MainTitle>GQAI 비즈니스 모델</MainTitle>
            <SubTitle>불확실한 정책환경을 판단 가능한 수준으로</SubTitle>
            <ExperienceBadge>
              🎓 국회 보좌진 8년 + 정치부 기자 2년 + 기업 대관 3년 = 14년 정책 실무 경험
            </ExperienceBadge>
          </HeroSection>

          <ContentSection>
            <SectionTitle>💎 핵심 가치제안</SectionTitle>
            <Card>
              <CardContent>
                <p style={{ fontSize: '19px', fontWeight: '600', color: '#1e40af', marginBottom: '24px' }}>
                  GQAI는 불확실한 정책환경을 기업이 판단 가능한 수준으로 전환합니다.
                </p>
                <p>
                  14년간의 정책 실무 경험을 바탕으로, 입법 과정의 <strong>'해상도 낮은 프로세스'</strong>를
                  구조화된 분석 변수로 만들고, 기업이 실행 가능한 대응전략을 도출합니다.
                </p>
              </CardContent>
            </Card>
          </ContentSection>

          <ContentSection>
            <SectionTitle>🤖 AI의 역할: 전문가 판단의 효율화</SectionTitle>
            <Card>
              <CardContent>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', marginBottom: '20px' }}>
                  AI는 전문가 판단을 대체하지 않고 보조합니다.
                </p>

                <TwoColumnGrid>
                  <ColumnCard>
                    <h4>🤖 AI가 수행하는 작업</h4>
                    <ul>
                      <li>관련 법안, 국회 회의록, 정책 뉴스 자동 수집 및 분류</li>
                      <li>이해관계자 네트워크 맵핑</li>
                      <li>과거 유사 법안 사례 검색 및 패턴 분석</li>
                    </ul>
                  </ColumnCard>

                  <ColumnCard>
                    <h4>👨‍💼 전문가가 수행하는 작업</h4>
                    <ul>
                      <li>수집된 정보의 정치적 맥락 해석</li>
                      <li>각 변수의 실질적 영향력 평가</li>
                      <li>최종 판단 및 전략 수립</li>
                    </ul>
                  </ColumnCard>
                </TwoColumnGrid>

                <HighlightBox>
                  <p><strong>결과:</strong> 분석 속도는 향상되고, 판단의 정확도는 경험적 직관에 의존합니다.</p>
                </HighlightBox>
              </CardContent>
            </Card>
          </ContentSection>

          <ContentSection>
            <SectionTitle>📊 GQAI 입법영향 평가 프레임워크</SectionTitle>
            <Card>
              <CardContent>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', marginBottom: '24px' }}>
                  5가지 핵심 분석 영역으로 법안의 통과 가능성과 기업 영향도를 평가합니다.
                </p>

                <FrameworkSection>
                  <FrameworkCard>
                    <h4>1️⃣ 입법 환경 분석</h4>
                    <ul>
                      <li>정책적 실현가능성 평가</li>
                      <li>정치적 리스크 요인 식별 (특혜 논란, 이념 갈등 등)</li>
                      <li>상위법 및 관련 법령과의 정합성 검토</li>
                    </ul>
                  </FrameworkCard>

                  <FrameworkCard>
                    <h4>2️⃣ 국회 논의 과정 분석</h4>
                    <ul>
                      <li>소관 상임위원회 진행 상황 및 일정</li>
                      <li>발의 의원의 의지와 정치적 영향력</li>
                      <li>경쟁 법안 존재 여부 및 내용 비교</li>
                    </ul>
                  </FrameworkCard>

                  <FrameworkCard>
                    <h4>3️⃣ 정부 정책 방향 평가</h4>
                    <ul>
                      <li>현 정부의 중점 추진 과제 연관성</li>
                      <li>관련 부처의 관심도 및 입장</li>
                      <li>정부 입법 전환 가능성</li>
                    </ul>
                  </FrameworkCard>

                  <FrameworkCard>
                    <h4>4️⃣ 이해관계자 갈등 분석</h4>
                    <ul>
                      <li>법안 적용 대상 범위 (산업 전반 vs 특정 분야)</li>
                      <li>찬반 이해관계자 구도 및 영향력</li>
                      <li>경쟁 업체의 대응 방향</li>
                    </ul>
                  </FrameworkCard>

                  <FrameworkCard>
                    <h4>5️⃣ 사회적 여론 환경</h4>
                    <ul>
                      <li>언론 보도 프레임 및 여론 방향</li>
                      <li>시민단체, 전문가 그룹의 입장</li>
                      <li>공론화 시 예상되는 쟁점</li>
                    </ul>
                  </FrameworkCard>
                </FrameworkSection>

                <HighlightBox>
                  <p><strong>각 영역별 평가 결과를 종합하여 법안 통과 시기, 가능성, 기업 영향도를 판단합니다.</strong></p>
                </HighlightBox>
              </CardContent>
            </Card>
          </ContentSection>

          <ContentSection>
            <SectionTitle>🎯 제공 솔루션</SectionTitle>
            <Card>
              <CardContent>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af', marginBottom: '24px' }}>
                  분석 결과를 바탕으로 3가지 방향의 전략을 제시합니다.
                </p>

                <HighlightBox>
                  <p><strong>1. 입법 대응 전략</strong></p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0' }}>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      법안 진행 단계별 모니터링 및 대응 시나리오
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      기업 내부 의사결정 지원 (진입/철수/지연 판단)
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      핵심 변수 관리 방안 및 타임라인
                    </li>
                  </ul>
                </HighlightBox>

                <HighlightBox>
                  <p><strong>2. 비입법 해결 방안</strong></p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0' }}>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      정부 정책, 예산사업 등 대체 경로 탐색
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      자율규제, 가이드라인 등 soft law 활용 방안
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      행정규칙 개정을 통한 해결 가능성
                    </li>
                  </ul>
                </HighlightBox>

                <HighlightBox>
                  <p><strong>3. 리스크 관리 및 커뮤니케이션</strong></p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0' }}>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      부정적 입법 진행 시 영향 최소화 전략
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      이해관계자 대상 논리 개발 및 메시지 설계
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      언론 대응 및 여론 관리 방안
                    </li>
                  </ul>
                </HighlightBox>

                <p style={{ marginTop: '24px', fontSize: '15px', color: '#64748b', fontStyle: 'italic' }}>
                  ※ GQAI는 정책환경 분석 및 전략 컨설팅을 제공하며, 국회의원이나 공무원에 대한 직접 접촉은 기업 내부 조직이 수행합니다.
                </p>
              </CardContent>
            </Card>
          </ContentSection>

          <ContentSection>
            <SectionTitle>🤝 협력 체계</SectionTitle>
            <Card>
              <CardTitle>⚖️ 로펌 협업</CardTitle>
              <CardContent>
                <HighlightBox>
                  <p><strong>현재 협력 모델</strong></p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0' }}>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      법률 해석 및 검토가 필요한 경우 협력 로펌을 통해 수행
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      GQAI는 정책 분석, 로펌은 법률 검토로 역할 분담
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      통합 솔루션 제공을 통한 고객 편의성 제고
                    </li>
                  </ul>
                </HighlightBox>

                <HighlightBox style={{ marginTop: '20px' }}>
                  <p><strong>장기 발전 방향: 법률지원 조직 확장</strong></p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0' }}>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      정책 컨설팅 역량 검증 후 법무법인 설립 또는 인수 검토
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      정책분석-법률검토-전략실행을 아우르는 통합 서비스 체계 구축
                    </li>
                    <li style={{ padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span>
                      원스톱 정책법무 솔루션 제공 플랫폼으로 성장
                    </li>
                  </ul>
                </HighlightBox>
              </CardContent>
            </Card>
          </ContentSection>

          <ContentSection>
            <SectionTitle>⭐ 차별화 요소</SectionTitle>
            <DifferentiatorGrid>
              <DifferentiatorCard>
                <h4>🎓 전문성</h4>
                <p>14년 정책 실무 경력 기반의 현장 중심 판단</p>
              </DifferentiatorCard>

              <DifferentiatorCard>
                <h4>⚡ 효율성</h4>
                <p>AI 활용으로 정보 수집 및 분석 시간 대폭 단축</p>
              </DifferentiatorCard>

              <DifferentiatorCard>
                <h4>🎯 실행가능성</h4>
                <p>입법 추진뿐 아니라 비입법 대안까지 제시하는 통합 솔루션</p>
              </DifferentiatorCard>

              <DifferentiatorCard>
                <h4>💎 투명성</h4>
                <p>국회와 정부 의사결정그룹이 수용 가능한 논리 기반 전략</p>
              </DifferentiatorCard>

              <DifferentiatorCard>
                <h4>🚀 확장성</h4>
                <p>로펌 협업을 통한 현재, 법률지원 조직 내재화를 통한 미래 경쟁력 확보</p>
              </DifferentiatorCard>
            </DifferentiatorGrid>
          </ContentSection>

          <CTASection>
            <CTATitle>정책환경 분석의 새로운 기준,<br />GQAI와 함께하세요</CTATitle>
            <CTADescription>
              14년 실무 경험과 AI 기술의 결합으로<br />
              불확실성을 판단 가능한 수준으로 만듭니다.
            </CTADescription>
            <CTAButton onClick={() => window.open('https://gqai.kr', '_blank')}>
              GQAI 문의하기 →
            </CTAButton>
          </CTASection>
        </MainContent>
      </BusinessContainer>
    </PasswordProtection>
  );
};

export default BusinessPage;
