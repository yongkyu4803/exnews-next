-- 테이블의 모든 컬럼 확인
SELECT
  column_name,
  data_type,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notification_settings'
ORDER BY ordinal_position;

-- 실제 데이터 확인 (모든 컬럼)
SELECT *
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';
