-- Supabase RPC 함수 생성: push_subscription 업데이트 전용
CREATE OR REPLACE FUNCTION update_push_subscription(
  p_device_id TEXT,
  p_subscription TEXT
)
RETURNS TABLE (
  id UUID,
  device_id TEXT,
  push_subscription TEXT,
  enabled BOOLEAN,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  UPDATE user_notification_settings
  SET
    push_subscription = p_subscription,
    updated_at = NOW()
  WHERE user_notification_settings.device_id = p_device_id
  RETURNING
    user_notification_settings.id,
    user_notification_settings.device_id,
    user_notification_settings.push_subscription,
    user_notification_settings.enabled,
    user_notification_settings.updated_at;
END;
$$ LANGUAGE plpgsql;

-- 함수 권한 설정 (anon 키로 호출 가능하도록)
GRANT EXECUTE ON FUNCTION update_push_subscription(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_push_subscription(TEXT, TEXT) TO authenticated;

-- 테스트
SELECT * FROM update_push_subscription(
  'device_a7703729_mgztqtlc',
  '{"endpoint": "https://fcm.googleapis.com/fcm/send/RPC_FUNCTION_TEST", "keys": {"p256dh": "rpc123", "auth": "rpc456"}}'
);
