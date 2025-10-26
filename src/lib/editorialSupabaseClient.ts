import { createClient } from '@supabase/supabase-js';

/**
 * Editorial Analysis용 Supabase 클라이언트
 * 단독뉴스/랭킹뉴스와는 다른 Supabase 프로젝트에 연결
 */

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    const errorMsg = `Missing required environment variable: ${key}`;
    console.error(`[Editorial Supabase Client] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  return value;
}

let editorialSupabaseUrl: string;
let editorialSupabaseAnonKey: string;

try {
  editorialSupabaseUrl = getRequiredEnvVar('NEXT_PUBLIC_EDITORIAL_SUPABASE_URL');
  editorialSupabaseAnonKey = getRequiredEnvVar('NEXT_PUBLIC_EDITORIAL_SUPABASE_ANON_KEY');
} catch (error) {
  console.error('[Editorial Supabase Client] 초기화 실패:', error);
  // Fallback to empty strings to prevent app crash
  editorialSupabaseUrl = '';
  editorialSupabaseAnonKey = '';
}

// 개발 모드에서 환경변수 로깅
if (process.env.NODE_ENV !== 'production') {
  console.log('[Editorial Supabase Client] 초기화:', {
    url: editorialSupabaseUrl,
    keyPrefix: editorialSupabaseAnonKey.substring(0, 30) + '...',
    keyLength: editorialSupabaseAnonKey.length
  });
}

export const editorialSupabase = createClient(editorialSupabaseUrl, editorialSupabaseAnonKey);
