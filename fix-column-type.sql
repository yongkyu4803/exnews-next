-- push_subscription 컬럼 타입을 TEXT에서 JSONB로 변경

-- 1. 기존 TEXT 데이터가 있다면 NULL로 초기화 (안전하게)
UPDATE user_notification_settings
SET push_subscription = NULL
WHERE push_subscription IS NOT NULL;

-- 2. 컬럼 타입을 JSONB로 변경
ALTER TABLE user_notification_settings
ALTER COLUMN push_subscription TYPE jsonb
USING push_subscription::jsonb;

-- 3. 결과 확인
SELECT
  id,
  device_id,
  push_subscription,
  pg_typeof(push_subscription) as column_type
FROM user_notification_settings
LIMIT 5;
