-- 010_verification_system.sql
-- User Verification System & Supreme Being Admin

-- 1. Create Verification Status Enum
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'pending',
        'approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add Verification Columns to User Profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS real_name TEXT,
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Create Storage Bucket for Verification Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-docs', 
    'verification-docs', 
    false, -- PRIVATE bucket!
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS for Verification Storage
-- Users can upload ONLY their own ID card
-- Users can READ ONLY their own ID card
-- Admins (Supreme Beings) can READ ALL

-- Helper to check if user is admin
-- For now, we'll hardcode a specific user UUID or checks against a 'moderators' table if established.
-- In 004_dominions_and_moderation.sql we created `moderators` table.
-- Let's use that! specific role: 'prime_sovereign'.

CREATE OR REPLACE FUNCTION is_supreme_being()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM moderators
        WHERE user_id = auth.uid()
        AND role = 'prime_sovereign'
        AND is_active = true
    );
END;
$$;

-- Storage Policies
CREATE POLICY "Users can upload verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'verification-docs' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text -- Enforce folder structure: uid/filename
);

CREATE POLICY "Users can view own verification docs"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'verification-docs'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text -- Own files
        OR is_supreme_being() -- OR admin
    )
);

-- 5. Update RLS on Posts/Chats to Enforce Verification
-- THIS IS STRICT! Unverified users become read-only observers.

-- Posts
DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Verified users can create posts" ON posts 
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND verification_status = 'approved'
        )
    );

-- Chats
-- Only verified users can initiate chats
-- Assuming `chats` table from logic in 003/Complete Schema
DROP POLICY IF EXISTS "Users can create chats" ON chats;
CREATE POLICY "Verified users can create chats" ON chats
    FOR INSERT WITH CHECK (
        auth.uid() = initiator_id
        AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND verification_status = 'approved'
        )
    );
