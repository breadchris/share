-- Supabase Schema for Shakespearean Bread Baking Application
-- This schema is designed to support the actual operations performed by supabase.ts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
-- Supports getUserProfile() and updateUserProfile() functions
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    location text,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- User recipes table (supports recipe creation functionality)
CREATE TABLE public.user_recipes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    difficulty text DEFAULT 'Intermediate',
    prep_time integer DEFAULT 60, -- minutes
    total_time integer DEFAULT 240, -- minutes
    image_url text,
    tags text[],
    ingredients jsonb DEFAULT '[]'::jsonb, -- Array of ingredient objects
    steps jsonb DEFAULT '[]'::jsonb, -- Array of step objects
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security for user_recipes
ALTER TABLE public.user_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_recipes table
CREATE POLICY "Users can view public recipes and their own recipes"
    ON public.user_recipes FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own recipes"
    ON public.user_recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
    ON public.user_recipes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
    ON public.user_recipes FOR DELETE
    USING (auth.uid() = user_id);

-- Bread progress table (supports active baking sessions)
-- Used by saveProgress(), getBreadProgress(), getAllUserProgress(), markBreadCompleted()
  CREATE TABLE public.bread_progress (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
      bread_id text NOT NULL, -- Can reference built-in recipes or user recipes
      bread_name text NOT NULL,
      current_step integer DEFAULT 0,
      completed_steps text[] DEFAULT '{}', -- Array of completed step IDs
      start_time timestamp with time zone NOT NULL,
      expected_finish_time timestamp with time zone NOT NULL,
      last_updated timestamp with time zone DEFAULT now() NOT NULL,
      is_completed boolean DEFAULT false,
      ingredient_notes text,
      step_start_times jsonb DEFAULT '{}'::jsonb, -- Map of step_id -> start_time
      created_at timestamp with time zone DEFAULT now() NOT NULL
  );

-- Enable Row Level Security for bread_progress
ALTER TABLE public.bread_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bread_progress table
CREATE POLICY "Users can view their own bread progress"
    ON public.bread_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bread progress"
    ON public.bread_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bread progress"
    ON public.bread_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bread progress"
    ON public.bread_progress FOR DELETE
    USING (auth.uid() = user_id);

-- Community can view active progress for community features
CREATE POLICY "Community can view active bread progress"
    ON public.bread_progress FOR SELECT
    USING (is_completed = false);

-- Bread photos table (supports community photo sharing)
-- Used by getCommunityBreadPhotos(), uploadBreadPhoto(), saveBreadResult()
CREATE TABLE public.bread_photos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    bread_id text NOT NULL,
    bread_name text NOT NULL,
    photo_url text NOT NULL,
    comment text,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    likes_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security for bread_photos
ALTER TABLE public.bread_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bread_photos table
CREATE POLICY "Bread photos are viewable by everyone"
    ON public.bread_photos FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own bread photos"
    ON public.bread_photos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bread photos"
    ON public.bread_photos FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bread photos"
    ON public.bread_photos FOR DELETE
    USING (auth.uid() = user_id);

-- Simplified baking history table (for completed bread archives)
-- Used by getAllUserProgress() when converting history to progress format
CREATE TABLE public.user_baking_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    bread_id text NOT NULL,
    bread_name text NOT NULL,
    start_time timestamp with time zone NOT NULL,
    finish_time timestamp with time zone NOT NULL,
    total_steps integer NOT NULL DEFAULT 0,
    completed_steps text[] DEFAULT '{}',
    duration_minutes integer,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    notes text,
    photo_ids uuid[] DEFAULT '{}', -- References to bread_photos.id
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security for user_baking_history
ALTER TABLE public.user_baking_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_baking_history table
CREATE POLICY "Users can view their own baking history"
    ON public.user_baking_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own baking history"
    ON public.user_baking_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baking history"
    ON public.user_baking_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own baking history"
    ON public.user_baking_history FOR DELETE
    USING (auth.uid() = user_id);

-- Photo likes table (for community engagement)
CREATE TABLE public.photo_likes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    photo_id uuid REFERENCES public.bread_photos ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, photo_id)
);

-- Enable Row Level Security for photo_likes
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_likes table
CREATE POLICY "Users can view all photo likes"
    ON public.photo_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like photos"
    ON public.photo_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
    ON public.photo_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'preferred_username', 'baker_' || substring(new.id::text, 1, 8)),
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update photo likes count
CREATE OR REPLACE FUNCTION public.update_photo_likes_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.bread_photos 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.photo_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.bread_photos 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.photo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update likes count
CREATE TRIGGER update_photo_likes_count_trigger
    AFTER INSERT OR DELETE ON public.photo_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_photo_likes_count();

-- Function to archive completed bread progress
CREATE OR REPLACE FUNCTION public.archive_completed_bread()
RETURNS trigger AS $$
BEGIN
    -- Only proceed if the bread was just marked as completed
    IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
        -- Insert into baking history
        INSERT INTO public.user_baking_history (
            user_id,
            bread_id,
            bread_name,
            start_time,
            finish_time,
            total_steps,
            completed_steps,
            duration_minutes,
            created_at
        ) VALUES (
            NEW.user_id,
            NEW.bread_id,
            NEW.bread_name,
            NEW.start_time,
            NEW.last_updated,
            0,
            NEW.completed_steps,
            EXTRACT(EPOCH FROM (NEW.last_updated - NEW.start_time)) / 60,
            NEW.last_updated
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically archive completed bread
CREATE TRIGGER archive_completed_bread_trigger
    AFTER UPDATE ON public.bread_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.archive_completed_bread();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_recipes_updated_at
    BEFORE UPDATE ON public.user_recipes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bread_progress_user_active ON public.bread_progress(user_id) WHERE is_completed = false;
CREATE INDEX idx_bread_progress_user_completed ON public.bread_progress(user_id) WHERE is_completed = true;
CREATE INDEX idx_bread_progress_community ON public.bread_progress(last_updated DESC) WHERE is_completed = false;
CREATE INDEX idx_user_baking_history_user_date ON public.user_baking_history(user_id, created_at DESC);
CREATE INDEX idx_bread_photos_recent ON public.bread_photos(created_at DESC);
CREATE INDEX idx_bread_photos_user ON public.bread_photos(user_id, created_at DESC);
CREATE INDEX idx_user_recipes_public ON public.user_recipes(created_at DESC) WHERE is_public = true;
CREATE INDEX idx_user_recipes_user ON public.user_recipes(user_id, created_at DESC);

-- Create storage bucket policies (these would be set up in the Supabase dashboard)
-- Storage bucket: bread_photos
-- Policies:
-- 1. "Users can upload their own photos" - INSERT for authenticated users
-- 2. "Photos are publicly viewable" - SELECT for everyone
-- 3. "Users can delete their own photos" - DELETE for auth.uid() = (storage.foldername(name))[1]::uuid

-- Sample data views for development (optional)
CREATE OR REPLACE VIEW public.community_bread_progress AS
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
    p.location
FROM public.bread_progress bp
LEFT JOIN public.profiles p ON bp.user_id = p.id
WHERE bp.is_completed = false
ORDER BY bp.last_updated DESC;

-- View for user's complete baking history (combines progress and history)
-- Fixed to use correct column names that actually exist in the tables
CREATE OR REPLACE VIEW public.user_complete_history AS
SELECT 
    id,
    user_id,
    bread_id,
    bread_name,
    start_time,
    expected_finish_time as finish_time, -- Use expected_finish_time from bread_progress
    CASE 
        WHEN is_completed THEN array_length(completed_steps, 1)
        ELSE current_step
    END as current_step,
    completed_steps,
    last_updated,
    is_completed,
    'progress' as source_table
FROM public.bread_progress
UNION ALL
SELECT 
    id,
    user_id,
    bread_id,
    bread_name,
    start_time,
    finish_time, -- This column exists in user_baking_history
    total_steps as current_step,
    completed_steps,
    created_at as last_updated,
    true as is_completed,
    'history' as source_table
FROM public.user_baking_history
ORDER BY last_updated DESC;