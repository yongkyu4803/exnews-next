/**
 * URL에서 언론사/미디어명을 추출하는 유틸리티
 * original_link에서 정규식 패턴 매칭으로 미디어명 추출
 */

/**
 * 한국 주요 언론사 URL 패턴 매핑
 * 정규식 패턴으로 도메인을 매칭하여 언론사명 반환
 */
const MEDIA_PATTERNS: Record<string, RegExp> = {
  // 종합 일간지
  '조선일보': /chosun\.com/i,
  '중앙일보': /joongang\.co\.kr|joins\.com/i,
  '동아일보': /donga\.com/i,
  '한겨레': /hani\.co\.kr/i,
  '경향신문': /khan\.co\.kr/i,
  '서울신문': /seoul\.co\.kr/i,
  '국민일보': /kmib\.co\.kr/i,
  '세계일보': /segye\.com/i,
  '문화일보': /munhwa\.com/i,

  // 경제지
  '매일경제': /mk\.co\.kr/i,
  '한국경제': /hankyung\.com/i,
  '서울경제': /sedaily\.com/i,
  '헤럴드경제': /heraldk\.com|heraldcorp\.com/i,
  '아시아경제': /asiae\.co\.kr/i,
  '파이낸셜뉴스': /fnnews\.com/i,
  '이데일리': /edaily\.co\.kr/i,
  '머니투데이': /mt\.co\.kr/i,
  '이코노미스트': /economist\.co\.kr/i,
  '비즈니스워치': /bizwatch\.co\.kr/i,

  // 방송사
  'KBS': /news\.kbs\.co\.kr|kbs\.co\.kr/i,
  'MBC': /imnews\.imbc\.com|mbc\.co\.kr/i,
  'SBS': /news\.sbs\.co\.kr|sbs\.co\.kr/i,
  'JTBC': /news\.jtbc\.co\.kr|jtbc\.co\.kr/i,
  'TV조선': /tvchosun\.com/i,
  '채널A': /ichannela\.com/i,
  'MBN': /mbn\.co\.kr/i,
  'YTN': /ytn\.co\.kr/i,
  '연합뉴스TV': /yonhapnewstv\.co\.kr/i,

  // 통신사
  '연합뉴스': /yna\.co\.kr|yonhapnews\.co\.kr/i,
  '뉴시스': /newsis\.com/i,
  '뉴스1': /news1\.kr/i,

  // 인터넷 언론
  '오마이뉴스': /ohmynews\.com/i,
  '프레시안': /pressian\.com/i,
  '미디어오늘': /mediatoday\.co\.kr/i,
  '민중의소리': /vop\.co\.kr/i,
  '노컷뉴스': /nocutnews\.co\.kr/i,

  // IT/과학
  '전자신문': /etnews\.com/i,
  '디지털타임스': /dt\.co\.kr/i,
  '아이뉴스24': /inews24\.com/i,
  '블로터': /bloter\.net/i,
  '지디넷코리아': /zdnet\.co\.kr/i,
  '보안뉴스': /boannews\.com/i,

  // 스포츠
  '스포츠조선': /sportschosun\.com/i,
  '스포츠동아': /donga\.com\/sports/i,
  '스포츠서울': /sportsseoul\.com/i,
  '일간스포츠': /isplus\.joins\.com/i,

  // 지역지
  '부산일보': /busan\.com/i,
  '국제신문': /kookje\.co\.kr/i,
  '경남신문': /knnews\.co\.kr/i,
  '영남일보': /yeongnam\.com/i,
  '대구MBC': /dgmbc\.com/i,
  '전북일보': /jjan\.kr/i,
  '광주일보': /kwangju\.co\.kr/i,
  '제민일보': /jejunews\.com/i,
  '제주일보': /jejuilbo\.net/i,
  '강원일보': /kwnews\.co\.kr/i,
  '충청투데이': /cctoday\.co\.kr/i,

  // 기타
  '코리아헤럴드': /koreaherald\.com/i,
  '코리아타임스': /koreatimes\.co\.kr/i,
  '주간조선': /weekly\.chosun\.com/i,
  '시사IN': /sisain\.co\.kr/i,
  '한겨레21': /h21\.hani\.co\.kr/i,
};

/**
 * URL에서 미디어명을 추출
 * @param url - original_link URL
 * @returns 추출된 미디어명 또는 fallback 값
 */
export function extractMediaName(url: string): string {
  if (!url || typeof url !== 'string') {
    return '미상';
  }

  // 1단계: 패턴 매칭으로 언론사명 추출
  for (const [mediaName, pattern] of Object.entries(MEDIA_PATTERNS)) {
    if (pattern.test(url)) {
      return mediaName;
    }
  }

  // 2단계: 패턴 매칭 실패 시 도메인에서 추출
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // www. 제거
    const cleanDomain = hostname.replace(/^www\./, '');

    // 도메인의 첫 번째 부분을 추출
    const parts = cleanDomain.split('.');
    if (parts.length > 0) {
      const domainName = parts[0];

      // 도메인명을 대문자로 시작하도록 변환
      return domainName.charAt(0).toUpperCase() + domainName.slice(1);
    }

    return '기타';
  } catch (error) {
    // URL 파싱 실패
    return '미상';
  }
}

/**
 * 미디어명 추출 결과를 캐싱하여 성능 최적화
 */
const mediaNameCache = new Map<string, string>();

/**
 * 캐싱된 미디어명 추출 (성능 최적화 버전)
 * @param url - original_link URL
 * @returns 추출된 미디어명
 */
export function extractMediaNameCached(url: string): string {
  if (!url) return '미상';

  // 캐시 확인
  if (mediaNameCache.has(url)) {
    return mediaNameCache.get(url)!;
  }

  // 추출 및 캐싱
  const mediaName = extractMediaName(url);
  mediaNameCache.set(url, mediaName);

  return mediaName;
}

/**
 * 캐시 초기화 (필요시 사용)
 */
export function clearMediaNameCache(): void {
  mediaNameCache.clear();
}

/**
 * 특정 미디어명에 해당하는지 확인
 * @param url - original_link URL
 * @param targetMedia - 확인할 미디어명
 * @returns 일치 여부
 */
export function isMediaMatch(url: string, targetMedia: string): boolean {
  const extractedMedia = extractMediaName(url);
  return extractedMedia === targetMedia;
}

/**
 * URL 목록에서 모든 미디어명 추출 (유니크)
 * @param urls - original_link URL 배열
 * @returns 유니크한 미디어명 배열
 */
export function extractAllMediaNames(urls: string[]): string[] {
  const mediaNames = new Set<string>();

  urls.forEach(url => {
    const mediaName = extractMediaName(url);
    if (mediaName && mediaName !== '미상') {
      mediaNames.add(mediaName);
    }
  });

  return Array.from(mediaNames).sort();
}
