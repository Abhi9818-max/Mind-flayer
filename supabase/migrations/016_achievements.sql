-- =============================================
-- 016: Prime Artifacts — Achievements System
-- =============================================

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    seen BOOLEAN DEFAULT FALSE,
    
    -- Prevent duplicate achievements
    UNIQUE(user_id, achievement_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_unseen ON user_achievements(user_id, seen) WHERE seen = FALSE;

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can read their own achievements
CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own achievements (awarded by service)
CREATE POLICY "Users can earn achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can mark their own achievements as seen
CREATE POLICY "Users can mark achievements seen"
    ON user_achievements FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Anyone can view any user's achievements (for profile badges)
CREATE POLICY "Anyone can view achievements"
    ON user_achievements FOR SELECT
    USING (true);
