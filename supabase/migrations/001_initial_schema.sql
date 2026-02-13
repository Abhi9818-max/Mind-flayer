-- Mind-Flayer Database Schema
-- "When court comes, you export logs. No panic."

-- =============================================
-- CORE GEOGRAPHY TABLES
-- =============================================

-- Regions (country-level grouping)
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    state_province TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dominions (regional grouping of colleges)
CREATE TABLE dominions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Territories (individual colleges)
CREATE TABLE territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dominion_id UUID REFERENCES dominions(id) ON DELETE CASCADE,
    email_domain TEXT, -- e.g., 'du.ac.in'
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER TABLES
-- =============================================

-- Extended user profile (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    territory_id UUID REFERENCES territories(id),
    is_verified BOOLEAN DEFAULT false,
    is_anonymous_default BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VISIBILITY LAW - FINGERPRINTING
-- =============================================

-- User fingerprints for tracking
CREATE TABLE user_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_hash TEXT NOT NULL,
    device_hash TEXT NOT NULL,
    behavior_signature JSONB DEFAULT '{}',
    time_pattern JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fingerprints_user_hash ON user_fingerprints(user_hash);
CREATE INDEX idx_fingerprints_device_hash ON user_fingerprints(device_hash);

-- =============================================
-- CONTENT TABLES
-- =============================================

-- Posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_hash TEXT NOT NULL, -- For anonymous tracking
    territory_id UUID REFERENCES territories(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('confession', 'rumor', 'crush', 'rant', 'question')),
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT true,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_territory ON posts(territory_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_user_hash ON posts(user_hash);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- Content visibility state machine (Courts love this)
CREATE TABLE content_visibility (
    content_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    visibility_state TEXT CHECK (visibility_state IN (
        'public',
        'shadowed',
        'probation',
        'restricted',
        'removed'
    )) DEFAULT 'public',
    decided_by UUID,
    decided_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- Likes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_hash TEXT NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_hash, post_id)
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_hash TEXT NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);

-- =============================================
-- POWER PYRAMID - MODERATION
-- =============================================

-- Moderators table
CREATE TABLE moderators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN (
        'prime_sovereign',
        'the_hand',
        'crowned_king',
        'steward',
        'marshal',
        'sentinel',
        'veil_watcher'
    )),
    scope_type TEXT CHECK (scope_type IN ('global', 'dominion', 'territory')),
    scope_id UUID, -- NULL for global, dominion_id or territory_id otherwise
    appointed_by UUID REFERENCES moderators(id),
    appointed_at TIMESTAMPTZ DEFAULT NOW(),
    rotation_due_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role, scope_id)
);

CREATE INDEX idx_moderators_role ON moderators(role);
CREATE INDEX idx_moderators_scope ON moderators(scope_type, scope_id);

-- Moderation audit log (EVERYTHING IS LOGGED)
CREATE TABLE mod_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID REFERENCES moderators(id),
    action_type TEXT CHECK (action_type IN (
        'shadow_ban',
        'cooldown',
        'content_lock',
        'territory_mute',
        'regional_mute',
        'permanent_ban',
        'unban',
        'content_remove',
        'content_restore',
        'user_warn',
        'appoint_mod',
        'remove_mod'
    )),
    target_user_hash TEXT,
    target_content_id UUID REFERENCES posts(id),
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mod_actions_moderator ON mod_actions(moderator_id);
CREATE INDEX idx_mod_actions_target_user ON mod_actions(target_user_hash);
CREATE INDEX idx_mod_actions_created ON mod_actions(created_at DESC);

-- =============================================
-- PUNISHMENT LADDER
-- =============================================

CREATE TABLE user_punishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_hash TEXT NOT NULL,
    punishment_level INT CHECK (punishment_level BETWEEN 1 AND 6),
    scope_type TEXT CHECK (scope_type IN ('global', 'dominion', 'territory')),
    scope_id UUID,
    expires_at TIMESTAMPTZ, -- NULL for permanent
    applied_by UUID REFERENCES moderators(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_punishments_user ON user_punishments(user_hash);
CREATE INDEX idx_punishments_expires ON user_punishments(expires_at);

-- =============================================
-- ANONYMOUS CHAT
-- =============================================

CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_hash TEXT NOT NULL,
    responder_hash TEXT NOT NULL,
    post_id UUID REFERENCES posts(id), -- Chat originated from this post
    is_revealed BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL, -- Auto-expire
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_hash TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id);

-- =============================================
-- REPORTS
-- =============================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_hash TEXT NOT NULL,
    target_type TEXT CHECK (target_type IN ('post', 'comment', 'user', 'chat')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES moderators(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dominions ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_punishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Public read for geography
CREATE POLICY "Public read for regions" ON regions FOR SELECT USING (true);
CREATE POLICY "Public read for dominions" ON dominions FOR SELECT USING (true);
CREATE POLICY "Public read for territories" ON territories FOR SELECT USING (true);

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles 
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Posts visible to users in same territory (with shadow-ban check)
CREATE POLICY "Read posts in territory" ON posts 
    FOR SELECT USING (true); -- Simplified, real implementation checks territory

-- Users can create posts
CREATE POLICY "Users can create posts" ON posts 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fingerprints only visible to system (service role)
CREATE POLICY "No user access to fingerprints" ON user_fingerprints
    FOR ALL USING (false);
