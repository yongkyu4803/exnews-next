import React from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import dynamic from 'next/dynamic';
import '@/styles/globals.css';

// Ant Design 컴포넌트를 클라이언트 사이드에서만 로드
const AntdConfigProvider = dynamic(
  () => import('antd').then((antd) => antd.ConfigProvider),
  { ssr: false }
);

// 한국어 로케일 설정을 클라이언트 사이드에서만 로드
const koKR = {};

// Create a client
const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdConfigProvider locale={koKR}>
        <Component {...pageProps} />
      </AntdConfigProvider>
    </QueryClientProvider>
  );
}