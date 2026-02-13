-- Migration: Internal Zoning and Moderation
-- Adding governance layers to the raw feed.

-- 1. Create Moderation Status Enum
CREATE TYPE moderation_status AS ENUM (
    'active',       -- Standard visibility
    'under_review', -- Reduced visibility (blurred/warning), waiting for mod action
    'flagged',      -- Visible but marked with a warning badge
    'quarantined'   -- Hidden from public feed, visible only to author and mods
);

-- 2. Alter Posts Table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS dominion_id UUID REFERENCES dominions(id),
ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES territories(id),
ADD COLUMN IF NOT EXISTS moderation_status moderation_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS moderation_score INT DEFAULT 0, -- Internal "temperature" of the post
ADD COLUMN IF NOT EXISTS is_auto_zoned BOOLEAN DEFAULT true; -- True if system-assigned, False if user explicitly chose

-- 3. Set Default Dominion (NCR) for existing posts
-- NCR Dominion ID from 002_seed_ncr.sql: 660e8400-e29b-41d4-a716-446655440000
UPDATE posts 
SET dominion_id = '660e8400-e29b-41d4-a716-446655440000' 
WHERE dominion_id IS NULL;

-- 4. Create Index for Feed Performance & Governance
-- We will filter feed by dominion AND moderation status often.
CREATE INDEX IF NOT EXISTS idx_posts_dominion_moderation 
ON posts(dominion_id, moderation_status);

-- 5. Create Index for Territory filtering
CREATE INDEX IF NOT EXISTS idx_posts_territory_moderation 
ON posts(territory_id, moderation_status);

-- 6. Add comment for documentation
COMMENT ON COLUMN posts.moderation_score IS 'Internal system score for automated moderation triggers. DO NOT EXPOSE TO UI.';
COMMENT ON COLUMN posts.is_auto_zoned IS 'True if the location/dominion was assigned by the system (e.g. default or geo-IP), False if manually selected by user.';
