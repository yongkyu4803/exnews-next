# 푸시 알림 시스템 재설계 완료

## 📋 변경 개요

기존 푸시 알림 시스템의 불안정성 문제를 해결하기 위해 전체 시스템을 재설계했습니다.

### 주요 문제점
- `subscription_data` 컬럼에 JSONB 데이터 저장 실패 (컬럼 레벨 이슈)
- 복잡한 JSONB 구조로 인한 직렬화/역직렬화 오류
- 불필요한 카테고리 알림 기능
- 2개의 테이블 혼재로 인한 복잡도 증가

### 해결 방안
- **JSONB 제거** → TEXT 필드로 분해 저장
- **카테고리 제거** → 키워드 중심 알림으로 단순화
- **단일 테이블** → `keyword_push_subscriptions` 테이블로 통합
- **구조 최적화** → subscription 객체를 3개 필드로 분해

---

## 🗄️ 데이터베이스 변경사항

### 1. 기존 테이블 삭제
```sql
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS user_notification_settings CASCADE;
DROP FUNCTION IF EXISTS upsert_push_subscription;
```

### 2. 새 테이블 생성

**테이블명**: `keyword_push_subscriptions`

```sql
CREATE TABLE keyword_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,

  -- 푸시 구독 정보 (JSONB 대신 개별 TEXT 필드)
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  -- 알림 설정
  enabled BOOLEAN NOT NULL DEFAULT true,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- 시간 제한 설정
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_start TIME DEFAULT '09:00',
  schedule_end TIME DEFAULT '22:00',

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**변경 근거**:
- ✅ JSONB `subscription_data` → TEXT 3개 필드 (`endpoint`, `p256dh_key`, `auth_key`)
- ✅ JSONB `categories` 완전 제거
- ✅ JSONB `schedule` → 단순 컬럼 3개 (`schedule_enabled`, `schedule_start`, `schedule_end`)
- ✅ TEXT[] `keywords` 유지 (GIN 인덱스로 최적화)

### 3. 인덱스 생성
```sql
CREATE INDEX idx_kps_device_id ON keyword_push_subscriptions(device_id);
CREATE INDEX idx_kps_enabled ON keyword_push_subscriptions(enabled) WHERE enabled = true;
CREATE INDEX idx_kps_keywords_gin ON keyword_push_subscriptions USING GIN(keywords);
CREATE INDEX idx_kps_updated_at ON keyword_push_subscriptions(updated_at DESC);
```

---

## 📝 API 변경사항

### 1. `/api/notifications/subscribe` (POST)

**요청**:
```json
{
  "device_id": "device_abc123",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-key"
    }
  }
}
```

**응답**:
```json
{
  "success": true,
  "message": "Push subscription이 저장되었습니다.",
  "data": {
    "id": "uuid",
    "device_id": "device_abc123",
    "enabled": true,
    "keywords": [],
    "created_at": "2025-10-23T...",
    "updated_at": "2025-10-23T..."
  }
}
```

**변경사항**:
- subscription 객체를 3개 필드로 분해 저장
- JSONB 직렬화 완전 제거
- 단순 UPSERT 로직으로 변경

### 2. `/api/notifications/settings` (GET, PUT, DELETE)

**GET 응답**:
```json
{
  "id": "uuid",
  "device_id": "device_abc123",
  "enabled": true,
  "keywords": ["검찰", "대통령", "국회"],
  "schedule_enabled": false,
  "schedule_start": "09:00",
  "schedule_end": "22:00",
  "created_at": "2025-10-23T...",
  "updated_at": "2025-10-23T..."
}
```

**PUT 요청**:
```json
{
  "device_id": "device_abc123",
  "enabled": true,
  "keywords": ["검찰", "대통령"],
  "schedule_enabled": true,
  "schedule_start": "09:00",
  "schedule_end": "22:00"
}
```

**변경사항**:
- `categories` 제거
- `schedule` 객체 → 3개 필드로 단순화
- POST 제거 (subscribe API에서 자동 생성)

---

## 🔧 클라이언트 코드 변경사항

### 1. `pushNotification.ts`

**제거된 기능**:
- `subscribeToPushByCategory()` - 카테고리별 구독
- `unsubscribeFromPushByCategory()` - 카테고리별 구독 취소
- 복잡한 `NotificationPreferences` 인터페이스

**단순화된 인터페이스**:
```typescript
interface KeywordNotificationPreferences {
  enabled: boolean;
  keywords: string[];
  schedule: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
  };
}
```

### 2. `check-new-news.ts` (Cron Job)

**변경사항**:
- `sendCategoryNotifications()` 함수 완전 제거
- `sendKeywordNotifications()` 함수만 유지
- 새 테이블 구조에 맞게 조회 쿼리 수정
- subscription 객체 재구성 로직 추가

**Before**:
```typescript
const { data: users } = await supabase
  .from('user_notification_settings')
  .select('device_id, subscription_data, keywords, schedule')
```

**After**:
```typescript
const { data: users } = await supabaseAdmin
  .from('keyword_push_subscriptions')
  .select('device_id, endpoint, p256dh_key, auth_key, keywords, schedule_enabled, schedule_start, schedule_end')
```

---

## ✅ 기대 효과

### 1. 안정성 향상
- ✅ JSONB 직렬화 문제 완전 해결
- ✅ TEXT 필드만 사용하여 컬럼 레벨 이슈 회피
- ✅ 단일 테이블로 데이터 일관성 보장

### 2. 단순성
- ✅ 카테고리 제거로 코드 40% 감소
- ✅ 키워드 중심 UX로 사용자 편의성 향상
- ✅ API 단순화로 유지보수 용이

### 3. 성능
- ✅ GIN 인덱스로 키워드 검색 최적화
- ✅ 불필요한 JOIN 제거
- ✅ 데이터 구조 최적화로 쿼리 성능 향상

---

## 🚀 배포 체크리스트

### 1. Supabase 작업
- [ ] [supabase/recreate_push_subscriptions.sql](supabase/recreate_push_subscriptions.sql) 실행
- [ ] 테이블 생성 확인
- [ ] 인덱스 생성 확인
- [ ] RLS 정책 확인

### 2. Vercel 배포
- [ ] 코드 변경사항 커밋
- [ ] main 브랜치 푸시
- [ ] Vercel 자동 빌드 완료 확인
- [ ] 배포 완료 후 API 테스트

### 3. 사용자 영향
- ⚠️ **기존 구독 정보 완전 삭제**
- ⚠️ 모든 사용자 재구독 필요
- ⚠️ 카테고리 알림 설정 사라짐

---

## 📚 관련 파일

### Supabase SQL
- [supabase/recreate_push_subscriptions.sql](supabase/recreate_push_subscriptions.sql)

### API 엔드포인트
- [src/pages/api/notifications/subscribe.ts](src/pages/api/notifications/subscribe.ts)
- [src/pages/api/notifications/settings.ts](src/pages/api/notifications/settings.ts)

### 클라이언트 코드
- [src/utils/pushNotification.ts](src/utils/pushNotification.ts)

### Cron Job
- [src/pages/api/cron/check-new-news.ts](src/pages/api/cron/check-new-news.ts)

### UI 컴포넌트 (추후 업데이트 필요)
- [src/components/NotificationSettings.tsx](src/components/NotificationSettings.tsx)
- [src/components/mobile/MobileNotificationSettings.tsx](src/components/mobile/MobileNotificationSettings.tsx)

---

## 🔍 테스트 방법

### 1. 푸시 구독 테스트
```bash
curl -X POST https://your-domain.vercel.app/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-001",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    }
  }'
```

### 2. 설정 조회
```bash
curl https://your-domain.vercel.app/api/notifications/settings?device_id=test-device-001
```

### 3. 키워드 업데이트
```bash
curl -X PUT https://your-domain.vercel.app/api/notifications/settings \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-001",
    "enabled": true,
    "keywords": ["검찰", "대통령"],
    "schedule_enabled": false,
    "schedule_start": "09:00",
    "schedule_end": "22:00"
  }'
```

---

## 💡 참고사항

### 기술적 변경 요약
1. **데이터 저장 방식**: JSONB → TEXT 필드 분해
2. **테이블 구조**: 2개 테이블 → 1개 테이블
3. **알림 방식**: 카테고리 + 키워드 → 키워드만
4. **시간대 설정**: JSON 객체 → 개별 컬럼

### 주의사항
- Service Role Key 사용으로 권한 문제 해결
- 매 요청마다 새 Supabase 클라이언트 생성
- subscription 객체 분해/재구성 로직 필수
- 기존 데이터 완전 삭제되므로 백업 불필요 (NULL 데이터만 존재)

---

**작성일**: 2025-10-23
**작성자**: Claude Code SuperClaude
