#!/bin/bash

# 실제 사용자의 push_subscription을 수동으로 업데이트하는 스크립트
# 사용법: ./update-user-subscription.sh <device_id> <subscription_json>

if [ $# -lt 1 ]; then
  echo "사용법: ./update-user-subscription.sh <device_id>"
  echo ""
  echo "예제:"
  echo "./update-user-subscription.sh device_a7801f9c_mgztx4dy"
  echo ""
  echo "현재 DB의 device_id:"
  echo "  1. device_a7801f9c_mgztx4dy"
  echo "  2. device_a7703729_mgztqt1c"
  exit 1
fi

DEVICE_ID="$1"

# 더미 subscription (테스트용)
# 실제 subscription을 얻으려면 모바일 브라우저 콘솔에서:
# navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription().then(sub => console.log(JSON.stringify(sub))))
SUBSCRIPTION='{
  "endpoint": "https://fcm.googleapis.com/fcm/send/dummy-for-test-'$RANDOM'",
  "keys": {
    "auth": "dummyAuthKey-'$RANDOM'",
    "p256dh": "dummyP256dhKey-'$RANDOM'"
  }
}'

echo "🔄 Updating subscription for device: $DEVICE_ID"
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
echo "Response Body:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
  echo "✅ Subscription updated successfully!"
  echo ""
  echo "📊 Verify in Supabase:"
  echo "https://supabase.com → user_notification_settings"
  echo "Find row with device_id: $DEVICE_ID"
  echo "Check that push_subscription is now NOT NULL"
  echo ""
  echo "⚠️  NOTE: This is a DUMMY subscription for testing!"
  echo "Real push notifications will NOT be sent with this dummy data."
  echo ""
  echo "To get REAL subscription from mobile browser:"
  echo "1. Open Chrome DevTools on mobile"
  echo "2. Run in console:"
  echo "   navigator.serviceWorker.ready.then(reg => "
  echo "     reg.pushManager.getSubscription().then(sub => "
  echo "       console.log(JSON.stringify(sub))"
  echo "     )"
  echo "   )"
  echo "3. Copy the JSON output"
  echo "4. Use it instead of dummy data"
else
  echo "❌ Failed to update subscription!"
  echo ""
  echo "Error details above ⬆️"
fi
