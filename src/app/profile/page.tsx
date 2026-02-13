"use client";

import { useState } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { MasonryGrid } from "@/components/profile/MasonryGrid";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { StatsPanel } from "@/components/profile/StatsPanel";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
// ... existing imports ...
import { PostType } from "@/types";
import { Heart } from "lucide-react";

// Mock data for created posts
const MOCK_CREATED_POSTS = Array.from({ length: 12 }).map((_, i) => ({
    id: `post-${i}`,
    type: ["confession", "rumor", "voice", "rant", "crush"][i % 5] as PostType | 'voice',
    content: i % 5 === 2
        ? "This is a voice note about the exam stress..."
        : [
            "I saw him at the library again. Should I say hi? 📚",
            "Why is the coffee machine always broken on Mondays? ☕️😤",
            "Just found out my roommate is a secret millionaire. 💸",
            "The sunset from the roof is insane today. 🌅",
            "Lost my ID card for the 3rd time this sem. I'm doomed. 💀"
        ][i % 5],
    media_url: i % 5 === 2 ? "/mock_audio.mp3" : undefined,
    is_anonymous: i % 3 !== 0,
    like_count: 12 + i * 5,
    comment_count: 3 + i,
    created_at: `${i + 1}h ago`,
}));

export default function ProfilePage() {
    const [profileData, setProfileData] = useState({
        name: "Fons Mans",
        bio: "@fonsmans • UI/UX Designer creating digital experiences.",
        avatar: "👀",
        followers: "294k",
        following: "120"
    });

    const [activeTab, setActiveTab] = useState<"created" | "saved" | "stats">("created");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [savedPosts] = useState<typeof MOCK_CREATED_POSTS>([]);

    // Crush Feature State
    const [admirerCount, setAdmirerCount] = useState(12); // Mock initial count
    const [hasCrushed, setHasCrushed] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false); // Default to FALSE to show the crush button immediately

    const handleMarkCrush = () => {
        if (hasCrushed) {
            // Unmark
            setHasCrushed(false);
            setAdmirerCount(prev => prev - 1);
            // In real app, call crushService.removeCrush(userId)
        } else {
            // Mark
            setHasCrushed(true);
            setAdmirerCount(prev => prev + 1);
            // In real app, call crushService.markCrush(userId)
            // alert("💘 You marked this user as your crush anonymously!"); // Removed alert for smoother UX
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            // Simple alert for now - could replace with toast notification
            alert("Profile link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleSaveProfile = (data: { name: string; bio: string; avatar: string }) => {
        setProfileData({
            ...profileData,
            name: data.name,
            bio: data.bio,
            avatar: data.avatar
        });
    };

    const displayedPosts = activeTab === "created" ? MOCK_CREATED_POSTS : savedPosts;
    const isStatsTab = activeTab === "stats";

    return (
        <div className="min-h-screen text-white relative bg-black selection:bg-red-600/30">
            <LiquidBackground />
            <ProfileHeader username={profileData.name} />

            <main className="pb-20 pt-16">
                {/* Hero Section - Centered & Soft */}
                <div className="flex flex-col items-center text-center px-6 mb-6">
                    {/* Avatar */}
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-32 h-32 rounded-full p-1 bg-white/10 mb-4 animate-fade-in-up cursor-pointer hover:scale-105 transition-transform"
                    >
                        <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden relative">
                            <div className="absolute inset-0 flex items-center justify-center text-5xl">
                                {profileData.avatar}
                            </div>
                        </div>
                    </button>

                    {/* Name & Bio */}
                    <h1 className="text-3xl font-bold mb-1 tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        {profileData.name}
                    </h1>
                    <p className="text-zinc-400 text-sm mb-4 max-w-xs mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        {profileData.bio}
                    </p>

                    {/* Stats - Text Based */}
                    <div className="flex items-center gap-4 text-sm font-medium text-zinc-300 mb-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <span><span className="text-white font-bold">{profileData.followers}</span> followers</span>
                        <span>•</span>
                        <span><span className="text-white font-bold">{profileData.following}</span> following</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-8 w-full max-w-xs animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <button
                            onClick={handleShare}
                            className="flex-1 bg-white text-black font-bold py-3 rounded-full hover:bg-zinc-200 transition-transform active:scale-95 shadow-lg shadow-white/10"
                        >
                            Share
                        </button>

                        {isOwnProfile && (
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-full hover:bg-zinc-700 transition-transform active:scale-95 border border-white/5"
                            >
                                Edit Profile
                            </button>
                        )}

                        <button
                            onClick={handleMarkCrush}
                            className={`
                                    w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 border backdrop-blur-md
                                    ${hasCrushed
                                    ? "bg-rose-500/10 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-110"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-90"
                                }
                                `}
                            title={hasCrushed ? "You have a crush on this user" : "Mark as Crush"}
                        >
                            <Heart
                                size={24}
                                className={`transition-all duration-300 ${hasCrushed
                                    ? "fill-rose-500 text-rose-500 animate-pulse-glow drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                                    : "text-zinc-400 group-hover:text-white"
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Filter Tabs - Pill Shape */}
                    <div className="flex items-center gap-4 mb-2 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <button
                            onClick={() => setActiveTab("created")}
                            className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${activeTab === "created"
                                ? "bg-white text-black shadow-lg"
                                : "bg-transparent text-zinc-400 hover:text-white"
                                }`}
                        >
                            Created
                        </button>
                        <button
                            onClick={() => setActiveTab("saved")}
                            className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${activeTab === "saved"
                                ? "bg-white text-black shadow-lg"
                                : "bg-transparent text-zinc-400 hover:text-white"
                                }`}
                        >
                            Saved
                        </button>
                        <button
                            onClick={() => setActiveTab("stats")}
                            className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${activeTab === "stats"
                                ? "bg-white text-black shadow-lg"
                                : "bg-transparent text-zinc-400 hover:text-white"
                                }`}
                        >
                            Stats
                        </button>
                    </div>
                </div>

                {/* Conditional Rendering: Masonry Grid or Stats Panel */}
                {isStatsTab ? <StatsPanel admirerCount={admirerCount} /> : <MasonryGrid posts={displayedPosts} />}
            </main>

            <MobileNav />

            {/* Edit Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentData={profileData}
                onSave={handleSaveProfile}
            />
        </div>
    );
}
