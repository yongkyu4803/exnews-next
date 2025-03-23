# 웹 애널리틱스 구현 작업 정의서

## 1. 프로젝트 개요
- **목적**: 단독 뉴스 웹 애플리케이션의 사용자 행동 및 트래픽 분석
- **기간**: 구현 2주, 테스트 1주
- **담당자**: 개발팀

## 2. 구현 요구사항

### 2.1 기본 방문자 분석 (우선순위: 높음)
- **Google Analytics 4(GA4) 통합**
  - GA4 계정 생성 및 속성 설정
  - 데이터 스트림 구성 (웹)
  - Next.js 애플리케이션에 GA4 추적 코드 삽입
  - 기본 페이지뷰 추적 설정
  - 사용자 식별 및 세션 관리 구성

### 2.2 사용자 행동 추적 (우선순위: 중간)
- **이벤트 추적 구현**
  - 기사 클릭 이벤트: `article_view` (매개변수: article_id, category, title)
  - 카테고리 전환 이벤트: `category_change` (매개변수: category_name)
  - 복사 기능 사용 이벤트: `copy_articles` (매개변수: count, article_ids)
  - 외부 링크 클릭 이벤트: `external_link` (매개변수: destination_url)

- **사용자 세그먼트 설정**
  - 방문 빈도별 사용자 그룹
  - 디바이스 유형별 사용자 그룹
  - 관심 카테고리별 사용자 그룹

### 2.3 성능 모니터링 (우선순위: 중간)
- **Web Vitals 측정**
  - LCP(Largest Contentful Paint) 추적
  - FID(First Input Delay) 추적
  - CLS(Cumulative Layout Shift) 추적
  
- **API 성능 측정**
  - API 호출 시간 로깅
  - 오류 발생률 모니터링
  - 데이터 로드 시간 분석

### 2.4 대시보드 구성 (우선순위: 낮음)
- **GA4 대시보드 커스터마이징**
  - 실시간 방문자 현황
  - 카테고리별 인기 기사
  - 사용자 유입 경로
  - 디바이스 및 브라우저 분포

## 3. 기술적 구현 방법

### 3.1 GA4 기본 설정
```typescript
// pages/_app.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
```

### 3.2 이벤트 추적 유틸리티

// utils/analytics.js
export const logEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// 기사 클릭 이벤트
export const logArticleView = (article) => {
  logEvent('article_view', {
    article_id: article.id,
    category: article.category,
    title: article.title
  });
};

// 카테고리 변경 이벤트
export const logCategoryChange = (category) => {
  logEvent('category_change', {
    category_name: category
  });
};

// 기사 복사 이벤트
export const logArticlesCopy = (articles) => {
  logEvent('copy_articles', {
    count: articles.length,
    article_ids: articles.map(a => a.id).join(',')
  });
};


## 4. 구현 일정 및 마일스톤
### 4.1 1주차: 기본 설정
- GA4 계정 및 속성 설정
- 기본 추적 코드 구현
- 페이지뷰 추적 테스트
### 4.2 2주차: 이벤트 추적
- 사용자 이벤트 추적 구현
- 성능 모니터링 설정
- 테스트 환경에서 데이터 검증
### 4.3 3주차: 테스트 및 최적화
- 실제 환경에서 데이터 수집 테스트
- 대시보드 구성 및 커스터마이징
- 문서화 및 모니터링 프로세스 수립
## 5. 성공 지표
- 모든 페이지에서 GA4 데이터 수집 확인
- 주요 사용자 이벤트 95% 이상 정확히 추적
- 대시보드에서 의미 있는 인사이트 도출 가능
- 페이지 성능 지표 수집 및 분석 가능
## 6. 참고 자료
- Google Analytics 4 공식 문서
- Next.js와 GA4 통합 가이드
- Web Vitals 측정 가이드