import React from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import BottomNav from '@/components/mobile/BottomNav';

// 동적 임포트
const Layout = dynamic(() => import('antd/lib/layout'), { ssr: false }) as any;
const { Header, Content, Footer } = Layout;

const MobileContainer = styled(Layout)`
  min-height: 100vh;
  
  .mobile-header {
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
    height: var(--mobile-header-height);
    padding: 0 var(--mobile-padding);
    display: flex;
    align-items: center;
  }

  .mobile-content {
    margin-top: var(--mobile-header-height);
    margin-bottom: var(--mobile-bottom-nav-height);
    padding: var(--mobile-padding);
  }

  .mobile-footer {
    position: fixed;
    bottom: 0;
    width: 100%;
    height: var(--mobile-bottom-nav-height);
    padding: 0;
    z-index: 1000;
  }
`;

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <MobileContainer>
      <Header className="mobile-header">
        <h1>NewsLens</h1>
      </Header>
      <Content className="mobile-content">
        {children}
      </Content>
      <Footer className="mobile-footer">
        <BottomNav />
      </Footer>
    </MobileContainer>
  );
}