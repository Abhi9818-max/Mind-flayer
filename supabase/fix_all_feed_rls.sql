-- =============================================
-- FIX RLS POLICIES FOR ALL FEED FEATURES
-- =============================================

-- Ensure RLS is enabled on all relevant tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- 1. POSTS POLICIES
-- ---------------------------------------------

DROP POLICY IF EXISTS "Read posts in territory" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Anyone can read active posts
CREATE POLICY "Public can read posts" ON posts 
    FOR SELECT USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" ON posts 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts 
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- 2. COMMENTS POLICIES
-- ---------------------------------------------

DROP POLICY IF EXISTS "Public can read comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Anyone can read comments
CREATE POLICY "Public can read comments" ON comments 
    FOR SELECT USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON comments 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments 
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- 3. LIKES POLICIES
-- ---------------------------------------------

DROP POLICY IF EXISTS "Public can read likes" ON likes;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON likes;

-- Anyone can see who liked what
CREATE POLICY "Public can read likes" ON likes 
    FOR SELECT USING (true);

-- Authenticated users can like posts (using their user_hash, assuming user_hash = auth.uid() for now)
CREATE POLICY "Authenticated users can like posts" ON likes 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = user_hash);

-- Users can unlike
CREATE POLICY "Users can unlike posts" ON likes 
    FOR DELETE USING (auth.uid()::text = user_hash);
