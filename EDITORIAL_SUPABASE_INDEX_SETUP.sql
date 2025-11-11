-- ============================================================================
-- 사설 분석 Supabase 인덱스 생성 스크립트
-- ============================================================================
-- 프로젝트: bwgndhxhnduoouodxngw.supabase.co (Editorial Analysis)
-- 목적: N+1 쿼리 최적화 및 JOIN 성능 개선
-- 예상 효과: 쿼리 시간 8-10초 → 0.3-0.5초 (-95%)
-- ============================================================================

-- 1. news_analysis 테이블 인덱스
-- ============================================================================
-- ORDER BY analyzed_at DESC 최적화
CREATE INDEX IF NOT EXISTS idx_news_analysis_analyzed_at
ON news_analysis(analyzed_at DESC);

COMMENT ON INDEX idx_news_analysis_analyzed_at IS
'사설 분석 날짜별 정렬 최적화 (메인 쿼리)';


-- 2. analysis_topic 테이블 인덱스
-- ============================================================================
-- JOIN 최적화: news_analysis.id = analysis_topic.analysis_id
CREATE INDEX IF NOT EXISTS idx_analysis_topic_analysis_id
ON analysis_topic(analysis_id);

COMMENT ON INDEX idx_analysis_topic_analysis_id IS
'사설 분석-주제 JOIN 최적화 (외래키)';

-- 복합 인덱스: analysis_id + topic_number 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_analysis_topic_analysis_id_topic_number
ON analysis_topic(analysis_id, topic_number);

COMMENT ON INDEX idx_analysis_topic_analysis_id_topic_number IS
'주제 번호 정렬 최적화 (복합 인덱스)';


-- 3. analysis_article 테이블 인덱스
-- ============================================================================
-- JOIN 최적화: analysis_topic.id = analysis_article.topic_id
CREATE INDEX IF NOT EXISTS idx_analysis_article_topic_id
ON analysis_article(topic_id);

COMMENT ON INDEX idx_analysis_article_topic_id IS
'주제-기사 JOIN 최적화 (외래키)';

-- 복합 인덱스: topic_id + article_number 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_analysis_article_topic_id_article_number
ON analysis_article(topic_id, article_number);

COMMENT ON INDEX idx_analysis_article_topic_id_article_number IS
'기사 번호 정렬 최적화 (복합 인덱스)';


-- 4. 쿼리 플래너 통계 업데이트
-- ============================================================================
ANALYZE news_analysis;
ANALYZE analysis_topic;
ANALYZE analysis_article;


-- ============================================================================
-- 인덱스 생성 확인 쿼리
-- ============================================================================
-- 아래 쿼리로 인덱스가 정상적으로 생성되었는지 확인하세요:

/*
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('news_analysis', 'analysis_topic', 'analysis_article')
ORDER BY tablename, indexname;
*/


-- ============================================================================
-- 성능 테스트 쿼리
-- ============================================================================
-- 인덱스 생성 전후 성능 비교용 쿼리:

/*
-- Before: N+1 쿼리 (41번)
EXPLAIN ANALYZE
SELECT * FROM news_analysis ORDER BY analyzed_at DESC LIMIT 12;

-- After: JOIN 쿼리 (1번)
EXPLAIN ANALYZE
SELECT
  na.*,
  json_agg(
    json_build_object(
      'topic', at.*,
      'articles', (
        SELECT json_agg(aa.*)
        FROM analysis_article aa
        WHERE aa.topic_id = at.id
        ORDER BY aa.article_number
      )
    ) ORDER BY at.topic_number
  ) as topics
FROM news_analysis na
LEFT JOIN analysis_topic at ON at.analysis_id = na.id
WHERE na.id IN (
  SELECT id FROM news_analysis ORDER BY analyzed_at DESC LIMIT 12
)
GROUP BY na.id
ORDER BY na.analyzed_at DESC;
*/


-- ============================================================================
-- 인덱스 삭제 쿼리 (롤백용)
-- ============================================================================
-- 문제 발생 시 인덱스를 삭제하려면 아래 쿼리를 실행하세요:

/*
DROP INDEX IF EXISTS idx_news_analysis_analyzed_at;
DROP INDEX IF EXISTS idx_analysis_topic_analysis_id;
DROP INDEX IF EXISTS idx_analysis_topic_analysis_id_topic_number;
DROP INDEX IF EXISTS idx_analysis_article_topic_id;
DROP INDEX IF EXISTS idx_analysis_article_topic_id_article_number;
*/


-- ============================================================================
-- 외래키 제약조건 확인 (선택사항)
-- ============================================================================
-- JOIN 쿼리가 정상 작동하려면 외래키 관계가 설정되어 있어야 합니다.
-- 아래 쿼리로 외래키 관계를 확인하세요:

/*
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('analysis_topic', 'analysis_article');
*/


-- ============================================================================
-- 실행 방법
-- ============================================================================
-- 1. Supabase Dashboard (https://supabase.com) 접속
-- 2. 사설 프로젝트 선택 (bwgndhxhnduoouodxngw)
-- 3. SQL Editor 메뉴 선택
-- 4. 이 파일의 내용을 복사하여 붙여넣기
-- 5. "Run" 버튼 클릭
-- 6. 인덱스 생성 확인 쿼리로 검증
-- 7. API 성능 테스트 (curl 또는 브라우저)
-- ============================================================================
