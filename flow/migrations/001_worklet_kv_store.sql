-- Migration: Create worklet_kv_store table for prototype data persistence
-- This table provides a key-value store for worklet prototypes with proper
-- namespacing and collision prevention

-- Create worklet_kv_store table
CREATE TABLE IF NOT EXISTS worklet_kv_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worklet_id UUID NOT NULL,
    namespace TEXT NOT NULL DEFAULT 'default',
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique keys within worklet and namespace scope
    CONSTRAINT unique_worklet_namespace_key UNIQUE (worklet_id, namespace, key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worklet_kv_store_worklet_id ON worklet_kv_store(worklet_id);
CREATE INDEX IF NOT EXISTS idx_worklet_kv_store_namespace ON worklet_kv_store(worklet_id, namespace);
CREATE INDEX IF NOT EXISTS idx_worklet_kv_store_key ON worklet_kv_store(worklet_id, namespace, key);
CREATE INDEX IF NOT EXISTS idx_worklet_kv_store_created_at ON worklet_kv_store(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_worklet_kv_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_worklet_kv_store_updated_at
    BEFORE UPDATE ON worklet_kv_store
    FOR EACH ROW
    EXECUTE FUNCTION update_worklet_kv_store_updated_at();

-- Enable Row Level Security
ALTER TABLE worklet_kv_store ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for data isolation
-- Users can only access data for worklets they own
-- This requires a worklets table with user_id column
CREATE POLICY "Users can access their own worklet data"
    ON worklet_kv_store
    USING (
        worklet_id IN (
            SELECT id FROM worklets 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for inserting data
CREATE POLICY "Users can insert data for their worklets"
    ON worklet_kv_store
    FOR INSERT
    WITH CHECK (
        worklet_id IN (
            SELECT id FROM worklets 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for updating data
CREATE POLICY "Users can update their own worklet data"
    ON worklet_kv_store
    FOR UPDATE
    USING (
        worklet_id IN (
            SELECT id FROM worklets 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for deleting data
CREATE POLICY "Users can delete their own worklet data"
    ON worklet_kv_store
    FOR DELETE
    USING (
        worklet_id IN (
            SELECT id FROM worklets 
            WHERE user_id = auth.uid()
        )
    );

-- Create function for efficient bulk operations
CREATE OR REPLACE FUNCTION bulk_upsert_kv_data(
    p_worklet_id UUID,
    p_namespace TEXT,
    p_data JSONB
)
RETURNS INTEGER AS $$
DECLARE
    key_text TEXT;
    value_data JSONB;
    affected_rows INTEGER := 0;
BEGIN
    -- Iterate through the JSON object
    FOR key_text, value_data IN SELECT * FROM jsonb_each(p_data)
    LOOP
        INSERT INTO worklet_kv_store (worklet_id, namespace, key, value)
        VALUES (p_worklet_id, p_namespace, key_text, value_data)
        ON CONFLICT (worklet_id, namespace, key)
        DO UPDATE SET 
            value = EXCLUDED.value,
            updated_at = NOW();
        
        affected_rows := affected_rows + 1;
    END LOOP;
    
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for namespace cleanup
CREATE OR REPLACE FUNCTION cleanup_worklet_namespace(
    p_worklet_id UUID,
    p_namespace TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    IF p_namespace IS NULL THEN
        -- Delete all data for the worklet
        DELETE FROM worklet_kv_store WHERE worklet_id = p_worklet_id;
    ELSE
        -- Delete data for specific namespace
        DELETE FROM worklet_kv_store 
        WHERE worklet_id = p_worklet_id AND namespace = p_namespace;
    END IF;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE worklet_kv_store IS 'Key-value store for worklet prototype data persistence with namespacing support';
COMMENT ON COLUMN worklet_kv_store.worklet_id IS 'UUID of the worklet that owns this data';
COMMENT ON COLUMN worklet_kv_store.namespace IS 'Logical grouping for keys within a worklet (e.g., user_prefs, app_state)';
COMMENT ON COLUMN worklet_kv_store.key IS 'The key identifier within the namespace';
COMMENT ON COLUMN worklet_kv_store.value IS 'JSON value associated with the key';
COMMENT ON FUNCTION bulk_upsert_kv_data IS 'Efficiently insert or update multiple key-value pairs in a single transaction';
COMMENT ON FUNCTION cleanup_worklet_namespace IS 'Clean up all data for a worklet or specific namespace';