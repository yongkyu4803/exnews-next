-- =====================================================
-- Keyword Push Subscriptions Table (Optimized)
-- =====================================================
-- 키워드 기반 푸시 알림 시스템
-- 복잡한 JSONB 제거, TEXT 필드로 안정성 확보
-- 카테고리 제거, 키워드 중심 설계
--
-- 사용법:
-- 1. Supabase Dashboard > SQL Editor
-- 2. 이 스크립트 전체 복사/붙여넣기
-- 3. "Run" 실행
-- =====================================================

-- =====================================================
-- Step 1: 기존 시스템 완전 제거
-- =====================================================

-- 기존 테이블 삭제 (CASCADE로 관련 객체 모두 제거)
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS user_notification_settings CASCADE;

-- 기존 RPC 함수 삭제
DROP FUNCTION IF EXISTS upsert_push_subscription(TEXT, TEXT);
DROP FUNCTION IF EXISTS upsert_push_subscription(TEXT, JSONB);

-- 기존 트리거 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

SELECT '✅ 기존 테이블 및 함수 삭제 완료' AS status;

-- =====================================================
-- Step 2: 새 테이블 생성 (최적화된 구조)
-- =====================================================

CREATE TABLE keyword_push_subscriptions (
  -- 기본 식별자
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,

  -- 푸시 구독 정보 (JSONB 대신 개별 TEXT 필드로 안정성 확보)
  endpoint TEXT NOT NULL,           -- FCM/Push Service Endpoint
  p256dh_key TEXT NOT NULL,         -- Public key for encryption
  auth_key TEXT NOT NULL,           -- Authentication secret

  -- 알림 활성화 상태
  enabled BOOLEAN NOT NULL DEFAULT true,

  -- 키워드 목록 (TEXT 배열)
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- 시간 제한 설정 (단순화)
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_start TIME DEFAULT '09:00'::TIME,
  schedule_end TIME DEFAULT '22:00'::TIME,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 제약조건: endpoint는 고유해야 함
  CONSTRAINT unique_endpoint UNIQUE (endpoint)
);

SELECT '✅ keyword_push_subscriptions 테이블 생성 완료' AS status;

-- =====================================================
-- Step 3: 인덱스 생성 (성능 최적화)
-- =====================================================

-- device_id 조회용 (가장 빈번한 조회)
CREATE INDEX idx_kps_device_id
  ON keyword_push_subscriptions(device_id);

-- enabled 필터링용 (Cron Job에서 활성 사용자만 조회)
CREATE INDEX idx_kps_enabled
  ON keyword_push_subscriptions(enabled)
  WHERE enabled = true;

-- 키워드 검색 최적화 (GIN 인덱스로 배열 검색 가속)
CREATE INDEX idx_kps_keywords_gin
  ON keyword_push_subscriptions USING GIN(keywords);

-- updated_at 정렬용
CREATE INDEX idx_kps_updated_at
  ON keyword_push_subscriptions(updated_at DESC);

SELECT '✅ 인덱스 생성 완료 (4개)' AS status;

-- =====================================================
-- Step 4: updated_at 자동 업데이트 트리거
-- =====================================================

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_kps_updated_at
  BEFORE UPDATE ON keyword_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ updated_at 자동 업데이트 트리거 설정 완료' AS status;

-- =====================================================
-- Step 5: RLS (Row Level Security) 정책
-- =====================================================

-- RLS 활성화
ALTER TABLE keyword_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 (모든 사용자, 익명 포함)
CREATE POLICY "Enable read access for all users"
  ON keyword_push_subscriptions
  FOR SELECT
  USING (true);

-- 삽입 권한 (모든 사용자, 익명 포함)
CREATE POLICY "Enable insert access for all users"
  ON keyword_push_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- 수정 권한 (모든 사용자, 익명 포함)
CREATE POLICY "Enable update access for all users"
  ON keyword_push_subscriptions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 삭제 권한 (모든 사용자, 익명 포함)
CREATE POLICY "Enable delete access for all users"
  ON keyword_push_subscriptions
  FOR DELETE
  USING (true);

SELECT '✅ RLS 정책 설정 완료 (4개 정책)' AS status;

-- =====================================================
-- Step 6: 테이블 및 컬럼 설명 (문서화)
-- =====================================================

COMMENT ON TABLE keyword_push_subscriptions IS
  '키워드 기반 푸시 알림 구독 정보 (Device ID 기반, JSONB 미사용으로 안정성 확보)';

COMMENT ON COLUMN keyword_push_subscriptions.device_id IS
  '브라우저 fingerprint 기반 고유 기기 식별자';

COMMENT ON COLUMN keyword_push_subscriptions.endpoint IS
  'Push Service Endpoint URL (FCM/VAPID)';

COMMENT ON COLUMN keyword_push_subscriptions.p256dh_key IS
  'Public key for message encryption (Base64)';

COMMENT ON COLUMN keyword_push_subscriptions.auth_key IS
  'Authentication secret for encryption (Base64)';

COMMENT ON COLUMN keyword_push_subscriptions.enabled IS
  '푸시 알림 활성화 여부';

COMMENT ON COLUMN keyword_push_subscriptions.keywords IS
  '관심 키워드 배열 (뉴스 제목/내용 매칭용)';

COMMENT ON COLUMN keyword_push_subscriptions.schedule_enabled IS
  '시간 제한 활성화 여부';

COMMENT ON COLUMN keyword_push_subscriptions.schedule_start IS
  '알림 시작 시간 (KST 기준)';

COMMENT ON COLUMN keyword_push_subscriptions.schedule_end IS
  '알림 종료 시간 (KST 기준)';

SELECT '✅ 테이블 문서화 완료' AS status;

-- =====================================================
-- Step 7: 검증 및 최종 확인
-- =====================================================

-- 테이블 구조 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'keyword_push_subscriptions'
ORDER BY ordinal_position;

-- 인덱스 확인
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'keyword_push_subscriptions';

-- RLS 정책 확인
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'keyword_push_subscriptions';

-- =====================================================
-- 완료 메시지
-- =====================================================

SELECT '

🎉 키워드 푸시 알림 시스템 재구축 완료!

✅ 기존 테이블 삭제: push_subscriptions, user_notification_settings
✅ 새 테이블 생성: keyword_push_subscriptions
✅ 인덱스 4개 생성
✅ RLS 정책 4개 설정
✅ 트리거 설정 완료

📊 테이블 구조:
- JSONB 제거 → TEXT 필드로 안정성 확보
- 카테고리 제거 → 키워드 중심 설계
- 단일 테이블 → 데이터 일관성 보장

🚀 다음 단계:
1. API 코드 업데이트 (subscribe.ts, settings.ts)
2. 클라이언트 코드 수정 (pushNotification.ts)
3. UI 컴포넌트 단순화 (NotificationSettings.tsx)
4. Cron Job 업데이트 (check-new-news.ts)

' AS completion_message;
