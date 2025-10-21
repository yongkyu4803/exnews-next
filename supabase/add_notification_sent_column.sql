-- =====================================================
-- Add notification_sent_at column to news table
-- =====================================================
-- 푸시 알림 발송 완료 시간을 기록하는 컬럼 추가
-- 중복 발송 방지 및 알림 이력 추적용
--
-- 사용법:
-- 1. Supabase Dashboard > SQL Editor로 이동
-- 2. 이 SQL 스크립트를 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
-- =====================================================

-- news 테이블에 notification_sent_at 컬럼 추가
ALTER TABLE news
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ DEFAULT NULL;

-- 컬럼 설명 추가
COMMENT ON COLUMN news.notification_sent_at IS '푸시 알림 발송 완료 시간 (NULL = 미발송, TIMESTAMPTZ = 발송 완료)';

-- 인덱스 생성 (성능 최적화)
-- 미발송 뉴스를 빠르게 조회하기 위한 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_news_notification_pending
  ON news(pub_date DESC)
  WHERE notification_sent_at IS NULL;

-- 발송 완료 뉴스를 날짜별로 조회하기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_news_notification_sent
  ON news(notification_sent_at DESC)
  WHERE notification_sent_at IS NOT NULL;

-- 통계 확인 쿼리 (선택사항)
-- SELECT
--   COUNT(*) FILTER (WHERE notification_sent_at IS NULL) AS pending_count,
--   COUNT(*) FILTER (WHERE notification_sent_at IS NOT NULL) AS sent_count,
--   COUNT(*) AS total_count
-- FROM news;
