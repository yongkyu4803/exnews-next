-- subscription_data 컬럼에 대한 모든 숨겨진 설정 확인

-- 1. 컬럼의 상세 정보
SELECT 
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_name = 'user_notification_settings'
  AND column_name IN ('subscription_data', 'subscription_data_test')
ORDER BY column_name;

-- 2. 해당 컬럼과 관련된 트리거 확인
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_notification_settings';

-- 3. 컬럼에 대한 CHECK 제약조건
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition,
  att.attname AS column_name
FROM pg_constraint con
JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
WHERE con.conrelid = 'user_notification_settings'::regclass
  AND att.attname = 'subscription_data';

-- 4. Supabase Realtime Publication 확인
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'user_notification_settings';

-- 5. PostgREST 관련 설정 확인
SELECT 
  n.nspname as schema,
  c.relname as table,
  a.attname as column,
  pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
  a.attnotnull as not_null,
  a.atthasdef as has_default
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'user_notification_settings'
  AND a.attname = 'subscription_data'
  AND NOT a.attisdropped;
