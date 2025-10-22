-- Raw SQL로 직접 UPDATE 시도
UPDATE user_notification_settings
SET
  push_subscription = '{"endpoint": "https://fcm.googleapis.com/fcm/send/DIRECT_SQL_TEST", "keys": {"p256dh": "test123", "auth": "test456"}}'::text,
  updated_at = NOW()
WHERE device_id = 'device_a7703729_mgztqtlc';

-- 즉시 조회해서 확인
SELECT
  id,
  device_id,
  push_subscription,
  push_subscription IS NULL as is_null,
  length(push_subscription) as text_length,
  updated_at
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';
