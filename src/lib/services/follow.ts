import { createClient } from "@/lib/supabase/client";
import { createNotification } from "./notifications";

export const followService = {
    /**
     * Follow a user. Returns true if followed, false if already following.
     */
    follow: async (targetId: string): Promise<boolean> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        if (user.id === targetId) return false;

        const { error } = await supabase
            .from('user_follows')
            .insert({ follower_id: user.id, following_id: targetId });

        if (error) {
            if (error.code === '23505') return false; // Already following
            throw error;
        }

        // Create notification for target
        try {
            await createNotification(targetId, 'follow', 'Someone started following you');
        } catch (e) { /* don't block on notification failure */ }

        return true;
    },

    /**
     * Unfollow a user.
     */
    unfollow: async (targetId: string): Promise<boolean> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from('user_follows')
            .delete()
            .match({ follower_id: user.id, following_id: targetId });

        if (error) throw error;
        return true;
    },

    /**
     * Check if current user follows a target.
     */
    isFollowing: async (targetId: string): Promise<boolean> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', targetId)
            .single();

        return !!data;
    },

    /**
     * Get follower count for a user.
     */
    getFollowerCount: async (userId: string): Promise<number> => {
        const supabase = createClient();
        const { count, error } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);
        if (error) return 0;
        return count || 0;
    },

    /**
     * Get following count for a user.
     */
    getFollowingCount: async (userId: string): Promise<number> => {
        const supabase = createClient();
        const { count, error } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);
        if (error) return 0;
        return count || 0;
    },
};
