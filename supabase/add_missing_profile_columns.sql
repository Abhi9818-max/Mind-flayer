-- Add all missing columns to user_profiles table to match the frontend TypeScript interface
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS void_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS void_avatar TEXT,
ADD COLUMN IF NOT EXISTS college_name TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
