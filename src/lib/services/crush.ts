import { createClient } from "@/lib/supabase/client";


export interface Crush {
    id: string;
    admirer_id: string;
    target_id: string;
    created_at: string;
}

const CRUSHES_KEY = 'mind_flayer_crushes';

export const crushService = {
    // Mark a user as your crush
    markCrush: async (targetId: string) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Must be logged in to mark a crush");

        // Check if self-crush (sad but allowed? No, let's ban it)
        if (user.id === targetId) {
            return { success: false, message: "You cannot mark yourself as a crush" };
        }

        // Check if already crushed
        const { data: existing } = await supabase
            .from('user_crushes')
            .select('id')
            .eq('admirer_id', user.id)
            .eq('target_id', targetId)
            .single();

        if (existing) {
            return { success: false, message: "Already marked as crush" };
        }

        const { error } = await supabase
            .from('user_crushes')
            .insert({ admirer_id: user.id, target_id: targetId });

        if (error) throw error;
        return { success: true };
    },

    // Get number of admirers for a user
    getAdmirerCount: async (userId: string): Promise<number> => {
        const supabase = createClient();
        const { count, error } = await supabase
            .from('user_crushes')
            .select('*', { count: 'exact', head: true })
            .eq('target_id', userId);

        if (error) {
            console.error("Error fetching admirer count:", error);
            return 0;
        }
        return count || 0;
    },

    // Check if I have crushed on this user
    hasCrushed: async (targetId: string): Promise<boolean> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const { data, error } = await supabase
            .from('user_crushes')
            .select('id')
            .eq('admirer_id', user.id)
            .eq('target_id', targetId)
            .single();

        return !!data;
    }
};
