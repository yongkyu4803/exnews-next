import React from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';

// 동적으로 컴포넌트 로드
const Layout = dynamic(() => import('@/components/Layout'), { ssr: false });
const NotificationSettings = dynamic(() => import('@/components/NotificationSettings'), { ssr: false });

// 동적 임포트
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;
const Tabs = dynamic(() => import('antd/lib/tabs'), { ssr: false }) as any;

const { Title } = Typography;

const SettingsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const SettingsHeader = styled.div`
  margin-bottom: 32px;
`;

export default function SettingsPage() {
  return (
    <Layout>
      <SettingsContainer>
        <SettingsHeader>
          <Title level={1}>설정</Title>
        </SettingsHeader>
        
        <Tabs
          defaultActiveKey="notifications"
          items={[
            {
              key: 'notifications',
              label: '알림 설정',
              children: <NotificationSettings />
            },
            {
              key: 'appearance',
              label: '외관 설정',
              children: <div>외관 설정 (개발 중)</div>
            },
            {
              key: 'account',
              label: '계정 설정',
              children: <div>계정 설정 (개발 중)</div>
            }
          ]}
        />
      </SettingsContainer>
    </Layout>
  );
} 