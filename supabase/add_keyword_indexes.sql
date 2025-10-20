-- =====================================================
-- Keyword Search Optimization Indexes
-- =====================================================
-- 키워드 검색 성능 최적화를 위한 인덱스 생성
--
-- 사용법:
-- 1. Supabase Dashboard > SQL Editor로 이동
-- 2. 이 SQL 스크립트를 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
-- =====================================================

-- GIN 인덱스: 배열 타입 검색 최적화
-- keywords 배열 필드에 대한 GIN 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_notification_keywords
  ON user_notification_settings USING GIN(keywords);

-- media_names 배열 필드에 대한 GIN 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_notification_media_names
  ON user_notification_settings USING GIN(media_names);

-- JSONB 필드 검색 최적화
-- categories JSONB 필드에 대한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_user_notification_categories
  ON user_notification_settings USING GIN(categories);

-- schedule JSONB 필드에 대한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_user_notification_schedule
  ON user_notification_settings USING GIN(schedule);

-- push_subscription JSONB 필드에 대한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_user_notification_push_subscription
  ON user_notification_settings USING GIN(push_subscription);

-- 복합 인덱스: enabled + keywords 조합 (자주 사용되는 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_user_notification_enabled_keywords
  ON user_notification_settings(enabled)
  WHERE keywords IS NOT NULL AND keywords <> ARRAY[]::TEXT[];

-- 인덱스 생성 확인
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_notification_settings'
ORDER BY indexname;

-- 완료 메시지
SELECT 'Keyword search optimization indexes created successfully!' AS status;
