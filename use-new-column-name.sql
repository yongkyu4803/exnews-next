-- 완전히 새로운 컬럼 이름 사용
-- push_subscription 대신 subscription_data로 변경

-- 1. 새 컬럼 추가
ALTER TABLE user_notification_settings
ADD COLUMN subscription_data TEXT;

-- 2. 테스트 데이터 삽입
UPDATE user_notification_settings
SET subscription_data = '{"endpoint": "https://fcm.googleapis.com/fcm/send/NEW_COLUMN_TEST", "keys": {"p256dh": "test", "auth": "test"}}'
WHERE device_id = 'device_a7703729_mgztqtlc';

-- 3. 즉시 확인
SELECT
  id,
  device_id,
  push_subscription,
  subscription_data,
  length(subscription_data) as new_col_length
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';
