-- Step 6 실행: 타입 확인
SELECT
  id,
  device_id,
  push_subscription,
  pg_typeof(push_subscription) as actual_type,
  jsonb_typeof(push_subscription) as jsonb_type_check
FROM user_notification_settings;
