import React from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import Head from 'next/head';

const ComingSoonContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #dbeafe 100%);
  display: flex;
  flex-direction: column;
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
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
`;

const ContentBox = styled.div`
  max-width: 600px;
  background: white;
  border-radius: 24px;
  padding: 60px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  text-align: center;

  @media (max-width: 768px) {
    padding: 40px 24px;
  }
`;

const Icon = styled.div`
  font-size: 80px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    font-size: 60px;
    margin-bottom: 24px;
  }
`;

const Title = styled.h1`
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 36px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 24px;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Description = styled.p`
  font-size: 18px;
  color: #64748b;
  line-height: 1.8;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const ContactSection = styled.div`
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #3b82f6;
  border-radius: 16px;
  padding: 32px;
  margin-top: 32px;

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const ContactTitle = styled.h2`
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 20px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 16px;
`;

const ContactText = styled.p`
  font-size: 16px;
  color: #334155;
  margin-bottom: 20px;
  line-height: 1.7;
`;

const EmailBox = styled.div`
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  border: 2px solid #bfdbfe;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1e40af;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  @media (max-width: 768px) {
    font-size: 16px;
    padding: 14px 20px;
  }
`;

const BackButton = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 18px;
  font-weight: 700;
  padding: 16px 40px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  margin-top: 32px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  @media (max-width: 768px) {
    font-size: 16px;
    padding: 14px 32px;
  }
`;

const ComingSoonPage: React.FC = () => {
  const router = useRouter();

  const handleEmailClick = () => {
    window.location.href = 'mailto:gq_newslens@gmail.com';
  };

  return (
    <>
      <Head>
        <title>서비스 준비중 - GQAI</title>
        <meta name="description" content="GQAI 법안 통과 예측 서비스를 준비하고 있습니다." />
      </Head>

      <ComingSoonContainer>
        <Header>
          <Logo onClick={() => router.push('/')}>
            GQ<span>AI</span>
          </Logo>
        </Header>

        <MainContent>
          <ContentBox>
            <Icon>🚀</Icon>
            <Title>서비스를 준비하고 있습니다</Title>
            <Description>
              법안 통과 시점 예측 서비스는 현재 개발 중이며,<br />
              더 나은 서비스로 여러분을 찾아뵙겠습니다.
            </Description>

            <ContactSection>
              <ContactTitle>🎯 베타 테스트에 참여하고 싶으신가요?</ContactTitle>
              <ContactText>
                베타 서비스의 테스트를 원하시면<br />
                아래 이메일로 연락 주시기 바랍니다.
              </ContactText>
              <EmailBox onClick={handleEmailClick}>
                <span>📧</span>
                <span>gq_newslens@gmail.com</span>
              </EmailBox>
            </ContactSection>

            <BackButton onClick={() => router.push('/dashboard')}>
              대시보드로 돌아가기
            </BackButton>
          </ContentBox>
        </MainContent>
      </ComingSoonContainer>
    </>
  );
};

export default ComingSoonPage;
