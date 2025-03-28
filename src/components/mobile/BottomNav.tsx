import React from 'react';
import { useRouter } from 'next/router';
import { HomeOutlined, UnorderedListOutlined, UserOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
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
  width: 20%;
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

interface BottomNavProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function BottomNav({ currentPage = 1, totalPages = 1, onPageChange }: BottomNavProps) {
  const router = useRouter();
  const currentPath = router.pathname;

  const handlePrevPage = () => {
    if (onPageChange && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (onPageChange && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // 표시할 페이지 범위 계산
  const pageDisplay = React.useMemo(() => {
    if (totalPages <= 1) return `${currentPage}`;
    
    return `${currentPage} / ${totalPages}`;
  }, [currentPage, totalPages]);

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
        onClick={handlePrevPage}
        disabled={currentPage <= 1}
        style={{ opacity: currentPage <= 1 ? 0.5 : 1 }}
      >
        <LeftOutlined style={{ fontSize: '24px' }} />
        <span>이전</span>
      </NavItem>
      <NavItem>
        <div style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '50%', 
          backgroundColor: '#1a4b8c', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {currentPage}
        </div>
        <span style={{ marginTop: '3px' }}>{pageDisplay}</span>
      </NavItem>
      <NavItem 
        onClick={handleNextPage}
        disabled={currentPage >= totalPages}
        style={{ opacity: currentPage >= totalPages ? 0.5 : 1 }}
      >
        <RightOutlined style={{ fontSize: '24px' }} />
        <span>다음</span>
      </NavItem>
      <NavItem 
        active={currentPath === '/categories'} 
        onClick={() => router.push('/categories')}
      >
        <UnorderedListOutlined style={{ fontSize: '24px' }} />
        <span>카테고리</span>
      </NavItem>
    </NavContainer>
  );
}