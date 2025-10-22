-- Step 1: 기존 데이터 백업
CREATE TABLE user_notification_settings_backup AS
SELECT * FROM user_notification_settings;

-- Step 2: 기존 테이블 삭제
DROP TABLE user_notification_settings;

-- Step 3: 새 테이블 생성 (push_subscription에 DEFAULT 없음)
CREATE TABLE user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  push_subscription JSONB,  -- DEFAULT 없음!
  enabled BOOLEAN NOT NULL DEFAULT true,
  categories JSONB NOT NULL DEFAULT '{"all": true, "정치": false, "경제": false, "사회": false, "국제": false, "문화": false, "연예/스포츠": false, "기타": false}'::jsonb,
  schedule JSONB NOT NULL DEFAULT '{"enabled": false, "startTime": "09:00", "endTime": "22:00"}'::jsonb,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  media_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: 백업에서 데이터 복원 (push_subscription 제외, 어차피 NULL이었음)
INSERT INTO user_notification_settings (
  id, device_id, enabled, categories, schedule, keywords, media_names, created_at, updated_at
)
SELECT
  id, device_id, enabled, categories, schedule, keywords, media_names, created_at, updated_at
FROM user_notification_settings_backup;

-- Step 5: 백업 테이블 삭제
DROP TABLE user_notification_settings_backup;

-- Step 6: 확인
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_notification_settings'
  AND column_name = 'push_subscription';
