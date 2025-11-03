import { createClient } from '@supabase/supabase-js';

/**
 * Get required environment variable or throw error
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

const supabaseUrl = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// 개발 모드에서 환경변수 로깅
if (process.env.NODE_ENV !== 'production') {
  console.log('[Supabase Client] 초기화:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.substring(0, 30) + '...',
    keyLength: supabaseAnonKey.length
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {},
  },
  // Explicitly set no default limit
});