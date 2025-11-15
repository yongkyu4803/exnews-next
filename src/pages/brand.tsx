import React from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Head from 'next/head';
import PasswordProtection from '@/components/PasswordProtection';

const BrandContainer = styled.div`
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

const TagLine = styled.p`
  font-size: 18px;
  color: #64748b;
  line-height: 1.8;

  @media (max-width: 768px) {
    font-size: 16px;
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
`;

const VariableList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin: 24px 0;
`;

const VariableItem = styled.div`
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid #e0f2fe;
  font-size: 15px;
  color: #1e40af;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    background: #eff6ff;
    border-color: #3b82f6;
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

const BrandPage: React.FC = () => {
  const router = useRouter();

  return (
    <PasswordProtection>
      <Head>
        <title>이 법안 언제 통과될까? - GQAI</title>
        <meta name="description" content="불확실한 정책환경을 판단 가능한 수준으로 만드는 GQAI의 접근법" />
      </Head>

      <BrandContainer>
        <Header>
          <Logo onClick={() => router.push('/')}>
            GQ<span>AI</span>
          </Logo>
        </Header>

        <MainContent>
          <HeroSection>
            <MainTitle>이 법안 언제 통과될까?</MainTitle>
            <SubTitle>불가능한 질문에 대한 현실적인 접근</SubTitle>
            <TagLine>
              법안 통과 시점 예측은 현실적으로 불가능합니다.<br />
              하지만 GQAI는 불확실성을 판단 가능한 수준으로 만듭니다.
            </TagLine>
          </HeroSection>

          <ContentSection>
            <SectionTitle>📊 왜 예측이 불가능한가?</SectionTitle>
            <Card>
              <CardTitle>🔢 다차 방정식의 복잡성</CardTitle>
              <CardContent>
                <p>국회 일정에는 고려해야 할 변수가 매우 많습니다. 일반적인 조건들을 살펴본다면 최소한의 시기는 예측 가능하지만, 완벽한 예측은 불가능합니다.</p>

                <VariableList>
                  <VariableItem>📋 법안 난이도</VariableItem>
                  <VariableItem>⚖️ 처리 절차</VariableItem>
                  <VariableItem>💪 발의의원의 의지</VariableItem>
                  <VariableItem>📅 국회 일정</VariableItem>
                  <VariableItem>🤝 이해관계자 연관성</VariableItem>
                  <VariableItem>🏛️ 정부 정책방향</VariableItem>
                  <VariableItem>👥 사회적 관심도</VariableItem>
                </VariableList>

                <HighlightBox>
                  <p><strong>이 정도만으로도 다차 방정식이며,</strong></p>
                  <p>합리적이지 않은 '휴먼 게이트'가 불확실성을 더욱 가중시킵니다.</p>
                </HighlightBox>
              </CardContent>
            </Card>

            <Card>
              <CardTitle>🎯 발의의 다양한 목적</CardTitle>
              <CardContent>
                <p>법안이 발의되고 국회에서 논의된다는 것이 반드시 입법적 해결을 의미하지는 않습니다. <strong>발의 자체가 목적인 법안이 상당합니다.</strong></p>

                <p>입법 논의는 특정 주제에 대한 사회적 관심을 높이고 다른 해법을 공론화하는 계기가 됩니다. 입법적 해결 외에도 국회와 정부가 선택할 수 있는 방법은 많습니다.</p>

                <HighlightBox>
                  <p>💡 정부 입법</p>
                  <p>💡 정책 및 예산사업</p>
                  <p>💡 기타 다양한 행정적 해결방안</p>
                </HighlightBox>
              </CardContent>
            </Card>
          </ContentSection>

          <ContentSection>
            <SectionTitle>🏢 기업이 직면한 도전</SectionTitle>
            <Card>
              <CardTitle>⚠️ 정책환경 불확실성</CardTitle>
              <CardContent>
                <p>중요한 것은 제도 개선을 바라보는 <strong>현장과 국회·정부의 시간이 다르다</strong>는 점입니다.</p>

                <HighlightBox>
                  <p>❌ 경제적 효율이 가장 높은 방법만 선택되지 않습니다</p>
                  <p>❌ 국회와 정부의 현장 이해도가 기업이 원하는 수준에 미치지 못합니다</p>
                  <p>❌ '해상도 낮은 입법 처리 프로세스'가 사업 방향성 결정의 핵심 장애요인이 됩니다</p>
                </HighlightBox>

                <p style={{ marginTop: '24px' }}>이런 상황에서 기업은 <strong>'정책환경 해소의 불확실성'</strong>으로 어려움을 겪습니다.</p>
              </CardContent>
            </Card>
          </ContentSection>

          <ContentSection>
            <SectionTitle>✅ 좋은 판단의 기준</SectionTitle>
            <Card>
              <CardTitle>🎯 사업하기 좋은 정책환경을 위한 조건</CardTitle>
              <CardContent>
                <p>사업하기 좋은 정책환경을 만들기 위한 기업의 노력은 <strong>'좋은 판단'</strong>에서 출발해야 합니다.</p>

                <p>'좋은 판단'을 위해서는 정책환경 전반의 다양한 변수들이 어떻게 상호작용하는지 제대로 파악해야 합니다.</p>

                <HighlightBox>
                  <p><strong>'좋은 판단'의 4가지 기준</strong></p>
                </HighlightBox>

                <VariableList>
                  <VariableItem>🌟 사회가 원하는 공익에 부합하는가</VariableItem>
                  <VariableItem>⚖️ 의사결정그룹이 결정하기에 합법적인가</VariableItem>
                  <VariableItem>🤝 이해관계자 절대다수가 수용 가능한가</VariableItem>
                  <VariableItem>🏛️ 정책 집행기관에서 실행 가능한가</VariableItem>
                </VariableList>

                <p style={{ marginTop: '24px', fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                  국회에서 입법이 성공한다는 것, 기업이 원하는 정책환경이 제도화된다는 것은<br />
                  이런 조건들이 조화롭게 갖춰졌을 때 이뤄집니다.
                </p>
              </CardContent>
            </Card>
          </ContentSection>

          <ContentSection>
            <SectionTitle>🚀 GQAI의 솔루션</SectionTitle>
            <Card>
              <CardTitle>💡 불확실성을 판단 가능한 수준으로</CardTitle>
              <CardContent>
                <p style={{ fontSize: '19px', fontWeight: '600', color: '#1e40af', marginBottom: '24px' }}>
                  GQAI는 불확실한 정책환경을 기업이 판단 가능한 수준으로 만듭니다.
                </p>

                <VariableList>
                  <VariableItem>
                    📊 입법 처리의 '해상도 낮은 프로세스'를<br />분석 가능한 변수로 전환
                  </VariableItem>
                  <VariableItem>
                    🔮 중장기 정책환경이 기업활동에 미칠<br />영향을 시나리오로 제시
                  </VariableItem>
                  <VariableItem>
                    🎯 국회와 정부 의사결정그룹이 수용 가능한<br />논리로 대응전략 도출
                  </VariableItem>
                </VariableList>
              </CardContent>
            </Card>
          </ContentSection>

          <CTASection>
            <CTATitle>정책환경의 불확실성,<br />이제 GQAI와 함께 해결하세요</CTATitle>
            <CTADescription>
              복잡한 입법 프로세스를 이해하고,<br />
              데이터 기반의 합리적인 의사결정을 지원합니다.
            </CTADescription>
            <CTAButton onClick={() => router.push('/business')}>
              비즈니스 모델 자세히 보기 →
            </CTAButton>
          </CTASection>
        </MainContent>
      </BrandContainer>
    </PasswordProtection>
  );
};

export default BrandPage;
