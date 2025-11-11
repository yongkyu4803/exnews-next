-- ============================================
-- Supabase 성능 최적화 인덱스 생성 SQL
-- ============================================
-- 실행 위치: Supabase Dashboard → SQL Editor
-- 예상 실행 시간: 1-5분 (데이터 크기에 따라)
-- 권장 실행 시간: 트래픽 낮은 시간대
-- ============================================

-- 1. news 테이블: pub_date 인덱스 (정렬 최적화)
-- 용도: ORDER BY pub_date DESC 쿼리 최적화
-- 예상 효과: 쿼리 속도 50-70% 개선
CREATE INDEX IF NOT EXISTS idx_news_pub_date
ON news(pub_date DESC);

-- 2. news 테이블: category + pub_date 복합 인덱스
-- 용도: category 필터링 + 날짜 정렬 최적화
-- 예상 효과: 카테고리별 조회 80-90% 빨라짐
CREATE INDEX IF NOT EXISTS idx_news_category_pub_date
ON news(category, pub_date DESC);

-- 3. ranking_news 테이블: id 인덱스 (Primary Key 확인)
-- 용도: ID 기반 조회 최적화
CREATE INDEX IF NOT EXISTS idx_ranking_news_id
ON ranking_news(id);

-- 4. editorials 테이블: created_at 인덱스 (사설 분석)
-- 용도: 최신 사설 조회 최적화
CREATE INDEX IF NOT EXISTS idx_editorials_created_at
ON editorials(created_at DESC);

-- 5. restaurants 테이블: category 인덱스
-- 용도: 카테고리별 식당 조회 최적화
CREATE INDEX IF NOT EXISTS idx_restaurants_category
ON restaurants(category);

-- 6. Query Planner 통계 업데이트
-- 용도: PostgreSQL이 최적의 쿼리 계획을 세우도록 통계 갱신
ANALYZE news;
ANALYZE ranking_news;
ANALYZE editorials;
ANALYZE restaurants;

-- ============================================
-- 인덱스 생성 확인 쿼리
-- ============================================
-- 실행 후 아래 쿼리로 인덱스 생성 확인

-- news 테이블 인덱스 목록
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'news'
ORDER BY indexname;

-- ranking_news 테이블 인덱스 목록
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ranking_news'
ORDER BY indexname;

-- ============================================
-- 성능 테스트 쿼리
-- ============================================
-- 인덱스 적용 전후 성능 비교

-- BEFORE: Full Table Scan (느림)
-- EXPLAIN ANALYZE SELECT * FROM news ORDER BY pub_date DESC LIMIT 12;

-- AFTER: Index Scan (빠름)
EXPLAIN ANALYZE
SELECT *
FROM news
ORDER BY pub_date DESC
LIMIT 12;

-- Category 필터링 성능 테스트
EXPLAIN ANALYZE
SELECT *
FROM news
WHERE category = '정치'
ORDER BY pub_date DESC
LIMIT 12;

-- ============================================
-- 예상 결과
-- ============================================
/*
BEFORE (인덱스 없음):
- Execution Time: 500-1000ms
- Planning Time: 10-50ms
- Method: Seq Scan (순차 스캔)

AFTER (인덱스 적용):
- Execution Time: 10-50ms ✅ (-95%)
- Planning Time: 1-5ms
- Method: Index Scan (인덱스 스캔) ✅
*/

-- ============================================
-- 롤백 쿼리 (문제 발생 시 인덱스 제거)
-- ============================================
-- 주의: 일반적으로 필요 없음. 문제 발생 시에만 실행

-- DROP INDEX IF EXISTS idx_news_pub_date;
-- DROP INDEX IF EXISTS idx_news_category_pub_date;
-- DROP INDEX IF EXISTS idx_ranking_news_id;
-- DROP INDEX IF EXISTS idx_editorials_created_at;
-- DROP INDEX IF EXISTS idx_restaurants_category;

-- ============================================
-- 인덱스 크기 확인 (선택사항)
-- ============================================
-- 인덱스가 차지하는 디스크 공간 확인

SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('news', 'ranking_news', 'editorials', 'restaurants')
ORDER BY tablename, indexname;

-- ============================================
-- 자동 VACUUM 설정 확인 (권장)
-- ============================================
-- PostgreSQL의 자동 정리 작업이 활성화되어 있는지 확인

SELECT
    relname AS table_name,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- ============================================
-- 실행 가이드
-- ============================================
/*
1. Supabase Dashboard 접속
   https://app.supabase.com/project/rxwztfdnragffxbmlscf

2. 좌측 메뉴에서 "SQL Editor" 클릭

3. "New Query" 버튼 클릭

4. 이 SQL 파일의 내용을 복사하여 붙여넣기

5. 인덱스 생성 부분만 선택하여 실행:
   - 1번부터 6번까지 순차 실행
   - 또는 전체 선택 후 "RUN" 버튼 클릭

6. 인덱스 생성 확인 쿼리 실행:
   - "news 테이블 인덱스 목록" 쿼리 실행
   - idx_news_pub_date, idx_news_category_pub_date 확인

7. 성능 테스트 쿼리 실행:
   - EXPLAIN ANALYZE 쿼리로 성능 개선 확인
   - Execution Time 비교

예상 결과:
✅ 인덱스 5개 생성 완료
✅ ANALYZE 완료
✅ 쿼리 속도 10-50ms로 개선 (기존 500-1000ms)
✅ API 응답 시간 -90% 개선
*/
