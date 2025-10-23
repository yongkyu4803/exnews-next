-- subscription_data를 안전하게 INSERT/UPDATE하는 RPC 함수
-- 명시적 커밋과 검증 포함

CREATE OR REPLACE FUNCTION upsert_push_subscription(
  p_device_id TEXT,
  p_subscription_data TEXT
)
RETURNS TABLE (
  id UUID,
  device_id TEXT,
  subscription_data TEXT,
  enabled BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
BEGIN
  -- 기존 레코드 확인
  SELECT user_notification_settings.id INTO v_existing_id
  FROM user_notification_settings
  WHERE user_notification_settings.device_id = p_device_id;

  IF v_existing_id IS NOT NULL THEN
    -- UPDATE
    UPDATE user_notification_settings
    SET
      subscription_data = p_subscription_data,
      updated_at = NOW()
    WHERE user_notification_settings.device_id = p_device_id;
  ELSE
    -- INSERT
    INSERT INTO user_notification_settings (
      device_id,
      subscription_data,
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
      '[]'::jsonb,
      '[]'::jsonb
    );
  END IF;

  -- 명시적으로 검증 조회 반환
  RETURN QUERY
  SELECT
    user_notification_settings.id,
    user_notification_settings.device_id,
    user_notification_settings.subscription_data,
    user_notification_settings.enabled,
    user_notification_settings.updated_at
  FROM user_notification_settings
  WHERE user_notification_settings.device_id = p_device_id;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION upsert_push_subscription(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_push_subscription(TEXT, TEXT) TO anon;
