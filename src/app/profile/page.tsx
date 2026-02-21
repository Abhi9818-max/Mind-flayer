"use client";

import { useState, useEffect } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navbar } from "@/components/layout/Navbar";
import { Bookmark, Edit3, MapPin, Sparkles, Eye, TrendingUp, Heart, Users, Settings, Grid3x3, BarChart3, Share2, Crown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "@/components/feed/PostCard";
import { SettingsView } from "@/components/settings/SettingsView";
import { getPosts } from "@/lib/services/posts";
import { getUserInteractions } from "@/lib/services/interactions";
import { useToast } from "@/lib/context/ToastContext";

export default function ProfilePage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"posts" | "saved" | "stats" | "settings">("posts");
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const profile = await import('@/lib/services/user').then(m => m.getUserProfile());
                if (profile) setUserProfile(profile);
            } catch (e) {
                console.error("Failed to load profile", e);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

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

    const displayName = userProfile?.display_name || "Unknown Entity";
    const username = userProfile?.username || "loading";
    const bio = userProfile?.bio || "A silent observer in the digital void.";
    const college = userProfile?.college_name || "Unverified Campus";
    const initial = displayName?.[0] || "?";

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Mind-Flayer Profile | ${displayName}`,
                text: bio,
                url: window.location.href,
            }).catch(() => {
                // Fallback to clipboard if share sheet is cancelled or fails
                navigator.clipboard.writeText(window.location.href);
                showToast({ title: "Profile link copied to clipboard!", type: "success", rank: "primary" });
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast({ title: "Profile link copied to clipboard!", type: "success", rank: "primary" });
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

            <main className="pb-28 relative">
                {/* ════════════════════════════════════════════════════════════
                    HERO — Full-bleed animated gradient with glassmorphic card
                   ════════════════════════════════════════════════════════════ */}
                <div className="relative pt-[calc(env(safe-area-inset-top,20px)+72px)] sm:pt-24 overflow-hidden">
                    {/* BACKGROUND: Large animated gradient blobs */}
                    <div className="absolute inset-0">
                        {/* Primary blob */}
                        <div
                            className="absolute w-[600px] h-[600px] rounded-full opacity-30"
                            style={{
                                top: '-150px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'radial-gradient(circle, #dc2626 0%, #7c3aed 40%, transparent 70%)',
                                animation: 'hero-breathe 8s ease-in-out infinite',
                            }}
                        />
                        {/* Secondary accent blob */}
                        <div
                            className="absolute w-[400px] h-[400px] rounded-full opacity-20"
                            style={{
                                top: '50px',
                                right: '-100px',
                                background: 'radial-gradient(circle, #e11d48 0%, transparent 70%)',
                                animation: 'hero-breathe 6s ease-in-out infinite reverse',
                            }}
                        />
                        {/* Tertiary cool blob */}
                        <div
                            className="absolute w-[350px] h-[350px] rounded-full opacity-15"
                            style={{
                                bottom: '-50px',
                                left: '-80px',
                                background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
                                animation: 'hero-float 10s ease-in-out infinite',
                            }}
                        />
                        {/* Fine grain overlay */}
                        <div className="absolute inset-0 bg-[#030303]/40" />
                    </div>

                    {/* CONTENT */}
                    <div className="relative z-10 flex flex-col items-center px-4 pt-12 pb-8">

                        {/* ── Avatar ── */}
                        <div className="relative group mb-6 profile-avatar-entry">
                            {/* Glow ring */}
                            <div className="absolute -inset-[6px] rounded-full bg-gradient-to-tr from-red-500 via-fuchsia-500 to-amber-500 opacity-70 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-700 animate-spin-slow" />
                            <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-red-500 via-fuchsia-500 to-amber-500 animate-spin-slow" />
                            {/* Photo */}
                            <div
                                className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-[#111] border-[3px] border-[#030303] flex items-center justify-center overflow-hidden z-10 cursor-pointer group-hover:scale-105 transition-transform duration-500"
                                onClick={() => setIsEditProfileOpen(true)}
                            >
                                {userProfile?.avatar_url ? (
                                    <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <span className="text-4xl md:text-5xl font-light text-white/20 select-none">{initial}</span>
                                )}
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                    <Edit3 size={22} className="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* ── Name ── */}
                        <div className="text-center profile-name-entry">
                            {loading ? (
                                <div className="h-8 w-44 bg-white/5 rounded-xl animate-pulse mb-2 mx-auto" />
                            ) : (
                                <h1 className="text-3xl md:text-[2.5rem] font-extrabold tracking-tight leading-none mb-1">
                                    {displayName}
                                </h1>
                            )}
                            <div className="flex items-center justify-center gap-2 mt-1.5">
                                <span className="text-rose-400 font-mono text-[13px] font-semibold">@{username}</span>
                                <span className="text-zinc-700">•</span>
                                <span className="flex items-center gap-1 text-zinc-500 text-[13px]">
                                    <MapPin size={11} className="text-zinc-600" />
                                    {college}
                                </span>
                            </div>
                        </div>

                        {/* ── Bio ── */}
                        <p className="text-[13px] text-zinc-400 text-center max-w-sm mt-3 leading-relaxed profile-bio-entry">
                            {bio}
                        </p>

                        {/* ── Stats Row ── */}
                        <div className="flex items-center gap-0 mt-6 bg-white/[0.04] rounded-2xl border border-white/[0.06] overflow-hidden profile-stats-entry">
                            <StatBlock value={posts.length.toString()} label="Posts" />
                            <div className="w-px h-10 bg-white/[0.06]" />
                            <StatBlock value="14" label="Admirers" highlight />
                            <div className="w-px h-10 bg-white/[0.06]" />
                            <StatBlock value="128" label="Connections" />
                        </div>

                        {/* ── Buttons ── */}
                        <div className="flex gap-2.5 mt-6 profile-actions-entry">
                            <button
                                onClick={() => setIsEditProfileOpen(true)}
                                className="h-10 px-6 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5"
                            >
                                <Edit3 size={15} /> Edit Profile
                            </button>
                            <button
                                onClick={handleShare}
                                className="h-10 px-4 sm:px-6 py-2 rounded-xl bg-white/[0.07] border border-white/[0.08] text-sm font-semibold text-zinc-300 hover:bg-white/[0.12] active:scale-[0.97] transition-all duration-200 flex items-center gap-1.5"
                            >
                                <Share2 size={15} /> <span className="hidden sm:inline">Share</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="h-10 px-4 py-2 rounded-xl bg-red-500/[0.1] border border-red-500/[0.2] text-sm font-semibold text-red-400 hover:bg-red-500/[0.2] active:scale-[0.97] transition-all duration-200 flex items-center justify-center sm:hidden"
                                aria-label="Log Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    TABS
                   ════════════════════════════════════════════════════════════ */}
                <div className="max-w-2xl mx-auto px-4 mt-2">
                    <div className="flex border-b border-white/[0.06]">
                        <TabBtn active={activeTab === "posts"} onClick={() => setActiveTab("posts")} icon={<Grid3x3 size={16} />} label="Posts" />
                        <TabBtn active={activeTab === "saved"} onClick={() => setActiveTab("saved")} icon={<Bookmark size={16} />} label="Saved" />
                        <TabBtn active={activeTab === "stats"} onClick={() => setActiveTab("stats")} icon={<BarChart3 size={16} />} label="Insights" />
                        <TabBtn active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings size={16} />} label="Settings" />
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    CONTENT
                   ════════════════════════════════════════════════════════════ */}
                <div className="max-w-2xl mx-auto px-4 mt-5">

                    {/* POSTS */}
                    {activeTab === "posts" && (
                        <div className="space-y-4">
                            {loadingPosts ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-36 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                                ))
                            ) : posts.length === 0 ? (
                                <EmptyState icon={<Grid3x3 size={36} />} title="No posts yet" subtitle="Share a thought, confession, or rant to get started." />
                            ) : (
                                posts.map((post, i) => (
                                    <div key={post.id} className="animate-fade-in-up" style={{ opacity: 0, animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}>
                                        <PostCard post={post as any} delay={0} onCommentClick={() => { }} onChatClick={() => { }} />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* SAVED */}
                    {activeTab === "saved" && (
                        <EmptyState icon={<Bookmark size={36} />} title="Your vault is empty" subtitle="Bookmark posts to save them here for later." />
                    )}

                    {/* STATS */}
                    {activeTab === "stats" && (
                        <div className="space-y-4 animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                            {/* Big metric */}
                            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 md:p-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-950/50 via-purple-950/30 to-transparent" />
                                <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/20 rounded-full blur-[60px]" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
                                        <Eye size={13} /> Profile Views
                                    </div>
                                    <div className="text-5xl md:text-6xl font-black tracking-tighter">12.4k</div>
                                    <div className="flex items-center gap-1 mt-2 text-emerald-400 text-sm font-semibold">
                                        <TrendingUp size={14} /> +12% this week
                                    </div>
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <MetricTile icon={<Heart size={16} />} label="Engagement" value="8.2%" trend="-2.1%" up={false} />
                                <MetricTile icon={<Crown size={16} />} label="Admirers" value="14" trend="+3" up />
                                <MetricTile icon={<TrendingUp size={16} />} label="Viral Ratio" value="1:10" trend="Top 5%" up />
                                <MetricTile icon={<Sparkles size={16} />} label="Streak" value="7d" trend="On fire" up />
                            </div>

                            {/* Activity chart */}
                            <div className="rounded-2xl bg-white/[0.025] border border-white/[0.05] p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[13px] font-semibold text-zinc-300">Weekly Activity</span>
                                    <span className="text-[11px] text-zinc-600">Last 7 days</span>
                                </div>
                                <div className="flex items-end gap-[6px] h-20">
                                    {[30, 55, 40, 75, 50, 90, 65].map((h, i) => (
                                        <div key={i} className="flex-1 group cursor-pointer">
                                            <div
                                                className="w-full rounded-sm transition-all duration-300 group-hover:opacity-100 opacity-80"
                                                style={{
                                                    height: `${h}%`,
                                                    background: `linear-gradient(to top, rgba(239,68,68,0.6), rgba(239,68,68,0.15))`,
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex mt-1.5">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                        <span key={i} className="flex-1 text-center text-[10px] text-zinc-600 font-medium">{d}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS */}
                    {activeTab === "settings" && (
                        <div className="animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                            <SettingsView />
                        </div>
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

            {/* Scoped animations */}
            <style jsx>{`
                @keyframes hero-breathe {
                    0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.3; }
                    50% { transform: translateX(-50%) scale(1.15); opacity: 0.45; }
                }
                @keyframes hero-float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, -20px); }
                }
                .profile-avatar-entry {
                    animation: profile-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
                }
                .profile-name-entry {
                    animation: profile-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
                }
                .profile-bio-entry {
                    animation: profile-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
                }
                .profile-stats-entry {
                    animation: profile-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both;
                }
                .profile-actions-entry {
                    animation: profile-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both;
                }
                @keyframes profile-pop {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes profile-fade-up {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function StatBlock({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
    return (
        <div className="flex flex-col items-center px-6 py-3 cursor-pointer group">
            <span className={`text-lg md:text-xl font-bold tracking-tight transition-colors ${highlight ? 'text-rose-400 group-hover:text-rose-300' : 'text-white group-hover:text-zinc-300'}`}>
                {value}
            </span>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-[0.12em]">{label}</span>
        </div>
    );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold border-b-2 transition-all duration-200
                ${active ? 'text-white border-red-500' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}
        >
            {icon} {label}
        </button>
    );
}

function MetricTile({ icon, label, value, trend, up }: { icon: React.ReactNode; label: string; value: string; trend: string; up: boolean }) {
    return (
        <div className="rounded-2xl bg-white/[0.025] border border-white/[0.05] p-4 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 cursor-pointer group">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-2.5 group-hover:text-zinc-400 transition-colors">
                {icon}
                <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight mb-0.5">{value}</div>
            <span className={`text-[11px] font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                {up ? '↗' : '↘'} {trend}
            </span>
        </div>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4 text-zinc-600">
                {icon}
            </div>
            <h3 className="text-base font-semibold text-zinc-300 mb-1">{title}</h3>
            <p className="text-[13px] text-zinc-600 max-w-xs">{subtitle}</p>
        </div>
    );
}
