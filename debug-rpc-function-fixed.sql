-- RPC 함수를 디버깅 버전으로 재작성
CREATE OR REPLACE FUNCTION update_push_subscription(
  p_device_id TEXT,
  p_subscription TEXT
)
RETURNS TABLE (
  id UUID,
  device_id TEXT,
  push_subscription TEXT,
  enabled BOOLEAN,
  updated_at TIMESTAMPTZ,
  debug_info TEXT
)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_result RECORD;
  v_affected INTEGER;
BEGIN
  -- 먼저 UPDATE 실행
  UPDATE user_notification_settings
  SET
    push_subscription = p_subscription,
    updated_at = NOW()
  WHERE user_notification_settings.device_id = p_device_id;

  -- 영향받은 행 수 확인
  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- UPDATE 후 실제 DB에서 다시 조회
  SELECT
    uns.id,
    uns.device_id,
    uns.push_subscription,
    uns.enabled,
    uns.updated_at,
    format('Updated %s rows. Actual DB value length: %s', v_affected, length(uns.push_subscription)) as debug_info
  INTO v_result
  FROM user_notification_settings uns
  WHERE uns.device_id = p_device_id;

  -- 결과 반환
  RETURN QUERY
  SELECT
    v_result.id,
    v_result.device_id,
    v_result.push_subscription,
    v_result.enabled,
    v_result.updated_at,
    v_result.debug_info;
END;
$function$;

-- 테스트
SELECT * FROM update_push_subscription(
  'device_a7703729_mgztqtlc',
  '{"endpoint": "https://fcm.googleapis.com/fcm/send/DEBUG_VERSION_TEST", "keys": {"p256dh": "debug123", "auth": "debug456"}}'
);

-- 테스트 후 실제 DB 확인
SELECT
  id,
  device_id,
  push_subscription,
  length(push_subscription) as actual_length
FROM user_notification_settings
WHERE device_id = 'device_a7703729_mgztqtlc';
