import { createClient } from '@/lib/supabase/client';

// ─── Achievement Definitions ───────────────────────────────────────

export interface AchievementDef {
    key: string;
    title: string;
    description: string;
    icon: string;       // Emoji icon
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    color: string;      // Tailwind color class
    glowColor: string;  // CSS glow color
}

export interface EarnedAchievement {
    id: string;
    user_id: string;
    achievement_key: string;
    earned_at: string;
    seen: boolean;
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
    first_whisper: {
        key: 'first_whisper',
        title: 'First Whisper',
        description: 'Cast your first thought into the void.',
        icon: '🌀',
        rarity: 'common',
        color: 'text-blue-400',
        glowColor: 'rgba(96, 165, 250, 0.6)',
    },
    firestarter: {
        key: 'firestarter',
        title: 'Firestarter',
        description: '10 whispers unleashed. The void listens.',
        icon: '🔥',
        rarity: 'rare',
        color: 'text-orange-400',
        glowColor: 'rgba(251, 146, 60, 0.6)',
    },
    heartbreaker: {
        key: 'heartbreaker',
        title: 'Heartbreaker',
        description: '10 souls crushed by your presence.',
        icon: '💘',
        rarity: 'rare',
        color: 'text-pink-400',
        glowColor: 'rgba(244, 114, 182, 0.6)',
    },
    crush_magnet: {
        key: 'crush_magnet',
        title: 'Crush Magnet',
        description: '50 admirers. Your gravity is undeniable.',
        icon: '💎',
        rarity: 'epic',
        color: 'text-purple-400',
        glowColor: 'rgba(192, 132, 252, 0.6)',
    },
    the_watcher: {
        key: 'the_watcher',
        title: 'The Watcher',
        description: '50 posts observed. You see everything.',
        icon: '👁️',
        rarity: 'rare',
        color: 'text-cyan-400',
        glowColor: 'rgba(34, 211, 238, 0.6)',
    },
    silver_tongue: {
        key: 'silver_tongue',
        title: 'Silver Tongue',
        description: '25 comments. Your words cut through noise.',
        icon: '💬',
        rarity: 'rare',
        color: 'text-emerald-400',
        glowColor: 'rgba(52, 211, 153, 0.6)',
    },
    rising_star: {
        key: 'rising_star',
        title: 'Rising Star',
        description: '25 followers. Influence awakens.',
        icon: '⭐',
        rarity: 'rare',
        color: 'text-yellow-400',
        glowColor: 'rgba(250, 204, 21, 0.6)',
    },
    the_sovereign: {
        key: 'the_sovereign',
        title: 'The Sovereign',
        description: '100 followers. You command the void.',
        icon: '👑',
        rarity: 'legendary',
        color: 'text-amber-400',
        glowColor: 'rgba(251, 191, 36, 0.8)',
    },
    mind_flayer: {
        key: 'mind_flayer',
        title: 'Mind Flayer',
        description: 'All artifacts collected. You are the void.',
        icon: '🧠',
        rarity: 'legendary',
        color: 'text-red-500',
        glowColor: 'rgba(239, 68, 68, 0.8)',
    },
};

// ─── Milestone Thresholds ──────────────────────────────────────────

interface MilestoneCheck {
    key: string;
    table: string;
    column: string;  // column to filter by user
    threshold: number;
}

const MILESTONES: MilestoneCheck[] = [
    { key: 'first_whisper', table: 'posts', column: 'user_id', threshold: 1 },
    { key: 'firestarter', table: 'posts', column: 'user_id', threshold: 10 },
    { key: 'heartbreaker', table: 'user_crushes', column: 'target_id', threshold: 10 },
    { key: 'crush_magnet', table: 'user_crushes', column: 'target_id', threshold: 50 },
    { key: 'the_watcher', table: 'likes', column: 'user_hash', threshold: 50 },
    { key: 'silver_tongue', table: 'comments', column: 'user_id', threshold: 25 },
    { key: 'rising_star', table: 'user_follows', column: 'following_id', threshold: 25 },
    { key: 'the_sovereign', table: 'user_follows', column: 'following_id', threshold: 100 },
];

// ─── Service Functions ─────────────────────────────────────────────

export const achievementService = {

    /**
     * Check all milestones and award any newly earned achievements.
     * Returns array of newly earned achievement keys.
     */
    checkAndAward: async (userId: string): Promise<string[]> => {
        const supabase = createClient();
        const newlyEarned: string[] = [];

        // 1. Get already earned achievements
        const { data: existing } = await supabase
            .from('user_achievements')
            .select('achievement_key')
            .eq('user_id', userId);

        const earnedKeys = new Set((existing || []).map((a: any) => a.achievement_key));

        // 2. Check each milestone
        for (const milestone of MILESTONES) {
            if (earnedKeys.has(milestone.key)) continue; // Already earned

            try {
                const { count } = await supabase
                    .from(milestone.table)
                    .select('*', { count: 'exact', head: true })
                    .eq(milestone.column, userId);

                if (count !== null && count >= milestone.threshold) {
                    // Award achievement
                    const { error } = await supabase
                        .from('user_achievements')
                        .insert({
                            user_id: userId,
                            achievement_key: milestone.key,
                            seen: false,
                        });

                    if (!error) {
                        newlyEarned.push(milestone.key);
                        earnedKeys.add(milestone.key);
                    }
                }
            } catch (e) {
                console.error(`Error checking milestone ${milestone.key}:`, e);
            }
        }

        // 3. Check for Mind Flayer (all other achievements earned)
        if (!earnedKeys.has('mind_flayer')) {
            const allOtherKeys = MILESTONES.map(m => m.key);
            const hasAll = allOtherKeys.every(k => earnedKeys.has(k));
            if (hasAll) {
                const { error } = await supabase
                    .from('user_achievements')
                    .insert({
                        user_id: userId,
                        achievement_key: 'mind_flayer',
                        seen: false,
                    });
                if (!error) newlyEarned.push('mind_flayer');
            }
        }

        return newlyEarned;
    },

    /**
     * Get unseen achievements for the celebration modal.
     */
    getUnseen: async (userId: string): Promise<(EarnedAchievement & AchievementDef)[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId)
            .eq('seen', false)
            .order('earned_at', { ascending: true });

        if (error || !data) return [];

        return data.map((earned: any) => ({
            ...earned,
            ...ACHIEVEMENTS[earned.achievement_key],
        }));
    },

    /**
     * Mark an achievement as seen (after user dismisses celebration).
     */
    markSeen: async (achievementId: string): Promise<void> => {
        const supabase = createClient();
        await supabase
            .from('user_achievements')
            .update({ seen: true })
            .eq('id', achievementId);
    },

    /**
     * Get all earned achievements for a user (for profile display).
     */
    getUserAchievements: async (userId: string): Promise<(EarnedAchievement & AchievementDef)[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId)
            .order('earned_at', { ascending: true });

        if (error || !data) return [];

        return data
            .filter((earned: any) => ACHIEVEMENTS[earned.achievement_key])
            .map((earned: any) => ({
                ...earned,
                ...ACHIEVEMENTS[earned.achievement_key],
            }));
    },
};
