/**
 * 스티비 뉴스레터 구독 버튼 컴포넌트
 *
 * CanvaBanner 아래에 표시되는 미니멀 디자인 구독 버튼
 */

import React from 'react';
import styled from '@emotion/styled';
import { MailOutlined } from '@ant-design/icons';

// 스티비 구독 폼 URL (나중에 실제 URL로 변경)
const STIBEE_URL = 'https://page.stibee.com/subscriptions/TEMP';

const ButtonContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const StibeeButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 400px;
  width: 100%;
  justify-content: center;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 10px 20px;
  }
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const NewsletterButton: React.FC = () => {
  return (
    <ButtonContainer>
      <StibeeButton
        href={STIBEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="뉴스레터 구독하기"
      >
        <IconWrapper>
          <MailOutlined />
        </IconWrapper>
        뉴스레터 구독
      </StibeeButton>
    </ButtonContainer>
  );
};

export default NewsletterButton;
