-- Create exnews_visit_analytics table for tracking visitor statistics
CREATE TABLE IF NOT EXISTS exnews_visit_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  tab_name TEXT CHECK (tab_name IN ('exclusive', 'ranking', 'editorial', 'restaurant')),
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'tab_change', 'interaction')),
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop')),
  -- Phase 2 columns (optional for now)
  duration_seconds INTEGER,
  scroll_depth INTEGER CHECK (scroll_depth >= 0 AND scroll_depth <= 100),
  interaction_count INTEGER DEFAULT 0,
  exit_page BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exnews_visit_analytics_session_id ON exnews_visit_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_exnews_visit_analytics_visitor_id ON exnews_visit_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_exnews_visit_analytics_tab_name ON exnews_visit_analytics(tab_name);
CREATE INDEX IF NOT EXISTS idx_exnews_visit_analytics_event_type ON exnews_visit_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_exnews_visit_analytics_created_at ON exnews_visit_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exnews_visit_analytics_device_type ON exnews_visit_analytics(device_type);

-- Create composite index for tab analytics queries
CREATE INDEX IF NOT EXISTS idx_exnews_visit_analytics_tab_created ON exnews_visit_analytics(tab_name, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE exnews_visit_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for tracking)
CREATE POLICY "Allow anonymous inserts for tracking" ON exnews_visit_analytics
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow authenticated reads (for analytics dashboard)
-- Note: For now, we'll allow all reads. Later, restrict to admin users only.
CREATE POLICY "Allow all reads for analytics" ON exnews_visit_analytics
  FOR SELECT
  USING (true);

-- Add helpful comment
COMMENT ON TABLE exnews_visit_analytics IS 'Stores visitor analytics data including page views, tab changes, and user interactions';
COMMENT ON COLUMN exnews_visit_analytics.session_id IS 'Unique session identifier for grouping visitor actions';
COMMENT ON COLUMN exnews_visit_analytics.visitor_id IS 'Anonymous visitor identifier stored in localStorage';
COMMENT ON COLUMN exnews_visit_analytics.tab_name IS 'Tab name: exclusive, ranking, editorial, or restaurant';
COMMENT ON COLUMN exnews_visit_analytics.event_type IS 'Event type: page_view, tab_change, or interaction';
COMMENT ON COLUMN exnews_visit_analytics.device_type IS 'Device type: mobile or desktop';
COMMENT ON COLUMN exnews_visit_analytics.duration_seconds IS 'Phase 2: Time spent on page in seconds';
COMMENT ON COLUMN exnews_visit_analytics.scroll_depth IS 'Phase 2: Scroll depth percentage (0-100)';
COMMENT ON COLUMN exnews_visit_analytics.interaction_count IS 'Phase 2: Number of interactions on the page';
