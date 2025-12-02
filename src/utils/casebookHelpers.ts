/**
 * 케이스북 유틸리티 함수
 */

/**
 * 한글/영어 파일명에서 URL-safe slug 생성
 * @param filename - 파일명 (예: "금융권_생성형_ai_도입_규제_케이스북_보완본.md")
 * @returns URL-safe slug (예: "finance-ai-regulation")
 */
export function generateSlug(filename: string): string {
  console.log('[generateSlug] Input filename:', filename)
  // .md 확장자 제거
  const nameWithoutExt = filename.replace(/\.md$/i, '')
  console.log('[generateSlug] After removing .md:', nameWithoutExt)

  // 한글을 영어로 변환하는 간단한 맵핑
  const koreanToEnglish: Record<string, string> = {
    '금융권': 'finance',
    '생성형': 'generative',
    'ai': 'ai',
    '도입': 'adoption',
    '규제': 'regulation',
    '케이스북': 'casebook',
    '보완본': 'revised',
    '외국인': 'foreign',
    '주식': 'stock',
    '통합': 'integrated',
    '계좌': 'account',
    '가이드라인': 'guideline',
    '해외': 'overseas',
    '해외주식': 'overseas-stock',
    '양도소득세': 'capital-gains-tax',
    '양도': 'transfer',
    '소득세': 'income-tax',
    '역외투자': 'offshore-investment',
    '역외': 'offshore',
    '투자': 'investment',
    '환율': 'exchange-rate',
    '세제': 'tax-system',
  }

  // 파일명을 단어로 먼저 분리 (대소문자 유지)
  const words = nameWithoutExt.split(/[_\s-]+/)
  console.log('[generateSlug] Split words:', words)

  // 각 단어를 소문자로 변환한 후 영어로 변환 (맵핑에 있으면 사용, 없으면 소문자 유지)
  const translatedWords = words.map(word => {
    const lowerWord = word.toLowerCase()
    return koreanToEnglish[lowerWord] || lowerWord
  })
  console.log('[generateSlug] Translated words:', translatedWords)

  // URL-safe하게 변환: 영숫자와 하이픈만 허용
  const joined = translatedWords.join('-')
  console.log('[generateSlug] After join:', joined)

  const slug = joined
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  console.log('[generateSlug] Final slug:', slug)
  return slug
}

/**
 * 마크다운에서 일반 텍스트 추출 (마크업 제거)
 * @param markdown - 마크다운 텍스트
 * @param maxLength - 최대 길이 (기본값: 200)
 * @returns 일반 텍스트
 */
export function extractPlainText(markdown: string, maxLength: number = 200): string {
  // 마크다운 문법 제거
  let text = markdown
    // 제목 마커 제거
    .replace(/^#{1,6}\s+/gm, '')
    // 링크 제거 [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 이미지 제거
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // 굵은 글씨/이탤릭 마커 제거
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // 코드 블록 제거
    .replace(/```[\s\S]*?```/g, '')
    // 인라인 코드 제거
    .replace(/`([^`]+)`/g, '$1')
    // 블록인용 마커 제거
    .replace(/^>\s+/gm, '')
    // 리스트 마커 제거
    .replace(/^[*+-]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // 여러 공백/줄바꿈을 하나로
    .replace(/\s+/g, ' ')
    .trim()

  // 최대 길이로 자르기
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...'
  }

  return text
}

/**
 * 다양한 형식 날짜 파싱 (ISO, 한글 "2025년 11월")
 * @param dateString - 날짜 문자열
 * @returns Date 객체
 */
export function parseDate(dateString: string): Date {
  // ISO 형식 시도
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return new Date(dateString)
  }

  // 한글 형식 파싱 (예: "2025년 11월 29일")
  const koreanMatch = dateString.match(/(\d{4})년\s*(\d{1,2})월(?:\s*(\d{1,2})일)?/)
  if (koreanMatch) {
    const year = parseInt(koreanMatch[1])
    const month = parseInt(koreanMatch[2]) - 1 // 월은 0부터 시작
    const day = koreanMatch[3] ? parseInt(koreanMatch[3]) : 1
    return new Date(year, month, day)
  }

  // 기본값: 현재 날짜
  return new Date()
}

/**
 * 날짜 표시 형식화 (한국어 로케일)
 * @param date - 날짜 문자열 또는 Date 객체
 * @returns 형식화된 날짜 문자열 (예: "2025년 11월 29일")
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 케이스북 파일명에서 제목 추출 (프론트매터가 없을 때 대비)
 * @param filename - 파일명
 * @returns 제목 문자열
 */
export function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, '')
    .replace(/_/g, ' ')
    .replace(/케이스북/g, '케이스북')
    .trim()
}
