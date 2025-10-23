-- Escape 처리 문제 테스트

-- 1. 직접 INSERT 테스트 (특수문자 포함)
DELETE FROM user_notification_settings WHERE device_id IN ('escape_test_1', 'escape_test_2', 'escape_test_3');

-- 케이스 1: 일반 JSON 문자열 (따옴표 포함)
INSERT INTO user_notification_settings (
  device_id,
  subscription_data,
  subscription_data_test,
  enabled,
  categories,
  schedule,
  keywords,
  media_names
) VALUES (
  'escape_test_1',
  '{"endpoint":"https://fcm.googleapis.com/fcm/send/test","keys":{"p256dh":"test","auth":"test"}}',
  '{"endpoint":"https://fcm.googleapis.com/fcm/send/test","keys":{"p256dh":"test","auth":"test"}}',
  true,
  '{"all":true}'::jsonb,
  '{"enabled":false}'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[]
);

-- 케이스 2: 실제 FCM 엔드포인트처럼 긴 문자열
INSERT INTO user_notification_settings (
  device_id,
  subscription_data,
  subscription_data_test,
  enabled,
  categories,
  schedule,
  keywords,
  media_names
) VALUES (
  'escape_test_2',
  '{"endpoint":"https://fcm.googleapis.com/fcm/send/fogJWCi_eqs:APA91bHQdSenDaz_HOoBdN54ykFdZ5Hh6jybi9qWxQTi5-test123456789","expirationTime":null,"keys":{"p256dh":"BAnTVpS-5tDtqifbGT9eRQpTXV-26exWLs1IvGF0TvHlNaly80cWCD6u0Q1gX6gX-o9DLY5dIeiAVIqrtJdtkfg","auth":"gw-6FjG5tFvBYZlZHwZfhAYMv74uDg8pT_EfDBXOQcI"}}',
  '{"endpoint":"https://fcm.googleapis.com/fcm/send/fogJWCi_eqs:APA91bHQdSenDaz_HOoBdN54ykFdZ5Hh6jybi9qWxQTi5-test123456789","expirationTime":null,"keys":{"p256dh":"BAnTVpS-5tDtqifbGT9eRQpTXV-26exWLs1IvGF0TvHlNaly80cWCD6u0Q1gX6gX-o9DLY5dIeiAVIqrtJdtkfg","auth":"gw-6FjG5tFvBYZlZHwZfhAYMv74uDg8pT_EfDBXOQcI"}}',
  true,
  '{"all":true}'::jsonb,
  '{"enabled":false}'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[]
);

-- 2. 결과 확인
SELECT 
  device_id,
  CASE WHEN subscription_data IS NULL THEN 'NULL ❌' ELSE 'DATA ✅' END as data_status,
  CASE WHEN subscription_data_test IS NULL THEN 'NULL ❌' ELSE 'DATA ✅' END as test_status,
  LENGTH(subscription_data) as data_len,
  LENGTH(subscription_data_test) as test_len
FROM user_notification_settings
WHERE device_id LIKE 'escape_test_%'
ORDER BY device_id;

-- 3. RPC 함수로 동일한 데이터 INSERT
SELECT * FROM upsert_push_subscription(
  'escape_test_3',
  '{"endpoint":"https://fcm.googleapis.com/fcm/send/fogJWCi_eqs:APA91bHQdSenDaz_HOoBdN54ykFdZ5Hh6jybi9qWxQTi5-test123456789","expirationTime":null,"keys":{"p256dh":"BAnTVpS-5tDtqifbGT9eRQpTXV-26exWLs1IvGF0TvHlNaly80cWCD6u0Q1gX6gX-o9DLY5dIeiAVIqrtJdtkfg","auth":"gw-6FjG5tFvBYZlZHwZfhAYMv74uDg8pT_EfDBXOQcI"}}'
);

-- 4. RPC 결과 확인
SELECT 
  device_id,
  subscription_data,
  subscription_data_test,
  CASE WHEN subscription_data IS NULL THEN 'NULL ❌' ELSE 'DATA ✅' END as data_status,
  CASE WHEN subscription_data_test IS NULL THEN 'NULL ❌' ELSE 'DATA ✅' END as test_status
FROM user_notification_settings
WHERE device_id = 'escape_test_3';
