/**
 * GQAI 배너 컴포넌트
 *
 * 내브바 하단에 고정 표시되는 배너
 */

import React from 'react';
import styled from '@emotion/styled';

const BannerContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
  padding: 0 20px;

  @media (max-width: 768px) {
    border-bottom: 1px solid #ddd;
    max-width: 100%;
    padding: 0 16px;
  }
`;

const BannerLink = styled.a`
  display: block;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`;

const BannerImage = styled.img`
  width: 70%;
  height: auto;
  display: block;
  margin: 0 auto;
`;

const CanvaBanner: React.FC = () => {
  return (
    <BannerContainer>
      <BannerLink
        href="https://gqai.kr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GQAI 방문하기"
      >
        <BannerImage
          src="/Blue Geometric Technology Linkedin Banner.png"
          alt="GQAI 생성형 AI 실전 강의"
          loading="lazy"
        />
      </BannerLink>
    </BannerContainer>
  );
};

export default CanvaBanner;
