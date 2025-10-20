-- Add building_name column to nares table
ALTER TABLE nares ADD COLUMN building_name VARCHAR(100);

-- Add comment to describe the column
COMMENT ON COLUMN nares.building_name IS 'L)… - ¤ ‘t X\ t<X t„';

-- Create index for faster building-based queries
CREATE INDEX idx_nares_building_name ON nares(building_name);