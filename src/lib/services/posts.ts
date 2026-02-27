import { createClient } from '@/lib/supabase/client';
import { PostType } from '@/types';

const NCR_DOMINION_ID = "660e8400-e29b-41d4-a716-446655440000"; // Hardcoded for MVP

export interface CreatePostParams {
    content: string;
    type: PostType;
    isAnonymous: boolean;
    audioBlob?: Blob | null;
}

export async function createPost({ content, type, isAnonymous, audioBlob }: CreatePostParams) {
    const supabase = createClient();

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");

    let mediaUrl = null;

    // 2. Upload Audio if exists
    if (type === 'voice' && audioBlob) {
        const fileExt = 'webm'; // Assuming webm from browser recorder
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(fileName, audioBlob, {
                contentType: 'audio/webm',
                upsert: false
            });

        if (uploadError) throw new Error(`Audio upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(fileName);

        mediaUrl = publicUrl;
    }

    // 3. Create Post
    // For anonymous posts, we generate a consistent hash based on user ID + salt (internal)
    // But for now, we just rely on `is_anonymous` flag. The backend RLS/View handles visibility.
    // The `user_hash` column is ideally generated via a triggered function or backend service to keep true anonymity.
    // For this MVP, we will generate a simple client-side hash or let the backend trigger handle it if it exists.
    // Checking schema: user_hash is NOT NULL. 
    // We'll generate a temporary hash here. Ideally this is server-side.
    const tempUserHash = isAnonymous ? `anon-${Math.random().toString(36).substring(7)}` : user.id;

    const { data, error } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            type: type,
            content: content || (type === 'voice' ? "Voice Note" : ""),
            is_anonymous: isAnonymous,
            dominion_id: NCR_DOMINION_ID,
            // territory_id: ... // Optional
            user_hash: tempUserHash, // This should be handled better long term
            media_url: mediaUrl,
            moderation_status: 'active'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getPosts(filterType: PostType | 'all' = 'all') {
    const supabase = createClient();

    let query = supabase
        .from('posts')
        .select(`
            *,
            author:user_profiles (
                void_name,
                display_name,
                avatar_url,
                void_avatar
            ),
            likes(count),
            comments(count)
        `)
        .order('created_at', { ascending: false });

    if (filterType !== 'all') {
        query = query.eq('type', filterType);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching posts:", error);
        return [];
    }

    // Process the data to ensure correct structure
    const processedPosts = await Promise.all(data.map(async (post: any) => {
        // If it's a real user post but the joined data is an array
        const authorData = Array.isArray(post.author) ? post.author[0] : post.author;

        // Compute real counts from joined aggregation
        const realLikeCount = post.likes?.[0]?.count ?? post.like_count ?? 0;
        const realCommentCount = post.comments?.[0]?.count ?? post.comment_count ?? 0;

        // Shadow Aura check (optimized: only for non-anonymous authors, with timeout)
        let auraActive = false;
        if (!post.is_anonymous && post.user_id) {
            try {
                const { hasShadowAura } = await import('./user');
                auraActive = await Promise.race([
                    hasShadowAura(post.user_id, authorData?.college_name),
                    new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('aura_timeout')), 3000))
                ]);
            } catch {
                auraActive = false;
            }
        }

        return {
            ...post,
            like_count: realLikeCount,
            comment_count: realCommentCount,
            author_shadow_aura: auraActive,
            // If anonymous, we still want to use the profile's 'void' details if it exists
            author: post.is_anonymous
                ? {
                    void_name: authorData?.void_name || "Anonymous User",
                    display_name: "Anonymous",
                    avatar_url: null,
                    void_avatar: authorData?.void_avatar || null
                }
                : authorData || {
                    void_name: "Unknown",
                    display_name: "Unknown User"
                },
            // Maps the database UUID to author_id for the UI
            author_id: post.user_id,
            // Clean up joined aggregation data
            likes: undefined,
        };
    }));

    return processedPosts;
}
