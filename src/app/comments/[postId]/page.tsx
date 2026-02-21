"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "@/components/feed/PostCard";
import { CommentSection } from "@/components/feed/CommentSection";
import { ChevronLeft } from "lucide-react";
import { getUserInteractions } from "@/lib/services/interactions";

export default function CommentsPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.postId as string;
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>();

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const { getPosts } = await import("@/lib/services/posts");
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) setCurrentUserId(user.id);

                const allPosts = await getPosts("all");
                const found = allPosts.find((p: any) => p.id === postId);

                if (found) {
                    // Get interaction state for this post
                    const interactions = await getUserInteractions([postId]);
                    setPost({
                        ...found,
                        hasLiked: interactions[postId]?.hasLiked || false,
                        hasSaved: interactions[postId]?.hasSaved || false,
                    });
                }
            } catch (e) {
                console.error("Failed to load post:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [postId]);

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/90 backdrop-blur-md border-b border-white/5 pt-safe">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft size={22} className="text-zinc-300" />
                    </button>
                    <h1 className="text-base font-bold text-white">Comments</h1>
                </div>
            </div>

            {/* Content */}
            <main className="pt-[calc(env(safe-area-inset-top,20px)+60px)] pb-8 px-4 max-w-2xl mx-auto">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-40 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
                        <div className="h-60 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
                    </div>
                ) : post ? (
                    <div className="space-y-0">
                        {/* The Post */}
                        <PostCard
                            post={post}
                            delay={0}
                            currentUserId={currentUserId}
                        />

                        {/* Comments — Full height */}
                        <div className="bg-zinc-900/50 rounded-b-3xl border-x border-b border-white/5 -mt-4 pt-6">
                            <CommentSection
                                postId={postId}
                                onClose={() => router.back()}
                                initialCount={post.comment_count || 0}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-zinc-500 text-sm">Post not found.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
