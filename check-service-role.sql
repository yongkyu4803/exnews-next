-- Service Role Key 환경변수가 제대로 설정되었는지 확인용
-- Vercel 환경변수에 SUPABASE_SERVICE_ROLE_KEY가 있는지 확인 필요

SELECT 
  id,
  device_id,
  subscription_data,
  enabled,
  updated_at
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc'
ORDER BY updated_at DESC;
