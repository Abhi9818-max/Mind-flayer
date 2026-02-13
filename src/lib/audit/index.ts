// Audit logging system
// "When court comes, you export logs. No panic."

import { ModActionType, ModAction } from '@/types';

/**
 * Action descriptions for audit log display
 */
export const ACTION_DESCRIPTIONS: Record<ModActionType, string> = {
    shadow_ban: 'Applied shadow-ban (Level 1)',
    cooldown: 'Applied cooldown (Level 2)',
    content_lock: 'Applied content lock (Level 3)',
    territory_mute: 'Applied territory mute (Level 4)',
    regional_mute: 'Applied regional mute (Level 5)',
    permanent_ban: 'Applied permanent ban (Level 6)',
    unban: 'Removed punishment',
    content_remove: 'Removed content',
    content_restore: 'Restored content',
    user_warn: 'Issued warning',
    appoint_mod: 'Appointed moderator',
    remove_mod: 'Removed moderator',
};

/**
 * Create an audit log entry
 */
export function createAuditEntry(
    moderatorId: string,
    actionType: ModActionType,
    options: {
        targetUserHash?: string;
        targetContentId?: string;
        reason: string;
        metadata?: Record<string, unknown>;
    }
): Omit<ModAction, 'id' | 'created_at'> {
    return {
        moderator_id: moderatorId,
        action_type: actionType,
        target_user_hash: options.targetUserHash || null,
        target_content_id: options.targetContentId || null,
        reason: options.reason,
        metadata: {
            ...options.metadata,
            timestamp: new Date().toISOString(),
            action_description: ACTION_DESCRIPTIONS[actionType],
        },
    };
}

/**
 * Format audit log for export
 */
export function formatAuditLog(actions: ModAction[]): string {
    const header = [
        'ID',
        'Timestamp',
        'Moderator ID',
        'Action',
        'Target User Hash',
        'Target Content ID',
        'Reason',
        'Metadata',
    ].join(',');

    const rows = actions.map(action => [
        action.id,
        action.created_at,
        action.moderator_id,
        action.action_type,
        action.target_user_hash || '',
        action.target_content_id || '',
        `"${action.reason.replace(/"/g, '""')}"`,
        `"${JSON.stringify(action.metadata).replace(/"/g, '""')}"`,
    ].join(','));

    return [header, ...rows].join('\n');
}

/**
 * Get action severity for filtering/sorting
 */
export function getActionSeverity(actionType: ModActionType): number {
    const severityMap: Record<ModActionType, number> = {
        shadow_ban: 1,
        cooldown: 2,
        content_lock: 3,
        territory_mute: 4,
        regional_mute: 5,
        permanent_ban: 6,
        unban: 0,
        content_remove: 3,
        content_restore: 0,
        user_warn: 1,
        appoint_mod: 0,
        remove_mod: 0,
    };
    return severityMap[actionType];
}

/**
 * Filter audit logs by criteria
 */
export function filterAuditLogs(
    actions: ModAction[],
    filters: {
        moderatorId?: string;
        actionType?: ModActionType;
        targetUserHash?: string;
        minSeverity?: number;
        startDate?: Date;
        endDate?: Date;
    }
): ModAction[] {
    return actions.filter(action => {
        if (filters.moderatorId && action.moderator_id !== filters.moderatorId) {
            return false;
        }
        if (filters.actionType && action.action_type !== filters.actionType) {
            return false;
        }
        if (filters.targetUserHash && action.target_user_hash !== filters.targetUserHash) {
            return false;
        }
        if (filters.minSeverity !== undefined) {
            if (getActionSeverity(action.action_type) < filters.minSeverity) {
                return false;
            }
        }
        if (filters.startDate) {
            if (new Date(action.created_at) < filters.startDate) {
                return false;
            }
        }
        if (filters.endDate) {
            if (new Date(action.created_at) > filters.endDate) {
                return false;
            }
        }
        return true;
    });
}

/**
 * Generate audit summary statistics
 */
export function generateAuditSummary(actions: ModAction[]): {
    totalActions: number;
    byType: Record<string, number>;
    byModerator: Record<string, number>;
    averageSeverity: number;
    dateRange: { start: string; end: string } | null;
} {
    if (actions.length === 0) {
        return {
            totalActions: 0,
            byType: {},
            byModerator: {},
            averageSeverity: 0,
            dateRange: null,
        };
    }

    const byType: Record<string, number> = {};
    const byModerator: Record<string, number> = {};
    let totalSeverity = 0;

    actions.forEach(action => {
        byType[action.action_type] = (byType[action.action_type] || 0) + 1;
        byModerator[action.moderator_id] = (byModerator[action.moderator_id] || 0) + 1;
        totalSeverity += getActionSeverity(action.action_type);
    });

    const dates = actions.map(a => new Date(a.created_at).getTime()).sort();

    return {
        totalActions: actions.length,
        byType,
        byModerator,
        averageSeverity: totalSeverity / actions.length,
        dateRange: {
            start: new Date(dates[0]).toISOString(),
            end: new Date(dates[dates.length - 1]).toISOString(),
        },
    };
}
