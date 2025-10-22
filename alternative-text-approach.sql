-- 대안: push_subscription을 TEXT 타입으로 변경
ALTER TABLE user_notification_settings
ALTER COLUMN push_subscription TYPE TEXT;

-- 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notification_settings'
  AND column_name = 'push_subscription';
