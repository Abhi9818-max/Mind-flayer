-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    initiator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'active', 'rejected', 'expired')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Chat Policies
CREATE POLICY "Users can view their own chats"
    ON chats FOR SELECT
    USING (auth.uid() = initiator_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create chats"
    ON chats FOR INSERT
    WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update their own chats"
    ON chats FOR UPDATE
    USING (auth.uid() = initiator_id OR auth.uid() = recipient_id);

-- Message Policies
CREATE POLICY "Users can view messages in their chats"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND (chats.initiator_id = auth.uid() OR chats.recipient_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages to their chats"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = chat_id
            AND (chats.initiator_id = auth.uid() OR chats.recipient_id = auth.uid())
        )
    );

-- Realtime
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table chats;
