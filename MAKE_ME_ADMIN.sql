-- Make a user a Supreme Being (Admin)
-- Run this in the Supabase SQL Editor after the admin account has signed up.

-- Step 1: Grant admin role
INSERT INTO public.moderators (user_id, role, scope_type, scope_id)
SELECT id, 'prime_sovereign', 'global', NULL
FROM auth.users
WHERE email = 'veritas9818@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.moderators 
    WHERE user_id = auth.users.id 
    AND role = 'prime_sovereign'
);

-- Step 2: Auto-approve the admin's verification (they don't need to be verified)
UPDATE public.user_profiles
SET verification_status = 'approved', is_verified = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'veritas9818@gmail.com');
