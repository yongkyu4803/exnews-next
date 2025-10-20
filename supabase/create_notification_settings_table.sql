-- =====================================================
-- User Notification Settings Table
-- =====================================================
-- 사용자별 푸시 알림 설정을 저장하는 테이블
-- Device ID 기반으로 로그인 없이 사용자를 식별합니다.
--
-- 사용법:
-- 1. Supabase Dashboard > SQL Editor로 이동
-- 2. 이 SQL 스크립트를 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
-- =====================================================

-- 기존 테이블이 있다면 삭제 (주의: 데이터 손실!)
-- DROP TABLE IF EXISTS user_notification_settings;

-- 테이블 생성
CREATE TABLE IF NOT EXISTS user_notification_settings (
  -- 기본 필드
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,

  -- 푸시 구독 정보 (PushSubscription 객체를 JSON으로 저장)
  push_subscription JSONB,

  -- 알림 활성화 여부
  enabled BOOLEAN NOT NULL DEFAULT false,

  -- 카테고리별 알림 설정 (JSON 객체)
  categories JSONB NOT NULL DEFAULT '{
    "all": true,
    "정치": false,
    "경제": false,
    "사회": false,
    "국제": false,
    "문화": false,
    "연예/스포츠": false,
    "기타": false
  }'::jsonb,

  -- 시간대별 알림 설정 (JSON 객체)
  schedule JSONB NOT NULL DEFAULT '{
    "morning": true,
    "afternoon": false,
    "evening": true
  }'::jsonb,

  -- 키워드 알림 (배열)
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- 언론사 필터 (배열)
  media_names TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_device_id
  ON user_notification_settings(device_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_settings_enabled
  ON user_notification_settings(enabled);

CREATE INDEX IF NOT EXISTS idx_user_notification_settings_created_at
  ON user_notification_settings(created_at DESC);

-- updated_at 자동 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
DROP TRIGGER IF EXISTS update_user_notification_settings_updated_at
  ON user_notification_settings;

CREATE TRIGGER update_user_notification_settings_updated_at
  BEFORE UPDATE ON user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 설정
-- 모든 사용자가 자신의 device_id로 접근 가능
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능 (익명 사용자 포함)
CREATE POLICY "Enable read access for all users"
  ON user_notification_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON user_notification_settings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON user_notification_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON user_notification_settings
  FOR DELETE
  USING (true);

-- 테이블 설명 추가
COMMENT ON TABLE user_notification_settings IS '사용자별 푸시 알림 설정 테이블 (Device ID 기반)';
COMMENT ON COLUMN user_notification_settings.device_id IS '브라우저 fingerprint 기반 고유 기기 식별자';
COMMENT ON COLUMN user_notification_settings.push_subscription IS 'PushSubscription 객체 (JSON)';
COMMENT ON COLUMN user_notification_settings.enabled IS '알림 활성화 여부';
COMMENT ON COLUMN user_notification_settings.categories IS '카테고리별 알림 설정 (JSON)';
COMMENT ON COLUMN user_notification_settings.schedule IS '시간대별 알림 설정 (JSON)';
COMMENT ON COLUMN user_notification_settings.keywords IS '키워드 알림 배열';
COMMENT ON COLUMN user_notification_settings.media_names IS '언론사 필터 배열';

-- 샘플 데이터 삽입 (테스트용 - 선택사항)
-- INSERT INTO user_notification_settings (device_id, enabled, categories, schedule)
-- VALUES (
--   'device_test123_abc',
--   true,
--   '{"all": false, "정치": true, "경제": true, "사회": false, "국제": true, "문화": false, "연예/스포츠": false, "기타": false}'::jsonb,
--   '{"morning": true, "afternoon": false, "evening": true}'::jsonb
-- );

-- 테이블 확인
SELECT * FROM user_notification_settings LIMIT 10;

-- 완료 메시지
SELECT 'user_notification_settings 테이블이 성공적으로 생성되었습니다!' AS status;
