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
import { FilterTab } from "@/components/feed/FilterTab";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { ComposeModal } from "@/components/compose/ComposeModal";
import { EmptyFeed } from "@/components/ui/EmptyState";

const NCR_DOMINION_ID = "660e8400-e29b-41d4-a716-446655440000";

const MOCK_POSTS = [
    {
        id: "1",
        type: "confession" as PostType,
        content: "I've been secretly studying in the library every night because I told everyone I don't study at all. The pressure of maintaining the 'effortlessly smart' image is killing me. 😭",
        is_anonymous: true,
        like_count: 47,
        comment_count: 12,
        created_at: "2h ago",
        author_id: "mock-user-1",
        dominion_id: NCR_DOMINION_ID,
        moderation_status: "active" as const,
        is_auto_zoned: true
    },
    {
        id: "2",
        type: "crush" as PostType,
        content: "To the person in the front row of the Data Structures class with the blue laptop - your smile literally makes my day. I'm too scared to say hi 🥹",
        is_anonymous: true,
        like_count: 89,
        comment_count: 23,
        created_at: "4h ago",
        author_id: "mock-user-2",
        dominion_id: NCR_DOMINION_ID,
        moderation_status: "active" as const,
        is_auto_zoned: true
    },
    {
        id: "3",
        type: "rumor" as PostType,
        content: "Heard the canteen is finally getting renovated next semester. New menu items coming apparently! 🍕",
        is_anonymous: true,
        like_count: 156,
        comment_count: 45,
        created_at: "6h ago",
        author_id: "mock-user-3",
        dominion_id: NCR_DOMINION_ID,
        moderation_status: "active" as const, // Normal
        is_auto_zoned: true
    },
    {
        id: "4",
        type: "rant" as PostType,
        content: "WHY does the WiFi always die exactly when I need to submit assignments?! It's like the router knows. 💀",
        is_anonymous: false,
        like_count: 234,
        comment_count: 67,
        created_at: "8h ago",
        author_id: "mock-user-4",
        dominion_id: NCR_DOMINION_ID,
        moderation_status: "flagged" as const, // TEST: Flagged state
        is_auto_zoned: true
    },
    {
        id: "5",
        type: "question" as PostType,
        content: "Anyone know any good spots near campus for late night study sessions? The library closes too early.",
        is_anonymous: true,
        like_count: 34,
        comment_count: 8,
        created_at: "10h ago",
        author_id: "mock-user-5",
        dominion_id: NCR_DOMINION_ID,
        moderation_status: "under_review" as const, // TEST: Under Review state
        is_auto_zoned: true
    }
];

function FeedContent() {
    const searchParams = useSearchParams();
    const activeFilter = searchParams.get("type") as PostType | "all" || "all";
    const router = useRouter();
    const { isFilterOpen, closeFilter } = useUI();

    const [showComposer, setShowComposer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
    // const [focusedPostId, setFocusedPostId] = useState<string | null>(null);

    const filteredPosts = activeFilter === "all"
        ? MOCK_POSTS
        : MOCK_POSTS.filter(p => p.type === activeFilter);

    // Simulate loading
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [activeFilter]);

    // Scroll Focus Logic Removed - Standard Feed Layout
    /* 
    useEffect(() => {
        // ... previous scroll logic ...
    }, []); 
    */

    const handleChatClick = async (postId: string, authorId: string, isAnonymous: boolean) => {
        try {
            const targetUserId = authorId || "mock-target-user-id";
            const chat = await createChat(postId, targetUserId);
            setActiveChatId(chat.id);
            setActiveChatRecipient(isAnonymous ? "Anonymous User" : "User");
        } catch (error) {
            console.error("Failed to start chat:", error);
            alert("Could not start chat. Make sure you are logged in.");
        }
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30">
            <LiquidBackground />

            {/* Navigation */}
            <Navbar />
            <MobileNav onComposeClick={() => setShowComposer(true)} />

            {/* Main Content Wrapper */}
            <main className="relative z-10 pt-16 pb-24 lg:pb-10 transition-all duration-300">
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
                <div className="px-4 md:px-6 space-y-8 max-w-3xl mx-auto">
                    {isLoading ? (
                        <PostCardSkeletonList count={3} />
                    ) : filteredPosts.length === 0 ? (
                        <EmptyFeed />
                    ) : (
                        filteredPosts.map((post, i) => (
                            <div key={post.id} data-id={post.id} className="post-wrapper transition-all duration-500">
                                <PostCard
                                    post={post}
                                    delay={i * 100} // Stagger by 100ms
                                    // isFocused={focusedPostId === post.id}
                                    onCommentClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                                    onChatClick={() => handleChatClick(post.id, post.author_id || "mock-id", post.is_anonymous)}
                                />

                                {/* Inline Comments */}
                                {activeCommentPostId === post.id && (
                                    <div className="mt-[-20px] mx-4 pt-6 bg-zinc-900/50 rounded-b-3xl border-x border-b border-white/5 animate-fade-in-down origin-top z-0 relative">
                                        <CommentSection
                                            postId={post.id}
                                            onClose={() => setActiveCommentPostId(null)}
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
                <ComposeModal onClose={() => setShowComposer(false)} />
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
