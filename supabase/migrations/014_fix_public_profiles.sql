-- Allow everyone to read user profiles (needed for chat to show names/avatars)
-- Drop the specific "own profile" policy if we want to be clean, but adding a broader one works too (OR logic).

CREATE POLICY "Public read access to profiles"
ON user_profiles FOR SELECT
USING (true);

-- Also ensure specific columns are accessible if needed, but RLS applies to rows.
-- This allows reading id, username, avatar_url, etc. from any user profile.
