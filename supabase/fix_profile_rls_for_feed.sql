-- =============================================
-- FIX RLS POLICY FOR USER PROFILES
-- =============================================

-- Currently, the policy "Users can read own profile" prevents the Feed
-- from fetching the display names and avatars of OTHER people who posted.
-- We need to allow authenticated users to read all profiles (so they can see the feed).

-- 1. Drop the restrictive read policy
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

-- 2. Create a new policy that allows anyone who is logged in to read profile basic info
CREATE POLICY "Authenticated users can read profiles" ON user_profiles 
    FOR SELECT USING (auth.role() = 'authenticated');
