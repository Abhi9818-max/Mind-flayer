-- 013_user_follows.sql
-- Follow/Following system

CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see follows
CREATE POLICY "Users can view follows" ON user_follows
    FOR SELECT TO authenticated USING (true);

-- Users can follow others
CREATE POLICY "Users can insert follows" ON user_follows
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = follower_id AND follower_id != following_id);

-- Users can unfollow
CREATE POLICY "Users can delete own follows" ON user_follows
    FOR DELETE TO authenticated
    USING (auth.uid() = follower_id);
