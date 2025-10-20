# 📱 사용자별 푸시 알림 설정 가이드

EXNEWS 앱에 사용자별 푸시 알림 기능이 추가되었습니다. 이 가이드는 설정 방법과 사용법을 안내합니다.

## 🎯 주요 기능

- ✅ **Device ID 기반 사용자 식별** - 로그인 없이 브라우저별로 독립적인 알림 설정
- ✅ **키워드 기반 알림** - 특정 키워드 포함 뉴스만 알림
- ✅ **카테고리별 알림** - 관심 있는 뉴스 카테고리만 선택
- ✅ **시간대별 알림** - 아침/오후/저녁 시간대 선택
- ✅ **서버 동기화** - Supabase 데이터베이스에 설정 저장
- ✅ **모바일 최적화 UI** - 터치 친화적인 인터페이스
- ✅ **오프라인 지원** - 로컬 스토리지 + 서버 하이브리드
- ✅ **백엔드 푸시 전송** - 서버에서 자동 알림 발송

## 📋 설정 단계

### 1. Supabase 테이블 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택 → **SQL Editor** 메뉴 클릭
3. `supabase/create_notification_settings_table.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭하여 실행

생성되는 테이블:
```sql
user_notification_settings (
  id UUID PRIMARY KEY,
  device_id TEXT UNIQUE,
  push_subscription JSONB,
  enabled BOOLEAN,
  categories JSONB,
  schedule JSONB,
  keywords TEXT[],
  media_names TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### 2. 검색 최적화 인덱스 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택 → **SQL Editor** 메뉴 클릭
3. `supabase/add_keyword_indexes.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭하여 실행

생성되는 인덱스:
- GIN 인덱스: keywords, media_names 배열 검색 최적화
- JSONB 인덱스: categories, schedule, push_subscription
- 복합 인덱스: enabled + keywords 조합

### 3. 환경 변수 설정 (필수)

`.env.local` 파일에 VAPID 키 추가 (푸시 알림용):

```env
# VAPID 키 (필수)
NEXT_PUBLIC_VAPID_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:your_email@example.com

# 알림 API 보안 키 (선택)
NOTIFICATION_API_KEY=your_secure_random_key_here
```

VAPID 키 생성 방법:
```bash
npx web-push generate-vapid-keys
```

출력 예시:
```
Public Key: BNe...xyz
Private Key: abc...123
```

이 키들을 `.env.local`에 추가하세요.

### 4. 앱 재시작

```bash
npm run dev
# 또는
npm run build && npm start
```

## 🚀 사용 방법

### 모바일 사용자 - 프론트엔드

1. 앱 하단의 **알림 아이콘 (🔔)** 탭
2. **"허용"** 버튼 클릭하여 브라우저 알림 권한 부여
3. **알림 방식 선택**:
   - **📰 전체 뉴스**: 카테고리 + 시간대 기반 알림
   - **🔍 키워드 뉴스만**: 특정 키워드 포함 뉴스만 알림
4. **키워드 모드** (선택 시):
   - 키워드 입력 (예: "삼성전자", "AI", "부동산")
   - 최대 10개까지 등록 가능
   - 2-20자, 특수문자 불가
5. **전체 뉴스 모드** (선택 시):
   - 관심 카테고리 선택
   - 알림 받을 시간대 선택 (아침/오후/저녁)
6. **"테스트 알림 보내기"**로 작동 확인

### 데스크탑 사용자

1. `/settings` 페이지 이동
2. **알림 설정** 탭 클릭
3. 모바일과 동일한 방식으로 설정

## 🔧 기술 아키텍처

### Device ID 생성 방식

브라우저 fingerprint 기반으로 고유 ID 생성:
- User Agent
- 화면 해상도
- 플랫폼 정보
- Timezone
- Canvas fingerprint

생성 예시: `device_a1b2c3d4_1h8j9k2l`

### 데이터 흐름

```
[브라우저] → Device ID 생성
    ↓
[프론트엔드] → PushSubscription 생성
    ↓
[API] → /api/notifications/subscribe
    ↓
[Supabase] → user_notification_settings 테이블 저장
    ↓
[로컬스토리지] ← → [Supabase] 동기화
```

### 백엔드 사용 방법 - 서버에서 알림 전송

새로운 뉴스가 추가될 때 사용자에게 알림을 보내려면 `/api/notifications/send` 엔드포인트를 호출하세요.

**API 요청 예시**:
```javascript
// 단일 뉴스 알림
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    news: {
      id: 123,
      title: '삼성전자, AI 반도체 신제품 공개',
      description: '차세대 AI 칩 발표...',
      original_link: 'https://example.com/news/123',
      category: '경제',
      media_name: '조선일보'
    },
    mode: 'both',  // 'keyword' | 'category' | 'both'
    apiKey: process.env.NOTIFICATION_API_KEY  // 선택사항
  })
});

const result = await response.json();
// { success: true, sent: 15, failed: 0, details: [...] }
```

**알림 모드 설명**:
- `keyword`: 키워드 매칭된 사용자에게만 전송
- `category`: 카테고리/시간대 매칭된 사용자에게만 전송
- `both`: 키워드 + 카테고리 모두 전송 (기본값)

**Supabase Trigger 활용** (자동 알림):
```sql
-- 뉴스 삽입 시 자동으로 알림 전송하는 Edge Function 트리거
CREATE OR REPLACE FUNCTION notify_new_news()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-app-url.com/api/notifications/send',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'news', row_to_json(NEW),
      'mode', 'both',
      'apiKey', current_setting('app.notification_api_key')
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_news
AFTER INSERT ON news
FOR EACH ROW
EXECUTE FUNCTION notify_new_news();
```

### API 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/api/notifications/settings?device_id=xxx` | 설정 조회 |
| `POST` | `/api/notifications/settings` | 새 설정 생성 |
| `PUT` | `/api/notifications/settings` | 설정 업데이트 |
| `DELETE` | `/api/notifications/settings?device_id=xxx` | 설정 삭제 |
| `POST` | `/api/notifications/subscribe` | PushSubscription 등록 |
| `POST` | `/api/notifications/send` | 푸시 알림 전송 (백엔드용) |

## 📱 주요 파일 구조

```
src/
├── utils/
│   ├── deviceId.ts                    # Device ID 생성 및 관리
│   ├── pushNotification.ts            # 푸시 알림 핵심 로직 (서버 연동)
│   ├── keywordMatcher.ts              # 키워드 매칭 알고리즘 (백엔드)
│   └── pushSender.ts                  # 푸시 전송 유틸리티 (백엔드)
├── components/
│   └── mobile/
│       ├── MobileNotificationSettings.tsx  # 모바일 설정 UI
│       ├── KeywordManager.tsx         # 키워드 관리 UI
│       └── BottomNav.tsx              # 알림 아이콘 추가
├── pages/
│   ├── notifications.tsx              # 알림 설정 페이지
│   └── api/
│       └── notifications/
│           ├── settings.ts            # 설정 CRUD API
│           ├── subscribe.ts           # 구독 등록 API
│           └── send.ts                # 푸시 전송 API (백엔드)
└── supabase/
    ├── create_notification_settings_table.sql  # DB 스키마
    └── add_keyword_indexes.sql        # 검색 최적화 인덱스
```

## 🧪 테스트

### 1. 기본 동작 테스트

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 접속
open http://localhost:3000/notifications
```

### 2. 알림 권한 테스트

1. 알림 설정 페이지 접속
2. "허용" 버튼 클릭
3. 브라우저 알림 권한 대화상자 확인
4. "허용" 선택

### 3. 테스트 알림 전송

1. 알림 활성화 후
2. "테스트 알림 보내기" 버튼 클릭
3. 알림 수신 확인

### 4. 데이터베이스 확인

Supabase Dashboard에서:
```sql
SELECT * FROM user_notification_settings;
```

## 🔍 트러블슈팅

### 알림이 표시되지 않을 때

1. **브라우저 권한 확인**
   - 브라우저 설정 → 사이트 설정 → 알림 → 허용 확인

2. **HTTPS 연결 확인**
   - 푸시 알림은 HTTPS 또는 localhost에서만 작동

3. **Service Worker 확인**
   - 개발자 도구 → Application → Service Workers 확인

4. **Device ID 확인**
   - 개발자 도구 → Console에서:
   ```javascript
   localStorage.getItem('exnews_device_id')
   ```

### 데이터베이스 연결 오류

1. `.env.local` 파일에서 Supabase 환경 변수 확인
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Supabase RLS 정책 확인 (모든 사용자 접근 허용)

3. 네트워크 탭에서 API 요청/응답 확인

### Device ID가 생성되지 않을 때

1. localStorage 사용 가능 여부 확인 (시크릿 모드 X)
2. 브라우저 쿠키 설정 확인
3. Canvas API 지원 확인

## 🚀 향후 확장 계획

- [x] **키워드 알림**: 특정 단어 포함 뉴스 알림 ✅
- [x] **백엔드 알림 전송**: 뉴스 추가 시 자동 알림 발송 ✅
- [ ] **언론사 필터**: media_name 기반 언론사 선택
- [ ] **알림 히스토리**: 받은 알림 목록 확인
- [ ] **알림 그룹화**: 같은 카테고리 알림 묶음
- [ ] **실시간 알림**: WebSocket 기반 실시간 푸시
- [ ] **알림 통계**: 발송/수신 통계 대시보드
- [ ] **스마트 알림**: AI 기반 관심사 학습

## 📚 참고 자료

- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Supabase Documentation](https://supabase.com/docs)
- [VAPID Keys](https://blog.mozilla.org/services/2016/08/23/sending-vapid-identified-webpush-notifications-via-mozillas-push-service/)

## 💡 베스트 프랙티스

1. **사용자 동의**: 알림 권한 요청 전 명확한 설명 제공
2. **빈도 제한**: 과도한 알림 방지 (시간당 최대 3개 권장)
3. **가치 제공**: 중요하고 관련성 높은 알림만 전송
4. **옵트아웃 용이**: 쉽게 알림 끄기 가능하도록
5. **테스트**: 다양한 브라우저와 기기에서 테스트

---

**문의 및 피드백**: GitHub Issues에 남겨주세요.
