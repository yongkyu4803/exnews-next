-- 1. user_notification_settings 테이블의 모든 트리거 확인
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_notification_settings';

-- 2. PostgreSQL 네이티브 트리거 확인 (더 상세함)
SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  t.tgtype AS trigger_type,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'user_notification_settings'
  AND t.tgisinternal = false;

-- 3. 컬럼 제약조건 확인
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_notification_settings'::regclass;
