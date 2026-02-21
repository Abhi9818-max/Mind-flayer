-- =============================================
-- 1. CREATE TABLES (IF THEY DON'T EXIST)
-- =============================================

-- Ensure chats table exists
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_hash TEXT NOT NULL,
    responder_hash TEXT NOT NULL,
    post_id UUID REFERENCES posts(id),
    is_revealed BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure chat_messages table exists
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_hash TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id);

-- =============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. APPLY RLS POLICIES FOR CHATS
-- =============================================

-- Safely drop existing policies if any to prevent errors when re-running
DROP POLICY IF EXISTS "Users can read own chats" ON chats;
DROP POLICY IF EXISTS "Users can create chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;

CREATE POLICY "Users can read own chats" ON chats 
    FOR SELECT USING (
        auth.uid()::text = initiator_hash OR auth.uid()::text = responder_hash
    );

CREATE POLICY "Users can create chats" ON chats 
    FOR INSERT WITH CHECK (
        auth.uid()::text = initiator_hash
    );

CREATE POLICY "Users can update own chats" ON chats 
    FOR UPDATE USING (
        auth.uid()::text = initiator_hash OR auth.uid()::text = responder_hash
    );

-- =============================================
-- 4. APPLY RLS POLICIES FOR CHAT MESSAGES
-- =============================================

-- Safely drop existing policies if any to prevent errors when re-running
DROP POLICY IF EXISTS "Users can read own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;

CREATE POLICY "Users can read own chat messages" ON chat_messages 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = chat_messages.chat_id 
            AND (chats.initiator_hash = auth.uid()::text OR chats.responder_hash = auth.uid()::text)
        )
    );

CREATE POLICY "Users can insert own chat messages" ON chat_messages 
    FOR INSERT WITH CHECK (
        auth.uid()::text = sender_hash
        AND EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = chat_messages.chat_id 
            AND (chats.initiator_hash = auth.uid()::text OR chats.responder_hash = auth.uid()::text)
        )
    );
