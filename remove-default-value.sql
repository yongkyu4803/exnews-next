-- Default Value 완전 제거
ALTER TABLE user_notification_settings
ALTER COLUMN push_subscription DROP DEFAULT;

-- 확인
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notification_settings'
  AND column_name = 'push_subscription';
