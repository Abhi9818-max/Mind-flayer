-- =============================================
-- 017: Psychological Features — Profile Views
-- =============================================

-- Profile Views Table
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profile_views_target ON profile_views(target_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);

-- Row Level Security
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views
CREATE POLICY "Users can record views"
    ON profile_views FOR INSERT
    WITH CHECK (auth.uid() = viewer_id);

-- Only targeted users can see who viewed them (or system for notifications)
CREATE POLICY "Users can see their own profile views"
    ON profile_views FOR SELECT
    USING (auth.uid() = target_id);

-- Helper Function for Shadow Aura
CREATE OR REPLACE FUNCTION get_college_crush_rankings(target_college TEXT)
RETURNS TABLE (user_id UUID, rank BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    target_id as user_id,
    RANK() OVER (ORDER BY COUNT(*) DESC) as rank
  FROM user_crushes
  JOIN user_profiles ON user_profiles.id = user_crushes.target_id
  WHERE user_profiles.college_name = target_college
  GROUP BY target_id;
$$;
