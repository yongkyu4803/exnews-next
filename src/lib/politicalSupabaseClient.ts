/**
 * 정치 뉴스 리포트 Supabase 클라이언트
 *
 * Editorial Supabase 프로젝트를 사용하여 정치 리포트 데이터를 관리합니다.
 */

import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Political:Supabase');

const supabaseUrl = process.env.NEXT_PUBLIC_EDITORIAL_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_EDITORIAL_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Political Supabase 환경 변수가 설정되지 않았습니다');
  throw new Error('Political Supabase credentials are not configured');
}

export const politicalSupabase = createClient(supabaseUrl, supabaseAnonKey);

logger.info('Political Supabase Client 초기화', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey.substring(0, 30) + '...',
  keyLength: supabaseAnonKey.length
});

/**
 * 테이블 이름 상수
 */
export const TABLES = {
  NEWS_REPORTS: 'skills_news_reports'
} as const;
