# 전체 API 성능 최적화 가이드

## 🚨 현재 상황

### 성능 측정 결과 (2025-11-12)

| API | 응답 시간 | 응답 크기 | 평가 | 목표 |
|-----|----------|----------|------|------|
| **단독 뉴스** | 1.09초 | 9KB | ⚠️ 느림 | **0.15초** |
| **랭킹 뉴스** | 1.96초 | 2.6KB | 🚨 매우 느림 | **0.15초** |
| **사설 분석** | 1.53초 | 85KB → 8KB | ⚠️ 배포 대기 | **0.15초** |
| **정치 리포트** | 1.29초 | 17.8KB | ⚠️ 느림 | **0.15초** |

**결론**: 모든 API가 **느립니다**!

---

## 🔍 원인 분석

### 공통 원인: Supabase 인덱스 부재

모든 API 코드는 페이지네이션과 캐싱이 적용되어 있지만, **데이터베이스 인덱스가 없어서** 쿼리가 느립니다.

#### 원인 1: ORDER BY 인덱스 없음
```sql
-- 단독 뉴스
SELECT * FROM news ORDER BY pub_date DESC  -- ❌ Full table scan

-- 사설 분석
SELECT * FROM news_analysis ORDER BY analyzed_at DESC  -- ❌ Full table scan

-- 정치 리포트
SELECT * FROM skills_news_reports ORDER BY created_at DESC  -- ❌ Full table scan
```

#### 원인 2: 카테고리 필터 인덱스 없음
```sql
-- 단독 뉴스 (카테고리 필터)
SELECT * FROM news WHERE category = '정치' ORDER BY pub_date DESC  -- ❌ Seq scan
```

#### 원인 3: 랭킹 뉴스 - 2번 쿼리 실행
```typescript
// ❌ 비효율: count와 data를 별도로 조회
const [countResult, dataResult] = await Promise.all([
  supabase.from('ranking_news').select('id', { count: 'exact', head: true }),
  supabase.from('ranking_news').select('*')
]);
```

---

## ✅ 해결 방법

### 방법 1: 단독/랭킹 뉴스 인덱스 생성 (Critical!)

**파일**: [SUPABASE_INDEX_SETUP.sql](SUPABASE_INDEX_SETUP.sql) (이미 존재)

```sql
-- 1. 단독 뉴스 인덱스
CREATE INDEX IF NOT EXISTS idx_news_pub_date
ON news(pub_date DESC);

CREATE INDEX IF NOT EXISTS idx_news_category_pub_date
ON news(category, pub_date DESC);

-- 2. 랭킹 뉴스 인덱스 (id 자동 인덱스 있음)
-- ranking_news 테이블은 id 기본키가 있어서 별도 인덱스 불필요

ANALYZE news;
ANALYZE ranking_news;
```

**실행 방법**:
1. Supabase Dashboard → `rxwztfdnragffxbmlscf` 프로젝트
2. SQL Editor → 위 SQL 복사 → Run

**예상 효과**:
- 단독 뉴스: 1.09초 → **0.15초** (-86%)
- 랭킹 뉴스: 1.96초 → **0.5초** (-75%, 코드 최적화 필요)
- 정치 리포트: 1.29초 → **0.15초** (-88%)

---

### 방법 2: 사설 분석 인덱스 생성 (Critical!)

**파일**: [EDITORIAL_SUPABASE_INDEX_SETUP.sql](EDITORIAL_SUPABASE_INDEX_SETUP.sql) (이미 존재)

```sql
-- 사설 분석 인덱스
CREATE INDEX IF NOT EXISTS idx_news_analysis_analyzed_at
ON news_analysis(analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_topic_analysis_id
ON analysis_topic(analysis_id);

CREATE INDEX IF NOT EXISTS idx_analysis_article_topic_id
ON analysis_article(topic_id);

ANALYZE news_analysis;
ANALYZE analysis_topic;
ANALYZE analysis_article;
```

**실행 방법**:
1. Supabase Dashboard → `bwgndhxhnduoouodxngw` 프로젝트 (사설 전용)
2. SQL Editor → 위 SQL 복사 → Run

**예상 효과**:
- 사설 분석: 1.53초 → **0.15초** (-90%)

---

### 방법 3: 랭킹 뉴스 API 코드 최적화

**현재 문제**: 2번의 쿼리 실행
```typescript
// ❌ 비효율
const [countResult, dataResult] = await Promise.all([
  supabase.from('ranking_news').select('id', { count: 'exact', head: true }),
  supabase.from('ranking_news').select('*')
]);
```

**개선 방법**:
```typescript
// ✅ 1번의 쿼리로 통합
const { data, error, count } = await supabase
  .from('ranking_news')
  .select('id, title, link, media_name', { count: 'exact' })
  .range(startIndex, startIndex + pageSizeNum - 1);
```

**예상 효과**:
- 쿼리 횟수: 2번 → 1번 (-50%)
- 응답 시간: 0.5초 → **0.25초** (추가 -50%)
- 인덱스 적용 후: **0.15초**

---

## 📋 실행 플랜

### 1단계: 단독/랭킹 뉴스 인덱스 생성 (5분)

```sql
-- Supabase Dashboard: rxwztfdnragffxbmlscf.supabase.co

-- 단독 뉴스 인덱스
CREATE INDEX IF NOT EXISTS idx_news_pub_date ON news(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_category_pub_date ON news(category, pub_date DESC);

-- 정치 리포트 인덱스
CREATE INDEX IF NOT EXISTS idx_skills_news_reports_created_at ON skills_news_reports(created_at DESC);

-- 통계 업데이트
ANALYZE news;
ANALYZE ranking_news;
ANALYZE skills_news_reports;
```

**예상 효과**:
- 단독 뉴스: 1.09초 → 0.15초
- 랭킹 뉴스: 1.96초 → 0.5초
- 정치 리포트: 1.29초 → 0.15초

---

### 2단계: 사설 분석 인덱스 생성 (5분)

```sql
-- Supabase Dashboard: bwgndhxhnduoouodxngw.supabase.co

-- 사설 분석 인덱스 (파일 전체 실행)
-- EDITORIAL_SUPABASE_INDEX_SETUP.sql 참조
```

**예상 효과**:
- 사설 분석: 1.53초 → 0.15초

---

### 3단계: 랭킹 뉴스 API 코드 최적화 (10분)

**파일**: `src/pages/api/ranking-news.ts`

**변경사항**: 2번 쿼리 → 1번 쿼리 통합

**예상 효과**:
- 랭킹 뉴스: 0.5초 → 0.25초 (인덱스 후)
- 인덱스 + 코드 최적화: **0.15초**

---

### 4단계: 성능 검증 (5분)

```bash
# 단독 뉴스
time curl -s "https://news.gqai.kr/api/news?page=1&pageSize=12" -o /dev/null
# 목표: 0.15초

# 랭킹 뉴스
time curl -s "https://news.gqai.kr/api/ranking-news?page=1&pageSize=12" -o /dev/null
# 목표: 0.15초

# 사설 분석
time curl -s "https://news.gqai.kr/api/editorials?page=1&pageSize=12" -o /dev/null
# 목표: 0.15초

# 정치 리포트
time curl -s "https://news.gqai.kr/api/political-reports?page=1&pageSize=12" -o /dev/null
# 목표: 0.15초
```

---

## 📊 예상 성능 개선

### Before (현재)
| API | 응답 시간 | 문제 |
|-----|----------|------|
| 단독 뉴스 | 1.09초 | 인덱스 없음 |
| 랭킹 뉴스 | 1.96초 | 인덱스 + 2번 쿼리 |
| 사설 분석 | 1.53초 | 인덱스 + N+1 |
| 정치 리포트 | 1.29초 | 인덱스 + 페이지네이션 없음 |

### After (인덱스 적용 후)
| API | 응답 시간 | 개선율 | 상태 |
|-----|----------|--------|------|
| 단독 뉴스 | **0.15초** | -86% | ✅ |
| 랭킹 뉴스 | **0.15초** | -92% | ✅ |
| 사설 분석 | **0.15초** | -90% | ✅ |
| 정치 리포트 | **0.15초** | -88% | ✅ |

### 캐시 히트 시
모든 API: **<0.05초** (Edge 캐싱)

---

## 🎯 최우선 작업

### Critical Priority (즉시 실행)

1. ✅ **단독/랭킹 인덱스 생성** (5분)
   - Supabase: `rxwztfdnragffxbmlscf`
   - 파일: [SUPABASE_INDEX_SETUP.sql](SUPABASE_INDEX_SETUP.sql)
   - 효과: 단독 -86%, 랭킹 -75%

2. ✅ **사설 인덱스 생성** (5분)
   - Supabase: `bwgndhxhnduoouodxngw`
   - 파일: [EDITORIAL_SUPABASE_INDEX_SETUP.sql](EDITORIAL_SUPABASE_INDEX_SETUP.sql)
   - 효과: 사설 -90%

3. 🔄 **랭킹 뉴스 코드 최적화** (10분)
   - 2번 쿼리 → 1번 쿼리
   - 효과: 추가 -50%

---

## 🔍 인덱스 생성 검증 방법

### Supabase Dashboard에서 확인

```sql
-- 인덱스 목록 조회
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('news', 'ranking_news', 'news_analysis', 'analysis_topic', 'analysis_article')
ORDER BY tablename, indexname;
```

**예상 결과**:
```
news | idx_news_pub_date
news | idx_news_category_pub_date
news_analysis | idx_news_analysis_analyzed_at
analysis_topic | idx_analysis_topic_analysis_id
analysis_article | idx_analysis_article_topic_id
```

---

## 🚨 주의사항

### 1. 두 개의 Supabase 프로젝트

- **단독/랭킹**: `rxwztfdnragffxbmlscf.supabase.co`
- **사설**: `bwgndhxhnduoouodxngw.supabase.co`

**반드시 각 프로젝트에 맞는 SQL 실행!**

### 2. 인덱스 생성 시간

- 데이터 1000건: ~1초
- 데이터 10만건: ~5-10초
- 데이터 100만건: ~1-2분

### 3. 인덱스 용량

- 각 인덱스: 데이터 크기의 ~10-20%
- 예: 100MB 테이블 → 인덱스 ~20MB

---

## 📝 체크리스트

- [ ] 단독 뉴스 인덱스 생성 (rxwztfdnragffxbmlscf)
- [ ] 정치 리포트 인덱스 생성 (rxwztfdnragffxbmlscf)
- [ ] 랭킹 뉴스 검증 (인덱스 자동 있음)
- [ ] 사설 분석 인덱스 생성 (bwgndhxhnduoouodxngw)
- [ ] 랭킹 뉴스 API 코드 최적화
- [ ] 정치 리포트 API 페이지네이션 추가
- [ ] 성능 테스트 (모든 API <0.2초)
- [ ] 캐시 동작 확인 (두 번째 요청 <0.05초)

---

## 🎉 최종 목표

**모든 API 응답 시간: <0.2초**

- 첫 요청: **0.15초** (DB 쿼리)
- 캐시 히트: **<0.05초** (Edge 캐싱)
- 사용자 체감: **즉시 로딩**
