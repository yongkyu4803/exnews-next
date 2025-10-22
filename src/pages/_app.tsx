import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  // 개발 모드에서 모바일 디버깅용 Eruda 콘솔 추가
  useEffect(() => {
    // 프로덕션에서도 임시로 활성화 (디버깅용)
    if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/eruda';
      document.body.appendChild(script);
      script.onload = () => {
        // @ts-ignore
        if (window.eruda) {
          // @ts-ignore
          window.eruda.init();
          console.log('🔧 Eruda 디버그 콘솔이 활성화되었습니다!');
        }
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}