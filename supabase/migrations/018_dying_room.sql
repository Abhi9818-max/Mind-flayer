-- =============================================
-- 018: The Dying Room — Battery-Gated Chat
-- =============================================

CREATE TABLE IF NOT EXISTS dying_room_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL DEFAULT 'Unknown Entity',
    content TEXT NOT NULL,
    battery_level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_dying_room_created ON dying_room_messages(created_at);

-- Row Level Security
ALTER TABLE dying_room_messages ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read messages
CREATE POLICY "Authenticated users can read dying room"
    ON dying_room_messages FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Users can insert their own messages
CREATE POLICY "Users can post to dying room"
    ON dying_room_messages FOR INSERT
    WITH CHECK (auth.uid() = author_id);

-- Realtime is already enabled globally (FOR ALL TABLES)
