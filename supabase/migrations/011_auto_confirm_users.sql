-- 011_auto_confirm_users.sql
-- Auto-confirm email for new users (Dev/MVP helper)
-- This ensures users get a session immediately upon signup, allowing them to upload IDs (which requires auth).

-- Function to set email_confirmed_at
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger before insert
DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_user();
