-- Migration: Add AI Recipe Generation Tracking Table
-- This table tracks all context around AI recipe creation (inputs and outputs)

CREATE TABLE IF NOT EXISTS ai_recipe_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User and Request Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Input Data
  recipe_name TEXT,
  additional_notes TEXT,
  difficulty TEXT,
  image_count INTEGER DEFAULT 0,
  image_urls TEXT[], -- Array of uploaded image URLs
  has_images BOOLEAN DEFAULT FALSE,
  has_text_details BOOLEAN DEFAULT FALSE,
  
  -- AI Service Details
  ai_model TEXT DEFAULT 'gpt-4o',
  api_request_id TEXT, -- OpenAI request ID if available
  
  -- Generation Results
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  generated_recipe_id TEXT, -- The ID of the generated recipe
  generated_recipe_name TEXT,
  generated_recipe JSONB, -- Full recipe JSON
  
  -- Performance Metrics
  processing_time_ms INTEGER,
  api_response_time_ms INTEGER,
  images_processed INTEGER DEFAULT 0,
  total_images_submitted INTEGER DEFAULT 0,
  
  -- Metadata
  generation_type TEXT CHECK (generation_type IN ('images', 'text', 'images-and-text', 'text-fallback')),
  fallback_reason TEXT, -- If fallback was used
  user_agent TEXT,
  
  -- Timestamps
  request_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  api_called_at TIMESTAMP WITH TIME ZONE,
  api_completed_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_recipe_generations_user_id ON ai_recipe_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recipe_generations_created_at ON ai_recipe_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_recipe_generations_success ON ai_recipe_generations(success);
CREATE INDEX IF NOT EXISTS idx_ai_recipe_generations_generation_type ON ai_recipe_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_recipe_generations_ai_model ON ai_recipe_generations(ai_model);

-- RLS Policies
ALTER TABLE ai_recipe_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI generation history
CREATE POLICY "Users can view own AI generations" ON ai_recipe_generations
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role can insert and update (for server operations)
CREATE POLICY "Service role can manage AI generations" ON ai_recipe_generations
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Anonymous users can view generations from their session
CREATE POLICY "Anonymous users can view own session generations" ON ai_recipe_generations
  FOR SELECT 
  USING (user_id IS NULL AND session_id IS NOT NULL);

-- Add helpful comments
COMMENT ON TABLE ai_recipe_generations IS 'Tracks all AI recipe generation requests, inputs, outputs, and performance metrics';
COMMENT ON COLUMN ai_recipe_generations.generation_type IS 'Type of generation: images, text, images-and-text, or text-fallback';
COMMENT ON COLUMN ai_recipe_generations.generated_recipe IS 'Full JSON of the generated recipe for analysis and debugging';
COMMENT ON COLUMN ai_recipe_generations.fallback_reason IS 'Reason for fallback (e.g., AI refused images, upload failed)';
COMMENT ON COLUMN ai_recipe_generations.processing_time_ms IS 'Total time from request start to completion';
COMMENT ON COLUMN ai_recipe_generations.api_response_time_ms IS 'Time spent waiting for OpenAI API response';

-- Create a view for analytics
CREATE OR REPLACE VIEW ai_recipe_generation_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE success = true) as successful_generations,
  COUNT(*) FILTER (WHERE success = false) as failed_generations,
  AVG(processing_time_ms) FILTER (WHERE success = true) as avg_processing_time_ms,
  AVG(api_response_time_ms) FILTER (WHERE success = true) as avg_api_time_ms,
  COUNT(DISTINCT user_id) as unique_users,
  ai_model,
  generation_type,
  SUM(images_processed) as total_images_processed
FROM ai_recipe_generations 
GROUP BY DATE_TRUNC('day', created_at), ai_model, generation_type
ORDER BY date DESC;

COMMENT ON VIEW ai_recipe_generation_analytics IS 'Daily analytics for AI recipe generation performance and usage';