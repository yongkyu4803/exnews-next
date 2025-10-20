/**
 * 키워드 매칭 유틸리티
 * 뉴스 제목/본문에서 키워드를 검색하여 매칭 여부를 판단합니다.
 */

export interface NewsContent {
  title: string;
  description?: string;
  content?: string;
}

export interface KeywordMatchResult {
  matched: boolean;
  matchedKeywords: string[];
  matchedIn: ('title' | 'description' | 'content')[];
}

/**
 * 텍스트를 정규화합니다 (대소문자, 공백 제거)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ') // 여러 공백을 하나로
    .trim();
}

/**
 * 단일 키워드가 텍스트에 포함되어 있는지 확인
 * 부분 일치를 지원합니다 (예: "삼성" → "삼성전자" 매칭)
 */
function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);

  // 키워드가 비어있으면 매칭하지 않음
  if (!normalizedKeyword) {
    return false;
  }

  // 부분 일치 검색
  return normalizedText.includes(normalizedKeyword);
}

/**
 * 뉴스 콘텐츠에서 키워드를 검색합니다
 *
 * @param newsContent 뉴스 내용 (제목, 설명, 본문)
 * @param keywords 검색할 키워드 목록
 * @returns 매칭 결과 (매칭 여부, 매칭된 키워드, 매칭 위치)
 */
export function matchKeywords(
  newsContent: NewsContent,
  keywords: string[]
): KeywordMatchResult {
  const result: KeywordMatchResult = {
    matched: false,
    matchedKeywords: [],
    matchedIn: []
  };

  // 키워드가 없으면 매칭하지 않음
  if (!keywords || keywords.length === 0) {
    return result;
  }

  // 각 키워드에 대해 검색 (OR 조건)
  for (const keyword of keywords) {
    let keywordMatched = false;

    // 제목에서 검색 (우선순위 높음)
    if (newsContent.title && containsKeyword(newsContent.title, keyword)) {
      keywordMatched = true;
      if (!result.matchedIn.includes('title')) {
        result.matchedIn.push('title');
      }
    }

    // 설명에서 검색
    if (newsContent.description && containsKeyword(newsContent.description, keyword)) {
      keywordMatched = true;
      if (!result.matchedIn.includes('description')) {
        result.matchedIn.push('description');
      }
    }

    // 본문에서 검색 (선택사항)
    if (newsContent.content && containsKeyword(newsContent.content, keyword)) {
      keywordMatched = true;
      if (!result.matchedIn.includes('content')) {
        result.matchedIn.push('content');
      }
    }

    // 이 키워드가 매칭되었으면 결과에 추가
    if (keywordMatched && !result.matchedKeywords.includes(keyword)) {
      result.matchedKeywords.push(keyword);
      result.matched = true;
    }
  }

  return result;
}

/**
 * 여러 뉴스 항목에서 키워드 매칭 결과를 반환합니다
 *
 * @param newsList 뉴스 목록
 * @param keywords 검색할 키워드 목록
 * @returns 매칭된 뉴스 목록과 각각의 매칭 결과
 */
export function filterNewsByKeywords<T extends NewsContent>(
  newsList: T[],
  keywords: string[]
): Array<T & { matchResult: KeywordMatchResult }> {
  return newsList
    .map(news => ({
      ...news,
      matchResult: matchKeywords(news, keywords)
    }))
    .filter(item => item.matchResult.matched);
}

/**
 * 사용자 키워드 목록과 뉴스를 비교하여 알림 대상 사용자를 찾습니다
 *
 * @param newsContent 새로 추가된 뉴스
 * @param userKeywords 사용자별 키워드 목록 { user_id: keywords[] }
 * @returns 알림을 받을 사용자 ID 목록과 매칭된 키워드
 */
export function findMatchedUsers(
  newsContent: NewsContent,
  userKeywords: Record<string, string[]>
): Array<{ userId: string; matchedKeywords: string[] }> {
  const matchedUsers: Array<{ userId: string; matchedKeywords: string[] }> = [];

  for (const [userId, keywords] of Object.entries(userKeywords)) {
    const matchResult = matchKeywords(newsContent, keywords);

    if (matchResult.matched) {
      matchedUsers.push({
        userId,
        matchedKeywords: matchResult.matchedKeywords
      });
    }
  }

  return matchedUsers;
}

/**
 * 키워드 하이라이트를 위한 유틸리티
 * 텍스트에서 키워드 위치를 찾아 반환합니다
 *
 * @param text 원본 텍스트
 * @param keywords 하이라이트할 키워드 목록
 * @returns 하이라이트 정보 (시작 인덱스, 끝 인덱스, 키워드)
 */
export function findKeywordPositions(
  text: string,
  keywords: string[]
): Array<{ start: number; end: number; keyword: string }> {
  const positions: Array<{ start: number; end: number; keyword: string }> = [];
  const normalizedText = text.toLowerCase();

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    let searchIndex = 0;

    while (true) {
      const index = normalizedText.indexOf(normalizedKeyword, searchIndex);
      if (index === -1) break;

      positions.push({
        start: index,
        end: index + normalizedKeyword.length,
        keyword: keyword
      });

      searchIndex = index + normalizedKeyword.length;
    }
  }

  // 시작 인덱스 기준으로 정렬
  return positions.sort((a, b) => a.start - b.start);
}

/**
 * 키워드 매칭 통계 생성
 *
 * @param newsList 뉴스 목록
 * @param keywords 키워드 목록
 * @returns 각 키워드별 매칭 횟수
 */
export function getKeywordStatistics(
  newsList: NewsContent[],
  keywords: string[]
): Record<string, number> {
  const stats: Record<string, number> = {};

  // 초기화
  keywords.forEach(keyword => {
    stats[keyword] = 0;
  });

  // 각 뉴스에서 키워드 매칭 횟수 카운트
  newsList.forEach(news => {
    const matchResult = matchKeywords(news, keywords);
    matchResult.matchedKeywords.forEach(keyword => {
      stats[keyword] = (stats[keyword] || 0) + 1;
    });
  });

  return stats;
}
