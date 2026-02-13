// Punishment ladder implementation
// "Most users leave at step 1. Idiots don't know they're punished. That's the beauty."

import {
    PunishmentLevel,
    PUNISHMENT_LADDER,
    UserPunishment,
    ScopeType
} from '@/types';

/**
 * Check if a user is currently punished
 */
export function isUserPunished(
    punishments: UserPunishment[],
    userHash: string,
    territoryId?: string,
    dominionId?: string
): UserPunishment | null {
    const now = new Date();

    // Get active punishments for this user
    const activePunishments = punishments.filter(p => {
        if (p.user_hash !== userHash) return false;
        if (p.expires_at && new Date(p.expires_at) < now) return false;
        return true;
    });

    if (activePunishments.length === 0) return null;

    // Return the highest level punishment that applies
    const applicable = activePunishments.filter(p => {
        if (p.scope_type === 'global') return true;
        if (p.scope_type === 'dominion' && p.scope_id === dominionId) return true;
        if (p.scope_type === 'territory' && p.scope_id === territoryId) return true;
        return false;
    });

    if (applicable.length === 0) return null;

    // Return highest level (highest number = most severe)
    return applicable.reduce((max, p) =>
        p.punishment_level > max.punishment_level ? p : max
    );
}

/**
 * Check if user can perform an action based on their punishment
 */
export function canUserAct(
    punishment: UserPunishment | null,
    action: 'post' | 'comment' | 'chat' | 'like'
): { allowed: boolean; reason?: string } {
    if (!punishment) {
        return { allowed: true };
    }

    const level = punishment.punishment_level;
    const info = PUNISHMENT_LADDER[level];

    switch (level) {
        case 1: // Shadow-ban - allow ALL actions, but they're invisible
            return { allowed: true };

        case 2: // Cooldown - allow with delay
            return {
                allowed: action !== 'post',
                reason: action === 'post' ? 'Posting cooldown active' : undefined
            };

        case 3: // Content lock - no new posts
            return {
                allowed: action !== 'post' && action !== 'comment',
                reason: 'Content creation locked'
            };

        case 4: // Territory mute
        case 5: // Regional mute
            return {
                allowed: action === 'like', // Can only like
                reason: `${info.name} active`
            };

        case 6: // Permanent ban
            return {
                allowed: false,
                reason: 'Account banned'
            };

        default:
            return { allowed: true };
    }
}

/**
 * Check if content should be visible (shadow-ban check)
 */
export function isContentVisible(
    viewerHash: string,
    authorHash: string,
    authorPunishment: UserPunishment | null
): boolean {
    // Own content is always visible to self
    if (viewerHash === authorHash) return true;

    // If author is shadow-banned, hide from others
    if (authorPunishment?.punishment_level === 1) {
        return false;
    }

    return true;
}

/**
 * Calculate next punishment level for a user
 */
export function getNextPunishmentLevel(
    currentPunishments: UserPunishment[],
    userHash: string
): PunishmentLevel {
    const userPunishments = currentPunishments
        .filter(p => p.user_hash === userHash)
        .sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

    if (userPunishments.length === 0) return 1;

    const lastLevel = userPunishments[0].punishment_level;
    return Math.min(lastLevel + 1, 6) as PunishmentLevel;
}

/**
 * Create a punishment record
 */
export function createPunishment(
    userHash: string,
    level: PunishmentLevel,
    scopeType: ScopeType,
    scopeId: string | null,
    moderatorId: string,
    reason: string
): Omit<UserPunishment, 'id' | 'created_at'> {
    const config = PUNISHMENT_LADDER[level];
    const expiresAt = config.duration_hours
        ? new Date(Date.now() + config.duration_hours * 60 * 60 * 1000).toISOString()
        : null;

    return {
        user_hash: userHash,
        punishment_level: level,
        scope_type: scopeType,
        scope_id: scopeId,
        expires_at: expiresAt,
        applied_by: moderatorId,
        reason,
    };
}

/**
 * Get punishment info for display (to mods only)
 */
export function getPunishmentDisplay(level: PunishmentLevel): {
    name: string;
    description: string;
    icon: string;
    color: string;
} {
    const info = PUNISHMENT_LADDER[level];
    const icons = ['👻', '⏳', '🔒', '🔇', '🌐', '💀'];
    const colors = ['#6b7280', '#eab308', '#f97316', '#ef4444', '#dc2626', '#7f1d1d'];

    return {
        name: info.name,
        description: info.description,
        icon: icons[level - 1],
        color: colors[level - 1],
    };
}
