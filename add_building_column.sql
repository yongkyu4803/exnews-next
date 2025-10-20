-- Add building_name column to nares table
ALTER TABLE nares ADD COLUMN building_name VARCHAR(100);

-- Add comment to describe the column
COMMENT ON COLUMN nares.building_name IS '빌딩명 - 레스토랑이 위치한 건물의 이름';

-- Create index for faster building-based queries
CREATE INDEX idx_nares_building_name ON nares(building_name);

-- Check the updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'nares' 
ORDER BY ordinal_position;