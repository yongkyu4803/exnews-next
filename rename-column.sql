-- push_subscription 컬럼을 subscription_data로 이름 변경
ALTER TABLE user_notification_settings
RENAME COLUMN push_subscription TO subscription_data_old;

-- 기존에 추가한 subscription_data 컬럼 이름을 push_subscription으로 변경
ALTER TABLE user_notification_settings
RENAME COLUMN subscription_data TO push_subscription;

-- 확인
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notification_settings'
  AND column_name IN ('push_subscription', 'subscription_data_old')
ORDER BY column_name;

-- 테스트 데이터 확인
SELECT
  id,
  device_id,
  push_subscription,
  length(push_subscription) as len
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';
