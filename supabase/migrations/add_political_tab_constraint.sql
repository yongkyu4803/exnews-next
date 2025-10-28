-- Migration: Add 'political' tab to exnews_visit_analytics constraint
-- Date: 2025-10-28
-- Description: Update tab_name CHECK constraint to include 'political' tab

-- Drop existing constraint
ALTER TABLE exnews_visit_analytics
DROP CONSTRAINT IF EXISTS exnews_visit_analytics_tab_name_check;

-- Add new constraint with 'political' included
ALTER TABLE exnews_visit_analytics
ADD CONSTRAINT exnews_visit_analytics_tab_name_check
CHECK (tab_name IN ('exclusive', 'ranking', 'editorial', 'political', 'restaurant'));

-- Verify the constraint was added
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'exnews_visit_analytics'::regclass
AND conname = 'exnews_visit_analytics_tab_name_check';
