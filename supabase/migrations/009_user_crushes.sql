-- 009_user_crushes.sql
-- Table for Secret Admirer feature

CREATE TABLE IF NOT EXISTS user_crushes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admirer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(admirer_id, target_id)
);

-- Index for counting admirers
CREATE INDEX IF NOT EXISTS idx_user_crushes_target ON user_crushes(target_id);

-- RLS
ALTER TABLE user_crushes ENABLE ROW LEVEL SECURITY;

-- Admirers can see who they crushed on
CREATE POLICY "Admirers can view their crushes" ON user_crushes
    FOR SELECT USING (auth.uid() = admirer_id);

-- Target users CANNOT see who crushed on them (Secret!)
-- They can only count them (which is done via COUNT(*) queries that don't need SELECT row access if using head: true?)
-- Actually, RLS usually blocks COUNT too if you can't SELECT.
-- But we can create a SECURITY DEFINER function to get the count if strict secrecy is needed.
-- For MVP, we'll allow users to see rows where they are the target BUT mask the admirer_id? No, RLS is per-row.
-- If we allow SELECT where target_id = auth.uid(), they can see the admirer_id.
-- So we MUST NOT allow SELECT for targets.

-- To allow counting, we might just rely on a separate mechanism or assume the client uses a trusted API.
-- Supabase `count` usually respects RLS.
-- If we want to show "5 Adimrers", we need a way to count without exposing IDs.

-- Option A: Create a view or function.
-- Option B: Allow select but trust the frontend not to show it (Insecure).

-- Let's stick to "Admirers can insert" and "Admirers can delete".
CREATE POLICY "Users can insert crushes" ON user_crushes
    FOR INSERT WITH CHECK (auth.uid() = admirer_id);

CREATE POLICY "Users can remove crushes" ON user_crushes
    FOR DELETE USING (auth.uid() = admirer_id);

-- For counting, we will use a function to keep it secret.
CREATE OR REPLACE FUNCTION get_admirer_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM user_crushes WHERE target_id = user_uuid);
END;
$$;
