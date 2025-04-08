import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const Menu = dynamic(() => import('antd/lib/menu'), { ssr: false }) as any;

const NavBarContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;

const NavHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const Logo = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color, #1a73e8);
  display: flex;
  align-items: center;
  
  span {
    margin-left: 8px;
  }
`;

const NavMenu = styled(Menu)`
  border-bottom: none !important;
  
  .ant-menu-item {
    min-width: 50px;
    height: 40px !important;
    line-height: 40px !important;
    margin: 0 8px !important;
    font-size: 14px;
    cursor: pointer !important;
    user-select: none;
    touch-action: manipulation;
  }
  
  .ant-menu-item:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .ant-menu-item-selected {
    font-weight: bold;
  }
`;

interface TopNavBarProps {
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ activeTab = 'exclusive', onTabChange }) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    console.log('TopNavBar 마운트됨, 활성 탭:', activeTab);
  }, [activeTab]);
  
  const handleTabChange = (info: { key: string }) => {
    console.log('탭 변경 시도:', info.key);
    
    // 페이지 이동 처리
    if (info.key === 'restaurants') {
      router.push('/restaurants');
      return;
    }
    
    if (onTabChange) {
      onTabChange(info.key);
    }
  };
  
  if (!isMounted) {
    return <div style={{ height: '48px', backgroundColor: '#ffffff' }}></div>;
  }
  
  // 현재 경로에 따라 active 탭 설정
  const currentPath = router.pathname;
  const activeKey = currentPath === '/restaurants' ? 'restaurants' : activeTab;
  
  return (
    <NavBarContainer>
      <NavHeader>
        <Logo>
          <span>🚨 뉴스</span>
        </Logo>
      </NavHeader>
      
      <NavMenu 
        mode="horizontal" 
        selectedKeys={[activeKey]}
        onSelect={handleTabChange}
        onClick={(info: { key: string, domEvent: React.MouseEvent<HTMLElement> }) => {
          console.log('탭 클릭됨:', info.key);
          handleTabChange(info);
        }}
        items={[
          {
            key: 'exclusive',
            label: '단독 뉴스',
            onClick: () => router.push('/'),
          },
          {
            key: 'ranking',
            label: '랭킹 뉴스',
            onClick: () => {
              if (currentPath === '/') {
                if (onTabChange) onTabChange('ranking');
              } else {
                router.push('/?tab=ranking');
              }
            },
          },
          {
            key: 'restaurants',
            label: '국회앞 식당',
            onClick: () => router.push('/restaurants'),
          }
        ]}
      />
    </NavBarContainer>
  );
};

export default TopNavBar; 