-- Add void_avatar column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS void_avatar TEXT;
