/**
 * Admin Navigation Component
 * 관리자 페이지 공통 네비게이션 바
 */

import React from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';

const NavBar = styled.nav`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 0;
  }
`;

const NavBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  color: white;
  font-family: 'Cafe24Anemone', sans-serif;
  font-size: 24px;
  font-weight: 700;

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 20px;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    gap: 0;
  }
`;

const NavLink = styled.button<{ active?: boolean }>`
  padding: 12px 20px;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.25)' : 'transparent'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    width: 100%;
    text-align: left;
    border-radius: 0;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    ${props => props.active && `
      background: rgba(255, 255, 255, 0.15);
      border-left: 4px solid white;
    `}
  }
`;

interface AdminNavProps {
  currentPage?: 'daily_memo' | 'analytics';
}

const AdminNav: React.FC<AdminNavProps> = ({ currentPage = 'daily_memo' }) => {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <NavBar>
      <NavContainer>
        <NavBrand>
          🔐 관리자 페이지
        </NavBrand>
        <NavLinks>
          <NavLink
            active={currentPage === 'daily_memo'}
            onClick={() => handleNavigate('/admin/daily_memo')}
          >
            📋 오늘의 메모
          </NavLink>
          <NavLink
            active={currentPage === 'analytics'}
            onClick={() => handleNavigate('/admin/analytics')}
          >
            📊 통계 대시보드
          </NavLink>
        </NavLinks>
      </NavContainer>
    </NavBar>
  );
};

export default AdminNav;
