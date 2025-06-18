-- Migration: Fix missing foreign key relationship between bread_photos and profiles
-- The bread_photos table currently references auth.users but PostgREST can't
-- automatically detect the relationship to profiles table.
--
-- This fixes the error: "Could not find a relationship between 'bread_photos' and 'profiles'"
-- that occurs when querying: bread_photos?select=*,profiles(username,avatar_url)

BEGIN;

-- Add direct foreign key from bread_photos to profiles
-- Since profiles.id already references auth.users.id, we can safely add this constraint

-- First, ensure all user_ids in bread_photos have corresponding profiles
-- (This should be the case due to the handle_new_user trigger, but let's be safe)
DELETE FROM bread_photos 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Add the foreign key constraint for bread_photos
ALTER TABLE bread_photos 
ADD CONSTRAINT bread_photos_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix the same issue for other tables that might have similar problems
-- This ensures consistency across all user-related tables

-- Fix user_baking_history
DELETE FROM user_baking_history 
WHERE user_id NOT IN (SELECT id FROM profiles);

ALTER TABLE user_baking_history 
ADD CONSTRAINT user_baking_history_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix bread_progress
DELETE FROM bread_progress 
WHERE user_id NOT IN (SELECT id FROM profiles);

ALTER TABLE bread_progress 
ADD CONSTRAINT bread_progress_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix photo_likes
DELETE FROM photo_likes 
WHERE user_id NOT IN (SELECT id FROM profiles);

ALTER TABLE photo_likes 
ADD CONSTRAINT photo_likes_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix user_recipes (if it doesn't already have the constraint)
DELETE FROM user_recipes 
WHERE user_id NOT IN (SELECT id FROM profiles);

ALTER TABLE user_recipes 
ADD CONSTRAINT user_recipes_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

COMMIT;

-- Verification queries to test the relationships
-- These should now work without errors:

-- Test the original failing query
-- SELECT bp.*, p.username, p.avatar_url 
-- FROM bread_photos bp 
-- LEFT JOIN profiles p ON bp.user_id = p.id 
-- LIMIT 5;

-- Verify all foreign key constraints are in place
-- SELECT con.conname, rel.relname 
-- FROM pg_constraint con 
-- JOIN pg_class rel ON rel.oid = con.conrelid 
-- JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace 
-- WHERE nsp.nspname = 'public' 
-- AND rel.relname IN ('bread_photos', 'bread_progress', 'user_baking_history', 'photo_likes', 'user_recipes')
-- AND con.contype = 'f'  -- Foreign key constraints
-- AND con.conname LIKE '%profiles_fkey';

-- Add helpful comments
COMMENT ON CONSTRAINT bread_photos_user_id_profiles_fkey ON bread_photos 
IS 'Direct foreign key to profiles table to enable PostgREST joins';

COMMENT ON CONSTRAINT bread_progress_user_id_profiles_fkey ON bread_progress 
IS 'Direct foreign key to profiles table to enable PostgREST joins';

COMMENT ON CONSTRAINT user_baking_history_user_id_profiles_fkey ON user_baking_history 
IS 'Direct foreign key to profiles table to enable PostgREST joins';

COMMENT ON CONSTRAINT photo_likes_user_id_profiles_fkey ON photo_likes 
IS 'Direct foreign key to profiles table to enable PostgREST joins';

COMMENT ON CONSTRAINT user_recipes_user_id_profiles_fkey ON user_recipes 
IS 'Direct foreign key to profiles table to enable PostgREST joins';
