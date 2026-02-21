-- =============================================
-- 1. FIX SUPABASE RELATIONS (THE JOIN ERROR)
-- =============================================

-- The `{}` error happens because Supabase JS cannot join `posts` and `user_profiles` 
-- if there is no explicit Foreign Key between them (they both pointed to auth.users).
-- We add the Foreign Keys here to instantly fix the Feed error.

ALTER TABLE posts
ADD CONSTRAINT posts_user_profile_fk
FOREIGN KEY (user_id) REFERENCES user_profiles(id)
ON DELETE SET NULL;

ALTER TABLE comments
ADD CONSTRAINT comments_user_profile_fk
FOREIGN KEY (user_id) REFERENCES user_profiles(id)
ON DELETE SET NULL;

-- =============================================
-- 2. SETUP COMMENT REPLIES
-- =============================================

-- Add parent_id to allow nested replies
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- =============================================
-- 3. SETUP SAVED POSTS (BOOKMARKS)
-- =============================================

CREATE TABLE IF NOT EXISTS saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Users can only read and manage their own saved posts
CREATE POLICY "Users can read own saved posts" ON saved_posts 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts" ON saved_posts 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts" ON saved_posts 
    FOR DELETE USING (auth.uid() = user_id);
