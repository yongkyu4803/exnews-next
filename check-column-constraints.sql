-- subscription_data 컬럼 정의 확인
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notification_settings'
  AND column_name = 'subscription_data';

-- 테이블의 모든 제약조건 확인
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_notification_settings'::regclass;
