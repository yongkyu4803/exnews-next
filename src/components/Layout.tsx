import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import Link from 'next/link';

// 동적 임포트
const AntdLayout = dynamic(() => import('antd/lib/layout'), { ssr: false }) as any;
const Menu = dynamic(() => import('antd/lib/menu'), { ssr: false }) as any;
const { Header, Content, Footer } = AntdLayout;

const LayoutContainer = styled(AntdLayout)`
  min-height: 100vh;
  
  .site-header {
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    .logo {
      height: 48px;
      margin-right: 16px;
      display: flex;
      align-items: center;
      font-size: 20px;
      font-weight: bold;
      color: var(--primary-color, #1a4b8c);
      text-decoration: none;
    }
    
    @media (max-width: 768px) {
      padding: 0 16px;
      
      .logo {
        height: 40px;
        font-size: 18px;
      }
    }
  }

  .site-content {
    margin-top: 64px;
    min-height: calc(100vh - 64px - 64px);
    
    @media (max-width: 768px) {
      margin-top: 56px;
      margin-bottom: 60px;
      min-height: calc(100vh - 56px - 60px);
    }
  }

  .site-footer {
    text-align: center;
    color: #666;
    padding: 20px;
    
    @media (max-width: 768px) {
      position: fixed;
      bottom: 0;
      width: 100%;
      padding: 0;
      z-index: 1000;
    }
  }
`;

const HeaderMenu = styled(Menu)`
  flex: 1;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileNav = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #fff;
    border-top: 1px solid #eee;
    height: 60px;
    
    nav {
      display: flex;
      justify-content: space-around;
      height: 100%;
      
      a {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #666;
        text-decoration: none;
        height: 100%;
        font-size: 12px;
        flex: 1;
        
        svg {
          margin-bottom: 4px;
          font-size: 18px;
        }
        
        &.active {
          color: var(--primary-color, #1a4b8c);
        }
      }
    }
  }
`;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // 클라이언트 사이드에서만 실행되도록 체크
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(max-width: 768px)');
      const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
        setIsMobile(e.matches);
      };

      // Initial check
      handleResize(mediaQuery);

      // Add listener for window resize
      mediaQuery.addEventListener('change', handleResize);

      // Cleanup
      return () => mediaQuery.removeEventListener('change', handleResize);
    }
  }, []);

  return (
    <LayoutContainer>
      <Header className="site-header">
        <Link href="/" className="logo">
          NewsLens
        </Link>
        
        <HeaderMenu
          mode="horizontal"
          items={[
            { key: 'home', label: <Link href="/">홈</Link> },
            { key: 'saved', label: <Link href="/offline">저장된 뉴스</Link> },
            { key: 'settings', label: <Link href="/settings">설정</Link> },
            { key: 'admin', label: <Link href="/admin">관리자</Link> }
          ]}
        />
      </Header>
      
      <Content className="site-content">
        {children}
      </Content>
      
      <Footer className="site-footer">
        {isMobile && (
          <MobileNav>
            <nav>
              <Link href="/" className="active">홈</Link>
              <Link href="/offline">저장됨</Link>
              <Link href="/settings">설정</Link>
            </nav>
          </MobileNav>
        )}
        {!isMobile && <div>© 2025 NewsLens. All rights reserved.</div>}
      </Footer>
    </LayoutContainer>
  );
} 