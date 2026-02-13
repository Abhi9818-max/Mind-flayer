// Role hierarchy utilities
// "The Prime does not moderate. The Prime decides who deserves power."

import { ModeratorRole, ROLE_HIERARCHY, Moderator, ScopeType } from '@/types';

/**
 * Check if a role can perform an action on a target role
 * Lower hierarchy number = more power
 */
export function canActOn(actorRole: ModeratorRole, targetRole: ModeratorRole): boolean {
    return ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY[targetRole];
}

/**
 * Check if a moderator can act within a scope
 */
export function canActInScope(
    moderator: Moderator,
    targetScopeType: ScopeType,
    targetScopeId: string | null
): boolean {
    // Global scope can act anywhere
    if (moderator.scope_type === 'global') return true;

    // Dominion can act in their dominion and its territories
    if (moderator.scope_type === 'dominion') {
        if (targetScopeType === 'global') return false;
        // Would need to check if territory belongs to dominion
        return true; // Simplified - implement with DB lookup
    }

    // Territory can only act in their territory
    if (moderator.scope_type === 'territory') {
        return targetScopeType === 'territory' &&
            targetScopeId === moderator.scope_id;
    }

    return false;
}

/**
 * Get the roles a moderator can appoint
 */
export function getAppointableRoles(role: ModeratorRole): ModeratorRole[] {
    const appointmentMap: Record<ModeratorRole, ModeratorRole[]> = {
        prime_sovereign: ['the_hand', 'crowned_king'],
        the_hand: [], // The Hand doesn't appoint, only resolves
        crowned_king: ['steward'],
        steward: ['marshal', 'sentinel'],
        marshal: ['veil_watcher'],
        sentinel: [],
        veil_watcher: [],
    };
    return appointmentMap[role];
}

/**
 * Get role display info
 */
export function getRoleDisplay(role: ModeratorRole): {
    title: string;
    icon: string;
    color: string;
    description: string;
} {
    const displayMap: Record<ModeratorRole, {
        title: string;
        icon: string;
        color: string;
        description: string;
    }> = {
        prime_sovereign: {
            title: 'Prime Sovereign',
            icon: '👑',
            color: '#ffd700',
            description: 'Absolute authority. Silent. Invisible.',
        },
        the_hand: {
            title: 'The Hand',
            icon: '☠️',
            color: '#8b0000',
            description: "Crisis resolver. The Hand doesn't rule. The Hand ends things.",
        },
        crowned_king: {
            title: 'Crowned King',
            icon: '🗺️',
            color: '#9333ea',
            description: 'Dominion authority. Judges and warlords.',
        },
        steward: {
            title: 'Steward',
            icon: '🩸',
            color: '#dc2626',
            description: 'Territory head. Authority through responsibility.',
        },
        marshal: {
            title: 'Marshal',
            icon: '⚔️',
            color: '#ea580c',
            description: 'The administrator. The butcher. The janitor.',
        },
        sentinel: {
            title: 'Sentinel',
            icon: '🛡️',
            color: '#0891b2',
            description: 'Enforcer. Executes pre-approved actions only.',
        },
        veil_watcher: {
            title: 'Veil Watcher',
            icon: '👁️',
            color: '#6b7280',
            description: 'Invisible surveillance. Pattern detection only.',
        },
    };
    return displayMap[role];
}

/**
 * Get allowed actions for a role
 */
export function getRolePermissions(role: ModeratorRole): string[] {
    const permissionMap: Record<ModeratorRole, string[]> = {
        prime_sovereign: [
            'appoint_king',
            'appoint_hand',
            'remove_anyone',
            'access_all_logs',
            'override_all',
            'freeze_regions',
            'delete_territories',
            'export_all_data',
        ],
        the_hand: [
            'override_kings',
            'freeze_territories',
            'mass_delete',
            'internal_identity_reveal',
            'reset_mod_structure',
        ],
        crowned_king: [
            'appoint_steward',
            'remove_steward',
            'audit_territories',
            'review_escalated_bans',
            'impose_regional_rules',
        ],
        steward: [
            'shadow_ban',
            'freeze_posts',
            'lock_threads',
            'restrict_anon_chats',
            'escalate_bans',
            'appoint_marshal',
            'appoint_sentinel',
        ],
        marshal: [
            'review_reports',
            'enforce_cooldowns',
            'silence_users',
            'prepare_ban_cases',
            'appoint_watcher',
        ],
        sentinel: [
            'execute_approved_actions',
        ],
        veil_watcher: [
            'monitor_feeds',
            'detect_patterns',
            'flag_silently',
        ],
    };
    return permissionMap[role];
}

/**
 * Validate role constraints
 */
export function validateRoleConstraints(
    role: ModeratorRole,
    action: string
): { valid: boolean; reason?: string } {
    // Veil Watchers: Pattern detection only, no single-user decisions
    if (role === 'veil_watcher') {
        const forbidden = ['shadow_ban', 'cooldown', 'content_lock', 'permanent_ban'];
        if (forbidden.includes(action)) {
            return {
                valid: false,
                reason: 'Veil Watchers cannot make single-user decisions. Flag to Marshal.',
            };
        }
    }

    // Sentinels: Execute only, no independent judgment
    if (role === 'sentinel') {
        const forbidden = ['detect_patterns', 'review_reports', 'prepare_ban_cases'];
        if (forbidden.includes(action)) {
            return {
                valid: false,
                reason: 'Sentinels execute pre-approved actions only. No independent judgment.',
            };
        }
    }

    // Marshals: Cannot permanently ban or speak publicly
    if (role === 'marshal') {
        const forbidden = ['permanent_ban', 'public_announcement'];
        if (forbidden.includes(action)) {
            return {
                valid: false,
                reason: 'Marshals cannot permanently ban or speak publicly.',
            };
        }
    }

    return { valid: true };
}
