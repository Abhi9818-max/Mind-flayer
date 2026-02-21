"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import {
    Shield, BadgeCheck, Users, Activity, ChevronRight, Crown,
    Eye, Map, Network, Terminal, Scroll, Swords, Radio
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0, banned: 0, frozen: 0 });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user || user.email !== 'veritas9818@gmail.com') {
                router.push('/feed');
                return;
            }

            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('verification_status, is_banned, frozen_until');

            if (profiles) {
                const now = new Date();
                setStats({
                    pending: profiles.filter((p: any) => p.verification_status === 'pending').length,
                    approved: profiles.filter((p: any) => p.verification_status === 'approved').length,
                    rejected: profiles.filter((p: any) => p.verification_status === 'rejected').length,
                    total: profiles.length,
                    banned: profiles.filter((p: any) => p.is_banned).length,
                    frozen: profiles.filter((p: any) => p.frozen_until && new Date(p.frozen_until) > now).length,
                });
            }
            setLoading(false);
        };
        fetchStats();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white bg-black">
                <div className="text-center">
                    <Crown className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
                    <p className="text-zinc-500">Summoning the Forge...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white bg-black">
            <LiquidBackground />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                            <Crown className="w-7 h-7 text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-red-400 to-yellow-400">
                                The Forge
                            </h1>
                            <p className="text-zinc-500 text-sm mt-1">Supreme Being Control Panel</p>
                        </div>
                    </div>
                    <Link href="/feed" className="text-sm text-zinc-600 hover:text-white transition-colors">
                        ← Back to The Stream
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                    <StatCard label="Total Souls" value={stats.total} icon={<Users className="w-5 h-5" />} color="text-blue-400" bg="bg-blue-500/10 border-blue-500/20" />
                    <StatCard label="Awaiting Judgement" value={stats.pending} icon={<Activity className="w-5 h-5 animate-pulse" />} color="text-yellow-400" bg="bg-yellow-500/10 border-yellow-500/20" />
                    <StatCard label="Approved" value={stats.approved} icon={<BadgeCheck className="w-5 h-5" />} color="text-green-400" bg="bg-green-500/10 border-green-500/20" />
                    <StatCard label="Rejected" value={stats.rejected} icon={<Shield className="w-5 h-5" />} color="text-red-400" bg="bg-red-500/10 border-red-500/20" />
                    <StatCard label="Banned" value={stats.banned} icon={<Swords className="w-5 h-5" />} color="text-orange-400" bg="bg-orange-500/10 border-orange-500/20" />
                    <StatCard label="Frozen" value={stats.frozen} icon={<Radio className="w-5 h-5" />} color="text-cyan-400" bg="bg-cyan-500/10 border-cyan-500/20" />
                </div>

                {/* === MODERATION POWERS === */}
                <SectionHeader title="Moderation Powers" subtitle="Judge, manage, and control" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <AdminCard
                        href="/admin/verifications"
                        title="Verification Codex"
                        description="Review and judge pending identity verifications"
                        icon={<BadgeCheck className="w-8 h-8 text-yellow-400" />}
                        badge={stats.pending > 0 ? `${stats.pending} pending` : undefined}
                    />
                    <AdminCard
                        href="/admin/users"
                        title="User Management"
                        description="Search, ban, freeze, and manage all registered souls"
                        icon={<Users className="w-8 h-8 text-blue-400" />}
                        badge={stats.banned > 0 ? `${stats.banned} banned` : undefined}
                    />
                    <AdminCard
                        href="/admin/verifications"
                        title="Content Moderation"
                        description="Review flagged posts and enforce community law"
                        icon={<Shield className="w-8 h-8 text-red-400" />}
                        disabled
                    />
                    <AdminCard
                        href="/admin/verifications"
                        title="Audit Log"
                        description="View all admin actions and moderation history"
                        icon={<Scroll className="w-8 h-8 text-amber-400" />}
                        disabled
                    />
                </div>

                {/* === SOVEREIGN POWERS === */}
                <SectionHeader title="Sovereign Powers" subtitle="The Prime does not moderate. The Prime decides." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <AdminCard
                        href="/prime"
                        title="Prime Dashboard"
                        description="Full command center with stats, alerts, and broadcast system"
                        icon={<Crown className="w-8 h-8 text-yellow-400" />}
                        accent="gold"
                    />
                    <AdminCard
                        href="/prime"
                        title="Hierarchy & Roles"
                        description="Appoint Kings, Stewards, and Marshals across dominions"
                        icon={<Network className="w-8 h-8 text-purple-400" />}
                        accent="purple"
                    />
                    <AdminCard
                        href="/prime"
                        title="Dominion Control"
                        description="Territory lockdowns, status management, and regional oversight"
                        icon={<Map className="w-8 h-8 text-emerald-400" />}
                        accent="emerald"
                    />
                    <AdminCard
                        href="/prime"
                        title="Surveillance"
                        description="Trace users, detect patterns, and monitor feeds in real-time"
                        icon={<Eye className="w-8 h-8 text-cyan-400" />}
                        accent="cyan"
                    />
                </div>

                {/* === SYSTEM === */}
                <SectionHeader title="System" subtitle="Platform infrastructure" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AdminCard
                        href="/prime"
                        title="Terminal"
                        description="Direct command interface for executing system operations"
                        icon={<Terminal className="w-8 h-8 text-green-400" />}
                        accent="green"
                    />
                    <AdminCard
                        href="/admin/verifications"
                        title="Activity Monitor"
                        description="Real-time platform analytics and event logs"
                        icon={<Activity className="w-8 h-8 text-green-400" />}
                        disabled
                    />
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="mb-4">
            <h2 className="text-lg font-bold text-zinc-300">{title}</h2>
            <p className="text-xs text-zinc-600 italic">{subtitle}</p>
        </div>
    );
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: number; icon: React.ReactNode; color: string; bg: string }) {
    return (
        <div className={`${bg} border rounded-2xl p-5 backdrop-blur-sm`}>
            <div className={`${color} mb-2`}>{icon}</div>
            <p className="text-3xl font-black text-white">{value}</p>
            <p className="text-xs text-zinc-500 mt-1">{label}</p>
        </div>
    );
}

const accentStyles: Record<string, string> = {
    gold: 'hover:border-yellow-500/30 hover:shadow-yellow-900/10',
    purple: 'hover:border-purple-500/30 hover:shadow-purple-900/10',
    emerald: 'hover:border-emerald-500/30 hover:shadow-emerald-900/10',
    cyan: 'hover:border-cyan-500/30 hover:shadow-cyan-900/10',
    green: 'hover:border-green-500/30 hover:shadow-green-900/10',
};

function AdminCard({ href, title, description, icon, badge, disabled, accent }: {
    href: string; title: string; description: string; icon: React.ReactNode; badge?: string; disabled?: boolean; accent?: string
}) {
    const hoverBorder = accent ? accentStyles[accent] || 'hover:border-purple-500/30 hover:shadow-purple-900/10' : 'hover:border-purple-500/30 hover:shadow-purple-900/10';

    const content = (
        <div className={`relative group p-6 rounded-2xl border transition-all duration-300 ${disabled
            ? 'bg-zinc-900/30 border-zinc-800/50 opacity-50 cursor-not-allowed'
            : `bg-zinc-900/50 border-white/5 hover:bg-zinc-800/60 cursor-pointer hover:shadow-lg ${hoverBorder}`
            }`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="mt-1">{icon}</div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{title}</h3>
                        <p className="text-sm text-zinc-500 mt-1">{description}</p>
                        {disabled && <span className="text-xs text-zinc-600 mt-2 block italic">Coming soon</span>}
                    </div>
                </div>
                {!disabled && <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition-colors mt-2" />}
            </div>
            {badge && (
                <span className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-500/30">
                    {badge}
                </span>
            )}
        </div>
    );

    if (disabled) return content;
    return <Link href={href}>{content}</Link>;
}
