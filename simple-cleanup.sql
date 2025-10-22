-- 1. 문제있는 push_subscription 컬럼 삭제
ALTER TABLE user_notification_settings
DROP COLUMN IF EXISTS push_subscription;

-- 2. subscription_data를 그대로 사용 (이미 정상 작동 확인됨)
-- 아무것도 안 함

-- 3. 확인
SELECT
  id,
  device_id,
  subscription_data,
  length(subscription_data) as len
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';
