-- Clean up old rejected feature
DROP TABLE IF EXISTS zone_messages;

-- Create Rooms Table
CREATE TABLE IF NOT EXISTS live_rooms (
    id TEXT PRIMARY KEY, -- Using TEXT to match frontend IDs "1", "2" etc. for simplicity with existing code
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Default Rooms (from frontend mock data)
INSERT INTO live_rooms (id, name, description, emoji, category) VALUES
('1', 'The Void', 'General anonymous chat', '🌀', 'General'),
('2', 'Study Hall', 'Focused study sessions', '📚', 'Study'),
('3', 'Confession Box', 'Share your secrets', '🤫', 'Confessions'),
('4', 'Meme Factory', 'Share and laugh', '😂', 'Memes'),
('5', 'Late Night Thoughts', '3 AM conversations', '🌙', 'General'),
('6', 'Dating Advice', 'Love and relationships', '💕', 'Advice')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    emoji = EXCLUDED.emoji,
    category = EXCLUDED.category;

-- Create Messages Table
CREATE TABLE IF NOT EXISTS live_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT REFERENCES live_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL CHECK (char_length(content) <= 1000),
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view rooms
DROP POLICY IF EXISTS "Public view rooms" ON live_rooms;
CREATE POLICY "Public view rooms" ON live_rooms FOR SELECT USING (true);

-- Everyone can view messages
DROP POLICY IF EXISTS "Public view messages" ON live_messages;
CREATE POLICY "Public view messages" ON live_messages FOR SELECT USING (true);

-- Authenticated users can insert messages
DROP POLICY IF EXISTS "Auth insert messages" ON live_messages;
CREATE POLICY "Auth insert messages" ON live_messages 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Realtime is already enabled for all tables in this project, so no need to add explicitly.
-- If it wasn't, we'd need to add it, but since it errors with 55000, we know it's on.
-- ALTER PUBLICATION supabase_realtime ADD TABLE live_messages;
