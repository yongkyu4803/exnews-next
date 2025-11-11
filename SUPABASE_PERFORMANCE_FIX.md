# Supabase 성능 최적화 가이드

## 🔴 발견된 성능 병목

### 현재 상태
```
News API 응답 시간: 3.1초
- DNS + TCP + TLS: 0.18초
- Supabase 쿼리: 1.81초 ⚠️
- 응답 크기: 760KB (1000개 항목)
- 실제 사용: 7-12개만 표시
- 낭비율: 98%
```

### 주요 문제점

1. **`all=true` 파라미터**
   - 전체 1000개 항목을 한 번에 fetch
   - 불필요한 988개 항목 다운로드
   - 760KB 중 ~750KB 낭비

2. **클라이언트 사이드 정렬**
   - Supabase에서 정렬 없이 가져옴
   - 서버에서 JavaScript로 정렬
   - CPU 시간 낭비

3. **인덱스 미최적화**
   - `pub_date` 컬럼에 인덱스 없음 (추정)
   - `category` 필터링 느림

4. **Supabase 지리적 위치**
   - 한국에서 200-300ms 기본 latency
   - Read Replica 없음

---

## ✅ 즉시 적용 가능한 해결책

### Solution 1: 서버사이드 페이지네이션 (필수) ⚡

**현재 문제:**
```typescript
// src/pages/index.tsx
const response = await fetch('/api/news?all=true');  // ❌ 1000개 전체
```

**해결책:**
```typescript
// src/pages/index.tsx
const response = await fetch(`/api/news?page=${currentPage}&pageSize=${pageSize}`);  // ✅ 7-12개만
```

**예상 효과:**
- API 응답 크기: 760KB → ~8KB (-99%)
- 응답 시간: 3.1초 → ~0.3초 (-90%)
- 네트워크 대역폭: -752KB 절약

---

### Solution 2: Supabase 쿼리 최적화 (필수) ⚡

**현재 코드:**
```typescript
// src/pages/api/news.ts
if (all === 'true') {
  const { data, error, count } = await dataQuery;

  // 클라이언트 정렬 ❌
  const sortedData = data?.sort((a, b) =>
    new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime()
  ) || [];
}
```

**최적화 코드:**
```typescript
// Supabase에서 정렬 및 제한 ✅
const { data, error, count } = await dataQuery
  .order('pub_date', { ascending: false })  // DB 레벨 정렬
  .limit(pageSize);  // 필요한 개수만
```

**예상 효과:**
- Supabase 쿼리 시간: 1.8초 → ~0.2초 (-89%)
- 정렬 CPU 시간: 제거
- 메모리 사용: -95%

---

### Solution 3: Supabase 인덱스 추가 (권장) 🔧

**Supabase Dashboard → SQL Editor → New Query**

```sql
-- pub_date 인덱스 (정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_news_pub_date
ON news(pub_date DESC);

-- category + pub_date 복합 인덱스 (필터링 + 정렬)
CREATE INDEX IF NOT EXISTS idx_news_category_pub_date
ON news(category, pub_date DESC);

-- Analyze tables for query planner
ANALYZE news;
```

**예상 효과:**
- 쿼리 속도: 추가 50-70% 개선
- 응답 시간: 0.3초 → ~0.1초

---

### Solution 4: API 응답 캐싱 (권장) 💾

**Next.js API Route 캐싱:**

```typescript
// src/pages/api/news.ts
export default async function handler(req, res) {
  // 캐시 헤더 추가
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  // ... existing code
}
```

**Vercel Edge Caching:**
- 5분간 Edge에서 캐시
- Supabase 쿼리 횟수 -95%

---

### Solution 5: React Query Prefetching (선택사항)

**다음 페이지 미리 가져오기:**

```typescript
// src/pages/index.tsx
useEffect(() => {
  // 다음 페이지 prefetch
  if (currentPage < totalPages) {
    queryClient.prefetchQuery(
      ['newsItems', selectedCategory, currentPage + 1],
      () => fetchNewsPage(currentPage + 1, pageSize)
    );
  }
}, [currentPage, selectedCategory]);
```

---

## 📊 예상 성능 개선

### Before (현재)
```
News API 응답 시간: 3.1초
- DNS + Connection: 0.18초
- Supabase Query: 1.81초
- Data Transfer: 0.76초 (760KB)
- Client Sort: 0.35초

Total Page Load: ~5-7초
```

### After (최적화 후)
```
News API 응답 시간: ~0.3초 ✅
- DNS + Connection: 0.18초
- Supabase Query: 0.08초 (-95%)
- Data Transfer: 0.02초 (8KB, -99%)
- Client Sort: 0초 (제거)

Total Page Load: ~1-2초 ✅ (-70%)
```

---

## 🚀 구현 순서

### Phase 1: 서버사이드 페이지네이션 (필수, 30분)

1. **`src/pages/index.tsx` 수정**
   - `all=true` 제거
   - `page` + `pageSize` 파라미터 사용
   - 클라이언트 페이지네이션 제거

2. **`src/pages/api/news.ts` 수정**
   - 기본 페이지네이션 활성화
   - `.order()` + `.range()` 사용

**예상 효과:** API 응답 -90%, 로딩 -60%

---

### Phase 2: Supabase 인덱스 (권장, 5분)

1. **Supabase Dashboard 접속**
2. **SQL Editor 열기**
3. **인덱스 SQL 실행**
   ```sql
   CREATE INDEX idx_news_pub_date ON news(pub_date DESC);
   CREATE INDEX idx_news_category_pub_date ON news(category, pub_date DESC);
   ANALYZE news;
   ```

**예상 효과:** 쿼리 속도 추가 -50-70%

---

### Phase 3: API 캐싱 (권장, 10분)

1. **API Route 캐시 헤더 추가**
2. **Vercel Edge Caching 활성화**
3. **React Query 캐싱 강화**

**예상 효과:** 재방문 시 즉시 로딩

---

## 🧪 테스트 방법

### 1. API 응답 시간 측정
```bash
# Before
curl -w "Time: %{time_total}s\n" -o /dev/null -s \
  "https://news.gqai.kr/api/news?all=true"
# Expected: ~3.1초

# After
curl -w "Time: %{time_total}s\n" -o /dev/null -s \
  "https://news.gqai.kr/api/news?page=1&pageSize=12"
# Expected: ~0.3초
```

### 2. 응답 크기 확인
```bash
# Before
curl -s "https://news.gqai.kr/api/news?all=true" | wc -c
# Expected: ~760,000 bytes

# After
curl -s "https://news.gqai.kr/api/news?page=1&pageSize=12" | wc -c
# Expected: ~8,000 bytes
```

### 3. Chrome DevTools Network 탭
- News API 요청 확인
- Size: 8KB 이하 확인
- Time: 300ms 이하 확인

---

## ⚠️ 주의사항

### 1. 클라이언트 코드 변경 필요
- `all=true` 사용하는 모든 컴포넌트 수정
- 페이지네이션 로직 서버 의존

### 2. 기존 무한 스크롤
- 현재는 모든 데이터를 메모리에 로드
- 변경 후 페이지별 로드 (더 효율적)

### 3. Supabase 인덱스
- 인덱스 생성 시 잠시 테이블 락 가능
- 트래픽 낮은 시간대 실행 권장

---

## 🔍 추가 분석

### Supabase 지리적 위치 확인
```bash
# Supabase 서버 위치 추정
ping rxwztfdnragffxbmlscf.supabase.co

# Expected latency:
# - 한국: 200-300ms
# - 일본: 100-150ms
# - 미국: 150-250ms
```

### Supabase Dashboard 성능 모니터링
1. **Supabase Dashboard** 접속
2. **Database** → **Query Performance** 확인
3. **느린 쿼리 확인:**
   - `SELECT * FROM news` (인덱스 없음)
   - 정렬 없는 full table scan

---

## 📈 장기 최적화 전략

### 1. Supabase Read Replicas (유료)
- 한국/일본 리전에 Read Replica 생성
- Latency 200ms → 50ms (-75%)
- 비용: $25-50/월

### 2. Vercel Edge Functions + KV Store
- Edge에서 최근 뉴스 캐시
- Supabase 쿼리 횟수 -95%
- 비용: $20/월

### 3. CDN 캐싱 (Cloudflare)
- API 응답 Edge 캐싱
- 5분간 Supabase 쿼리 0회
- 무료 (Free plan)

---

## ✅ 즉시 실행 체크리스트

### 코드 변경 (30분)
- [ ] `src/pages/api/news.ts` - `all=true` 로직 제거
- [ ] `src/pages/index.tsx` - 페이지네이션 파라미터 추가
- [ ] 동일 패턴 `ranking-news`, `editorials`에 적용

### Supabase 설정 (5분)
- [ ] SQL Editor에서 인덱스 생성
- [ ] `ANALYZE` 실행
- [ ] Query Performance 확인

### 테스트 (10분)
- [ ] API 응답 시간 측정 (<500ms 목표)
- [ ] 응답 크기 확인 (<10KB 목표)
- [ ] 페이지네이션 동작 확인

### 배포 (5분)
- [ ] Git commit
- [ ] Vercel 배포
- [ ] 프로덕션 테스트

---

## 🎯 예상 최종 결과

### API 성능
- **응답 시간:** 3.1초 → 0.3초 ✅ (-90%)
- **응답 크기:** 760KB → 8KB ✅ (-99%)
- **Supabase 쿼리:** 1.8초 → 0.1초 ✅ (-94%)

### 사용자 경험
- **First Load:** 5-7초 → 1-2초 ✅ (-70%)
- **Tab Switch:** 3초 → 0.5초 ✅ (-83%)
- **Pagination:** 즉시 (캐시) ✅

### 비용 절감
- **Supabase Bandwidth:** -99%
- **Supabase Compute:** -90%
- **Vercel Bandwidth:** -99%

---

생성 일시: 2025-01-11
우선순위: 🔴 Critical (즉시 적용 필요)
