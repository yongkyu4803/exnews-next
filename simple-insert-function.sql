-- INSERT 함수도 단순한 형태로 재작성
DROP FUNCTION IF EXISTS insert_push_subscription(TEXT, TEXT);

CREATE FUNCTION insert_push_subscription(
  p_device_id TEXT,
  p_subscription TEXT
)
RETURNS TABLE (
  id UUID,
  device_id TEXT,
  push_subscription TEXT,
  enabled BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
AS '
BEGIN
  RETURN QUERY
  INSERT INTO user_notification_settings (
    device_id,
    push_subscription,
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
    ''{"all": true, "정치": false, "경제": false, "사회": false, "국제": false, "문화": false, "연예/스포츠": false, "기타": false}''::jsonb,
    ''{"enabled": false, "startTime": "09:00", "endTime": "22:00"}''::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    NOW(),
    NOW()
  )
  RETURNING
    user_notification_settings.id,
    user_notification_settings.device_id,
    user_notification_settings.push_subscription,
    user_notification_settings.enabled,
    user_notification_settings.created_at,
    user_notification_settings.updated_at;
END;
' LANGUAGE plpgsql;

-- 권한 부여
GRANT EXECUTE ON FUNCTION insert_push_subscription(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION insert_push_subscription(TEXT, TEXT) TO authenticated;
