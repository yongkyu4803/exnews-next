import React from 'react';
import { useRouter } from 'next/router';
import { HomeOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

const NavContainer = styled.nav`
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
`;

const NavItem = styled.button<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 33.33%;
  height: 100%;
  border: none;
  background: none;
  color: ${props => props.active ? '#1a4b8c' : '#666'};
  font-size: 12px;
  gap: 4px;
  
  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

export default function BottomNav() {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <NavContainer>
      <NavItem 
        active={currentPath === '/'} 
        onClick={() => router.push('/')}
      >
        <HomeOutlined style={{ fontSize: '24px' }} />
        <span>홈</span>
      </NavItem>
      <NavItem 
        active={currentPath === '/categories'} 
        onClick={() => router.push('/categories')}
      >
        <UnorderedListOutlined style={{ fontSize: '24px' }} />
        <span>카테고리</span>
      </NavItem>
      <NavItem 
        active={currentPath === '/admin'} 
        onClick={() => router.push('/admin')}
      >
        <UserOutlined style={{ fontSize: '24px' }} />
        <span>관리자</span>
      </NavItem>
    </NavContainer>
  );
}