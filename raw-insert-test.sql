-- 1. 기존 행 삭제
DELETE FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';

-- 2. Raw SQL로 직접 INSERT (JSONB 리터럴 사용)
INSERT INTO user_notification_settings (
  device_id,
  push_subscription,
  enabled,
  categories,
  schedule,
  keywords,
  media_names,
  created_at,
  updated_at
) VALUES (
  'device_a7703729_mgztqtlc',
  '{"endpoint": "https://fcm.googleapis.com/fcm/send/TEST_MANUAL_INSERT", "keys": {"p256dh": "test123", "auth": "auth456"}}'::jsonb,
  true,
  '{"all": true}'::jsonb,
  '{"enabled": false, "startTime": "09:00", "endTime": "22:00"}'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  NOW(),
  NOW()
);

-- 3. 결과 확인
SELECT
  id,
  device_id,
  push_subscription,
  push_subscription IS NULL as is_null,
  jsonb_typeof(push_subscription) as jsonb_type
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';
