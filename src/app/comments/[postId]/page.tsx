"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "@/components/feed/PostCard";
import { ChevronLeft, Send } from "lucide-react";
import { getUserInteractions, getComments, addComment, Comment } from "@/lib/services/interactions";
import { useToast } from "@/lib/context/ToastContext";
import { formatPostTime } from "@/lib/utils/formatTime";

export default function CommentsPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const postId = params.postId as string;

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>();

    // Comments state
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

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

    // Fetch comments
    useEffect(() => {
        async function fetchComments() {
            setLoadingComments(true);
            try {
                const fetched = await getComments(postId);
                setComments(fetched);
            } catch (e) {
                console.error("Failed to load comments:", e);
            } finally {
                setLoadingComments(false);
            }
        }
        fetchComments();
    }, [postId]);

    const handleSend = async () => {
        if (!newComment.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const { comment } = await addComment(
                postId,
                newComment,
                true,
                replyTo ? replyTo.id : null,
                comments.length
            );

            if (replyTo) {
                setComments(prev => prev.map(c => {
                    if (c.id === replyTo.id) {
                        return { ...c, replies: [...(c.replies || []), comment] };
                    }
                    return c;
                }));
            } else {
                setComments(prev => [...prev, comment]);
            }

            setNewComment("");
            setReplyTo(null);

            // Scroll to bottom
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
        } catch (error) {
            showToast({ title: "Failed", message: "Could not post comment.", type: "error", rank: "secondary" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = (comment: Comment) => {
        setReplyTo(replyTo?.id === comment.id ? null : comment);
        inputRef.current?.focus();
    };

    const renderComment = (comment: Comment, isReply = false) => {
        const authorName = comment.is_anonymous
            ? (comment.author?.void_name || "Anonymous")
            : (comment.author?.display_name || "User");

        return (
            <div key={comment.id} className={`${isReply ? 'ml-10 mt-3' : ''}`}>
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-sm overflow-hidden">
                        {comment.is_anonymous ? '🌑' : (
                            comment.author?.avatar_url ? (
                                <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-zinc-400">{authorName[0]}</span>
                            )
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-3 border border-white/[0.04]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-zinc-300 truncate">{authorName}</span>
                                <span className="text-[10px] text-zinc-600 shrink-0">
                                    {formatPostTime(comment.created_at)}
                                </span>
                            </div>
                            <p className="text-[13px] text-zinc-400 leading-relaxed break-words">{comment.content}</p>
                        </div>

                        {/* Reply button */}
                        {!isReply && (
                            <button
                                onClick={() => handleReply(comment)}
                                className={`text-[10px] font-bold tracking-wider uppercase mt-1.5 ml-4 transition-colors ${replyTo?.id === comment.id ? 'text-red-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                            >
                                {replyTo?.id === comment.id ? 'Cancel' : 'Reply'}
                            </button>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {comment.replies.map(reply => renderComment(reply, true))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Count total comments including replies
    const totalComments = comments.reduce((count, c) => count + 1 + (c.replies?.length || 0), 0);

    return (
        <div className="min-h-screen bg-[#030303] text-white flex flex-col">
            {/* ─── Top Bar ─── */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/[0.06] pt-safe">
                <div className="flex items-center gap-3 px-3 py-2.5">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 rounded-xl hover:bg-white/5 transition-colors active:scale-95"
                    >
                        <ChevronLeft size={20} className="text-zinc-400" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-sm font-bold text-white">Comments</h1>
                        <p className="text-[11px] text-zinc-500">{totalComments} {totalComments === 1 ? 'comment' : 'comments'}</p>
                    </div>
                </div>
            </div>

            {/* ─── Scrollable Content ─── */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto pt-[calc(env(safe-area-inset-top,20px)+56px)] pb-[80px]"
            >
                {loading ? (
                    <div className="px-4 py-6 space-y-4 animate-pulse">
                        <div className="h-32 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
                        <div className="h-20 rounded-xl bg-white/[0.02] border border-white/[0.04]" />
                        <div className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.04]" />
                    </div>
                ) : post ? (
                    <>
                        {/* Post Preview — compact version */}
                        <div className="px-4 pt-4 pb-2">
                            <div className="bg-zinc-900/50 rounded-2xl border border-white/[0.06] p-4">
                                {/* Mini author row */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/5">
                                        {post.is_anonymous ? (
                                            post.author?.void_avatar ? (
                                                <img src={post.author.void_avatar} alt="" className="w-full h-full object-cover" />
                                            ) : <span className="text-[10px]">🌑</span>
                                        ) : (
                                            post.author?.avatar_url ? (
                                                <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : <span className="text-[9px] font-bold text-zinc-400">{(post.author?.display_name || 'U')[0]}</span>
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold text-zinc-300">
                                        {post.is_anonymous ? (post.author?.void_name || 'Anonymous') : (post.author?.display_name || 'User')}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 ml-auto">{formatPostTime(post.created_at)}</span>
                                </div>
                                {/* Post content */}
                                <p className="text-[13px] text-zinc-400 leading-relaxed line-clamp-4">
                                    {post.content}
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 px-6 py-3">
                            <div className="flex-1 h-px bg-white/[0.06]" />
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                {totalComments > 0 ? `${totalComments} Comments` : 'No comments yet'}
                            </span>
                            <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        {/* Comments */}
                        <div className="px-4 space-y-4 pb-4">
                            {loadingComments ? (
                                <div className="flex flex-col items-center py-12">
                                    <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                                    <p className="text-xs text-zinc-600 mt-3">Loading comments...</p>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">💬</span>
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-400 mb-1">Start the conversation</p>
                                    <p className="text-xs text-zinc-600">Be the first to drop a comment.</p>
                                </div>
                            ) : (
                                comments.map(c => renderComment(c))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-zinc-500 text-sm">Post not found.</p>
                    </div>
                )}
            </div>

            {/* ─── Fixed Input Bar ─── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#030303]/90 backdrop-blur-xl border-t border-white/[0.06] pb-safe">
                {replyTo && (
                    <div className="flex items-center justify-between px-4 pt-2 pb-0">
                        <span className="text-[10px] text-red-400 font-mono uppercase tracking-tight">
                            ↩ Replying to {replyTo.is_anonymous ? (replyTo.author?.void_name || "Anon") : (replyTo.author?.display_name || "User")}
                        </span>
                        <button onClick={() => setReplyTo(null)} className="text-[10px] text-zinc-600 hover:text-white">✕</button>
                    </div>
                )}
                <div className="flex items-center gap-2 px-4 py-3">
                    <div className="flex-1 bg-white/[0.05] rounded-full border border-white/[0.08] focus-within:border-white/[0.15] focus-within:bg-white/[0.08] transition-all">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                            className="w-full bg-transparent text-sm text-white placeholder-zinc-600 px-4 py-2.5 focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isSubmitting}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!newComment.trim() || isSubmitting}
                        className="p-2.5 rounded-full bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-all active:scale-90 hover:bg-red-500"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
