"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/context/ToastContext";
import { getComments, addComment, Comment } from "@/lib/services/interactions";

export function CommentSection({
    postId,
    onClose,
    initialCount
}: {
    postId: string;
    onClose: () => void;
    initialCount: number;
}) {
    const { showToast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reply State
    const [replyTo, setReplyTo] = useState<Comment | null>(null);

    useEffect(() => {
        const fetchComments = async () => {
            setIsLoading(true);
            try {
                const fetched = await getComments(postId);
                setComments(fetched);
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [postId]);

    const handleSend = async () => {
        if (!newComment.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const { comment } = await addComment(
                postId,
                newComment,
                true, // Defaulting to anonymous for mvp
                replyTo ? replyTo.id : null,
                initialCount
            );

            // Optimistic UI Update
            if (replyTo) {
                // Find parent and append
                setComments(prev => prev.map(c => {
                    if (c.id === replyTo.id) {
                        return { ...c, replies: [...(c.replies || []), comment] };
                    }
                    return c;
                }));
            } else {
                // Top level
                setComments(prev => [...prev, comment]);
            }

            setNewComment("");
            setReplyTo(null);

        } catch (error) {
            showToast({ title: "Failed", message: "Could not post comment.", type: "error", rank: "secondary" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderComment = (comment: Comment, isReply = false) => {
        const authorName = comment.is_anonymous ? (comment.author?.void_name || "Anonymous") : (comment.author?.display_name || "User");

        return (
            <div key={comment.id} className={`flex gap-3 group ${isReply ? 'ml-8 mt-4 relative before:absolute before:content-[""] before:w-6 before:h-px before:bg-white/10 before:-left-6 before:top-4' : ''}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 text-sm shadow-sm overflow-hidden text-xs text-white font-mono">
                    {comment.is_anonymous ? '🌑' : (
                        comment.author?.avatar_url ? (
                            <img src={comment.author.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (authorName[0])
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-300">
                            {authorName}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                            {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed break-words">
                        {comment.content}
                    </p>

                    {!isReply && (
                        <button
                            onClick={() => setReplyTo(replyTo?.id === comment.id ? null : comment)}
                            className={`text-[10px] font-bold tracking-wider uppercase mt-2 transition-colors ${replyTo?.id === comment.id ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}
                        >
                            {replyTo?.id === comment.id ? 'Cancel Reply' : 'Reply'}
                        </button>
                    )}

                    {/* Render Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2 border-l border-white/5 relative">
                            {comment.replies.map(reply => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="overflow-hidden bg-black/40 border-t border-white/5 animate-slide-down">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/5">
                <h3 className="font-display text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <span>💬</span> Comments <span className="text-zinc-500">({comments.length})</span>
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Comments List */}
            <div className="max-h-[400px] overflow-y-auto p-6 space-y-6 dark-scrollbar">
                {isLoading ? (
                    <div className="text-center text-zinc-500 text-xs py-8 animate-pulse">Loading whispers...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-zinc-600 text-xs py-8 italic">No comments yet. Be the first.</div>
                ) : (
                    comments.map(c => renderComment(c))
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white/5 mx-4 mb-4 rounded-xl border border-white/5 transition-all duration-300 focus-within:border-white/20 focus-within:bg-white/10">
                {replyTo && (
                    <div className="flex items-center justify-between text-[10px] text-red-400 font-mono mb-2 uppercase tracking-tight">
                        <span>Replying to {replyTo.is_anonymous ? (replyTo.author?.void_name || "Anonymous") : (replyTo.author?.display_name || "User")}</span>
                        <button onClick={() => setReplyTo(null)} className="hover:text-white">Cancel</button>
                    </div>
                )}
                <div className="relative flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? "Draft your reply..." : "Add a comment..."}
                        className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isSubmitting}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newComment.trim() || isSubmitting}
                        className="text-red-500 font-bold text-xs uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:text-red-400 transition-colors"
                    >
                        {isSubmitting ? '...' : 'Post'}
                    </button>
                </div>
            </div>

            <style jsx>{`
        .dark-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .dark-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        @keyframes slide-down {
          from { height: 0; opacity: 0; }
          to { height: auto; opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
        </div>
    );
}
