-- Add email column to profiles table
-- This allows storing email in profiles for easier querying without joining auth.users

-- Add email column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

-- Add unique constraint on email (case-insensitive)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON profiles(LOWER(email));

-- Add comment
COMMENT ON COLUMN profiles.email IS 'User email address, duplicated from auth.users for easier querying';

-- Update existing profiles with emails from auth.users (if any exist)
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email = '';
