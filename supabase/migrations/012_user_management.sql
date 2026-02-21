-- =================================================================
-- 012: User Management - Ban & Freeze System
-- =================================================================

-- Add moderation columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS freeze_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Fix RLS: Allow admins to read ALL user profiles
-- (The original policy only allows users to read their own profile)
CREATE POLICY "Admins can read all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM moderators
            WHERE user_id = auth.uid()
            AND role = 'prime_sovereign'
        )
    );

-- Allow admins to update any user profile (for ban/freeze/notes)
CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM moderators
            WHERE user_id = auth.uid()
            AND role = 'prime_sovereign'
        )
    );

-- Create an audit log for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('ban', 'unban', 'freeze', 'unfreeze', 'approve', 'reject', 'note')),
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);

-- RLS for admin audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log" ON admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM moderators
            WHERE user_id = auth.uid()
            AND role = 'prime_sovereign'
        )
    );

CREATE POLICY "Admins can insert audit log" ON admin_audit_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM moderators
            WHERE user_id = auth.uid()
            AND role = 'prime_sovereign'
        )
    );

-- Update RLS on posts to also block banned/frozen users
-- Drop old policy first if it exists, then recreate
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Verified users can create posts' AND tablename = 'posts') THEN
        DROP POLICY "Verified users can create posts" ON posts;
    END IF;
END $$;

CREATE POLICY "Verified users can create posts" ON posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND verification_status = 'approved'
            AND is_banned = false
            AND (frozen_until IS NULL OR frozen_until < NOW())
        )
    );
