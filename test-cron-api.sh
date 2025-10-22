#!/bin/bash

# 수동 Cron API 테스트 스크립트
# 사용법: ./test-cron-api.sh

echo "🔍 Testing Cron API manually..."
echo ""

# API 호출
response=$(curl -s -w "\n%{http_code}" -X POST https://exnews-next.vercel.app/api/cron/check-new-news \
  -H "Content-Type: application/json" \
  -H "x-github-actions: manual-test" \
  -H "Authorization: Bearer ${CRON_API_KEY}" \
  --connect-timeout 10 \
  --max-time 30)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP Status: $http_code"
echo ""
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" -eq 200 ]; then
  echo "✅ API call successful!"
  echo ""
  echo "📊 Now check Vercel logs at:"
  echo "https://vercel.com/parkyongkyus-projects/exnews-next/logs"
  echo ""
  echo "Look for logs with timestamp: $(date '+%Y-%m-%d %H:%M:%S KST')"
else
  echo "❌ API call failed with status $http_code"
fi
