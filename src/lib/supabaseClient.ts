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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);