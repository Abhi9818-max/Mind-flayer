"use client";

import { useState } from "react";
import { POST_CONFIG, PostType } from "@/types";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { AudioPlayer } from "@/components/feed/AudioPlayer";
import { haptic } from "@/lib/utils/haptic";
import { getPostTypeColor } from "@/lib/utils/postTypeColors";
import { formatPostTime } from "@/lib/utils/formatTime";

// ... existing imports ...

interface Post {
    id: string;
    type: PostType;
    content: string;
    media_url?: string;
    is_anonymous: boolean;
    like_count: number;
    comment_count: number;
    created_at: string;
    author?: {
        display_name?: string;
        void_name?: string;
        avatar_url?: string;
        username?: string;
    };
    moderation_status?: 'active' | 'under_review' | 'flagged' | 'quarantined';
    hasLiked?: boolean;
    hasSaved?: boolean;
}

const typeStyles: Record<PostType | 'voice', { badge: string; border: string }> = {
    // ... (unchanged)
    confession: { badge: 'bg-red-600/10 text-red-500 border-red-600/20', border: 'group-hover:border-red-600/30' },
    rumor: { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', border: 'group-hover:border-amber-500/30' },
    crush: { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20', border: 'group-hover:border-rose-500/30' },
    rant: { badge: 'bg-orange-600/10 text-orange-500 border-orange-600/20', border: 'group-hover:border-orange-600/30' },
    question: { badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', border: 'group-hover:border-zinc-500/30' },
    voice: { badge: 'bg-purple-600/10 text-purple-400 border-purple-500/20', border: 'group-hover:border-purple-500/30' },
};

import { useToast } from "@/lib/context/ToastContext";
import { toggleLike, toggleSave } from "@/lib/services/interactions";

export function PostCard({
    post,
    delay,
    onCommentClick,
    onChatClick,
    isFocused = true
}: {
    post: Post;
    delay: number;
    onCommentClick?: () => void;
    onChatClick?: () => void;
    isFocused?: boolean;
}) {
    const { showToast } = useToast();

    // Interaction States
    const [liked, setLiked] = useState(post.hasLiked || false);
    const [likeCount, setLikeCount] = useState(post.like_count || 0);
    const [saved, setSaved] = useState(post.hasSaved || false);
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fallback for new types
    const config = POST_CONFIG[post.type as PostType] || { icon: '🎙️', label: 'Voice Note' };
    const styles = typeStyles[post.type] || typeStyles['confession'];
    const typeColor = getPostTypeColor(post.type);

    const handleIdentityClick = () => {
        if (post.is_anonymous) {
            showToast({
                title: "Identity Encrypted",
                message: "This user is exploring the void anonymously.",
                type: "info",
                rank: "secondary"
            });
        } else {
            // Navigate to profile (Mock action)
            console.log("Navigate to profile:", post.author?.username);
        }
    };

    const handleLikeClick = async () => {
        if (isLiking) return;

        // Optimistic UI update
        haptic.like();
        const prevLiked = liked;
        const prevCount = likeCount;

        setLiked(!prevLiked);
        setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
        setIsLiking(true);

        try {
            const res = await toggleLike(post.id, prevCount, prevLiked);
            // Sync with actual server response if needed
            setLiked(res.isLiked);
            setLikeCount(res.likeCount);
        } catch (error) {
            // Revert on failure
            setLiked(prevLiked);
            setLikeCount(prevCount);
            showToast({ title: "Verification Failed", message: "Action blocked.", type: "error", rank: "secondary" });
        } finally {
            setIsLiking(false);
        }
    };

    const handleSaveClick = async () => {
        if (isSaving) return;

        haptic.light();
        const prevSaved = saved;
        setSaved(!prevSaved);
        setIsSaving(true);

        try {
            const result = await toggleSave(post.id, prevSaved);
            setSaved(result);
            if (result) {
                showToast({ title: "Saved", message: "Post saved to your collection.", type: "success", rank: "secondary" });
            }
        } catch (error) {
            setSaved(prevSaved);
            showToast({ title: "Error", message: "Could not save post.", type: "error", rank: "secondary" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SpotlightCard
            className={`
                p-5 sm:p-8 transition-all duration-500 ease-out animate-fade-in-up
                scale-100 opacity-0 shadow-2xl shadow-black/40 translate-y-4 z-10 
                hover:shadow-red-900/20 hover:-translate-y-1
                active:scale-[0.99] active:duration-150
                ${styles.border} group
                border-l-4
            `}
            spotlightColor="rgba(255, 255, 255, 0.08)"
            style={{
                animationDelay: `${delay}ms`,
                animationFillMode: 'forwards',
                borderLeftColor: typeColor.primary,
            }}
        >
            {/* Glow effect on hover (Secondary layer) */}
            <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none`} />
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-20 pointer-events-none" />

            {/* Moderation Overlay: Quarantined */}
            {post.moderation_status === 'quarantined' ? (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md border border-red-900/30 rounded-3xl p-6 text-center">
                    <div className="p-3 rounded-full bg-red-900/20 mb-3">
                        <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                    </div>
                    <h3 className="text-red-500 font-bold tracking-widest uppercase text-xs mb-1">System Action</h3>
                    <p className="text-zinc-500 text-sm">Content quarantined.</p>
                </div>
            ) : null}

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">

                {/* Left: Identity */}

                <button
                    onClick={handleIdentityClick}
                    className="flex items-center gap-3 group/id cursor-pointer"
                >
                    {post.is_anonymous ? (
                        <>
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700/50 group-hover/id:border-zinc-500 transition-colors shadow-sm overflow-hidden">
                                {post.author?.void_avatar ? (
                                    <img
                                        src={post.author.void_avatar}
                                        alt="Void Identity"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm">🌑</span>
                                )}
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-bold text-zinc-400 group-hover/id:text-zinc-200 transition-colors tracking-wide">
                                    {post.author?.void_name || "Anonymous"}
                                </span>
                                <span className="block text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
                                    Void Identity
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-xs font-mono font-bold text-white shadow-md shadow-red-900/20 group-hover/id:scale-110 transition-transform overflow-hidden relative">
                                {post.author?.avatar_url ? (
                                    <img
                                        src={post.author.avatar_url}
                                        alt={post.author.display_name || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    (post.author?.display_name || "U")[0]
                                )}
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-bold text-zinc-200 group-hover/id:text-white transition-colors tracking-wide">
                                    {post.author?.display_name || "User"}
                                </span>
                                <span className="block text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
                                    {post.author?.username ? `@${post.author.username}` : 'Real Identity'}
                                </span>
                            </div>
                        </>
                    )}
                </button>

                {/* Right: Tag & Time */}
                <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                        {/* Moderation Status (Mini) */}
                        {post.moderation_status === 'under_review' && (
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Under Review" />
                        )}
                        {post.moderation_status === 'flagged' && (
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" title="Flagged" />
                        )}

                        <span className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wide uppercase shadow-sm
                            ${styles.badge} transition-transform duration-300 group-hover:scale-105
                        `}>
                            <span className="text-sm">{config.icon}</span>
                            {config.label}
                        </span>
                    </div>

                    {/* Time relative to post creation */}
                    {(!post.moderation_status || post.moderation_status === 'active') && (
                        <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500 mr-1">
                            {formatPostTime(post.created_at)}
                        </span>
                    )}
                </div>
            </div>

            {/* Content w/ optional blur for Under Review */}
            <div className={`mb-6 relative z-10 ${post.moderation_status === 'under_review' ? 'blur-sm select-none opacity-50 grayscale transition-all duration-300 hover:blur-none hover:opacity-100' : ''}`}>
                {post.moderation_status === 'under_review' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <span className="bg-black/80 px-3 py-1.5 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest border border-white/10">
                            Visibility Limited
                        </span>
                    </div>
                )}

                {post.type === 'voice' && post.media_url ? (
                    <div className="mb-4">
                        <AudioPlayer src={post.media_url} />
                    </div>
                ) : null}

                {post.content && (
                    <p className="text-zinc-300 leading-relaxed font-medium text-[15px]">
                        {post.content}
                    </p>
                )}
            </div>

            {/* Actions */}
            {/* Actions Footer - Disable if quarantined (though handled by overlay above) */}
            <div className={`flex items-center justify-between pt-6 mt-2 border-t border-white/5 relative z-10 ${post.moderation_status === 'under_review' ? 'opacity-50 pointer-events-none' : ''}`}>

                {/* Social Group */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLikeClick}
                        disabled={isLiking}
                        className={`group flex items-center gap-2 transition-transform active:scale-90 duration-200 ${isLiking ? 'opacity-70' : ''} ${liked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'}`}
                        aria-label="Like"
                    >
                        <div className={`p-2 rounded-full transition-all duration-300 ${liked ? 'bg-red-500/10' : 'bg-white/5 group-hover:bg-red-500/10'}`}>
                            <svg
                                className={`w-5 h-5 transition-transform duration-300 ${liked ? 'scale-110 fill-current' : 'scale-100 hover:scale-110'}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                        </div>
                        <span className={`text-xs font-bold font-mono ${liked ? 'text-red-500' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                            {likeCount}
                        </span>
                    </button>

                    <button
                        onClick={onCommentClick}
                        className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-transform active:scale-90 duration-200"
                        aria-label="Comment"
                    >
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold font-mono text-zinc-500 group-hover:text-zinc-300">
                            {post.comment_count}
                        </span>
                    </button>

                    {/* Bookmark/Save Button */}
                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className={`group flex items-center gap-2 transition-transform active:scale-90 duration-200 ${isSaving ? 'opacity-70' : ''} ${saved ? 'text-yellow-500' : 'text-zinc-400 hover:text-yellow-500'}`}
                        aria-label="Save"
                    >
                        <div className={`p-2 rounded-full transition-colors ${saved ? 'bg-yellow-500/20' : 'bg-white/5 group-hover:bg-yellow-500/10'}`}>
                            <svg className={`w-5 h-5 transition-transform duration-300 ${saved ? 'fill-current scale-110' : 'group-hover:scale-110'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                    </button>
                </div>

                {/* Primary Action: Connect */}
                <button
                    onClick={onChatClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-red-900/10 active:scale-95 group transition-all duration-300"
                >
                    <span className="text-zinc-400 group-hover:text-white font-medium text-xs tracking-wide uppercase transition-colors">Connect</span>
                    <svg className="w-4 h-4 text-zinc-500 group-hover:text-red-500 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                    </svg>
                </button>

                {/* More / Report */}
                {/* <button className="absolute right-0 top-0 -mt-16 sm:mt-0 sm:relative p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                    </svg>
                </button> */}
            </div>
        </SpotlightCard>
    );
}

