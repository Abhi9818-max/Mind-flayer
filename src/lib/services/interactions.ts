import { createClient } from '@/lib/supabase/client';
import { createNotification } from './notifications';

// ==========================================
// TYPES
// ==========================================

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    user_hash: string;
    content: string;
    is_anonymous: boolean;
    created_at: string;
    parent_id: string | null;
    author?: {
        display_name: string;
        void_name: string;
        avatar_url: string;
    };
    replies?: Comment[];
}

export interface InteractionState {
    hasLiked: boolean;
    hasSaved: boolean;
    likeCount: number;
    commentCount: number;
}

// ==========================================
// LIKES
// ==========================================

export async function toggleLike(postId: string, currentLikeCount: number, isCurrentlyLiked: boolean) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const userHash = user.id;

    if (isCurrentlyLiked) {
        const { error: deleteError } = await supabase
            .from('likes')
            .delete()
            .match({ post_id: postId, user_hash: userHash });

        if (deleteError) throw deleteError;

        const newCount = Math.max(0, currentLikeCount - 1);
        await supabase.from('posts').update({ like_count: newCount }).eq('id', postId);
        return { isLiked: false, likeCount: newCount };

    } else {
        const { error: insertError } = await supabase
            .from('likes')
            .insert({ post_id: postId, user_hash: userHash });

        if (insertError) throw insertError;

        const newCount = currentLikeCount + 1;
        await supabase.from('posts').update({ like_count: newCount }).eq('id', postId);

        // Fire notification to post author
        try {
            const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
            if (post && post.user_id !== user.id) {
                await createNotification(post.user_id, 'like', 'Someone liked your post', postId);
            }
        } catch (e) { /* don't block */ }

        return { isLiked: true, likeCount: newCount };
    }
}

// ==========================================
// SAVES (BOOKMARKS)
// ==========================================

export async function toggleSave(postId: string, isCurrentlySaved: boolean) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (isCurrentlySaved) {
        // Unsave
        const { error } = await supabase
            .from('saved_posts')
            .delete()
            .match({ post_id: postId, user_id: user.id });
        if (error) throw error;
        return false;
    } else {
        // Save
        const { error } = await supabase
            .from('saved_posts')
            .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
        return true;
    }
}

/**
 * Fetches all posts the current user has saved/bookmarked.
 */
export async function getSavedPosts() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get saved post IDs
    const { data: savedEntries, error: savedError } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (savedError || !savedEntries || savedEntries.length === 0) return [];

    const postIds = savedEntries.map((s: any) => s.post_id);

    // Fetch the actual posts with author data
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
            *,
            author:user_profiles (
                void_name,
                display_name,
                avatar_url,
                void_avatar
            )
        `)
        .in('id', postIds)
        .order('created_at', { ascending: false });

    if (postsError || !posts) return [];

    // Process author data (same logic as getPosts)
    return posts.map((post: any) => {
        const authorData = Array.isArray(post.author) ? post.author[0] : post.author;
        return {
            ...post,
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
            author_id: post.user_id,
            hasSaved: true, // We know these are saved
        };
    });
}

// ==========================================
// COMMENTS
// ==========================================

/**
 * Fetches all comments for a post, including author details.
 * Also formats them into a hierarchical tree if replies exist.
 */
export async function getComments(postId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            author:user_profiles (
                display_name,
                void_name,
                avatar_url
            )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    // Process generic arrays from relation
    const processed = data.map((c: any) => ({
        ...c,
        author: Array.isArray(c.author) ? c.author[0] : c.author
    })) as Comment[];

    // Build the tree (Nesting replies under their parents)
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // Initialize all with empty replies array
    processed.forEach(comment => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
    });

    processed.forEach(comment => {
        if (comment.parent_id) {
            // It's a reply, find parent and push
            const parent = commentMap.get(comment.parent_id);
            if (parent && parent.replies) {
                parent.replies.push(comment);
            }
        } else {
            // It's a root comment
            rootComments.push(comment);
        }
    });

    return rootComments;
}

export async function addComment(postId: string, content: string, isAnonymous: boolean, parentId: string | null = null, currentCommentCount: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const userHash = isAnonymous ? `anon-${Math.random().toString(36).substring(7)}` : user.id;

    // Insert the new comment
    const { data, error } = await supabase
        .from('comments')
        .insert({
            post_id: postId,
            user_id: user.id,
            user_hash: userHash,
            content: content,
            is_anonymous: isAnonymous,
            parent_id: parentId
        })
        .select(`
            *,
            author:user_profiles(display_name, void_name, avatar_url)
        `)
        .single();

    if (error) throw error;

    // Increment count on post
    const newCount = currentCommentCount + 1;
    await supabase.from('posts').update({ comment_count: newCount }).eq('id', postId);

    // Process output
    const processedData = {
        ...data,
        author: Array.isArray((data as any).author) ? (data as any).author[0] : (data as any).author,
        replies: []
    } as Comment;

    // Fire notification to post author
    try {
        const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
        if (post && post.user_id !== user.id) {
            await createNotification(post.user_id, 'comment', 'Someone commented on your post', postId);
        }
    } catch (e) { /* don't block */ }

    return { comment: processedData, newCount };
}

// ==========================================
// BATCH LOAD STATE
// ==========================================

/**
 * Since the Feed loads many posts, we need to batch-check which ones the user liked/saved.
 */
export async function getUserInteractions(postIds: string[]): Promise<Record<string, { hasLiked: boolean, hasSaved: boolean }>> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || postIds.length === 0) return {};

    const userHash = user.id;
    const interactionsMap: Record<string, { hasLiked: boolean, hasSaved: boolean }> = {};

    // Initialize map
    postIds.forEach(id => interactionsMap[id] = { hasLiked: false, hasSaved: false });

    // Parallel fetch likes and saves
    const [likesRes, savesRes] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_hash', userHash).in('post_id', postIds),
        supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
    ]);

    if (likesRes.data) {
        likesRes.data.forEach((like: any) => interactionsMap[like.post_id].hasLiked = true);
    }

    if (savesRes.data) {
        savesRes.data.forEach((save: any) => interactionsMap[save.post_id].hasSaved = true);
    }

    return interactionsMap;
}
