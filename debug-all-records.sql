-- 모든 레코드 확인
SELECT 
  id,
  device_id,
  CASE 
    WHEN subscription_data IS NULL THEN 'NULL'
    WHEN subscription_data = '' THEN 'EMPTY'
    ELSE SUBSTRING(subscription_data, 1, 50) || '...'
  END as subscription_preview,
  LENGTH(subscription_data) as data_length,
  enabled,
  updated_at
FROM user_notification_settings
ORDER BY updated_at DESC
LIMIT 10;
