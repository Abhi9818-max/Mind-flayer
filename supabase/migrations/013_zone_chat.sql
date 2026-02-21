-- Migration: Zone Chat ("The Void")
-- Ephemeral public chat for map zones

-- 1. Create table
CREATE TABLE IF NOT EXISTS zone_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id TEXT NOT NULL CHECK (zone_id IN ('north', 'south', 'off')),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE zone_messages ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Anyone can view messages (public void)
CREATE POLICY "Public view zone messages"
ON zone_messages FOR SELECT
USING (true);

-- Authenticated users can post
CREATE POLICY "Authenticated insert zone messages"
ON zone_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users delete own messages"
ON zone_messages FOR DELETE
USING (auth.uid() = user_id);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE zone_messages;

-- 5. Auto-cleanup (Ephemeral nature)
-- Simple trigger to clean old messages on insert
CREATE OR REPLACE FUNCTION clean_old_zone_messages()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM zone_messages WHERE created_at < NOW() - INTERVAL '24 hours';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clean_void
AFTER INSERT ON zone_messages
FOR EACH STATEMENT
EXECUTE FUNCTION clean_old_zone_messages();
