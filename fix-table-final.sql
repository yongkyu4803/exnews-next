-- 완전히 새로 시작
-- Step 1: 테이블 완전 삭제
DROP TABLE IF EXISTS user_notification_settings CASCADE;

-- Step 2: 처음부터 다시 생성
CREATE TABLE user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  push_subscription JSONB,  -- JSONB 타입!
  enabled BOOLEAN NOT NULL DEFAULT true,
  categories JSONB NOT NULL DEFAULT '{"all": true, "정치": false, "경제": false, "사회": false, "국제": false, "문화": false, "연예/스포츠": false, "기타": false}'::jsonb,
  schedule JSONB NOT NULL DEFAULT '{"enabled": false, "startTime": "09:00", "endTime": "22:00"}'::jsonb,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  media_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: 인덱스 생성
CREATE INDEX idx_user_notification_settings_device_id ON user_notification_settings(device_id);

-- Step 4: 컬럼 타입 확인
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notification_settings'
ORDER BY ordinal_position;

-- Step 5: 테스트 데이터 삽입
INSERT INTO user_notification_settings (
  device_id,
  push_subscription,
  enabled,
  categories,
  schedule
) VALUES (
  'device_a7703729_mgztqtlc',
  '{"endpoint": "https://fcm.googleapis.com/fcm/send/TEST", "keys": {"p256dh": "test", "auth": "test"}}'::jsonb,
  true,
  '{"all": true, "경제": true, "사회": true, "정치": true}'::jsonb,
  '{"enabled": false, "startTime": "09:00", "endTime": "22:00"}'::jsonb
);

-- Step 6: 결과 확인 (JSONB인지 TEXT인지 명확히 확인)
SELECT
  id,
  device_id,
  push_subscription,
  pg_typeof(push_subscription) as actual_type,
  jsonb_typeof(push_subscription) as jsonb_type_check
FROM user_notification_settings;
