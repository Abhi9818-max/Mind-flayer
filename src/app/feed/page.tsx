"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useUI } from "@/lib/context/UIContext";
import { POST_CONFIG, PostType } from "@/types";
import { PostCard } from "@/components/feed/PostCard";
import { PostCardSkeletonList } from "@/components/feed/PostCardSkeleton";
import { CommentSection } from "@/components/feed/CommentSection";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Navbar } from "@/components/layout/Navbar";
// import { Sidebar } from "@/components/layout/Sidebar"; // Removed
import { MobileNav } from "@/components/layout/MobileNav";
import { createChat } from "@/lib/services/chat";
import { getPosts } from "@/lib/services/posts";
import { getUserInteractions } from "@/lib/services/interactions";
import { FilterTab } from "@/components/feed/FilterTab";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { EmptyFeed } from "@/components/ui/EmptyState";
import { VerificationBanner } from "@/components/layout/VerificationBanner";
import { useToast } from "@/lib/context/ToastContext";
import { achievementService, EarnedAchievement, AchievementDef } from "@/lib/services/achievements";
import { AchievementCelebration } from "@/components/ui/AchievementCelebration";

const NCR_DOMINION_ID = "660e8400-e29b-41d4-a716-446655440000";

function FeedContent() {
    const searchParams = useSearchParams();
    const activeFilter = searchParams.get("type") as PostType | "all" || "all";
    const router = useRouter();
    const { isFilterOpen, closeFilter } = useUI();
    const { showToast } = useToast();

    const [showComposer, setShowComposer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [posts, setPosts] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [unseenAchievements, setUnseenAchievements] = useState<(EarnedAchievement & AchievementDef)[]>([]);
    const [showCelebration, setShowCelebration] = useState(false);

    const handleFilterClick = (type: PostType | "all") => {
        if (type === "all") {
            router.push("/feed");
        } else {
            router.push(`/feed?type=${type}`);
        }
        closeFilter();
    };

    // Interaction State
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [activeChatRecipient, setActiveChatRecipient] = useState<string | null>(null);

    // Get current user ID & check achievements
    useEffect(() => {
        async function fetchUserAndAchievements() {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);

                // Check & award new achievements silently
                try {
                    await achievementService.checkAndAward(user.id);
                    const unseen = await achievementService.getUnseen(user.id);
                    if (unseen.length > 0) {
                        setUnseenAchievements(unseen);
                        setShowCelebration(true);
                    }
                } catch (e) {
                    console.error('Achievement check failed:', e);
                }
            }
        }
        fetchUserAndAchievements();
    }, []);

    // Fetch Posts from Supabase
    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const fetchedPosts = await getPosts(activeFilter);

                // Fetch interaction states (likes/saves)
                const postIds = fetchedPosts.map((p: any) => p.id);
                const interactionsMap = await getUserInteractions(postIds);

                const postsWithInteractions = fetchedPosts.map((post: any) => ({
                    ...post,
                    hasLiked: interactionsMap[post.id]?.hasLiked || false,
                    hasSaved: interactionsMap[post.id]?.hasSaved || false
                }));

                setPosts(postsWithInteractions);
            } catch (error) {
                console.error("Error loading feed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [activeFilter, refreshTrigger]);

    const filteredPosts = posts;

    // Scroll Focus Logic Removed - Standard Feed Layout
    /* 
    useEffect(() => {
        // ... previous scroll logic ...
    }, []); 
    */

    const handleChatClick = async (post: any) => {
        try {
            const targetUserId = post.author_id || "mock-target-user-id";
            const chat = await createChat(post.id, targetUserId);
            setActiveChatId(chat.id);
            const recipientName = post.is_anonymous
                ? (post.author?.void_name || "Anonymous User")
                : (post.author?.display_name || "User");
            setActiveChatRecipient(recipientName);
        } catch (error) {
            console.error("Failed to start chat:", error);
            showToast({
                title: "Connection Failed",
                message: "Could not establish telepathic link. Ensure you are logged in.",
                type: "error",
                rank: "primary"
            });
        }
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30">
            <LiquidBackground />

            {/* Navigation */}
            <Navbar />
            <MobileNav onComposeClick={() => setShowComposer(true)} />
            <VerificationBanner />

            {/* Main Content Wrapper */}
            <main className="relative z-10 pt-[calc(env(safe-area-inset-top,20px)+72px)] sm:pt-24 pb-24 lg:pb-10 transition-all duration-300">
                {/* Filter Panel (Pushes content down) */}
                <div className={`
                    w-full bg-[#09090b]/50 border-b border-white/5 overflow-hidden transition-all duration-300 ease-in-out
                    ${isFilterOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}
                `}>
                    <div className="flex flex-wrap justify-center gap-2 px-4 max-w-2xl mx-auto">
                        <FilterTab
                            active={activeFilter === "all"}
                            onClick={() => handleFilterClick("all")}
                            icon="👁️"
                            label="All"
                        />
                        {Object.entries(POST_CONFIG).map(([type, config]) => (
                            <FilterTab
                                key={type}
                                active={activeFilter === type}
                                onClick={() => handleFilterClick(type as PostType)}
                                icon={config.icon}
                                label={config.label}
                                type={type as PostType}
                            />
                        ))}
                    </div>
                </div>
                {/* Header (Mobile Only) - Removed per user request */}
                {/* <div className="px-6 py-3 flex items-center justify-between lg:hidden sticky top-16 z-40 bg-black/80 backdrop-blur-md border-b border-white/5">...</div> */}

                {/* Header Section */}
                {/* Header Section */}
                {/* Header Section */}
                {/* Header Section */}
                {/* Header Section */}
                <div className="px-4 pb-0 lg:pb-12 lg:pt-12 flex flex-col items-center text-center space-y-4 lg:space-y-8">
                    <div className="space-y-2 hidden lg:block">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 animate-fade-in-up">
                            The Stream
                        </h1>
                        <p className="text-zinc-400 font-medium text-lg max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            Live whispers from the void. <span className="text-red-500/80">Don't blink.</span>
                        </p>
                    </div>

                    {/* Compose Trigger (Desktop Only) */}
                    <button
                        onClick={() => setShowComposer(true)}
                        className="hidden lg:inline-flex group relative items-center justify-center gap-3 px-8 py-3 rounded-full bg-red-600 text-white font-bold tracking-wide shadow-lg shadow-red-600/20 hover:scale-105 hover:shadow-red-600/40 transition-all duration-300 animate-fade-in-up"
                        style={{ animationDelay: '0.2s' }}
                    >
                        <span className="text-xl group-hover:rotate-12 transition-transform">✨</span>
                        <span>Share a Secret</span>
                    </button>

                    {/* Active Filter Indicator (Optional, to show current state if needed, or remove completely) */}
                    {activeFilter !== 'all' && (
                        <div className="animate-fade-in flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 text-red-200 border border-red-500/30 text-xs font-bold">
                                <span>Filtering:</span>
                                <span>{POST_CONFIG[activeFilter as PostType]?.icon}</span>
                                <span>{POST_CONFIG[activeFilter as PostType]?.label}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* The Stream Feed */}
                <div className="px-4 md:px-6 space-y-4 max-w-3xl mx-auto">
                    {isLoading ? (
                        <PostCardSkeletonList count={3} />
                    ) : filteredPosts.length === 0 ? (
                        <EmptyFeed />
                    ) : (
                        filteredPosts.map((post, i) => (
                            <div key={post.id} data-id={post.id} className="post-wrapper transition-all duration-500">
                                <PostCard
                                    post={post}
                                    delay={i * 100}
                                    currentUserId={currentUserId || undefined}
                                    onCommentClick={() => {
                                        // Mobile: navigate to full-page comments
                                        if (window.innerWidth < 768) {
                                            router.push(`/comments/${post.id}`);
                                        } else {
                                            // Desktop: toggle inline comments
                                            setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id);
                                        }
                                    }}
                                    onChatClick={() => handleChatClick(post)}
                                />

                                {/* Inline Comments */}
                                {activeCommentPostId === post.id && (
                                    <div className="mt-[-20px] mx-4 pt-6 bg-zinc-900/50 rounded-b-3xl border-x border-b border-white/5 animate-fade-in-down origin-top z-0 relative">
                                        <CommentSection
                                            postId={post.id}
                                            onClose={() => setActiveCommentPostId(null)}
                                            initialCount={post.comment_count || 0}
                                        />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* "End of Stream" / Load More Loading State */}
                <div className="flex justify-center pt-20 pb-32">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm animate-pulse">
                        <div className="h-2 w-2 rounded-full bg-red-600/80" />
                        <div className="h-2 w-2 rounded-full bg-red-600/80" style={{ animationDelay: '0.2s' }} />
                        <div className="h-2 w-2 rounded-full bg-red-600/80" style={{ animationDelay: '0.4s' }} />
                        <span className="ml-2 font-medium tracking-widest uppercase text-xs text-red-500/80">Drifting deeper...</span>
                    </div>
                </div>
            </main>

            {/* Modals & Overlays */}
            {showComposer && (
                <ComposeModal
                    onClose={() => setShowComposer(false)}
                    onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}

            {/* {activeCommentPostId && (
                <CommentSection
                    postId={activeCommentPostId}
                    onClose={() => setActiveCommentPostId(null)}
                />
            )} */}

            {activeChatId && (
                <ChatWindow
                    chatId={activeChatId}
                    recipientName={activeChatRecipient || "Anonymous"}
                    onClose={() => setActiveChatId(null)}
                />
            )}

            {/* Achievement Celebration */}
            {showCelebration && unseenAchievements.length > 0 && (
                <AchievementCelebration
                    achievements={unseenAchievements}
                    onComplete={() => {
                        setShowCelebration(false);
                        setUnseenAchievements([]);
                    }}
                />
            )}
        </div>
    );
}

export default function FeedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="flex items-center gap-2 text-zinc-500 text-sm animate-pulse">
                    <div className="h-2 w-2 rounded-full bg-red-600/80" />
                    <div className="h-2 w-2 rounded-full bg-red-600/80" style={{ animationDelay: '0.2s' }} />
                    <div className="h-2 w-2 rounded-full bg-red-600/80" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        }>
            <FeedContent />
        </Suspense>
    );
}
