-- RLS Policies for Chats

-- Users can read chats they are a part of
CREATE POLICY "Users can read own chats" ON chats 
    FOR SELECT USING (
        auth.uid()::text = initiator_hash OR auth.uid()::text = responder_hash
    );

-- Users can start chats
CREATE POLICY "Users can create chats" ON chats 
    FOR INSERT WITH CHECK (
        auth.uid()::text = initiator_hash
    );

-- Users can update chats they are a part of
CREATE POLICY "Users can update own chats" ON chats 
    FOR UPDATE USING (
        auth.uid()::text = initiator_hash OR auth.uid()::text = responder_hash
    );

-- RLS Policies for Chat Messages

-- Users can read messages in their chats
CREATE POLICY "Users can read own chat messages" ON chat_messages 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = chat_messages.chat_id 
            AND (chats.initiator_hash = auth.uid()::text OR chats.responder_hash = auth.uid()::text)
        )
    );

-- Users can insert messages in their chats
CREATE POLICY "Users can insert own chat messages" ON chat_messages 
    FOR INSERT WITH CHECK (
        auth.uid()::text = sender_hash
        AND EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = chat_messages.chat_id 
            AND (chats.initiator_hash = auth.uid()::text OR chats.responder_hash = auth.uid()::text)
        )
    );
