-- push_subscription 컬럼을 완전히 다시 만들기

-- 1. 기존 컬럼 삭제
ALTER TABLE user_notification_settings
DROP COLUMN IF EXISTS push_subscription;

-- 2. 새 컬럼 생성 (DEFAULT 없이)
ALTER TABLE user_notification_settings
ADD COLUMN push_subscription TEXT;

-- 3. 컬럼 정보 확인
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable,
  is_updatable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notification_settings'
  AND column_name = 'push_subscription';

-- 4. 직접 UPDATE 테스트
UPDATE user_notification_settings
SET push_subscription = '{"test": "manual_update_after_recreate"}'
WHERE device_id = 'device_a7703729_mgztqtlc';

-- 5. 즉시 확인
SELECT
  id,
  device_id,
  push_subscription,
  push_subscription IS NULL as is_null,
  length(push_subscription) as text_length
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';
