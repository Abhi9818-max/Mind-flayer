-- Migration 005: Media and Voice Support
-- Adding media_url and allowing 'voice' type.

-- 1. Add media_url column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- 2. Update type check constraint to include 'voice'
-- We have to drop the old constraint and add a new one because Postgres ENUMs are strict, 
-- but here 'type' is a TEXT column with a CHECK constraint (from 001_initial_schema.sql).

ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_type_check;

ALTER TABLE posts
ADD CONSTRAINT posts_type_check 
CHECK (type IN ('confession', 'rumor', 'crush', 'rant', 'question', 'voice'));

-- 3. Add Storage Bucket for Post Media if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS for Storage
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');
