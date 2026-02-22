-- =============================================
-- Advanced Messaging (Attachments, Replies, Read Receipts)
-- =============================================

-- COPY AND PASTE THIS ENTIRE BLOB INTO THE SUPABASE SQL EDITOR AND CLICK RUN

-- 1. Upgrades to Direct Messaging (`chat_messages` table)
ALTER TABLE chat_messages
    -- Reply Tracking
    ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    -- Read Receipts (Timestamps)
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
    -- Attachments
    ADD COLUMN IF NOT EXISTS attachment_url TEXT,
    ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'document', 'audio', 'location', 'poll')),
    ADD COLUMN IF NOT EXISTS attachment_metadata JSONB;

-- 2. Upgrades to The Void Room (`dying_room_messages` table)
ALTER TABLE dying_room_messages
    -- Reply Tracking
    ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES dying_room_messages(id) ON DELETE SET NULL,
    -- Attachments (NO read receipts in Void Room)
    ADD COLUMN IF NOT EXISTS attachment_url TEXT,
    ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'document', 'audio', 'location', 'poll')),
    ADD COLUMN IF NOT EXISTS attachment_metadata JSONB;

-- 3. Storage Buckets for Media Sharing
-- We need a bucket named 'chat_attachments'. 
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to chat attachments
CREATE POLICY "Public Read Access to Chat Attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat_attachments');

-- Allow authenticated users to upload attachments
CREATE POLICY "Auth Users Upload Attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'chat_attachments' 
        AND auth.role() = 'authenticated'
    );

-- Allow users to delete their own uploaded attachments
CREATE POLICY "Users Delete Own Attachments"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'chat_attachments'
        AND auth.uid() = owner
    );
