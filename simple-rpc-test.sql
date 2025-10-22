-- 가장 단순한 형태로 RPC 함수 재작성
DROP FUNCTION IF EXISTS update_push_subscription(TEXT, TEXT);

CREATE FUNCTION update_push_subscription(
  p_device_id TEXT,
  p_subscription TEXT
)
RETURNS TABLE (
  id UUID,
  device_id TEXT,
  push_subscription TEXT,
  enabled BOOLEAN,
  updated_at TIMESTAMPTZ
)
AS '
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
' LANGUAGE plpgsql;

-- 권한 부여
GRANT EXECUTE ON FUNCTION update_push_subscription(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_push_subscription(TEXT, TEXT) TO authenticated;

-- 테스트
SELECT * FROM update_push_subscription(
  'device_a7703729_mgztqtlc',
  '{"endpoint": "https://fcm.googleapis.com/fcm/send/SIMPLE_RPC_TEST", "keys": {"p256dh": "simple123", "auth": "simple456"}}'
);

-- 테스트 후 실제 DB 확인
SELECT
  id,
  device_id,
  push_subscription,
  length(push_subscription) as actual_length,
  updated_at
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';
