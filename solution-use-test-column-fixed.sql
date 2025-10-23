-- 해결책: subscription_data_test 컬럼을 메인으로 사용

-- 1. 기존 함수 삭제
DROP FUNCTION IF EXISTS upsert_push_subscription(TEXT, TEXT);

-- 2. subscription_data_test 사용하는 새 함수 생성
CREATE OR REPLACE FUNCTION upsert_push_subscription(
  p_device_id TEXT,
  p_subscription_data TEXT
)
RETURNS TABLE (
  id UUID,
  device_id TEXT,
  subscription_data_test TEXT,  -- 🔥 _test 컬럼 사용!
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
    UPDATE user_notification_settings
    SET
      subscription_data_test = p_subscription_data,
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
      subscription_data_test,
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

-- 3. 권한 부여
GRANT EXECUTE ON FUNCTION upsert_push_subscription(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_push_subscription(TEXT, TEXT) TO anon;
