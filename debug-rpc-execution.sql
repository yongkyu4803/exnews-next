-- RPC 함수 내부에서 실제로 어떤 일이 일어나는지 확인

-- 1. 현재 RPC 함수 정의 확인
SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'upsert_push_subscription';

-- 2. RPC 함수 직접 실행하고 즉시 검증
DO $$
DECLARE
  v_result RECORD;
BEGIN
  -- RPC 함수 실행
  SELECT * INTO v_result
  FROM upsert_push_subscription(
    'debug_test_device',
    '{"endpoint":"https://debug.test","keys":{"p256dh":"test","auth":"test"}}'
  );
  
  RAISE NOTICE 'RPC 반환 결과 - id: %, subscription_data: %', 
    v_result.id, 
    SUBSTRING(v_result.subscription_data, 1, 50);
  
  -- 즉시 실제 DB 조회
  SELECT subscription_data INTO v_result
  FROM user_notification_settings
  WHERE device_id = 'debug_test_device';
  
  RAISE NOTICE '실제 DB 조회 결과 - subscription_data: %', 
    SUBSTRING(v_result.subscription_data, 1, 50);
END $$;

-- 3. 결과 확인
SELECT 
  device_id,
  subscription_data,
  LENGTH(subscription_data) as data_length
FROM user_notification_settings
WHERE device_id = 'debug_test_device';
