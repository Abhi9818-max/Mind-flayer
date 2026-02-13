// Core type definitions for Mind-Flayer

// ==========================================
// POWER HIERARCHY TYPES
// ==========================================

export type ModeratorRole =
  | 'prime_sovereign'
  | 'the_hand'
  | 'crowned_king'
  | 'steward'
  | 'marshal'
  | 'sentinel'
  | 'veil_watcher';

export type ScopeType = 'global' | 'dominion' | 'territory';

export interface Moderator {
  id: string;
  user_id: string;
  role: ModeratorRole;
  scope_type: ScopeType;
  scope_id: string | null;
  appointed_by: string | null;
  appointed_at: string;
  rotation_due_at: string | null;
  is_active: boolean;
}

// Role hierarchy level (lower = more power)
export const ROLE_HIERARCHY: Record<ModeratorRole, number> = {
  prime_sovereign: 0,
  the_hand: 1,
  crowned_king: 2,
  steward: 3,
  marshal: 4,
  sentinel: 5,
  veil_watcher: 6,
};

// ==========================================
// VISIBILITY LAW TYPES
// ==========================================

export interface UserFingerprint {
  id: string;
  user_id: string;
  user_hash: string;
  device_hash: string;
  behavior_signature: BehaviorSignature;
  time_pattern: TimePattern;
  created_at: string;
}

export interface BehaviorSignature {
  avg_session_duration: number;
  preferred_post_types: string[];
  activity_hours: number[];
  interaction_patterns: string[];
}

export interface TimePattern {
  first_seen: string;
  last_active: string;
  typical_active_hours: number[];
  timezone_offset: number;
}

// ==========================================
// CONTENT TYPES
// ==========================================

export type PostType = 'confession' | 'rumor' | 'crush' | 'rant' | 'question' | 'voice';

export type ContentVisibilityState =
  | 'public'
  | 'shadowed'
  | 'probation'
  | 'restricted'
  | 'removed';

export type ModerationStatus = 'active' | 'under_review' | 'flagged' | 'quarantined';

export interface Post {
  id: string;
  user_id: string;
  user_hash: string;
  dominion_id: string; // New: Governance Zone
  territory_id?: string; // Optional: Specific College
  type: PostType;
  content: string;
  media_url?: string; // New: For Voice/Images
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  visibility_state: ContentVisibilityState;
  moderation_status: ModerationStatus; // New: Governance State
  moderation_score?: number; // Internal: Do not expose to UI logic if possible
  is_auto_zoned: boolean; // New: System vs User zone
  created_at: string;
  updated_at: string;
}

export interface ContentVisibility {
  content_id: string;
  visibility_state: ContentVisibilityState;
  decided_by: string | null;
  decided_at: string;
  reason: string | null;
}

// Post type configuration
export const POST_CONFIG: Record<PostType, {
  icon: string;
  label: string;
  reportWeight: 'low' | 'medium' | 'high';
  throttle: 'none' | 'light' | 'medium' | 'heavy';
  defaultAnonymous: boolean;
}> = {
  confession: {
    icon: '💝',
    label: 'Confession',
    reportWeight: 'medium',
    throttle: 'none',
    defaultAnonymous: true,
  },
  rumor: {
    icon: '🗣️',
    label: 'Rumor',
    reportWeight: 'high',
    throttle: 'heavy',
    defaultAnonymous: true,
  },
  crush: {
    icon: '😍',
    label: 'Crush',
    reportWeight: 'low',
    throttle: 'light',
    defaultAnonymous: true,
  },
  rant: {
    icon: '🔥',
    label: 'Rant',
    reportWeight: 'high',
    throttle: 'medium',
    defaultAnonymous: false,
  },
  question: {
    icon: '❓',
    label: 'Question',
    reportWeight: 'low',
    throttle: 'none',
    defaultAnonymous: false,
  },
  voice: {
    icon: '🎙️',
    label: 'Voice Note',
    reportWeight: 'medium',
    throttle: 'medium',
    defaultAnonymous: true,
  },
};

// ==========================================
// PUNISHMENT LADDER
// ==========================================

export type PunishmentLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const PUNISHMENT_LADDER: Record<PunishmentLevel, {
  name: string;
  description: string;
  duration_hours: number | null; // null = permanent
}> = {
  1: {
    name: 'Shadow-Ban',
    description: 'User screams into void. Posts visible only to them.',
    duration_hours: 24,
  },
  2: {
    name: 'Cooldown',
    description: 'Posting delay enforced.',
    duration_hours: 48,
  },
  3: {
    name: 'Content Lock',
    description: 'Cannot create new posts.',
    duration_hours: 72,
  },
  4: {
    name: 'Territory Mute',
    description: 'Silenced in their college.',
    duration_hours: 168, // 1 week
  },
  5: {
    name: 'Regional Mute',
    description: 'Silenced across the dominion.',
    duration_hours: 720, // 1 month
  },
  6: {
    name: 'Permanent Ban',
    description: 'Gone. Escalated decision.',
    duration_hours: null,
  },
};

export interface UserPunishment {
  id: string;
  user_hash: string;
  punishment_level: PunishmentLevel;
  scope_type: ScopeType;
  scope_id: string | null;
  expires_at: string | null;
  applied_by: string;
  reason: string;
  created_at: string;
}

// ==========================================
// GEOGRAPHY TYPES
// ==========================================

export interface Region {
  id: string;
  name: string;
  country: string;
  state_province: string;
}

export interface Dominion {
  id: string;
  name: string;
  region_id: string;
  is_active: boolean;
}

export interface Territory {
  id: string;
  name: string; // College name
  dominion_id: string;
  email_domain: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

// ==========================================
// USER TYPES
// ==========================================

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  territory_id: string;
  is_verified: boolean;
  is_anonymous_default: boolean;
  created_at: string;
  updated_at: string;
}

// ==========================================
// CHAT TYPES
// ==========================================

export interface AnonymousChat {
  id: string;
  initiator_hash: string;
  responder_hash: string;
  post_id: string | null; // Chat originated from this post
  is_revealed: boolean;
  expires_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_hash: string;
  content: string;
  created_at: string;
}

// ==========================================
// AUDIT TYPES
// ==========================================

export type ModActionType =
  | 'shadow_ban'
  | 'cooldown'
  | 'content_lock'
  | 'territory_mute'
  | 'regional_mute'
  | 'permanent_ban'
  | 'unban'
  | 'content_remove'
  | 'content_restore'
  | 'user_warn'
  | 'appoint_mod'
  | 'remove_mod';

export interface ModAction {
  id: string;
  moderator_id: string;
  action_type: ModActionType;
  target_user_hash: string | null;
  target_content_id: string | null;
  reason: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
