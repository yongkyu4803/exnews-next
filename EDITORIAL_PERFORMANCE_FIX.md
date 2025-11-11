# 사설 분석 API 성능 최적화 가이드

## 🚨 발견된 심각한 성능 문제

### 문제 분석

**현재 상황:**
- 단독/랭킹 뉴스: `rxwztfdnragffxbmlscf.supabase.co`
- 사설 분석: `bwgndhxhnduoouodxngw.supabase.co` (**별도 프로젝트**)

**성능 문제:**

1. **N+1 쿼리 문제 (Critical):**
   - 분석 10개 조회: 1번 쿼리
   - 각 분석의 주제 조회: 10번 쿼리
   - 각 주제의 기사 조회: 30번 쿼리
   - **총 41번의 연속 DB 쿼리**
   - 예상 소요 시간: 8-10초

2. **페이지네이션 없음:**
   - 모든 사설 분석을 한 번에 조회
   - 데이터가 많아질수록 선형적으로 느려짐

3. **캐시 헤더 없음:**
   - 매번 전체 DB 쿼리 실행
   - Edge 캐싱 불가능

4. **별도 Supabase 프로젝트:**
   - 서로 다른 데이터베이스
   - 인덱스 별도 생성 필요

---

## 🎯 해결 방법

### 방법 1: Supabase JOIN 쿼리 최적화 (추천)

**현재 (N+1 쿼리):**
```typescript
// 41번의 쿼리
const analysisData = await supabase.from('news_analysis').select('*');
for (const analysis of analysisData) {
  const topics = await supabase.from('analysis_topic').eq('analysis_id', analysis.id);
  for (const topic of topics) {
    const articles = await supabase.from('analysis_article').eq('topic_id', topic.id);
  }
}
```

**개선 후 (1번 쿼리):**
```typescript
// 1번의 쿼리로 모든 데이터 조회
const { data, error } = await editorialSupabase
  .from('news_analysis')
  .select(`
    *,
    topics:analysis_topic(
      *,
      articles:analysis_article(*)
    )
  `)
  .order('analyzed_at', { ascending: false })
  .range(startIndex, startIndex + pageSizeNum - 1);
```

**성능 개선:**
- 41번 쿼리 → 1번 쿼리 (-98%)
- 8-10초 → 0.2-0.5초 (-95%)

---

### 방법 2: 페이지네이션 추가

**현재:**
```typescript
// 전체 데이터 조회
const { data } = await editorialSupabase.from('news_analysis').select('*');
```

**개선:**
```typescript
// 페이지별 조회
const page = parseInt(req.query.page || '1');
const pageSize = parseInt(req.query.pageSize || '12');
const startIndex = (page - 1) * pageSize;

const { data, error, count } = await editorialSupabase
  .from('news_analysis')
  .select('*, topics:analysis_topic(*, articles:analysis_article(*))', { count: 'exact' })
  .order('analyzed_at', { ascending: false })
  .range(startIndex, startIndex + pageSize - 1);

return res.status(200).json({
  items: data || [],
  totalCount: count || 0
});
```

---

### 방법 3: 캐시 헤더 추가

```typescript
export default async function handler(req, res) {
  // Edge 캐싱 (5분 캐시, 10분 stale-while-revalidate)
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  // ... API 로직
}
```

---

### 방법 4: 데이터베이스 인덱스 생성

사설 Supabase 프로젝트 (`bwgndhxhnduoouodxngw`)에 인덱스 생성:

```sql
-- news_analysis 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_news_analysis_analyzed_at
ON news_analysis(analyzed_at DESC);

-- analysis_topic 테이블 인덱스 (외래키)
CREATE INDEX IF NOT EXISTS idx_analysis_topic_analysis_id
ON analysis_topic(analysis_id);

CREATE INDEX IF NOT EXISTS idx_analysis_topic_topic_number
ON analysis_topic(analysis_id, topic_number);

-- analysis_article 테이블 인덱스 (외래키)
CREATE INDEX IF NOT EXISTS idx_analysis_article_topic_id
ON analysis_article(topic_id);

CREATE INDEX IF NOT EXISTS idx_analysis_article_article_number
ON analysis_article(topic_id, article_number);

-- 통계 업데이트
ANALYZE news_analysis;
ANALYZE analysis_topic;
ANALYZE analysis_article;
```

---

## 📋 구현 단계

### 1단계: API 최적화 (즉시 가능)
- [x] N+1 쿼리 문제 진단
- [ ] JOIN 쿼리로 변경
- [ ] 페이지네이션 추가
- [ ] Cache-Control 헤더 추가

### 2단계: 데이터베이스 최적화 (Supabase Dashboard)
- [ ] 사설 Supabase 프로젝트 접속
- [ ] SQL Editor에서 인덱스 생성
- [ ] 쿼리 성능 검증

### 3단계: 프론트엔드 수정
- [ ] 페이지네이션 파라미터 전달
- [ ] 캐싱 설정 확인

---

## 🧪 성능 테스트 방법

### Before (현재 상태)
```bash
time curl -s "https://news.gqai.kr/api/editorials" | jq '.items | length'
# 예상: 8-10초
```

### After (최적화 후)
```bash
time curl -s "https://news.gqai.kr/api/editorials?page=1&pageSize=12" | jq '.items | length'
# 목표: 0.3-0.5초 (-95%)
```

---

## 📊 예상 성능 개선

| 지표 | Before | After | 개선율 |
|------|--------|-------|--------|
| 쿼리 횟수 | 41번 | 1번 | -98% |
| 응답 시간 | 8-10초 | 0.3-0.5초 | -95% |
| 데이터 전송 | 전체 | 페이지별 | -92% |
| 캐시 효율 | 없음 | 5분 Edge | ∞ |

---

## ⚠️ 주의사항

1. **Supabase 프로젝트 확인:**
   - 단독/랭킹: `rxwztfdnragffxbmlscf`
   - 사설: `bwgndhxhnduoouodxngw`
   - **반드시 사설 프로젝트에 인덱스 생성**

2. **외래키 관계 확인:**
   - `analysis_topic.analysis_id` → `news_analysis.id`
   - `analysis_article.topic_id` → `analysis_topic.id`
   - JOIN 쿼리 작동을 위해 필수

3. **데이터 검증:**
   - JOIN 쿼리 후 데이터 구조 확인
   - 누락된 topics/articles 확인

---

## 🚀 다음 단계

1. ✅ 문제 진단 완료
2. ⏳ JOIN 쿼리로 API 수정
3. ⏳ Cache-Control 헤더 추가
4. ⏳ 페이지네이션 구현
5. ⏳ 인덱스 SQL 실행
6. ⏳ 성능 테스트 및 검증
