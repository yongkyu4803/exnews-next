/**
 * 이미지 최적화 유틸리티 함수
 */

// 이미지 지연 로딩을 위한 인터섹션 옵저버 설정
export const setupLazyLoading = () => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const image = entry.target as HTMLImageElement;
      if (image.dataset.src) {
        image.src = image.dataset.src;
        image.removeAttribute('data-src');
      }

      observer.unobserve(image);
    });
  }, options);

  // 모든 lazy-load 이미지에 observer 적용
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach(img => observer.observe(img));
};

// 이미지 스켈레톤 로더 설정
export const setupSkeletonLoader = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const lazyImages = document.querySelectorAll('img.skeleton-loader');
  lazyImages.forEach(img => {
    const image = img as HTMLImageElement;
    
    // 스켈레톤 로딩 상태 표시
    image.classList.add('loading');
    
    // 이미지 로드 완료 시 클래스 변경
    image.onload = () => {
      image.classList.remove('loading');
      image.classList.add('loaded');
    };
    
    // 이미지 로드 실패 시 오류 표시
    image.onerror = () => {
      image.classList.remove('loading');
      image.classList.add('error');
      image.src = '/images/placeholder.png'; // 기본 이미지로 대체
    };
  });
};

// 이미지 URL에 최적화 파라미터 추가
export const getOptimizedImageUrl = (url: string, width: number = 600): string => {
  if (!url) return '/images/placeholder.png';
  
  try {
    const originalUrl = new URL(url);
    
    // 이미 최적화된 CDN URL인 경우
    if (originalUrl.hostname.includes('imagedelivery') || 
        originalUrl.hostname.includes('cloudinary') ||
        originalUrl.hostname.includes('imgix')) {
      return url;
    }
    
    // Cloudinary 변환을 적용할 수 있는 경우
    if (process.env.NEXT_PUBLIC_CLOUDINARY_URL) {
      return `${process.env.NEXT_PUBLIC_CLOUDINARY_URL}/w_${width},q_auto,f_auto/${encodeURIComponent(url)}`;
    }
    
    return url;
  } catch (error) {
    console.error('이미지 URL 최적화 중 오류:', error);
    return url;
  }
};

// 웹 폰트 최적화를 위한 함수
export const setupWebFontOptimization = () => {
  if (typeof window === 'undefined') {
    return;
  }
  
  // 폰트 디스플레이 스왑 적용
  const fontStyleSheet = document.createElement('style');
  fontStyleSheet.textContent = `
    @font-face {
      font-family: 'CustomFont';
      font-display: swap;
    }
  `;
  document.head.appendChild(fontStyleSheet);
  
  // 폰트 사전 로드
  const fontLinks = [
    { rel: 'preload', href: '/fonts/main-font.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }
  ];
  
  fontLinks.forEach(linkData => {
    // null/undefined 체크 추가
    if (!linkData) return;
    
    const link = document.createElement('link');
    // Object.entries에 안전장치 추가
    if (linkData && typeof linkData === 'object') {
      Object.entries(linkData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          link.setAttribute(key, value);
        }
      });
      document.head.appendChild(link);
    }
  });
};

// 반응형 이미지 소스 생성
export const getResponsiveImageSrcSet = (url: string): string => {
  if (!url) return '';
  
  try {
    const widths = [320, 640, 960, 1280];
    const srcSet = widths.map(width => 
      `${getOptimizedImageUrl(url, width)} ${width}w`
    ).join(', ');
    
    return srcSet;
  } catch (error) {
    console.error('반응형 이미지 소스 생성 오류:', error);
    return '';
  }
}; 