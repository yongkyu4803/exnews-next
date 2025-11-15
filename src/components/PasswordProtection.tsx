import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';

const PasswordContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pretendard', -apple-system, sans-serif;
  padding: 20px;
`;

const PasswordBox = styled.div`
  background: white;
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  max-width: 480px;
  width: 100%;
  text-align: center;

  @media (max-width: 768px) {
    padding: 32px 24px;
  }
`;

const Icon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-family: 'KimjungchulGothic', var(--gqai-font-display);
  font-size: 28px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Description = styled.p`
  font-size: 16px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 32px;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  font-size: 16px;
  border: 2px solid #e0f2fe;
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
  font-family: 'Pretendard', -apple-system, sans-serif;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #cbd5e1;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  margin-top: 16px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  font-family: 'KimjungchulGothic', var(--gqai-font-display);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 16px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
`;

const BackButton = styled.button`
  margin-top: 24px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: 2px solid #e0f2fe;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #f8fafc;
    border-color: #bfdbfe;
  }
`;

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ children }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('gqai_auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Use the same admin password from the admin page
    if (password === 'exnews2024!') {
      sessionStorage.setItem('gqai_auth', 'authenticated');
      setIsAuthenticated(true);
    } else {
      setError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <PasswordContainer>
        <PasswordBox>
          <Icon>⏳</Icon>
          <Title>로딩 중...</Title>
        </PasswordBox>
      </PasswordContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <PasswordContainer>
        <PasswordBox>
          <Icon>🔒</Icon>
          <Title>대외비 페이지</Title>
          <Description>
            이 페이지는 관리자 전용 페이지입니다.<br />
            비밀번호를 입력해 주세요.
          </Description>

          <form onSubmit={handleSubmit}>
            <PasswordInput
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <SubmitButton type="submit" disabled={!password}>
              확인
            </SubmitButton>
          </form>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <BackButton onClick={handleBack}>
            대시보드로 돌아가기
          </BackButton>
        </PasswordBox>
      </PasswordContainer>
    );
  }

  return <>{children}</>;
};

export default PasswordProtection;
