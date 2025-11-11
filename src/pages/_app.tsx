import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from 'react-query';
import ErrorBoundary from '@/components/ErrorBoundary';
import { trackPageView } from '@/utils/analytics';
import '@/styles/globals.css';

// Create a client with optimized caching strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1, // Retry once on failure
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 min
      cacheTime: 10 * 60 * 1000, // 10 minutes - keep unused data in cache
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

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

  // 글로벌 라우트 변경 트래킹
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // 페이지 라우트 변경 시 페이지뷰 트래킹
      trackPageView();
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}