-- RPC 함수 재작성 - SECURITY DEFINER 추가로 권한 문제 해결

-- UPDATE 함수
DROP FUNCTION IF EXISTS update_push_subscription(TEXT, TEXT);

CREATE OR REPLACE FUNCTION update_push_subscription(
  p_device_id TEXT,
  p_subscription TEXT
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
AS $$
BEGIN
  RETURN QUERY
  UPDATE user_notification_settings
  SET
    subscription_data = p_subscription,
    updated_at = NOW()
  WHERE user_notification_settings.device_id = p_device_id
  RETURNING
    user_notification_settings.id,
    user_notification_settings.device_id,
    user_notification_settings.subscription_data,
    user_notification_settings.enabled,
    user_notification_settings.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION update_push_subscription(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_push_subscription(TEXT, TEXT) TO authenticated;

-- INSERT 함수
DROP FUNCTION IF EXISTS insert_push_subscription(TEXT, TEXT);

CREATE OR REPLACE FUNCTION insert_push_subscription(
  p_device_id TEXT,
  p_subscription TEXT
)
RETURNS TABLE (
  id UUID,
  device_id TEXT,
  subscription_data TEXT,
  enabled BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO user_notification_settings (
    device_id,
    subscription_data,
    enabled,
    categories,
    schedule,
    keywords,
    media_names,
    created_at,
    updated_at
  ) VALUES (
    p_device_id,
    p_subscription,
    true,
    '{"all": true, "정치": false, "경제": false, "사회": false, "국제": false, "문화": false, "연예/스포츠": false, "기타": false}'::jsonb,
    '{"enabled": false, "startTime": "09:00", "endTime": "22:00"}'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    NOW(),
    NOW()
  )
  RETURNING
    user_notification_settings.id,
    user_notification_settings.device_id,
    user_notification_settings.subscription_data,
    user_notification_settings.enabled,
    user_notification_settings.created_at,
    user_notification_settings.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_push_subscription(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION insert_push_subscription(TEXT, TEXT) TO authenticated;

-- 테스트
SELECT * FROM update_push_subscription(
  'device_a7703729_mgztqtlc',
  '{"endpoint": "RPC_SECURITY_DEFINER_TEST", "keys": {"p256dh": "test123", "auth": "test456"}}'
);
