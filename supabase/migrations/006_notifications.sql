-- Notifications System
-- "The void whispers back."

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('like', 'comment', 'system', 'mention')),
    reference_id UUID, -- ID of the post, comment, or other entity
    content TEXT NOT NULL, -- Short summary text
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- System (or triggers) can insert notifications. 
-- For MVP, we might allow authenticated users to insert notifications for others (e.g. when liking)
-- ideally this is done via Database Triggers to be secure.
-- But to keep it simple for now, we will allow insert if the user is authenticated, 
-- relying on the service layer to validate. 
-- A better approach for the future: `security definer` functions.

-- Allow inserts for now (simplified for MVP speed)
CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);
