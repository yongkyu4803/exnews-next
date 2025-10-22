-- Fix push_subscription for device_a7703729_mgztqt1c
-- UUID: 569f9deb-86e4-48af-bcc7-5de91811d9db

-- Method 1: Direct update with real subscription from logs
UPDATE user_notification_settings
SET push_subscription = '{
  "endpoint": "https://fcm.googleapis.com/fcm/send/eeA1VOCIONE:APA91bGANVKj-VRXSWu5gRqWZhzrk5jSUqyXbzKMP_aKvEl4zFYiTTM1zeVpdf5Orsn1XCTi2zWcC0FYBwR6y6BAXjlCq5Gj0APEzRow-yQjcc9CL",
  "keys": {
    "p256dh": "PLACEHOLDER_P256DH",
    "auth": "PLACEHOLDER_AUTH"
  }
}'::jsonb,
updated_at = NOW()
WHERE id = '569f9deb-86e4-48af-bcc7-5de91811d9db';

-- Check result
SELECT id, device_id, push_subscription IS NOT NULL as has_subscription, enabled
FROM user_notification_settings
WHERE id = '569f9deb-86e4-48af-bcc7-5de91811d9db';
