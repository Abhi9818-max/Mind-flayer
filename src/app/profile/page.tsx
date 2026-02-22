"use client";

import { useState, useEffect } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navbar } from "@/components/layout/Navbar";
import { Bookmark, Edit3, MapPin, Heart, Settings, Grid3x3, BarChart3, Share2, LogOut, Zap, Eye, TrendingUp, Crown, Sparkles, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "@/components/feed/PostCard";
import { SettingsView } from "@/components/settings/SettingsView";
import { getPosts } from "@/lib/services/posts";
import { getUserInteractions, getSavedPosts } from "@/lib/services/interactions";
import { useToast } from "@/lib/context/ToastContext";
import { crushService } from "@/lib/services/crush";
import { followService } from "@/lib/services/follow";
import { achievementService, ACHIEVEMENTS, EarnedAchievement, AchievementDef } from "@/lib/services/achievements";

export default function ProfilePage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"posts" | "saved" | "stats" | "settings">("posts");
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [crushCount, setCrushCount] = useState(0);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [earnedBadges, setEarnedBadges] = useState<(EarnedAchievement & AchievementDef)[]>([]);

    useEffect(() => {
        async function fetchProfile() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const isAdmin = user.email === 'veritas9818@gmail.com';

            try {
                const profile = await import('@/lib/services/user').then(m => m.getUserProfile());
                if (profile) setUserProfile({ ...profile, isAdmin });
            } catch (e) {
                console.error("Failed to load profile", e);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    useEffect(() => {
        if (!userProfile?.id) return;
        async function fetchSocialCounts() {
            const [crushes, followers, following, badges] = await Promise.all([
                crushService.getAdmirerCount(userProfile.id),
                followService.getFollowerCount(userProfile.id),
                followService.getFollowingCount(userProfile.id),
                achievementService.getUserAchievements(userProfile.id),
            ]);
            setCrushCount(crushes);
            setFollowerCount(followers);
            setFollowingCount(following);
            setEarnedBadges(badges);
        }
        fetchSocialCounts();
    }, [userProfile]);

    useEffect(() => {
        async function fetchUserFeed() {
            if (!userProfile?.id) return;
            setLoadingPosts(true);
            try {
                const allPosts = await getPosts("all");
                const myPosts = allPosts.filter((p: any) => p.author_id === userProfile.id);
                const postIds = myPosts.map((p: any) => p.id);
                const interactionsMap = await getUserInteractions(postIds);
                const postsWithInteractions = myPosts.map((post: any) => ({
                    ...post,
                    hasLiked: interactionsMap[post.id]?.hasLiked || false,
                    hasSaved: interactionsMap[post.id]?.hasSaved || false
                }));
                setPosts(postsWithInteractions);
            } catch (error) {
                console.error("Failed to fetch user posts:", error);
            } finally {
                setLoadingPosts(false);
            }
        }
        if (userProfile) fetchUserFeed();
    }, [userProfile]);

    useEffect(() => {
        async function fetchSaved() {
            if (activeTab !== 'saved') return;
            setLoadingSaved(true);
            try {
                const saved = await getSavedPosts();
                setSavedPosts(saved);
            } catch (error) {
                console.error("Failed to fetch saved posts:", error);
            } finally {
                setLoadingSaved(false);
            }
        }
        fetchSaved();
    }, [activeTab]);

    const displayName = userProfile?.display_name || "Unknown Entity";
    const username = userProfile?.username || "loading";
    const bio = userProfile?.bio || "A silent observer in the digital void.";
    const college = userProfile?.college_name || "Unverified Campus";
    const initial = displayName?.[0] || "?";

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Mind-Flayer | ${displayName}`,
                text: bio,
                url: window.location.href,
            }).catch(() => {
                navigator.clipboard.writeText(window.location.href);
                showToast({ title: "Link copied!", type: "success", rank: "primary" });
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast({ title: "Link copied!", type: "success", rank: "primary" });
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            <Navbar />

            <main className="pb-28">
                {/* ─── Header Section ─── */}
                <div className="pt-[calc(env(safe-area-inset-top,20px)+72px)] sm:pt-24 px-4">
                    <div className="max-w-xl mx-auto">

                        {/* Top row: avatar + stats */}
                        <div className="flex items-center gap-5 mb-5">
                            {/* Avatar */}
                            <div
                                className="relative w-20 h-20 md:w-24 md:h-24 rounded-full shrink-0 cursor-pointer group"
                                onClick={() => setIsEditProfileOpen(true)}
                            >
                                <div className="absolute -inset-[2px] rounded-full bg-gradient-to-tr from-red-500 via-rose-500 to-amber-500 opacity-80" />
                                <div className="relative w-full h-full rounded-full bg-[#111] border-[2px] border-[#030303] flex items-center justify-center overflow-hidden z-10 group-hover:scale-105 transition-transform">
                                    {userProfile?.avatar_url ? (
                                        <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-light text-white/20">{initial}</span>
                                    )}
                                </div>
                                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                                    <Edit3 size={16} className="text-white" />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex-1 flex justify-around">
                                <StatBlock value={posts.length.toString()} label="Posts" />
                                <StatBlock value={followerCount.toString()} label="Followers" />
                                <StatBlock value={followingCount.toString()} label="Following" />
                            </div>
                        </div>

                        {/* Name + meta */}
                        <div className="mb-3">
                            {loading ? (
                                <div className="h-5 w-36 bg-white/5 rounded-lg animate-pulse mb-2" />
                            ) : (
                                <h1 className="text-lg font-bold leading-tight">{displayName}</h1>
                            )}
                            <p className="text-[13px] text-zinc-500 flex items-center gap-1.5">
                                <span className="text-rose-400 font-mono font-semibold">@{username}</span>
                            </p>
                        </div>

                        {/* Bio & Affiliation */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-[12px] font-bold text-zinc-400">
                                <GraduationCap size={14} className="text-red-500" />
                                <span className="tracking-wide uppercase">{college}</span>
                            </div>
                            <p className="text-[13px] text-zinc-400 leading-relaxed max-w-md italic">
                                "{bio}"
                            </p>
                        </div>

                        {/* Crush badge - always show if possible */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold mb-3">
                            <Heart size={12} fill={crushCount > 0 ? "currentColor" : "none"} /> {crushCount} {crushCount === 1 ? 'Crush' : 'Crushes'}
                        </div>

                        {/* Achievement Badges */}
                        {earnedBadges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {earnedBadges.map((badge) => (
                                    <div
                                        key={badge.achievement_key}
                                        className={`group relative flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-default`}
                                        title={`${badge.title}: ${badge.description}`}
                                    >
                                        <span className="text-sm">{badge.icon}</span>
                                        <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors hidden sm:inline">
                                            {badge.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mb-1">
                            <button
                                onClick={() => setIsEditProfileOpen(true)}
                                className="flex-1 h-9 rounded-lg bg-zinc-800 text-[13px] font-semibold text-white hover:bg-zinc-700 active:scale-[0.98] transition-all"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex-1 h-9 rounded-lg bg-zinc-800 text-[13px] font-semibold text-white hover:bg-zinc-700 active:scale-[0.98] transition-all"
                            >
                                Share Profile
                            </button>
                            {userProfile?.isAdmin && (
                                <Link href="/admin">
                                    <button className="h-9 px-3 rounded-lg bg-gradient-to-r from-amber-600/20 to-red-600/20 border border-amber-500/20 text-amber-400 hover:border-amber-500/40 active:scale-[0.98] transition-all flex items-center gap-1.5 animate-pulse">
                                        <Zap size={14} fill="currentColor" />
                                        <span className="text-[12px] font-black tracking-tighter uppercase hidden sm:inline">Forged Power</span>
                                    </button>
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="h-9 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all sm:hidden"
                                aria-label="Log Out"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Tabs ─── */}
                <div className="sticky top-0 z-30 bg-[#030303]/80 backdrop-blur-xl border-b border-white/[0.06] mt-4">
                    <div className="max-w-xl mx-auto flex">
                        <TabBtn active={activeTab === "posts"} onClick={() => setActiveTab("posts")} icon={<Grid3x3 size={16} />} label="Posts" />
                        <TabBtn active={activeTab === "saved"} onClick={() => setActiveTab("saved")} icon={<Bookmark size={16} />} label="Saved" />
                        <TabBtn active={activeTab === "stats"} onClick={() => setActiveTab("stats")} icon={<BarChart3 size={16} />} label="Stats" />
                        <TabBtn active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings size={16} />} label="Settings" />
                    </div>
                </div>

                {/* ─── Tab Content ─── */}
                <div className="max-w-xl mx-auto px-4 mt-4">

                    {/* POSTS */}
                    {activeTab === "posts" && (
                        <div className="space-y-3">
                            {loadingPosts ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-28 rounded-xl bg-white/[0.02] animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                ))
                            ) : posts.length === 0 ? (
                                <EmptyState icon={<Grid3x3 size={28} />} title="No posts yet" subtitle="Share a thought to get started." />
                            ) : (
                                posts.map((post, i) => (
                                    <div key={post.id}>
                                        <PostCard post={post as any} delay={0} currentUserId={userProfile?.id} onCommentClick={() => { }} onChatClick={() => { }} />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* SAVED */}
                    {activeTab === "saved" && (
                        <div className="space-y-3">
                            {loadingSaved ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-28 rounded-xl bg-white/[0.02] animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                ))
                            ) : savedPosts.length === 0 ? (
                                <EmptyState icon={<Bookmark size={28} />} title="Your vault is empty" subtitle="Bookmark posts to save them here." />
                            ) : (
                                savedPosts.map((post) => (
                                    <div key={post.id}>
                                        <PostCard post={post as any} delay={0} currentUserId={userProfile?.id} onCommentClick={() => { }} onChatClick={() => { }} />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* STATS */}
                    {activeTab === "stats" && (
                        <div className="space-y-3">
                            {/* Big metric */}
                            <div className="rounded-xl bg-zinc-900/50 border border-white/[0.06] p-5">
                                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Eye size={12} /> Profile Views
                                </div>
                                <div className="text-3xl font-black tracking-tight">—</div>
                                <span className="text-[11px] text-zinc-600">Coming soon</span>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <MetricTile icon={<Heart size={14} />} label="Crushes" value={crushCount.toString()} />
                                <MetricTile icon={<Crown size={14} />} label="Followers" value={followerCount.toString()} />
                                <MetricTile icon={<TrendingUp size={14} />} label="Posts" value={posts.length.toString()} />
                                <MetricTile icon={<Sparkles size={14} />} label="Following" value={followingCount.toString()} />
                            </div>

                            {/* Activity chart placeholder */}
                            <div className="rounded-xl bg-zinc-900/50 border border-white/[0.06] p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[13px] font-semibold text-zinc-300">Weekly Activity</span>
                                    <span className="text-[11px] text-zinc-600">Last 7 days</span>
                                </div>
                                <div className="flex items-end gap-[5px] h-16">
                                    {[30, 55, 40, 75, 50, 90, 65].map((h, i) => (
                                        <div key={i} className="flex-1">
                                            <div
                                                className="w-full rounded-sm bg-gradient-to-t from-red-500/50 to-red-500/10"
                                                style={{ height: `${h}%` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex mt-1">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                        <span key={i} className="flex-1 text-center text-[9px] text-zinc-600">{d}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS */}
                    {activeTab === "settings" && (
                        <SettingsView />
                    )}
                </div>
            </main>

            {/* Edit Profile Modal */}
            {isEditProfileOpen && userProfile && (
                <div className="fixed inset-0 z-[100]">
                    {(() => {
                        const { EditProfileModal } = require('@/components/profile/EditProfileModal');
                        return <EditProfileModal
                            user={userProfile}
                            onClose={() => setIsEditProfileOpen(false)}
                            onUpdate={async () => {
                                const profile = await import('@/lib/services/user').then(m => m.getUserProfile());
                                if (profile) setUserProfile(profile);
                            }}
                        />;
                    })()}
                </div>
            )}

            <MobileNav />
        </div>
    );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════ */

function StatBlock({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-lg font-bold">{value}</span>
            <span className="text-[11px] text-zinc-500">{label}</span>
        </div>
    );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-semibold border-b-2 transition-all
                ${active ? 'text-white border-red-500' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}
        >
            {icon} {label}
        </button>
    );
}

function MetricTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-xl bg-zinc-900/50 border border-white/[0.06] p-4 hover:bg-zinc-900/80 transition-colors">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-2">
                {icon}
                <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-bold">{value}</div>
        </div>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3 text-zinc-600">
                {icon}
            </div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">{title}</h3>
            <p className="text-xs text-zinc-600 max-w-xs">{subtitle}</p>
        </div>
    );
}
