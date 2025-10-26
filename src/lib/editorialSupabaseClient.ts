import { createClient } from '@supabase/supabase-js';

/**
 * Editorial Analysis용 Supabase 클라이언트
 * 단독뉴스/랭킹뉴스와는 다른 Supabase 프로젝트에 연결
 */

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please add ${key} to your .env.local file.`
    );
  }
  return value;
}

const editorialSupabaseUrl = getRequiredEnvVar('NEXT_PUBLIC_EDITORIAL_SUPABASE_URL');
const editorialSupabaseAnonKey = getRequiredEnvVar('NEXT_PUBLIC_EDITORIAL_SUPABASE_ANON_KEY');

// 개발 모드에서 환경변수 로깅
if (process.env.NODE_ENV !== 'production') {
  console.log('[Editorial Supabase Client] 초기화:', {
    url: editorialSupabaseUrl,
    keyPrefix: editorialSupabaseAnonKey.substring(0, 30) + '...',
    keyLength: editorialSupabaseAnonKey.length
  });
}

export const editorialSupabase = createClient(editorialSupabaseUrl, editorialSupabaseAnonKey);
