-- 방금 INSERT된 레코드를 직접 조회
SELECT 
  id,
  device_id,
  subscription_data,
  CASE 
    WHEN subscription_data IS NULL THEN 'NULL'
    WHEN subscription_data = '' THEN 'EMPTY STRING'
    ELSE 'HAS DATA (' || LENGTH(subscription_data) || ' chars)'
  END as data_status,
  enabled,
  created_at,
  updated_at
FROM user_notification_settings
WHERE id = 'a9692ef6-341c-46d5-a9ac-b0f3659ebdf7';

-- 테이블의 트리거 확인
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_notification_settings';

-- 테이블의 제약조건 확인
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_notification_settings'::regclass;
