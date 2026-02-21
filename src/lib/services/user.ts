import { createClient } from '@/lib/supabase/client';

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
