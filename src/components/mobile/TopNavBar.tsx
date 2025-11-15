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
  background: linear-gradient(to right, #1e40af, #3b82f6, #1e40af);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

const NavWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const BrandLogo = styled.div`
  font-family: var(--gqai-font-display, 'Pretendard', sans-serif);
  font-size: 28px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.5px;
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  position: absolute;
  left: 24px;

  &:hover {
    transform: scale(1.05);
  }

  span {
    color: #fbbf24;
  }

  @media (max-width: 768px) {
    display: none;
  }
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
  display: flex;
  justify-content: center;
  max-width: 1000px;
  width: 100%;
  background: transparent !important;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    padding: 4px 8px;
  }

  .ant-menu-item {
    min-width: 78px;
    height: 48px !important;
    margin: 7px 5px !important;
    cursor: pointer !important;
    user-select: none;
    touch-action: manipulation;
    color: rgba(255, 255, 255, 0.95) !important;
    border-bottom: none !important;
    border-radius: 8px !important;
    transition: all 0.3s ease;
    padding: 10px 10px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* 모든 자식 요소에 강제로 동일한 스타일 적용 */
  .ant-menu-item span,
  .ant-menu-item-selected span {
    font-family: 'Cafe24Anemone', sans-serif !important;
    font-weight: normal !important;
    font-size: 14px !important;
    line-height: 1.2 !important;
    text-align: center !important;
    display: inline-block !important;
    width: 100% !important;
    height: 100% !important;
    vertical-align: middle !important;
  }

  /* Ant Design의 자동 생성 클래스 무력화 */
  .ant-menu-item span *,
  .ant-menu-item-selected span * {
    font-family: 'Cafe24Anemone', sans-serif !important;
    font-weight: normal !important;
    font-size: 14px !important;
    line-height: 1.2 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .ant-menu-item:hover {
    color: #ffffff !important;
    background-color: rgba(255, 255, 255, 0.2) !important;
    padding-top: 11.5px !important;
    padding-bottom: 7.7px !important;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .ant-menu-item:active {
    background-color: rgba(255, 255, 255, 0.3) !important;
    transform: translateY(0);
  }

  .ant-menu-item-selected {
    color: #ffffff !important;
    background-color: rgba(255, 255, 255, 0.3) !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    height: 48px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* 모바일 최적화 */
  @media (max-width: 768px) {
    .ant-menu-item {
      min-width: 60px;
      height: 48px !important;
      line-height: 1.2 !important;
      margin: 5px 2px !important;
      font-size: 13px;
      padding: 7px 7px !important;
    }

    .ant-menu-item:hover {
      padding-top: 8.6px !important;
      padding-bottom: 5.8px !important;
    }
  }

  /* 작은 모바일 화면 */
  @media (max-width: 360px) {
    .ant-menu-item {
      min-width: 54px;
      height: 43px !important;
      line-height: 1.2 !important;
      margin: 5px 1px !important;
      font-size: 12px;
      padding: 7px 5px !important;
    }

    .ant-menu-item:hover {
      padding-top: 8.6px !important;
      padding-bottom: 5.8px !important;
    }
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
      <NavWrapper>
        <BrandLogo onClick={() => router.push('/dashboard')}>
          GQ<span>AI</span>
        </BrandLogo>
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
            label: <span style={{ fontFamily: 'Cafe24Anemone, sans-serif', fontWeight: 'normal', fontSize: '14px', textAlign: 'center', lineHeight: '1.2', display: 'inline-block' }}>단독<br/>뉴스</span>,
            onClick: () => router.push('/'),
          },
          {
            key: 'ranking',
            label: <span style={{ fontFamily: 'Cafe24Anemone, sans-serif', fontWeight: 'normal', fontSize: '14px', textAlign: 'center', lineHeight: '1.2', display: 'inline-block' }}>랭킹<br/>뉴스</span>,
            onClick: () => {
              if (currentPath === '/') {
                if (onTabChange) onTabChange('ranking');
              } else {
                router.push('/?tab=ranking');
              }
            },
          },
          {
            key: 'political',
            label: <span style={{ fontFamily: 'Cafe24Anemone, sans-serif', fontWeight: 'normal', fontSize: '14px', textAlign: 'center', lineHeight: '1.2', display: 'inline-block' }}>정치<br/>리포트</span>,
            onClick: () => {
              if (currentPath === '/') {
                if (onTabChange) onTabChange('political');
              } else {
                router.push('/?tab=political');
              }
            },
          },
          {
            key: 'bills',
            label: <span style={{ fontFamily: 'Cafe24Anemone, sans-serif', fontWeight: 'normal', fontSize: '14px', textAlign: 'center', lineHeight: '1.2', display: 'inline-block' }}>오늘의<br/>법안</span>,
            onClick: () => {
              if (currentPath === '/') {
                if (onTabChange) onTabChange('bills');
              } else {
                router.push('/?tab=bills');
              }
            },
          },
          {
            key: 'editorial',
            label: <span style={{ fontFamily: 'Cafe24Anemone, sans-serif', fontWeight: 'normal', fontSize: '14px', textAlign: 'center', lineHeight: '1.2', display: 'inline-block' }}>오늘의<br/>사설</span>,
            onClick: () => {
              if (currentPath === '/') {
                if (onTabChange) onTabChange('editorial');
              } else {
                router.push('/?tab=editorial');
              }
            },
          },
          {
            key: 'restaurants',
            label: <span style={{ fontFamily: 'Cafe24Anemone, sans-serif', fontWeight: 'normal', fontSize: '14px', textAlign: 'center', lineHeight: '1.2', display: 'inline-block' }}>국회앞<br/>식당</span>,
            onClick: () => router.push('/restaurants'),
          }
        ]}
      />
      </NavWrapper>
    </NavBarContainer>
  );
};

export default TopNavBar; 