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

const typeStyles: Record<PostType | 'voice', { text: string; glow: string; border: string }> = {
    confession: { text: 'text-red-400', glow: 'from-red-500/10 via-black/0', border: 'border-red-500/20 group-hover:border-red-500/40' },
    rumor: { text: 'text-amber-400', glow: 'from-amber-500/10 via-black/0', border: 'border-amber-500/20 group-hover:border-amber-500/40' },
    crush: { text: 'text-rose-400', glow: 'from-rose-500/10 via-black/0', border: 'border-rose-500/20 group-hover:border-rose-500/40' },
    rant: { text: 'text-orange-400', glow: 'from-orange-500/10 via-black/0', border: 'border-orange-500/20 group-hover:border-orange-500/40' },
    question: { text: 'text-zinc-300', glow: 'from-white/5 via-black/0', border: 'border-white/10 group-hover:border-white/20' },
    voice: { text: 'text-purple-400', glow: 'from-purple-500/10 via-black/0', border: 'border-purple-500/20 group-hover:border-purple-500/40' },
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
                bg-black/80 backdrop-blur-3xl
                shadow-[0_8px_30px_rgb(0,0,0,0.4)]
                border ${styles.border} transition-colors duration-500
                shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                group relative overflow-hidden rounded-[24px]
            `}
            spotlightColor="rgba(255, 255, 255, 0.05)"
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


            {/* Subtle ambient glow on hover & Noise Texture */}
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.glow} opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0`} />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent transition-opacity duration-700 opacity-0 group-hover:opacity-100 pointer-events-none rounded-[24px]" />
            <div className="absolute -inset-px rounded-[24px] bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

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
                            <div className="w-9 h-9 rounded-full bg-zinc-900/90 flex items-center justify-center ring-1 ring-white/10 group-hover/id:ring-white/20 transition-all duration-500 shadow-inner overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
                                {post.author?.void_avatar ? (
                                    <img
                                        src={post.author.void_avatar}
                                        alt="Void Identity"
                                        className="w-full h-full object-cover relative z-10 brightness-90 group-hover/id:brightness-110 transition-all duration-500"
                                    />
                                ) : (
                                    <span className="text-sm relative z-10">🌑</span>
                                )}
                            </div>
                            <div className="text-left flex flex-col justify-center">
                                <span className="block text-[14px] font-semibold text-white/90 group-hover/id:text-white transition-colors tracking-tight">
                                    {post.author?.void_name || "Anonymous"}
                                </span>
                                <span className="block text-[11px] text-zinc-500 font-medium tracking-wide mt-0.5">
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
                                        <div className="absolute -inset-2 rounded-full bg-red-600/10 blur-md animate-pulse z-0" />
                                        <div className="absolute -inset-1 rounded-full border border-red-500/20 blur-[1px] z-0" />
                                    </>
                                )}
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-inner overflow-hidden relative z-10 group-hover/id:scale-105 transition-all duration-500 ${post.author_shadow_aura ? 'bg-gradient-to-br from-red-950 via-red-900 to-black ring-1 ring-red-500/30' : 'bg-zinc-900/90 ring-1 ring-white/10 group-hover/id:ring-white/20'}`}>
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
                                    {post.author?.avatar_url ? (
                                        <img
                                            src={post.author.avatar_url}
                                            alt={post.author.display_name || "User"}
                                            className="w-full h-full object-cover relative z-10 brightness-90 group-hover/id:brightness-110 transition-all duration-500"
                                        />
                                    ) : (
                                        <span className="relative z-10">{(post.author?.display_name || "U")[0]}</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-left flex flex-col justify-center">
                                <div className="flex items-center gap-1.5">
                                    <span className="block text-[14px] font-semibold text-white/90 group-hover/id:text-white transition-colors tracking-tight line-clamp-1">
                                        {post.author?.display_name || "User"}
                                    </span>
                                    {post.author_shadow_aura && (
                                        <Crown size={12} className="text-red-500/80 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                                    )}
                                </div>
                                <span className="block text-[11px] text-zinc-500 font-medium tracking-wide line-clamp-1 mt-0.5">
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

                        <div className={`
                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                            bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner
                            transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-white/[0.12]
                        `}>
                            <span className="text-[12px] opacity-80">{config.icon}</span>
                            <span className={`text-[10px] font-medium tracking-wide uppercase ${styles.text}`}>
                                {config.label}
                            </span>
                        </div>
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

                {/* Subtle Background Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[100px] opacity-[0.015] pointer-events-none select-none saturate-0 pointer-events-none z-0">
                    {config.icon}
                </div>

                {post.moderation_status === 'under_review' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <span className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-semibold text-zinc-400 uppercase tracking-widest border border-white/10">
                            Visibility Limited
                        </span>
                    </div>
                )}

                {post.type === 'voice' && post.media_url ? (
                    <div className="mb-4 relative z-10">
                        <AudioPlayer src={post.media_url} />
                    </div>
                ) : null}

                {post.content && (
                    <div className="relative z-10 p-5 mt-3 rounded-[16px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm group-hover:border-white/[0.08] transition-colors duration-500">
                        <p className="text-white leading-[1.7] font-medium text-[16px] sm:text-[17px] tracking-tight whitespace-pre-wrap drop-shadow-sm">
                            {post.content}
                        </p>
                    </div>
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCrushClick}
                            disabled={isCrushing || hasCrushed}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-500 active:scale-95 group/btn
                                ${hasCrushed
                                    ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-[inset_0_1px_0_rgba(236,72,153,0.1)]'
                                    : 'bg-transparent border-white/[0.08] hover:bg-pink-500/5 hover:border-pink-500/20 text-zinc-400 hover:text-pink-300'
                                }`}
                        >
                            <Sparkles size={12} className={`transition-all duration-500 ${hasCrushed ? "fill-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]" : "group-hover/btn:animate-pulse"}`} />
                            <span className="text-[10px] font-semibold uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-300">
                                {hasCrushed ? 'Crushed' : 'Crush'}
                            </span>
                        </button>

                        <button
                            onClick={onChatClick}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] active:scale-95 group/btn transition-all duration-500 shadow-inner"
                        >
                            <span className="text-zinc-300 group-hover/btn:text-white font-medium text-[11px] tracking-wide uppercase transition-colors">Connect</span>
                            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-white transition-all duration-500 group-hover/btn:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
