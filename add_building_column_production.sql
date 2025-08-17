-- Add building_name column to nares table (Production)
-- 이 스크립트는 운영 데이터베이스에 building_name 칼럼을 추가합니다.

-- 1. 칼럼 추가
ALTER TABLE nares ADD COLUMN IF NOT EXISTS building_name VARCHAR(100);

-- 2. 칼럼 설명 추가
COMMENT ON COLUMN nares.building_name IS '빌딩명 - 레스토랑이 위치한 건물의 이름';

-- 3. 검색 성능을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_nares_building_name ON nares(building_name);

-- 4. 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'nares' 
ORDER BY ordinal_position;