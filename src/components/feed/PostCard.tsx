"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { POST_CONFIG, PostType } from "@/types";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { AudioPlayer } from "@/components/feed/AudioPlayer";
import { haptic } from "@/lib/utils/haptic";
import { getPostTypeColor } from "@/lib/utils/postTypeColors";
import { formatPostTime } from "@/lib/utils/formatTime";

interface Post {
    id: string;
    type: PostType;
    content: string;
    media_url?: string;
    is_anonymous: boolean;
    like_count: number;
    comment_count: number;
    created_at: string;
    author_id?: string;
    author_shadow_aura?: boolean;
    author?: {
        display_name?: string;
        void_name?: string;
        avatar_url?: string;
        void_avatar?: string;
        username?: string;
    };
    moderation_status?: 'active' | 'under_review' | 'flagged' | 'quarantined';
    hasLiked?: boolean;
    hasSaved?: boolean;
}

const typeStyles: Record<PostType | 'voice', { badge: string; border: string }> = {
    confession: { badge: 'bg-red-600/10 text-red-500 border-red-600/20', border: 'group-hover:border-red-600/30' },
    rumor: { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', border: 'group-hover:border-amber-500/30' },
    crush: { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20', border: 'group-hover:border-rose-500/30' },
    rant: { badge: 'bg-orange-600/10 text-orange-500 border-orange-600/20', border: 'group-hover:border-orange-600/30' },
    question: { badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', border: 'group-hover:border-zinc-500/30' },
    voice: { badge: 'bg-purple-600/10 text-purple-400 border-purple-500/20', border: 'group-hover:border-purple-500/30' },
};

import { useToast } from "@/lib/context/ToastContext";
import { toggleLike, toggleSave } from "@/lib/services/interactions";
import { crushService } from "@/lib/services/crush";
import { Sparkles, Heart, Crown } from "lucide-react";

export function PostCard({
    post,
    delay,
    onCommentClick,
    onChatClick,
    currentUserId,
    isFocused = true
}: {
    post: Post;
    delay: number;
    onCommentClick?: () => void;
    onChatClick?: () => void;
    currentUserId?: string;
    isFocused?: boolean;
}) {
    const { showToast } = useToast();

    // Interaction States
    const [liked, setLiked] = useState(post.hasLiked || false);
    const [likeCount, setLikeCount] = useState(post.like_count || 0);
    const [saved, setSaved] = useState(post.hasSaved || false);
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Long-press state for mobile save
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [longPressProgress, setLongPressProgress] = useState(0);
    const [hasCrushed, setHasCrushed] = useState(false);
    const [isCrushing, setIsCrushing] = useState(false);
    const longPressAnimationRef = useRef<number | null>(null);
    const longPressStartRef = useRef<number>(0);
    const LONG_PRESS_DURATION = 4000; // 4 seconds

    // Check if this is the current user's own post
    const isOwnPost = currentUserId && post.author_id === currentUserId;

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
            console.log("Navigate to profile:", post.author?.username);
        }
    };

    const handleLikeClick = async () => {
        if (isLiking) return;

        haptic.like();
        const prevLiked = liked;
        const prevCount = likeCount;

        setLiked(!prevLiked);
        setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
        setIsLiking(true);

        try {
            const res = await toggleLike(post.id, prevCount, prevLiked);
            setLiked(res.isLiked);
            setLikeCount(res.likeCount);
        } catch (error) {
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

    const handleCrushClick = async () => {
        if (isCrushing || hasCrushed || isOwnPost) return;

        haptic.success();
        setIsCrushing(true);

        try {
            const authorId = post.author_id;
            if (!authorId) throw new Error("No author ID");

            const result = await crushService.markCrush(authorId);
            if (result.success) {
                setHasCrushed(true);
                showToast({
                    title: "Crush Marked!",
                    message: "Identity encrypted. They'll only see the total count.",
                    type: "success",
                    rank: "primary"
                });
            } else {
                showToast({ title: "Note", message: result.message || "Unable to mark crush", type: "info", rank: "secondary" });
            }
        } catch (error) {
            showToast({ title: "Neural Link Error", message: "Failed to transmit crush signal.", type: "error", rank: "secondary" });
        } finally {
            setIsCrushing(false);
        }
    };

    // Check crush status on load
    useEffect(() => {
        if (!currentUserId || !post.author_id || isOwnPost) return;
        async function checkCrush() {
            const crushed = await crushService.hasCrushed(post.author_id!);
            setHasCrushed(crushed);
        }
        checkCrush();
    }, [currentUserId, post.author_id, isOwnPost]);

    // Long-press handlers for mobile save
    const startLongPress = useCallback((e: React.TouchEvent) => {
        // Only handle single finger touch
        if (e.touches.length !== 1) return;

        longPressStartRef.current = Date.now();

        const animate = () => {
            const elapsed = Date.now() - longPressStartRef.current;
            const progress = Math.min(elapsed / LONG_PRESS_DURATION, 1);
            setLongPressProgress(progress);

            if (progress < 1) {
                longPressAnimationRef.current = requestAnimationFrame(animate);
            }
        };

        longPressAnimationRef.current = requestAnimationFrame(animate);

        longPressTimerRef.current = setTimeout(() => {
            haptic.light();
            handleSaveClick();
            cancelLongPress();
        }, LONG_PRESS_DURATION);
    }, [saved, isSaving]);

    const cancelLongPress = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        if (longPressAnimationRef.current) {
            cancelAnimationFrame(longPressAnimationRef.current);
            longPressAnimationRef.current = null;
        }
        setLongPressProgress(0);
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
            if (longPressAnimationRef.current) cancelAnimationFrame(longPressAnimationRef.current);
        };
    }, []);

    return (
        <SpotlightCard
            className={`
                p-5 sm:p-6 transition-all duration-500 ease-out animate-fade-in-up
                scale-100 opacity-0 translate-y-4 z-10
                hover:-translate-y-0.5
                active:scale-[0.998] active:duration-150
                ${styles.border} group
                relative overflow-hidden
            `}
            spotlightColor="rgba(255, 255, 255, 0.04)"
            style={{
                animationDelay: `${delay}ms`,
                animationFillMode: 'forwards',
            }}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
            onTouchCancel={cancelLongPress}
            onTouchMove={cancelLongPress}
        >
            {/* Long-press progress indicator */}
            {longPressProgress > 0 && (
                <div className="absolute inset-0 z-50 pointer-events-none rounded-3xl overflow-hidden">
                    <div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-yellow-500 to-amber-400 transition-none"
                        style={{ width: `${longPressProgress * 100}%` }}
                    />
                    {longPressProgress > 0.2 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-500/30 flex items-center gap-2">
                                <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                                <span className="text-xs font-bold text-yellow-400">
                                    {saved ? 'Unsaving...' : 'Saving...'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}


            {/* Subtle ambient glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent transition-opacity duration-700 opacity-0 group-hover:opacity-100 pointer-events-none rounded-2xl" />
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

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
                            <div className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center border border-zinc-700/30 group-hover/id:border-zinc-600/50 transition-all duration-300 shadow-sm shadow-black/20 overflow-hidden">
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
                                <span className="block text-[13px] font-semibold text-zinc-400 group-hover/id:text-zinc-200 transition-colors tracking-wide">
                                    {post.author?.void_name || "Anonymous"}
                                </span>
                                <span className="block text-[10px] text-zinc-600/80 font-mono uppercase tracking-[0.1em] mt-0.5">
                                    Void Identity
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                {/* Shadow Aura Effect for PostCard */}
                                {post.author_shadow_aura && (
                                    <>
                                        <div className="absolute -inset-1.5 rounded-full bg-red-600/20 blur-sm animate-pulse z-0" />
                                        <div className="absolute -inset-1 rounded-full border border-red-900/40 animate-spin-slow z-0" />
                                    </>
                                )}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-md overflow-hidden relative z-10 group-hover/id:scale-105 transition-all duration-300 ${post.author_shadow_aura ? 'bg-gradient-to-br from-red-900 via-red-800 to-black shadow-red-900/40' : 'bg-gradient-to-br from-red-600 to-rose-600 shadow-red-900/20'}`}>
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
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-1.5">
                                    <span className="block text-[13px] font-semibold text-zinc-200 group-hover/id:text-white transition-colors tracking-wide line-clamp-1">
                                        {post.author?.display_name || "User"}
                                    </span>
                                    {post.author_shadow_aura && (
                                        <Crown size={10} className="text-red-500 animate-pulse" />
                                    )}
                                </div>
                                <span className="block text-[10px] text-zinc-600/80 font-mono uppercase tracking-[0.1em] line-clamp-1 mt-0.5">
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
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-semibold tracking-widest uppercase
                            ${styles.badge} transition-all duration-300 group-hover:scale-[1.02]
                        `}>
                            <span className="text-xs">{config.icon}</span>
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
            <div className={`mb-4 relative z-10 ${post.moderation_status === 'under_review' ? 'blur-sm select-none opacity-50 grayscale transition-all duration-300 hover:blur-none hover:opacity-100' : ''}`}>
                {post.moderation_status === 'under_review' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <span className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-semibold text-zinc-400 uppercase tracking-widest border border-white/10">
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
                    <p className="text-zinc-300/90 leading-[1.75] font-normal text-[14.5px] tracking-[0.01em]">
                        {post.content}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className={`flex items-center justify-between pt-3 mt-1 border-t border-white/[0.04] relative z-10 ${post.moderation_status === 'under_review' ? 'opacity-50 pointer-events-none' : ''}`}>

                {/* Social Group */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLikeClick}
                        disabled={isLiking}
                        className={`group flex items-center gap-1.5 transition-all active:scale-90 duration-200 ${isLiking ? 'opacity-70' : ''} ${liked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}
                        aria-label="Like"
                    >
                        <div className={`p-1.5 rounded-full transition-all duration-300 ${liked ? 'bg-red-500/10' : 'hover:bg-red-500/5'}`}>
                            <svg
                                className={`w-[18px] h-[18px] transition-transform duration-300 ${liked ? 'scale-110 fill-current' : 'scale-100 hover:scale-105'}`}
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
                        <span className={`text-xs font-semibold font-mono tabular-nums ${liked ? 'text-red-500' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                            {likeCount}
                        </span>
                    </button>

                    <button
                        onClick={onCommentClick}
                        className="group flex items-center gap-1.5 text-zinc-500 hover:text-white transition-all active:scale-90 duration-200"
                        aria-label="Comment"
                    >
                        <div className="p-1.5 rounded-full hover:bg-white/5 transition-colors">
                            <svg className="w-[18px] h-[18px] transition-transform duration-300 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold font-mono tabular-nums text-zinc-500 group-hover:text-zinc-400">
                            {post.comment_count}
                        </span>
                    </button>

                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className={`hidden sm:flex group items-center gap-1.5 transition-all active:scale-90 duration-200 ${isSaving ? 'opacity-70' : ''} ${saved ? 'text-yellow-500' : 'text-zinc-500 hover:text-yellow-500'}`}
                        aria-label="Save"
                    >
                        <div className={`p-1.5 rounded-full transition-colors ${saved ? 'bg-yellow-500/10' : 'hover:bg-yellow-500/5'}`}>
                            <svg className={`w-[18px] h-[18px] transition-transform duration-300 ${saved ? 'fill-current scale-105' : 'group-hover:scale-105'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                    </button>

                    {/* Mobile saved indicator (no button, just a badge if already saved) */}
                    {saved && (
                        <div className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                            <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            <span className="text-[9px] font-bold text-yellow-500 uppercase">Saved</span>
                        </div>
                    )}
                </div>

                {/* Primary Action: Connect / Crush — hidden for own posts */}
                {!isOwnPost && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCrushClick}
                            disabled={isCrushing || hasCrushed}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 active:scale-95 group
                                ${hasCrushed
                                    ? 'bg-pink-500/10 border-pink-500/20 text-pink-500'
                                    : 'bg-transparent border-white/[0.06] hover:bg-pink-500/10 hover:border-pink-500/20 text-zinc-500 hover:text-pink-400'
                                }`}
                        >
                            <Sparkles size={12} className={hasCrushed ? "fill-current" : "group-hover:animate-spin"} />
                            <span className="text-[10px] font-semibold uppercase tracking-widest">
                                {hasCrushed ? 'Crushed' : 'Crush'}
                            </span>
                        </button>

                        <button
                            onClick={onChatClick}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] active:scale-95 group transition-all duration-300"
                        >
                            <span className="text-zinc-400 group-hover:text-white font-medium text-[11px] tracking-wide uppercase transition-colors">Connect</span>
                            <svg className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-500 transition-all duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </SpotlightCard>
    );
}
