#!/bin/bash

# Push Subscription API 테스트 스크립트
# 모바일에서 구독이 DB에 저장되지 않는 문제 진단

echo "🔍 Testing Push Subscription API..."
echo ""

# 테스트용 더미 subscription 데이터
SUBSCRIPTION='{
  "endpoint": "https://fcm.googleapis.com/fcm/send/test123",
  "keys": {
    "auth": "testAuthKey123",
    "p256dh": "testP256dhKey123"
  }
}'

DEVICE_ID="device_test_manual_12345"

echo "📤 Sending subscription to server..."
echo "Device ID: $DEVICE_ID"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST https://exnews-next.vercel.app/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"subscription\": $SUBSCRIPTION
  }")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Status: $http_code"
echo ""
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo "✅ API call successful!"
  echo ""
  echo "📊 Now check Supabase database:"
  echo "https://supabase.com → user_notification_settings table"
  echo "Look for device_id: $DEVICE_ID"
else
  echo "❌ API call failed!"
  echo ""
  echo "🔍 Check the error message above"
fi
