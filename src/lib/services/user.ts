import { createClient } from '@/lib/supabase/client';
import { createNotification } from './notifications';

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'unverified';

export interface UserProfile {
    id: string;
    username: string;
    display_name?: string; // Real Name
    void_name?: string;    // Anonymous Alias
    bio?: string;
    avatar_url?: string;
    void_avatar?: string;
    college_name?: string;
    territory_id?: string;
    verification_status: VerificationStatus;
    rejection_reason?: string;
}

export async function getUserProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }

    return data as UserProfile;
}

export async function updateUserProfile(updates: Partial<UserProfile>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Check if profile exists
    const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

    const profileUpdates: any = { id: user.id, ...updates };

    try {
        if (existingProfile) {
            // Update existing profile
            const { error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) {
                console.error("Error updating profile:", JSON.stringify(error, null, 2));
                throw error;
            }
        } else {
            // If profile doesn't exist and no username provided, generate one from email
            if (!updates.username) {
                const email = user.email || "";
                const generatedUsername = email.split('@')[0] || `user_${Date.now()}`;
                profileUpdates.username = generatedUsername;
            }

            // Insert new profile
            const { error } = await supabase
                .from('user_profiles')
                .insert(profileUpdates);

            if (error) {
                console.error("Error inserting profile:", JSON.stringify(error, null, 2));
                throw error;
            }
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn("Update profile request was aborted.");
            return false; // Silently fail on abort
        }
        throw error;
    }

    return true;
}

export async function uploadAvatar(file: File, path: string) {
    const supabase = createClient();

    // Upload file to 'Profile_pic' bucket
    const { error } = await supabase.storage
        .from('Profile_pic')
        .upload(path, file, { upsert: true });

    if (error) {
        console.error("Error uploading avatar:", error);
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('Profile_pic')
        .getPublicUrl(path);

    return publicUrl;
}

export async function getProfileViews(userId: string): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', userId);

    if (error) {
        console.error("Error fetching profile views:", error);
        return 0;
    }

    return count || 0;
}

/**
 * The Peek: Record a profile view and notify the target.
 */
export async function recordProfileView(targetId: string, targetCollege?: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id === targetId) return;

    // Record the view
    const { error: viewError } = await supabase
        .from('profile_views')
        .insert({
            viewer_id: user.id,
            target_id: targetId
        });

    if (viewError) {
        console.error("Error recording profile view:", viewError);
        return;
    }

    // Get viewer's college to make the notification mysterious
    let viewerCollege = "The Void";
    const { data: viewerProfile } = await supabase
        .from('user_profiles')
        .select('college_name')
        .eq('id', user.id)
        .single();

    if (viewerProfile?.college_name) {
        viewerCollege = viewerProfile.college_name;
    }

    // Create the "Peek" notification
    await createNotification(
        targetId,
        'system',
        `👁️ Someone from ${viewerCollege} is watching your profile...`,
        user.id // Reference to viewer profile if they want to click it (optional)
    );
}

/**
 * Shadow Aura: Check if a user is in the top 5% of their college by crush count.
 */
export async function hasShadowAura(userId: string, collegeName?: string): Promise<boolean> {
    const supabase = createClient();

    // If no college provided, fetch it
    let targetCollege = collegeName;
    if (!targetCollege) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('college_name')
            .eq('id', userId)
            .single();
        targetCollege = profile?.college_name;
    }

    if (!targetCollege) return false;

    // Logic:
    // 1. Get crash counts for all users in this college
    // 2. See if the target user's count is in the top 5%

    // This is an expensive query for real-time. 
    // Optimization: For now, we'll check if they have at least 10 crushes AND are in the top 5% of users with at least 1 crush.

    const { data: rankings, error } = await supabase
        .rpc('get_college_crush_rankings', { target_college: targetCollege });

    if (error || !rankings) {
        // Fallback: If no RPC exists, just check for a high minimum (e.g., 20 crushes)
        const { count } = await supabase
            .from('user_crushes')
            .select('*', { count: 'exact', head: true })
            .eq('target_id', userId);

        return (count || 0) >= 20;
    }

    const userRank = rankings.find((r: any) => r.user_id === userId);
    if (!userRank) return false;

    const percentile = (userRank.rank / rankings.length);
    return percentile <= 0.05; // Top 5%
}
