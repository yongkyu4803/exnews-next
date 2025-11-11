# Cloudflare SSL/TLS 설정 가이드

## ✅ 완료된 작업

1. **DNS 설정 완료**
   - Nameservers가 Cloudflare로 성공적으로 변경됨
   - roman.ns.cloudflare.com
   - sara.ns.cloudflare.com

2. **DNS 레코드 구성 완료**
   ```
   A * → 216.198.79.65 (Proxied)
   A gqai.kr → 216.198.79.1 (Proxied)
   A news → 216.198.79.1 (Proxied)
   A newsletter → 216.198.79.65 (Proxied)
   A www → 216.198.79.65 (Proxied)
   CAA gqai.kr → 0 issue letsencrypt.org
   ```

---

## 🔐 다음 단계: SSL/TLS 보안 설정

### 1. SSL/TLS 암호화 모드 설정

**목적**: Cloudflare와 Vercel 서버 간의 암호화 방식 설정

**설정 방법**:
1. Cloudflare 대시보드 접속
2. **SSL/TLS** 메뉴 클릭
3. **Overview** 탭에서 암호화 모드 선택

**권장 설정**: **Full (strict)** ⭐

#### 암호화 모드 옵션 설명

| 모드 | 설명 | 보안 수준 | 사용 권장 |
|------|------|-----------|-----------|
| Off | 암호화 없음 | ⚠️ 매우 낮음 | ❌ 사용 금지 |
| Flexible | Cloudflare ↔ 방문자만 암호화 | ⚠️ 낮음 | ❌ 권장 안함 |
| **Full** | 양방향 암호화 (자체 서명 인증서 허용) | ✅ 보통 | ⚠️ 사용 가능 |
| **Full (strict)** | 양방향 암호화 (유효한 인증서 필수) | ✅ 높음 | ⭐ **강력 권장** |

**Full (strict) 선택 이유**:
- Vercel은 자동으로 Let's Encrypt SSL 인증서를 제공
- Cloudflare와 Vercel 간 연결도 완전히 암호화
- 회사 방화벽/프록시 환경에서도 신뢰할 수 있는 인증서 사용

---

### 2. Always Use HTTPS 활성화

**목적**: HTTP 접속을 자동으로 HTTPS로 리다이렉트

**설정 방법**:
1. **SSL/TLS** → **Edge Certificates** 탭
2. **Always Use HTTPS** 찾기
3. 스위치를 **On**으로 변경

**효과**:
```
http://news.gqai.kr → https://news.gqai.kr (자동 리다이렉트)
http://gqai.kr → https://gqai.kr (자동 리다이렉트)
```

---

### 3. Automatic HTTPS Rewrites 활성화

**목적**: HTTP 리소스를 자동으로 HTTPS로 변환

**설정 방법**:
1. **SSL/TLS** → **Edge Certificates** 탭
2. **Automatic HTTPS Rewrites** 찾기
3. 스위치를 **On**으로 변경

**효과**:
- 페이지 내 `http://` 링크를 자동으로 `https://`로 변환
- 혼합 콘텐츠(Mixed Content) 경고 방지

---

### 4. Minimum TLS Version 설정 (선택사항)

**목적**: 최소 TLS 버전 지정으로 보안 강화

**설정 방법**:
1. **SSL/TLS** → **Edge Certificates** 탭
2. **Minimum TLS Version** 찾기
3. **TLS 1.2** 이상 선택 권장

**권장 설정**: **TLS 1.2** (기본값)

---

### 5. HSTS (HTTP Strict Transport Security) 활성화 (선택사항)

**목적**: 브라우저가 항상 HTTPS를 사용하도록 강제

**설정 방법**:
1. **SSL/TLS** → **Edge Certificates** 탭
2. **HTTP Strict Transport Security (HSTS)** 섹션
3. **Enable HSTS** 클릭
4. 다음 설정 권장:
   ```
   Max Age Header: 6 months (15768000 seconds)
   Include subdomains: ✅ 체크
   Preload: ⚠️ 신중히 고려 (되돌리기 어려움)
   No-Sniff Header: ✅ 체크
   ```

**주의사항**:
- HSTS 활성화 후 HTTP 접속 완전 차단
- "Preload"는 신중히 결정 (Chrome의 HSTS Preload List에 등록)

---

## 🧪 설정 검증

### 1. SSL Labs 테스트

**목적**: SSL 구성의 보안 등급 확인

**테스트 방법**:
1. https://www.ssllabs.com/ssltest/ 접속
2. 도메인 입력: `news.gqai.kr`
3. **Submit** 클릭
4. 테스트 완료 대기 (2-3분)

**목표 등급**: **A** 이상

---

### 2. 브라우저 테스트

**확인 항목**:
1. ✅ `https://news.gqai.kr` 접속 시 자물쇠 아이콘 표시
2. ✅ `http://news.gqai.kr` 입력 시 자동으로 `https://`로 리다이렉트
3. ✅ 인증서 확인:
   - 발급자: Cloudflare
   - 유효 기간 확인
   - 도메인 이름 일치 여부

**인증서 확인 방법**:
- Chrome: 주소창의 자물쇠 아이콘 클릭 → "Connection is secure" → "Certificate is valid"
- Firefox: 주소창의 자물쇠 아이콘 클릭 → "More information" → "View Certificate"

---

### 3. 회사 네트워크에서 테스트

**확인 항목**:
1. ✅ `https://news.gqai.kr` 접속 성공
2. ✅ ERR_CERT_COMMON_NAME_INVALID 오류 해결 확인
3. ✅ 페이지 로딩 속도 정상
4. ✅ 모든 리소스(이미지, CSS, JS) 정상 로드

---

## 📊 Cloudflare의 이점

### 1. SSL/TLS 인증서 자동 관리
- Cloudflare가 자동으로 SSL 인증서 발급 및 갱신
- Let's Encrypt 인증서 대신 Cloudflare의 Universal SSL 사용
- 인증서 만료 걱정 없음

### 2. DDoS 보호
- 자동으로 DDoS 공격 차단
- 트래픽 필터링 및 보호

### 3. CDN (Content Delivery Network)
- 전 세계 데이터 센터를 통한 콘텐츠 배포
- 페이지 로딩 속도 향상
- 대역폭 비용 절감

### 4. 회사 방화벽 우회
- Cloudflare IP는 대부분의 기업 방화벽에서 허용
- Vercel IP가 차단되어도 Cloudflare를 통해 접속 가능

### 5. 보안 강화
- Web Application Firewall (WAF) - 유료 플랜
- Bot 차단
- Rate Limiting
- IP Reputation 기반 차단

---

## ⚙️ Vercel 설정 확인

### Vercel 대시보드 확인

**확인 사항**:
1. Vercel 대시보드 → 프로젝트 → **Settings** → **Domains**
2. `news.gqai.kr` 도메인 상태 확인
3. 상태가 **"Valid Configuration"**이어야 함

**만약 "Invalid Configuration" 표시되면**:
- Cloudflare DNS 전파 대기 (최대 24시간)
- DNS 레코드가 Vercel IP를 올바르게 가리키는지 확인

---

## 🔍 문제 해결

### SSL 인증서 오류가 계속 발생하는 경우

**1단계: Cloudflare SSL 모드 확인**
```
SSL/TLS → Overview → Full (strict) 선택
```

**2단계: Cloudflare 캐시 삭제**
```
Caching → Configuration → Purge Everything
```

**3단계: DNS 전파 확인**
```bash
dig news.gqai.kr +short
nslookup news.gqai.kr
```

**4단계: Cloudflare 개발자 모드 활성화 (임시)**
```
Caching → Configuration → Development Mode → On (3시간 동안 활성화)
```

### "Too many redirects" 오류 발생 시

**원인**: Vercel과 Cloudflare 모두 HTTPS 리다이렉트 설정

**해결 방법**:
1. Cloudflare에서 "Always Use HTTPS" 비활성화
2. 또는 Vercel에서 HTTPS 리다이렉트 설정 제거

---

## 📅 DNS 전파 상태 확인

**전파 확인 사이트**:
- https://www.whatsmydns.net/
- 도메인 입력: `news.gqai.kr`
- 레코드 타입: A
- 전 세계 DNS 서버에서 Cloudflare IP가 조회되는지 확인

**예상 전파 시간**:
- 빠른 경우: 1-4시간
- 일반적: 4-24시간
- 최대: 48시간

---

## ✅ 최종 체크리스트

설정 완료 후 다음 항목을 확인하세요:

- [ ] Cloudflare SSL/TLS 모드: **Full (strict)**
- [ ] Always Use HTTPS: **활성화**
- [ ] Automatic HTTPS Rewrites: **활성화**
- [ ] DNS 레코드: news → 216.198.79.1 (Proxied)
- [ ] SSL Labs 테스트: **A 등급 이상**
- [ ] 브라우저 테스트: 자물쇠 아이콘 표시
- [ ] 회사 네트워크 테스트: ERR_CERT_COMMON_NAME_INVALID 해결
- [ ] Vercel 도메인 상태: **Valid Configuration**

---

## 📞 추가 지원

**Cloudflare 문서**:
- https://developers.cloudflare.com/ssl/

**Vercel + Cloudflare 가이드**:
- https://vercel.com/docs/concepts/projects/custom-domains#cloudflare

**SSL Labs 테스트**:
- https://www.ssllabs.com/ssltest/

---

## 🎯 다음 단계

1. **즉시 실행**: SSL/TLS 설정 (Full strict, Always Use HTTPS, Automatic HTTPS Rewrites)
2. **1-4시간 후**: DNS 전파 확인 및 회사 네트워크에서 테스트
3. **테스트 완료 후**: SSL Labs 테스트로 보안 등급 확인
4. **선택사항**: HSTS 활성화 (신중히 결정)

---

## 🔒 보안 요약

**현재 상태**:
- ✅ Hardcoded 비밀번호 제거 (서버사이드 환경변수로 이동)
- ✅ Cloudflare DNS 설정 완료
- ⏳ SSL/TLS 보안 설정 대기 중

**남은 보안 작업** (선택사항):
1. Supabase 키 재발급 (Git 히스토리에 노출됨)
2. JWT 인증 구현
3. Rate Limiting 추가
4. XSS 보호 (DOMPurify)
5. Supabase RLS (Row Level Security) 활성화
