-- ============================================================
-- Government Press Releases Database Schema for Supabase
-- ============================================================
-- Created: 2025-11-18
-- Description: Supabase-optimized schema for government press releases
-- Database: PostgreSQL (Supabase)
-- ============================================================

-- ============================================================
-- 1. Collections Table
-- Stores metadata about each collection run
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
    id BIGSERIAL PRIMARY KEY,
    collection_id VARCHAR(100) UNIQUE NOT NULL,
    skill_version VARCHAR(20) NOT NULL,
    schema_version VARCHAR(20) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
    generator VARCHAR(100) DEFAULT 'govt-press-releases',

    -- Query parameters (using JSONB for better performance)
    limit_per_agency INTEGER,
    keywords JSONB,
    date_range_days INTEGER,
    agencies_requested JSONB,

    -- Statistics
    total_items INTEGER DEFAULT 0,
    agencies_succeeded INTEGER DEFAULT 0,
    agencies_failed INTEGER DEFAULT 0,
    collection_duration_seconds DECIMAL(10, 2),

    -- Timestamps (Supabase automatically adds these if using their UI)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for collections table
CREATE INDEX IF NOT EXISTS idx_collections_generated_at ON collections(generated_at);
CREATE INDEX IF NOT EXISTS idx_collections_collection_id ON collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);


-- ============================================================
-- 2. Agencies Table (Master data)
-- Reference table for government agencies
-- ============================================================
CREATE TABLE IF NOT EXISTS agencies (
    id BIGSERIAL PRIMARY KEY,
    agency_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    url VARCHAR(500),
    collection_method VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert agency master data
INSERT INTO agencies (agency_code, name, name_en, url, collection_method) VALUES
('ftc', '공정거래위원회', 'Fair Trade Commission', 'https://ftc.go.kr/', 'html_parsing'),
('kca', '한국소비자원', 'Korea Consumer Agency', 'https://www.kca.go.kr/', 'rss_feed'),
('fsc', '금융위원회', 'Financial Services Commission', 'https://www.fsc.go.kr/', 'rss_feed'),
('fss', '금융감독원', 'Financial Supervisory Service', 'https://www.fss.or.kr/', 'open_api')
ON CONFLICT (agency_code) DO NOTHING;

-- Index for agencies
CREATE INDEX IF NOT EXISTS idx_agencies_code ON agencies(agency_code);


-- ============================================================
-- 3. Agency Collection Results Table
-- Tracks collection status per agency per collection run
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_collection_results (
    id BIGSERIAL PRIMARY KEY,
    collection_id VARCHAR(100) NOT NULL,
    agency_code VARCHAR(10) NOT NULL,
    collection_time TIMESTAMPTZ NOT NULL,
    collection_status VARCHAR(20) NOT NULL,
    items_count INTEGER DEFAULT 0,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE,
    FOREIGN KEY (agency_code) REFERENCES agencies(agency_code),
    UNIQUE(collection_id, agency_code)
);

-- Indexes for agency_collection_results
CREATE INDEX IF NOT EXISTS idx_acr_collection_id ON agency_collection_results(collection_id);
CREATE INDEX IF NOT EXISTS idx_acr_agency_code ON agency_collection_results(agency_code);
CREATE INDEX IF NOT EXISTS idx_acr_status ON agency_collection_results(collection_status);


-- ============================================================
-- 4. Press Releases Table (Main data)
-- Stores individual press release items
-- ============================================================
CREATE TABLE IF NOT EXISTS press_releases (
    id BIGSERIAL PRIMARY KEY,
    collection_id VARCHAR(100) NOT NULL,
    agency_code VARCHAR(10) NOT NULL,

    -- Content fields
    title VARCHAR(1000) NOT NULL,
    link VARCHAR(1000) NOT NULL,
    release_date DATE,
    department VARCHAR(200),
    summary TEXT,

    -- Metadata (using JSONB for flexibility)
    metadata JSONB,
    char_count INTEGER,
    has_summary BOOLEAN DEFAULT FALSE,

    -- Deduplication
    link_hash VARCHAR(64),

    -- Full-text search (tsvector for PostgreSQL full-text search)
    search_vector TSVECTOR,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE,
    FOREIGN KEY (agency_code) REFERENCES agencies(agency_code)
);

-- Indexes for press_releases
CREATE INDEX IF NOT EXISTS idx_pr_collection_id ON press_releases(collection_id);
CREATE INDEX IF NOT EXISTS idx_pr_agency_code ON press_releases(agency_code);
CREATE INDEX IF NOT EXISTS idx_pr_release_date ON press_releases(release_date);
CREATE INDEX IF NOT EXISTS idx_pr_created_at ON press_releases(created_at);
CREATE INDEX IF NOT EXISTS idx_pr_link_hash ON press_releases(link_hash);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_pr_unique_link ON press_releases(link_hash, agency_code)
WHERE link_hash IS NOT NULL;

-- Full-text search index (GIN index for better search performance)
CREATE INDEX IF NOT EXISTS idx_pr_search_vector ON press_releases USING GIN(search_vector);

-- JSONB index for metadata queries
CREATE INDEX IF NOT EXISTS idx_pr_metadata ON press_releases USING GIN(metadata);


-- ============================================================
-- 5. Collection Errors Table
-- Stores errors that occurred during collection
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_errors (
    id BIGSERIAL PRIMARY KEY,
    collection_id VARCHAR(100) NOT NULL,
    agency_code VARCHAR(10),
    error_code VARCHAR(50),
    error_message TEXT,
    error_details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    recoverable BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE
);

-- Indexes for collection_errors
CREATE INDEX IF NOT EXISTS idx_ce_collection_id ON collection_errors(collection_id);
CREATE INDEX IF NOT EXISTS idx_ce_agency_code ON collection_errors(agency_code);
CREATE INDEX IF NOT EXISTS idx_ce_timestamp ON collection_errors(timestamp);


-- ============================================================
-- Triggers for automatic timestamp updates
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to collections
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to press_releases
CREATE TRIGGER update_press_releases_updated_at
    BEFORE UPDATE ON press_releases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to agencies
CREATE TRIGGER update_agencies_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- Trigger for automatic search vector updates
-- ============================================================

-- Function to update search_vector
CREATE OR REPLACE FUNCTION update_press_release_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.department, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply search vector trigger
CREATE TRIGGER update_pr_search_vector
    BEFORE INSERT OR UPDATE OF title, summary, department ON press_releases
    FOR EACH ROW
    EXECUTE FUNCTION update_press_release_search_vector();


-- ============================================================
-- Views for common queries
-- ============================================================

-- View: Latest press releases with agency info
CREATE OR REPLACE VIEW v_latest_press_releases AS
SELECT
    pr.id,
    pr.collection_id,
    pr.agency_code,
    a.name as agency_name,
    pr.title,
    pr.link,
    pr.release_date,
    pr.department,
    pr.summary,
    pr.char_count,
    pr.has_summary,
    pr.created_at
FROM press_releases pr
JOIN agencies a ON pr.agency_code = a.agency_code
ORDER BY pr.created_at DESC;


-- View: Collection summary
CREATE OR REPLACE VIEW v_collection_summary AS
SELECT
    c.collection_id,
    c.generated_at,
    c.total_items,
    c.agencies_succeeded,
    c.agencies_failed,
    c.collection_duration_seconds,
    COUNT(DISTINCT pr.agency_code) as agencies_with_data,
    COUNT(pr.id) as total_releases,
    c.created_at
FROM collections c
LEFT JOIN press_releases pr ON c.collection_id = pr.collection_id
GROUP BY c.collection_id, c.generated_at, c.total_items, c.agencies_succeeded,
         c.agencies_failed, c.collection_duration_seconds, c.created_at
ORDER BY c.generated_at DESC;


-- View: Agency statistics
CREATE OR REPLACE VIEW v_agency_statistics AS
SELECT
    a.agency_code,
    a.name as agency_name,
    COUNT(DISTINCT pr.collection_id) as collections_count,
    COUNT(pr.id) as total_releases,
    MAX(pr.created_at) as last_release_date,
    AVG(pr.char_count) as avg_char_count,
    SUM(CASE WHEN pr.has_summary THEN 1 ELSE 0 END) as releases_with_summary
FROM agencies a
LEFT JOIN press_releases pr ON a.agency_code = pr.agency_code
GROUP BY a.agency_code, a.name
ORDER BY total_releases DESC;


-- ============================================================
-- Row Level Security (RLS) Policies - Optional
-- ============================================================
-- Uncomment if you want to enable RLS for Supabase

-- Enable RLS on tables
-- ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agency_collection_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE collection_errors ENABLE ROW LEVEL SECURITY;

-- Example: Allow public read access
-- CREATE POLICY "Allow public read access on press_releases"
--     ON press_releases FOR SELECT
--     USING (true);

-- CREATE POLICY "Allow public read access on agencies"
--     ON agencies FOR SELECT
--     USING (true);

-- CREATE POLICY "Allow public read access on collections"
--     ON collections FOR SELECT
--     USING (true);


-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to search press releases by keyword
CREATE OR REPLACE FUNCTION search_press_releases(search_query TEXT, agency_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    id BIGINT,
    agency_code VARCHAR,
    agency_name VARCHAR,
    title VARCHAR,
    link VARCHAR,
    release_date DATE,
    summary TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        pr.agency_code,
        a.name as agency_name,
        pr.title,
        pr.link,
        pr.release_date,
        pr.summary,
        ts_rank(pr.search_vector, plainto_tsquery('simple', search_query)) as rank
    FROM press_releases pr
    JOIN agencies a ON pr.agency_code = a.agency_code
    WHERE pr.search_vector @@ plainto_tsquery('simple', search_query)
        AND (agency_filter IS NULL OR pr.agency_code = agency_filter)
    ORDER BY rank DESC, pr.release_date DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;


-- Function to get statistics for a collection
CREATE OR REPLACE FUNCTION get_collection_stats(p_collection_id VARCHAR)
RETURNS TABLE (
    collection_id VARCHAR,
    total_items INTEGER,
    agencies_succeeded INTEGER,
    agencies_failed INTEGER,
    duration_seconds DECIMAL,
    ftc_count BIGINT,
    kca_count BIGINT,
    fsc_count BIGINT,
    fss_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.collection_id,
        c.total_items,
        c.agencies_succeeded,
        c.agencies_failed,
        c.collection_duration_seconds,
        COUNT(*) FILTER (WHERE pr.agency_code = 'ftc'),
        COUNT(*) FILTER (WHERE pr.agency_code = 'kca'),
        COUNT(*) FILTER (WHERE pr.agency_code = 'fsc'),
        COUNT(*) FILTER (WHERE pr.agency_code = 'fss')
    FROM collections c
    LEFT JOIN press_releases pr ON c.collection_id = pr.collection_id
    WHERE c.collection_id = p_collection_id
    GROUP BY c.collection_id, c.total_items, c.agencies_succeeded,
             c.agencies_failed, c.collection_duration_seconds;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- Cleanup function (optional)
-- ============================================================

-- Function to delete old collections (older than N days)
CREATE OR REPLACE FUNCTION cleanup_old_collections(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM collections
    WHERE generated_at < NOW() - (days_to_keep || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- Verification Queries (commented out)
-- ============================================================

-- Check all tables exist
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('collections', 'agencies', 'agency_collection_results', 'press_releases', 'collection_errors')
-- ORDER BY table_name;

-- Check all indexes
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- Check all views
-- SELECT table_name
-- FROM information_schema.views
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
