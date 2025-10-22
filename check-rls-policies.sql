-- RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_notification_settings';

-- RLS 활성화 여부 확인
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_notification_settings';
