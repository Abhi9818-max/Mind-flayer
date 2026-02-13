import { createClient } from "@/lib/supabase/client";
import { mockAuth } from "@/lib/auth/mockAuth";

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
        // Try Supabase first (if configured)
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // If Supabase is active
        if (user) {
            const { error } = await supabase
                .from('user_crushes')
                .insert({ admirer_id: user.id, target_id: targetId });

            if (error) throw error;
            return { success: true };
        }

        // Fallback to Mock Auth / LocalStorage
        const currentUser = mockAuth.getCurrentUser();
        if (!currentUser) throw new Error("Must be logged in to mark a crush");

        const crushes = JSON.parse(localStorage.getItem(CRUSHES_KEY) || '[]') as Crush[];

        // Check if already crushed
        if (crushes.some(c => c.admirer_id === currentUser.id && c.target_id === targetId)) {
            return { success: false, message: "Already marked as crush" };
        }

        const newCrush: Crush = {
            id: `crush_${Date.now()}`,
            admirer_id: currentUser.id,
            target_id: targetId,
            created_at: new Date().toISOString()
        };

        crushes.push(newCrush);
        localStorage.setItem(CRUSHES_KEY, JSON.stringify(crushes));

        return { success: true };
    },

    // Get number of admirers for a user
    getAdmirerCount: async (userId: string): Promise<number> => {
        // Mock Implementation
        const crushes = JSON.parse(localStorage.getItem(CRUSHES_KEY) || '[]') as Crush[];
        return crushes.filter(c => c.target_id === userId).length;
    },

    // Check if I have crushed on this user
    hasCrushed: async (targetId: string): Promise<boolean> => {
        const currentUser = mockAuth.getCurrentUser();
        if (!currentUser) return false;

        const crushes = JSON.parse(localStorage.getItem(CRUSHES_KEY) || '[]') as Crush[];
        return crushes.some(c => c.admirer_id === currentUser.id && c.target_id === targetId);
    }
};
