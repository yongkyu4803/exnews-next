-- 1. 테스트용 임시 컬럼 추가
ALTER TABLE user_notification_settings 
ADD COLUMN IF NOT EXISTS subscription_data_test TEXT;

-- 2. 다른 컬럼명으로 RPC 함수 생성
CREATE OR REPLACE FUNCTION upsert_push_subscription_test(
  p_device_id TEXT,
  p_subscription_data TEXT
)
RETURNS TABLE (
  id UUID,
  device_id TEXT,
  subscription_data_test TEXT,  -- 🔥 다른 컬럼명 사용
  enabled BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_result RECORD;
BEGIN
  SELECT user_notification_settings.id INTO v_existing_id
  FROM user_notification_settings
  WHERE user_notification_settings.device_id = p_device_id;

  IF v_existing_id IS NOT NULL THEN
    -- 🔥 subscription_data_test 컬럼에 저장
    UPDATE user_notification_settings
    SET
      subscription_data_test = p_subscription_data,  -- 다른 컬럼!
      updated_at = NOW()
    WHERE user_notification_settings.device_id = p_device_id
    RETURNING 
      user_notification_settings.id,
      user_notification_settings.device_id,
      user_notification_settings.subscription_data_test,
      user_notification_settings.enabled,
      user_notification_settings.updated_at
    INTO v_result;
    
    RETURN QUERY SELECT 
      v_result.id,
      v_result.device_id,
      v_result.subscription_data_test,
      v_result.enabled,
      v_result.updated_at;
  ELSE
    INSERT INTO user_notification_settings (
      device_id,
      subscription_data_test,  -- 🔥 다른 컬럼!
      enabled,
      categories,
      schedule,
      keywords,
      media_names
    ) VALUES (
      p_device_id,
      p_subscription_data,
      true,
      '{"all":true,"정치":false,"경제":false,"사회":false,"국제":false,"문화":false,"연예/스포츠":false,"기타":false}'::jsonb,
      '{"enabled":false,"startTime":"09:00","endTime":"22:00"}'::jsonb,
      ARRAY[]::text[],
      ARRAY[]::text[]
    )
    RETURNING 
      user_notification_settings.id,
      user_notification_settings.device_id,
      user_notification_settings.subscription_data_test,
      user_notification_settings.enabled,
      user_notification_settings.updated_at
    INTO v_result;
    
    RETURN QUERY SELECT 
      v_result.id,
      v_result.device_id,
      v_result.subscription_data_test,
      v_result.enabled,
      v_result.updated_at;
  END IF;
END;
$$;

-- 3. 테스트 실행
DELETE FROM user_notification_settings WHERE device_id = 'column_test_device';

SELECT * FROM upsert_push_subscription_test(
  'column_test_device',
  '{"endpoint":"https://column.test","keys":{"p256dh":"test","auth":"test"}}'
);

-- 4. 두 컬럼 동시 비교
SELECT 
  device_id,
  subscription_data as original_column,
  subscription_data_test as test_column,
  CASE 
    WHEN subscription_data IS NULL THEN 'NULL ❌'
    ELSE 'HAS DATA ✅'
  END as original_status,
  CASE 
    WHEN subscription_data_test IS NULL THEN 'NULL ❌'
    ELSE 'HAS DATA ✅'
  END as test_status
FROM user_notification_settings
WHERE device_id = 'column_test_device';
