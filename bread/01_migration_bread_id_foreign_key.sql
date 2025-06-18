-- Migration: Convert bread_id to foreign key referencing user_recipes.id
-- This migration removes all built-in recipe references and makes bread_progress 
-- only work with user-created recipes stored in user_recipes table

-- WARNING: This migration will delete all existing bread_progress records 
-- that reference built-in recipes (non-UUID bread_ids)

BEGIN;

-- Step 1: Backup existing data (optional, for safety)
-- CREATE TABLE bread_progress_backup AS SELECT * FROM bread_progress;

-- Step 2: Delete any bread_progress records that don't reference valid user_recipes
-- This removes progress for built-in recipes that are being removed
DELETE FROM bread_progress 
WHERE bread_id NOT IN (
    SELECT id::text FROM user_recipes
);

-- Step 3: Drop existing foreign key constraints if any exist
-- (there shouldn't be any based on current schema, but this is safe)
ALTER TABLE bread_progress DROP CONSTRAINT IF EXISTS bread_progress_bread_id_fkey;

-- Step 4: Change bread_id column type from text to uuid
-- First, convert any remaining valid text UUIDs to proper UUID type
ALTER TABLE bread_progress 
ALTER COLUMN bread_id TYPE uuid USING bread_id::uuid;

-- Step 5: Add foreign key constraint
ALTER TABLE bread_progress 
ADD CONSTRAINT bread_progress_bread_id_fkey 
FOREIGN KEY (bread_id) REFERENCES user_recipes(id) ON DELETE CASCADE;

-- Step 6: Update the bread_photos table to also use foreign key (if needed)
-- First backup and clean invalid references
DELETE FROM bread_photos 
WHERE bread_id NOT IN (
    SELECT id::text FROM user_recipes
);

-- Convert bread_photos.bread_id to uuid and add foreign key
ALTER TABLE bread_photos 
ALTER COLUMN bread_id TYPE uuid USING bread_id::uuid;

ALTER TABLE bread_photos 
ADD CONSTRAINT bread_photos_bread_id_fkey 
FOREIGN KEY (bread_id) REFERENCES user_recipes(id) ON DELETE CASCADE;

-- Step 7: Update user_baking_history table 
-- Clean invalid references
DELETE FROM user_baking_history 
WHERE bread_id NOT IN (
    SELECT id::text FROM user_recipes
);

-- Convert user_baking_history.bread_id to uuid and add foreign key
ALTER TABLE user_baking_history 
ALTER COLUMN bread_id TYPE uuid USING bread_id::uuid;

ALTER TABLE user_baking_history 
ADD CONSTRAINT user_baking_history_bread_id_fkey 
FOREIGN KEY (bread_id) REFERENCES user_recipes(id) ON DELETE CASCADE;

-- Step 8: Update any views that might reference the old schema
-- Recreate the community_bread_progress view
DROP VIEW IF EXISTS community_bread_progress;
CREATE OR REPLACE VIEW community_bread_progress AS
SELECT 
    bp.id,
    bp.user_id,
    bp.bread_id,
    bp.bread_name,
    bp.current_step,
    bp.completed_steps,
    bp.start_time,
    bp.expected_finish_time,
    bp.last_updated,
    p.username,
    p.avatar_url,
    p.location,
    ur.name as recipe_name,
    ur.difficulty as recipe_difficulty
FROM bread_progress bp
LEFT JOIN profiles p ON bp.user_id = p.id
LEFT JOIN user_recipes ur ON bp.bread_id = ur.id
WHERE bp.is_completed = false
ORDER BY bp.last_updated DESC;

-- Step 9: Update the user_complete_history view
DROP VIEW IF EXISTS user_complete_history;
CREATE OR REPLACE VIEW user_complete_history AS
SELECT 
    id,
    user_id,
    bread_id,
    bread_name,
    start_time,
    expected_finish_time as finish_time,
    CASE 
        WHEN is_completed THEN array_length(completed_steps, 1)
        ELSE current_step
    END as current_step,
    completed_steps,
    last_updated,
    is_completed,
    'progress' as source_table
FROM bread_progress
UNION ALL
SELECT 
    id,
    user_id,
    bread_id,
    bread_name,
    start_time,
    finish_time,
    total_steps as current_step,
    completed_steps,
    created_at as last_updated,
    true as is_completed,
    'history' as source_table
FROM user_baking_history
ORDER BY last_updated DESC;

-- Step 10: Add indexes for better performance with foreign keys
CREATE INDEX IF NOT EXISTS idx_bread_progress_bread_id ON bread_progress(bread_id);
CREATE INDEX IF NOT EXISTS idx_bread_photos_bread_id ON bread_photos(bread_id);
CREATE INDEX IF NOT EXISTS idx_user_baking_history_bread_id ON user_baking_history(bread_id);

-- Step 11: Update RLS policies to work with the new foreign key relationships
-- The existing RLS policies should continue to work, but we can add more specific ones

-- Policy to ensure users can only create progress for their own recipes
DROP POLICY IF EXISTS "Users can create progress for own recipes" ON bread_progress;
CREATE POLICY "Users can create progress for own recipes"
    ON bread_progress FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND 
        bread_id IN (SELECT id FROM user_recipes WHERE user_id = auth.uid())
    );

-- Policy to ensure users can only upload photos for their own recipes
DROP POLICY IF EXISTS "Users can upload photos for own recipes" ON bread_photos;
CREATE POLICY "Users can upload photos for own recipes"
    ON bread_photos FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND 
        bread_id IN (SELECT id FROM user_recipes WHERE user_id = auth.uid())
    );

COMMIT;

-- Verification queries (run these after migration to verify success):
-- 1. Check that all bread_progress records now reference valid user_recipes
-- SELECT bp.bread_id, ur.name FROM bread_progress bp 
-- LEFT JOIN user_recipes ur ON bp.bread_id = ur.id 
-- WHERE ur.id IS NULL;  -- Should return 0 rows

-- 2. Check foreign key constraints are in place
-- SELECT con.conname, con.contype 
-- FROM pg_constraint con 
-- JOIN pg_class rel ON rel.oid = con.conrelid 
-- JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace 
-- WHERE nsp.nspname = 'public' 
-- AND rel.relname IN ('bread_progress', 'bread_photos', 'user_baking_history')
-- AND con.contype = 'f';  -- Should show foreign key constraints

-- 3. Verify data types
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('bread_progress', 'bread_photos', 'user_baking_history') 
-- AND column_name = 'bread_id';  -- Should show 'uuid' type