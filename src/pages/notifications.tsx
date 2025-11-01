import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import styled from '@emotion/styled';

// 동적으로 컴포넌트 로드
const MobileNotificationSettings = dynamic(
  () => import('@/components/mobile/MobileNotificationSettings'),
  { ssr: false }
);

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
`;

export default function NotificationsPage() {
  return (
    <>
      <Head>
        <title>NEWS-GQAI</title>
        <meta name="description" content="NEWS-GQAI 알림 설정" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <PageContainer>
        <MobileNotificationSettings />
      </PageContainer>
    </>
  );
}
