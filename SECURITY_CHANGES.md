# 보안 개선 사항 - 1단계 완료

## ✅ 완료된 작업

### 1. 하드코딩된 비밀번호 제거

**변경 파일**:
- [src/utils/adminAuth.ts](src/utils/adminAuth.ts) - 클라이언트 사이드 인증 유틸리티
- [src/pages/api/admin/verify-password.ts](src/pages/api/admin/verify-password.ts) - **새로 생성된 서버사이드 API**
- [src/pages/admin/login.tsx](src/pages/admin/login.tsx) - 로그인 페이지 업데이트
- [.env.local](.env.local) - 환경변수 추가

**보안 개선 내용**:
1. ❌ **이전**: 비밀번호가 소스코드에 평문으로 하드코딩 (`const ADMIN_PASSWORD = 'sm32320909'`)
2. ✅ **현재**: 서버사이드 환경변수로 이동, API를 통한 검증

**아키텍처 변경**:
```
[이전] 클라이언트 → 하드코딩된 비밀번호 비교 (브라우저에서 노출)

[현재] 클라이언트 → POST /api/admin/verify-password → 서버에서 환경변수로 검증
```

---

## 🚀 Vercel 배포 설정 필요

### 필수 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 추가해야 합니다:

1. Vercel 프로젝트 설정 이동
2. **Settings** → **Environment Variables** 클릭
3. 다음 변수 추가:

```env
ADMIN_PASSWORD=sm32320909
```

**중요**:
- `NEXT_PUBLIC_` 접두사 없이 설정해야 합니다 (서버사이드 전용)
- 배포 후 즉시 비밀번호를 변경하는 것을 **강력히 권장**합니다

### 환경변수 설정 화면

```
┌────────────────────────────────────────┐
│ Environment Variables                   │
├────────────────────────────────────────┤
│ Key:   ADMIN_PASSWORD                   │
│ Value: [새로운_안전한_비밀번호]         │
│ Environment: Production, Preview, Dev   │
│ ☑ Apply to all environments            │
└────────────────────────────────────────┘
```

---

## 📋 배포 체크리스트

배포 전에 다음을 확인하세요:

- [ ] Vercel에 `ADMIN_PASSWORD` 환경변수 추가됨
- [ ] 환경변수가 모든 환경(Production, Preview, Development)에 적용됨
- [ ] Git에 커밋된 `.env.local` 파일 제거 (이미 .gitignore에 있음)
- [ ] 배포 후 로그인 페이지 테스트 (`/admin/login`)
- [ ] 배포 후 비밀번호 변경 (강력 권장)

---

## 🔄 배포 후 테스트

1. **로그인 테스트**:
   ```
   https://your-app.vercel.app/admin/login
   ```
   - 잘못된 비밀번호 입력 → "비밀번호가 일치하지 않습니다" 에러 표시 확인
   - 올바른 비밀번호 입력 → `/admin/analytics`로 리다이렉트 확인

2. **API 테스트** (선택사항):
   ```bash
   curl -X POST https://your-app.vercel.app/api/admin/verify-password \
     -H "Content-Type: application/json" \
     -d '{"password":"your_password"}'
   ```
   - 예상 응답: `{"success":true}` 또는 `{"success":false,"message":"..."}`

---

## ⚠️ 알려진 제약사항

### 남은 보안 취약점

이번 1단계 작업으로 **가장 위험한 하드코딩 문제는 해결**되었지만, 여전히 다음 문제들이 남아있습니다:

1. **JWT 인증 미구현** - localStorage 기반 인증으로 서버 재시작 시 세션 무효화 안 됨
2. **Rate Limiting 없음** - 무차별 대입 공격(brute-force) 방어 불가
3. **HTTPS 강제 리다이렉트 미설정** - HTTP 연결 허용
4. **Supabase 키 노출** - `.env.local`이 Git 히스토리에 존재 (키 재발급 필요)

이러한 문제는 다음 단계에서 해결할 예정입니다.

---

## 📚 관련 파일

- [src/pages/api/admin/verify-password.ts](src/pages/api/admin/verify-password.ts) - 비밀번호 검증 API
- [src/utils/adminAuth.ts](src/utils/adminAuth.ts) - 인증 유틸리티
- [src/pages/admin/login.tsx](src/pages/admin/login.tsx) - 로그인 페이지
- [.env.local](.env.local) - 로컬 환경변수 (Git에 커밋하지 말 것)

---

## 🎯 다음 단계 (2단계)

2단계에서는 **Supabase 키 재발급 및 Git 히스토리 정리**를 진행합니다:

1. GitHub에서 민감 정보 완전 제거 (Git filter-branch)
2. Supabase 프로젝트에서 키 재발급
3. Vercel 환경변수 업데이트
4. `.gitignore` 확인 및 보강

진행하시겠습니까?
