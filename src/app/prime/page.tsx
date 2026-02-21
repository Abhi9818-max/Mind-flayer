"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { MessageSquare } from "lucide-react";


// Types
interface Log {
    id: string;
    time: string;
    type: string;
    msg: string;
    color: string;
}

interface Dominion {
    id: string;
    name: string;
    status: "NORMAL" | "ELEVATED" | "WATCH" | "LOCKDOWN" | "QUIET";
    userCount: number;
    postCount: number;
    region_name: string;
}

interface RealStats {
    totalUsers: number;
    activePosts: number;
    bannedUsers: number;
    frozenUsers: number;
    pendingVerifications: number;
    totalReports: number;
    totalModerators: number;
    todayPosts: number;
}

interface TracedUser {
    id: string;
    username: string;
    real_name: string | null;
    territory_name: string | null;
    verification_status: string;
    is_banned: boolean;
    frozen_until: string | null;
    is_anonymous_default: boolean;
    created_at: string;
    post_count: number;
}

export default function PrimeDashboard() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'dominions' | 'surveillance' | 'hierarchy'>('overview');

    // Shared State
    const [logs, setLogs] = useState<Log[]>([]);
    const [dominions, setDominions] = useState<Dominion[]>([]);
    const [stats, setStats] = useState<RealStats>({
        totalUsers: 0, activePosts: 0, bannedUsers: 0, frozenUsers: 0,
        pendingVerifications: 0, totalReports: 0, totalModerators: 0, todayPosts: 0
    });
    const [terminalHistory, setTerminalHistory] = useState<string[]>([
        "Mind-Flayer OS v4.2.0 [Secure Boot]",
        "Connecting to Supabase...",
    ]);
    const [terminalOpen, setTerminalOpen] = useState(false);

    const addLog = useCallback((type: string, msg: string, color: string = "text-zinc-400") => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLogs(prev => [{ id: Date.now().toString(), time: timeStr, type, msg, color }, ...prev]);
    }, []);

    const addToTerminal = useCallback((line: string) => {
        setTerminalHistory(prev => [...prev, `> ${line}`]);
        setTerminalOpen(true);
    }, []);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user || user.email !== 'veritas9818@gmail.com') {
                router.push("/admin");
                return;
            }
            setAuthorized(true);

            // Fetch real stats
            const [profilesRes, postsRes, dominionsRes, moderatorsRes, auditRes] = await Promise.all([
                supabase.from('user_profiles').select('id, verification_status, is_banned, frozen_until, created_at'),
                supabase.from('posts').select('id, created_at'),
                supabase.from('dominions').select('id, name, region_id, regions(name)'),
                supabase.from('moderators').select('id, user_id, role, scope_type, scope_id, user_profiles(username)'),
                supabase.from('admin_audit_log').select('id, action, reason, created_at, target_user_id').order('created_at', { ascending: false }).limit(20),
            ]);

            const profiles = profilesRes.data || [];
            const posts = postsRes.data || [];
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            setStats({
                totalUsers: profiles.length,
                activePosts: posts.length,
                bannedUsers: profiles.filter((p: any) => p.is_banned).length,
                frozenUsers: profiles.filter((p: any) => p.frozen_until && new Date(p.frozen_until) > now).length,
                pendingVerifications: profiles.filter((p: any) => p.verification_status === 'pending').length,
                totalReports: 0, // reports table may not have data yet
                totalModerators: (moderatorsRes.data || []).length,
                todayPosts: posts.filter((p: any) => new Date(p.created_at) >= todayStart).length,
            });

            // Fetch dominions with user counts
            const doms = (dominionsRes.data || []).map((d: any) => ({
                id: d.id,
                name: d.name,
                status: "NORMAL" as const,
                userCount: 0,
                postCount: 0,
                region_name: d.regions?.name || 'Unknown',
            }));
            setDominions(doms);

            // Build audit log entries as real logs
            const auditLogs: Log[] = (auditRes.data || []).map((a: any) => {
                const time = new Date(a.created_at);
                const timeStr = `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`;
                const actionColors: Record<string, string> = {
                    ban: 'text-red-500', unban: 'text-green-500',
                    freeze: 'text-blue-500', unfreeze: 'text-cyan-500',
                    approve: 'text-emerald-500', reject: 'text-orange-500',
                    note: 'text-zinc-400'
                };
                return {
                    id: a.id,
                    time: timeStr,
                    type: a.action.toUpperCase(),
                    msg: a.reason || `Action: ${a.action}`,
                    color: actionColors[a.action] || 'text-zinc-400'
                };
            });

            setLogs(auditLogs.length > 0 ? auditLogs : [
                { id: 'init', time: timeStr(now), type: 'SYS', msg: 'System initialized. No audit log entries yet.', color: 'text-zinc-500' }
            ]);

            setTerminalHistory(prev => [
                ...prev,
                `Connected. ${profiles.length} users loaded.`,
                `${posts.length} posts in database.`,
                `${(moderatorsRes.data || []).length} active moderator(s).`,
                "Awaiting input..."
            ]);
        };
        init();
    }, [router]);

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden selection:bg-red-900 selection:text-white">
            {/* Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black -z-20" />
            <div className="fixed inset-0 opacity-20 pointer-events-none -z-10" style={{ backgroundImage: 'url("/noise.png")' }} />
            <div className="fixed inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-40">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]" />
                    <h1 className="text-sm font-bold tracking-[0.2em] text-zinc-300">PRIME SOVEREIGN // <span className="text-red-500">GOD MODE</span></h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="text-[10px] text-zinc-500 hover:text-white transition-colors">← THE FORGE</Link>
                    <div className="flex gap-1 text-[10px] text-zinc-500">
                        <span>{stats.totalUsers} souls</span>
                        <span className="mx-2">|</span>
                        <span>{stats.activePosts} posts</span>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <main className="pt-20 pb-64 px-6 max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
                {/* Sidebar Navigation */}
                <nav className="col-span-12 lg:col-span-2 flex flex-col gap-2">
                    <NavButton label="OVERVIEW" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon="⚡" />
                    <NavButton label="DOMINIONS" active={activeTab === 'dominions'} onClick={() => setActiveTab('dominions')} icon="🗺️" />
                    <NavButton label="SURVEILLANCE" active={activeTab === 'surveillance'} onClick={() => setActiveTab('surveillance')} icon="👁️" />
                    <NavButton label="HIERARCHY" active={activeTab === 'hierarchy'} onClick={() => setActiveTab('hierarchy')} icon="👑" />

                    <div className="mt-8 p-4 border border-white/10 bg-zinc-900/30 rounded-xl">
                        <h3 className="text-[10px] font-bold text-zinc-400 mb-2 tracking-widest">SYSTEM STATUS</h3>
                        <div className="space-y-2 text-[11px]">
                            <div className="flex justify-between"><span className="text-zinc-500">Users</span><span className="text-white font-bold">{stats.totalUsers}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Banned</span><span className="text-red-400 font-bold">{stats.bannedUsers}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Frozen</span><span className="text-blue-400 font-bold">{stats.frozenUsers}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Pending</span><span className="text-yellow-400 font-bold">{stats.pendingVerifications}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Mods</span><span className="text-purple-400 font-bold">{stats.totalModerators}</span></div>
                        </div>
                    </div>
                </nav>

                {/* Content Area */}
                <div className="col-span-12 lg:col-span-10 space-y-6">
                    {activeTab === 'overview' && <OverviewView stats={stats} logs={logs} addLog={addLog} addToTerminal={addToTerminal} />}
                    {activeTab === 'dominions' && <DominionsView dominions={dominions} addLog={addLog} addToTerminal={addToTerminal} />}
                    {activeTab === 'surveillance' && <SurveillanceView addLog={addLog} addToTerminal={addToTerminal} />}
                    {activeTab === 'hierarchy' && <HierarchyView addLog={addLog} addToTerminal={addToTerminal} />}
                </div>
            </main>

            {/* Floating Terminal */}
            <TerminalWidget open={terminalOpen} setOpen={setTerminalOpen} history={terminalHistory} setHistory={setTerminalHistory} />
        </div>
    );
}

function timeStr(d: Date): string {
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// --- Views ---

function OverviewView({ stats, logs, addLog, addToTerminal }: any) {
    const handleAction = (action: string, desc: string) => {
        addLog("SYS", `Action Initiated: ${action}`, "text-yellow-500");
        addToTerminal(`Executing ${action.toLowerCase().replace(' ', '_')}...`);
        setTimeout(() => {
            addLog("SUCCESS", `${action} completed successfully`, "text-emerald-500");
            addToTerminal(`Process finished: ${desc}`);
        }, 800);
    };

    const handleBroadcast = (msg: string) => {
        if (!msg.trim()) return;
        addLog("CAST", `Global Broadcast: "${msg}"`, "text-purple-400");
        addToTerminal(`broadcasting --global "${msg}"`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards - REAL DATA */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="TOTAL USERS" value={stats.totalUsers} trend={`${stats.pendingVerifications} pending`} />
                <StatCard label="TOTAL POSTS" value={stats.activePosts} trend={`${stats.todayPosts} today`} highlight />
                <StatCard label="BANNED" value={stats.bannedUsers} trend={`${stats.frozenUsers} frozen`} color="text-red-400" />
                <StatCard label="MODERATORS" value={stats.totalModerators} trend="Active roles" color="text-purple-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Summary */}
                <div className="lg:col-span-2 h-80 bg-zinc-900/40 border border-white/10 rounded-xl p-4 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-zinc-400 tracking-wider">PLATFORM OVERVIEW</h3>
                        <div className="flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-zinc-500">LIVE</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 h-[calc(100%-40px)]">
                        <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-between">
                            <span className="text-[10px] text-zinc-500 tracking-widest">VERIFIED USERS</span>
                            <span className="text-4xl font-black text-green-400">{stats.totalUsers - stats.pendingVerifications}</span>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalUsers > 0 ? ((stats.totalUsers - stats.pendingVerifications) / stats.totalUsers * 100) : 0}%` }} />
                            </div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-between">
                            <span className="text-[10px] text-zinc-500 tracking-widest">PENDING REVIEW</span>
                            <span className="text-4xl font-black text-yellow-400">{stats.pendingVerifications}</span>
                            <Link href="/admin/verifications" className="text-[10px] text-yellow-500/60 hover:text-yellow-400 transition-colors">Review now →</Link>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-between">
                            <span className="text-[10px] text-zinc-500 tracking-widest">BANNED ACCOUNTS</span>
                            <span className="text-4xl font-black text-red-400">{stats.bannedUsers}</span>
                            <Link href="/admin/users" className="text-[10px] text-red-500/60 hover:text-red-400 transition-colors">Manage →</Link>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-between">
                            <span className="text-[10px] text-zinc-500 tracking-widest">FROZEN ACCOUNTS</span>
                            <span className="text-4xl font-black text-blue-400">{stats.frozenUsers}</span>
                            <Link href="/admin/users" className="text-[10px] text-blue-500/60 hover:text-blue-400 transition-colors">Manage →</Link>
                        </div>
                    </div>
                </div>

                {/* Live Audit Logs */}
                <div className="h-80 bg-zinc-900/40 border border-white/10 rounded-xl p-4 flex flex-col">
                    <h3 className="text-xs font-bold text-zinc-400 tracking-wider mb-4">AUDIT LOG</h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar flex flex-col-reverse">
                        {logs.map((log: Log) => (
                            <AlertRow key={log.id} time={log.time} msg={log.msg} color={log.color} type={log.type} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4 bg-zinc-900/40 border-white/5 space-y-3">
                    <h3 className="text-sm font-bold text-zinc-300 mb-2">Quick Actions</h3>
                    <ActionButton
                        icon="👥" label="User Management" desc="Ban, freeze, and manage users"
                        onClick={() => window.location.href = '/admin/users'}
                    />
                    <ActionButton
                        icon="✅" label="Verification Queue" desc={`${stats.pendingVerifications} pending verifications`}
                        onClick={() => window.location.href = '/admin/verifications'}
                    />
                    <ActionButton
                        icon="🔙" label="Back to Forge" desc="Return to admin dashboard"
                        onClick={() => window.location.href = '/admin'}
                    />
                </Card>

                <Card className="p-4 bg-gradient-to-br from-purple-900/10 to-transparent border-purple-500/20">
                    <h3 className="text-sm font-bold text-purple-200 mb-2">Global Broadcast</h3>
                    <BroadcastForm onSend={handleBroadcast} />
                </Card>
            </div>
        </div>
    );
}

function BroadcastForm({ onSend }: { onSend: (msg: string) => void }) {
    const [msg, setMsg] = useState("");
    return (
        <>
            <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="w-full bg-black/50 border border-purple-500/30 rounded-lg p-3 text-xs text-purple-200 placeholder-purple-500/50 resize-none focus:outline-none focus:border-purple-500/60"
                rows={4}
                placeholder="Broadcast a message to all users..."
            />
            <button
                onClick={() => { onSend(msg); setMsg(""); }}
                disabled={!msg.trim()}
                className="w-full mt-2 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 text-xs font-bold rounded border border-purple-500/30 transition-all disabled:opacity-50"
            >
                BROADCAST
            </button>
        </>
    );
}

function DominionsView({ dominions, addLog, addToTerminal }: any) {
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);


    const zones = [
        {
            id: 'north',
            name: 'North Campus',
            subtitle: 'Dominion of the North',
            color: '#a855f7',
            glowColor: 'rgba(168, 85, 247, 0.4)',
            icon: '🏛️',
            territories: ['Hansraj', 'Hindu', 'St. Stephen\'s', 'Miranda House', 'Kirori Mal', 'SRCC', 'Ramjas', 'Daulat Ram'],
            status: 'NORMAL',
            description: 'North Delhi — Civil Lines, GTB Nagar, Kamla Nagar. Intellectual heartland of DU with the densest concentration of prestigious colleges.',
        },
        {
            id: 'south',
            name: 'South Campus',
            subtitle: 'Dominion of the South',
            color: '#3b82f6',
            glowColor: 'rgba(59, 130, 246, 0.4)',
            icon: '⚔️',
            territories: ['LSR', 'Jesus & Mary', 'Gargi', 'ARSD', 'Maitreyi', 'Kamala Nehru', 'Deshbandhu', 'Motilal Nehru'],
            status: 'NORMAL',
            description: 'Southwest Delhi — Dhaula Kuan, Moti Bagh, Munirka. The southern stronghold near Benito Juarez Marg.',
        },
        {
            id: 'off',
            name: 'Off Campus (Noida / East)',
            subtitle: 'The Outer Realms',
            color: '#f59e0b',
            glowColor: 'rgba(245, 158, 11, 0.4)',
            icon: '🌐',
            territories: ['Shaheed Bhagat Singh', 'Maharaja Agrasen', 'Bhagini Nivedita', 'PGDAV', 'Shaheed Sukhdev CBS', 'Noida Colleges'],
            status: 'QUIET',
            description: 'East & Southeast Delhi — Noida, Greater Noida, Shahdara. The outer realms beyond the Yamuna.',
        },
    ];

    const activeZone = zones.find(z => z.id === selectedZone);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Map */}
                <div className="lg:col-span-3">
                    <Card className="p-0 bg-zinc-900/40 border-white/10 overflow-hidden relative">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-300 tracking-wider">DELHI DOMINION MAP</h3>
                                <p className="text-[10px] text-zinc-600">Interactive territory visualization</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-zinc-500">LIVE</span>
                            </div>
                        </div>

                        {/* Scan line animation */}
                        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                            <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent animate-scan" />
                        </div>

                        <div className="relative p-6 flex items-center justify-center" style={{ minHeight: 480 }}>
                            {/* Grid overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

                            <svg viewBox="0 0 380 480" className="w-full max-w-[380px]" style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.05))' }}>
                                <defs>
                                    {/* Real Delhi boundary - traced from official GeoJSON (datameet/Municipal_Spatial_Data) */}
                                    <path id="delhi-outline" d="M 353.6 248.5 L 356.2 251.4 L 359.4 253.7 L 360.2 254.0 L 361.1 256.5 L 361.0 260.6 L 361.2 263.1 L 361.1 264.2 L 360.7 266.7 L 359.6 267.5 L 358.1 268.9 L 356.9 269.2 L 354.4 269.5 L 351.7 270.3 L 350.3 271.1 L 348.8 271.8 L 346.4 271.9 L 342.6 272.4 L 341.1 273.4 L 340.6 274.6 L 339.4 276.7 L 335.2 280.4 L 333.5 281.9 L 332.1 283.5 L 331.8 284.1 L 332.2 285.2 L 332.4 286.7 L 331.7 289.4 L 332.3 291.5 L 336.7 296.6 L 343.8 304.1 L 345.5 306.8 L 346.0 308.7 L 346.7 310.2 L 350.3 311.8 L 353.3 314.7 L 355.1 316.8 L 356.0 320.2 L 357.4 322.3 L 361.0 324.0 L 365.0 325.0 L 364.8 326.7 L 364.0 328.3 L 363.6 330.0 L 361.5 331.8 L 360.5 333.1 L 358.1 335.4 L 356.7 337.2 L 355.8 338.9 L 353.8 341.4 L 352.5 343.1 L 350.9 345.2 L 349.7 346.5 L 346.2 347.4 L 343.7 349.7 L 341.9 350.4 L 339.7 348.4 L 337.5 347.5 L 335.3 346.5 L 332.6 346.3 L 332.7 343.2 L 330.9 342.8 L 328.5 342.4 L 328.1 341.9 L 323.9 341.9 L 322.1 342.6 L 320.0 343.1 L 317.8 343.5 L 315.8 344.1 L 314.2 345.1 L 313.1 348.1 L 307.5 349.0 L 300.4 351.1 L 297.2 352.5 L 294.5 354.2 L 291.1 356.0 L 288.7 358.3 L 287.0 359.6 L 286.3 362.1 L 286.3 364.0 L 286.6 365.4 L 286.7 366.3 L 286.3 368.1 L 287.1 369.1 L 287.3 370.4 L 289.5 371.0 L 291.7 371.2 L 292.7 372.7 L 294.8 373.4 L 297.4 376.2 L 298.2 377.9 L 298.1 379.5 L 298.2 381.0 L 298.0 382.8 L 297.9 386.6 L 300.0 387.5 L 297.6 391.4 L 290.0 394.1 L 286.9 397.0 L 282.5 398.5 L 278.6 399.3 L 274.5 400.7 L 269.0 401.5 L 264.3 402.1 L 257.5 402.7 L 253.6 402.0 L 250.4 402.1 L 246.8 404.1 L 245.5 404.5 L 243.8 402.0 L 242.0 399.5 L 239.5 397.7 L 240.0 392.6 L 239.2 389.5 L 237.7 388.1 L 233.6 386.3 L 231.5 385.2 L 230.4 384.0 L 228.6 382.8 L 225.1 382.3 L 223.2 382.7 L 221.4 381.9 L 218.7 381.3 L 216.5 379.8 L 213.0 378.1 L 210.1 377.9 L 209.8 367.7 L 206.2 364.2 L 203.4 360.7 L 202.1 359.0 L 203.7 358.9 L 204.5 354.2 L 205.2 352.0 L 206.9 348.9 L 208.7 347.0 L 208.2 344.7 L 208.9 342.7 L 208.9 341.9 L 205.0 341.0 L 198.4 338.2 L 193.2 335.8 L 192.0 334.2 L 193.8 331.2 L 190.1 329.4 L 183.3 327.5 L 177.5 326.3 L 175.6 325.3 L 174.9 327.2 L 172.3 330.8 L 169.2 330.5 L 165.5 330.3 L 163.4 329.3 L 160.0 328.2 L 158.7 325.5 L 155.8 322.7 L 154.8 321.4 L 154.0 321.4 L 148.3 317.8 L 142.6 316.4 L 138.1 313.4 L 135.2 311.2 L 132.6 311.8 L 130.8 311.3 L 127.3 315.7 L 126.8 317.5 L 130.8 320.0 L 133.3 321.6 L 137.6 324.7 L 133.2 328.8 L 127.8 327.2 L 123.4 326.0 L 121.2 328.3 L 116.2 328.3 L 112.9 325.9 L 109.2 326.3 L 106.3 328.2 L 102.0 330.3 L 95.0 335.2 L 86.9 336.1 L 82.7 333.7 L 76.1 331.8 L 72.9 334.0 L 68.5 331.8 L 64.1 330.8 L 59.7 332.4 L 57.1 332.5 L 53.0 337.0 L 51.1 338.6 L 47.1 338.3 L 44.7 336.0 L 43.8 335.1 L 44.4 332.5 L 47.0 327.4 L 48.3 325.2 L 44.9 323.8 L 39.9 320.1 L 38.8 318.5 L 38.2 317.8 L 38.0 316.2 L 35.6 315.2 L 33.9 310.8 L 32.7 309.1 L 28.8 307.4 L 22.9 305.7 L 19.9 304.7 L 19.3 303.2 L 18.4 301.7 L 17.6 300.7 L 17.3 300.0 L 17.1 297.4 L 17.0 294.8 L 16.0 291.3 L 15.0 288.3 L 15.2 287.1 L 15.1 285.5 L 15.4 282.2 L 18.7 281.2 L 25.4 280.4 L 30.3 280.6 L 33.0 279.3 L 35.6 275.1 L 36.9 270.6 L 39.2 267.0 L 42.1 263.8 L 44.4 258.2 L 46.1 254.4 L 46.3 252.4 L 47.9 249.2 L 50.3 248.3 L 55.4 250.4 L 58.1 252.2 L 62.3 252.7 L 64.9 249.9 L 70.4 248.7 L 73.6 251.0 L 79.0 256.2 L 82.6 255.8 L 86.6 251.0 L 87.7 247.5 L 84.1 245.9 L 80.3 242.6 L 77.6 239.6 L 74.8 235.1 L 78.5 229.6 L 80.0 225.5 L 82.8 223.7 L 87.7 222.7 L 93.2 222.5 L 95.5 220.5 L 96.1 215.9 L 98.1 209.9 L 100.7 206.0 L 104.0 202.1 L 100.9 199.9 L 92.4 194.6 L 92.3 189.3 L 95.7 185.2 L 98.2 181.2 L 98.0 178.1 L 95.9 175.8 L 97.4 171.9 L 92.8 167.6 L 87.7 164.5 L 89.1 161.3 L 92.2 157.8 L 95.1 153.7 L 92.6 150.6 L 91.0 148.7 L 91.2 146.9 L 91.6 144.1 L 93.1 140.9 L 93.7 138.7 L 89.1 134.4 L 86.1 133.9 L 87.8 130.8 L 88.8 128.4 L 88.6 127.4 L 88.7 126.4 L 89.4 124.5 L 90.4 122.5 L 91.3 121.7 L 96.2 121.3 L 98.6 122.2 L 100.1 121.7 L 101.7 119.0 L 101.2 117.7 L 101.9 115.8 L 102.3 115.0 L 103.2 113.2 L 107.5 114.3 L 109.2 116.7 L 111.1 117.5 L 114.5 115.2 L 116.9 109.2 L 118.2 108.3 L 119.7 106.5 L 122.1 105.4 L 128.7 105.3 L 134.0 104.8 L 138.0 105.3 L 142.0 105.7 L 146.7 108.0 L 149.1 108.9 L 153.6 110.8 L 155.1 109.3 L 155.4 108.5 L 154.7 106.9 L 156.9 104.9 L 157.2 102.6 L 157.2 102.0 L 157.5 100.0 L 159.2 97.9 L 161.2 95.1 L 161.8 93.2 L 161.7 92.0 L 164.0 89.0 L 167.2 84.6 L 169.8 85.0 L 174.4 86.1 L 175.5 85.5 L 177.9 85.5 L 179.9 83.6 L 180.5 82.2 L 179.5 79.5 L 182.6 75.5 L 183.8 76.0 L 186.2 77.2 L 186.7 80.0 L 186.3 80.6 L 186.4 80.9 L 191.1 83.6 L 196.2 84.2 L 200.9 84.7 L 201.9 85.4 L 203.3 87.0 L 204.4 87.8 L 206.2 89.6 L 209.1 91.5 L 211.6 92.3 L 212.2 91.2 L 215.8 89.7 L 219.3 89.7 L 222.3 90.1 L 223.0 92.5 L 223.7 94.0 L 226.0 96.1 L 223.8 100.0 L 223.3 103.3 L 223.9 104.9 L 226.9 106.6 L 234.5 107.3 L 233.9 105.9 L 239.3 99.8 L 242.0 98.0 L 244.7 95.5 L 246.3 92.5 L 248.5 92.4 L 252.9 92.9 L 258.0 92.5 L 260.3 91.9 L 268.3 92.1 L 268.9 93.4 L 271.6 93.0 L 272.1 95.6 L 273.3 100.5 L 274.0 103.6 L 275.5 106.5 L 278.4 110.5 L 279.8 112.8 L 279.7 114.9 L 279.9 116.3 L 279.0 117.8 L 277.5 119.9 L 276.3 123.4 L 276.5 126.6 L 274.4 127.6 L 268.7 125.4 L 263.6 125.0 L 262.6 129.6 L 261.4 133.0 L 261.4 133.9 L 270.4 137.6 L 274.0 141.5 L 277.3 142.3 L 283.9 142.1 L 285.9 143.3 L 285.1 144.9 L 281.8 146.5 L 280.3 147.7 L 281.5 153.4 L 284.9 155.3 L 288.1 159.6 L 292.7 161.7 L 298.2 163.5 L 302.9 164.6 L 304.0 167.8 L 302.3 171.2 L 301.8 174.5 L 304.2 176.8 L 306.2 177.7 L 310.6 177.4 L 314.4 176.4 L 318.9 178.8 L 320.0 180.7 L 321.2 182.1 L 322.6 183.5 L 323.1 184.4 L 324.9 185.3 L 326.0 185.8 L 325.7 186.9 L 325.1 187.7 L 325.3 190.1 L 324.3 191.2 L 324.7 192.6 L 323.5 193.2 L 323.9 194.2 L 324.8 195.4 L 325.7 196.7 L 329.1 198.2 L 330.3 198.2 L 331.4 196.2 L 331.6 195.2 L 333.7 194.1 L 336.3 191.9 L 338.5 192.1 L 340.3 192.0 L 341.5 192.4 L 344.3 191.8 L 348.1 192.1 L 350.3 192.5 L 353.5 192.7 L 349.8 195.6 L 350.2 199.6 L 349.7 200.7 L 348.5 202.4 L 350.2 204.9 L 353.1 208.4 L 354.4 211.8 L 354.8 213.7 L 353.4 216.2 L 351.5 217.3 L 349.4 216.7 L 348.7 217.8 L 348.9 219.8 L 348.3 221.6 L 348.7 223.0 L 348.2 223.7 L 347.8 224.4 L 346.7 226.5 L 346.5 228.8 L 346.2 232.7 L 346.4 234.9 L 344.3 240.0 L 343.4 241.8 L 344.7 242.9 L 347.7 244.9 L 352.3 248.1 L 353.6 248.5 Z" />

                                    {/* Clip paths divide Delhi into 3 geographic zones matching real DU campus locations.
                                        E-W curve follows Ring Road (~28.63°N), N-S curve follows Mathura Rd/central Delhi.
                                        North Campus = north Delhi (above Ring Road curve)
                                        South Campus = southwest Delhi (below curve, west of center)
                                        Off Campus = east/southeast Delhi (below curve, east of center) */}
                                    <clipPath id="clip-north">
                                        <polygon points="0,0 380,0 380,210 365,215 350,208 335,212 320,205 305,215 290,210 275,225 260,218 245,230 230,225 215,235 200,240 185,235 170,245 155,255 140,250 125,260 110,265 95,260 80,268 65,265 50,275 35,270 20,278 0,275" />
                                    </clipPath>
                                    <clipPath id="clip-south">
                                        <polygon points="0,275 20,278 35,270 50,275 65,265 80,268 95,260 110,265 125,260 140,250 155,255 170,245 185,235 200,240 215,235 230,225 245,230 252,228 255,240 248,255 252,270 245,285 250,300 242,315 248,330 240,345 235,360 242,375 238,390 230,405 235,420 228,435 232,450 225,465 230,480 0,480" />
                                    </clipPath>
                                    <clipPath id="clip-off">
                                        <polygon points="252,228 260,218 275,225 290,210 305,215 320,205 335,212 350,208 365,215 380,210 380,480 230,480 225,465 232,450 228,435 235,420 230,405 238,390 242,375 235,360 240,345 248,330 242,315 250,300 245,285 252,270 248,255 255,240 252,228" />
                                    </clipPath>

                                    {/* Glow filters */}
                                    {zones.map(z => (
                                        <filter key={`glow-${z.id}`} id={`glow-${z.id}`}>
                                            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    ))}
                                </defs>

                                {/* Faint full outline for context */}
                                <use href="#delhi-outline" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                                {/* NORTH CAMPUS ZONE — north Delhi above Ring Road */}
                                <use
                                    href="#delhi-outline"
                                    clipPath="url(#clip-north)"
                                    fill={hoveredZone === 'north' || selectedZone === 'north' ? 'rgba(168, 85, 247, 0.30)' : 'rgba(168, 85, 247, 0.10)'}
                                    stroke={hoveredZone === 'north' || selectedZone === 'north' ? '#a855f7' : 'rgba(168, 85, 247, 0.25)'}
                                    strokeWidth={hoveredZone === 'north' || selectedZone === 'north' ? 2.5 : 1}
                                    filter={hoveredZone === 'north' || selectedZone === 'north' ? 'url(#glow-north)' : undefined}
                                    className="cursor-pointer"
                                    style={{ transition: 'fill 0.4s, stroke 0.4s, stroke-width 0.4s' }}
                                    onMouseEnter={() => setHoveredZone('north')}
                                    onMouseLeave={() => setHoveredZone(null)}
                                    onClick={() => { setSelectedZone(selectedZone === 'north' ? null : 'north'); addLog('MAP', 'Selected: North Campus', 'text-purple-400'); }}
                                />

                                {/* SOUTH CAMPUS ZONE — southwest Delhi (Dhaula Kuan area) */}
                                <use
                                    href="#delhi-outline"
                                    clipPath="url(#clip-south)"
                                    fill={hoveredZone === 'south' || selectedZone === 'south' ? 'rgba(59, 130, 246, 0.30)' : 'rgba(59, 130, 246, 0.10)'}
                                    stroke={hoveredZone === 'south' || selectedZone === 'south' ? '#3b82f6' : 'rgba(59, 130, 246, 0.25)'}
                                    strokeWidth={hoveredZone === 'south' || selectedZone === 'south' ? 2.5 : 1}
                                    filter={hoveredZone === 'south' || selectedZone === 'south' ? 'url(#glow-south)' : undefined}
                                    className="cursor-pointer"
                                    style={{ transition: 'fill 0.4s, stroke 0.4s, stroke-width 0.4s' }}
                                    onMouseEnter={() => setHoveredZone('south')}
                                    onMouseLeave={() => setHoveredZone(null)}
                                    onClick={() => { setSelectedZone(selectedZone === 'south' ? null : 'south'); addLog('MAP', 'Selected: South Campus', 'text-blue-400'); }}
                                />

                                {/* OFF CAMPUS ZONE — east/southeast Delhi */}
                                <use
                                    href="#delhi-outline"
                                    clipPath="url(#clip-off)"
                                    fill={hoveredZone === 'off' || selectedZone === 'off' ? 'rgba(245, 158, 11, 0.30)' : 'rgba(245, 158, 11, 0.08)'}
                                    stroke={hoveredZone === 'off' || selectedZone === 'off' ? '#f59e0b' : 'rgba(245, 158, 11, 0.20)'}
                                    strokeWidth={hoveredZone === 'off' || selectedZone === 'off' ? 2.5 : 1}
                                    filter={hoveredZone === 'off' || selectedZone === 'off' ? 'url(#glow-off)' : undefined}
                                    className="cursor-pointer"
                                    style={{ transition: 'fill 0.4s, stroke 0.4s, stroke-width 0.4s' }}
                                    onMouseEnter={() => setHoveredZone('off')}
                                    onMouseLeave={() => setHoveredZone(null)}
                                    onClick={() => { setSelectedZone(selectedZone === 'off' ? null : 'off'); addLog('MAP', 'Selected: Off Campus', 'text-amber-400'); }}
                                />

                                {/* Internal divider lines where zones meet — wandering organic paths */}
                                {/* E-W boundary: Ring Road corridor — swoops down from West then joins Yamuna */}
                                <path d="M 0,275 L 20,278 L 35,270 L 50,275 L 65,265 L 80,268 L 95,260 L 110,265 L 125,260 L 140,250 L 155,255 L 170,245 L 185,235 L 200,240 L 215,235 L 230,225 L 245,230 L 260,218 L 275,225 L 290,210 L 305,215 L 320,205 L 335,212 L 350,208 L 365,215 L 380,210" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.8" strokeDasharray="3,2" />
                                {/* N-S boundary: Central/Yamuna corridor — winds like a river */}
                                <path d="M 252,228 L 255,240 L 248,255 L 252,270 L 245,285 L 250,300 L 242,315 L 248,330 L 240,345 L 235,360 L 242,375 L 238,390 L 230,405 L 235,420 L 228,435 L 232,450 L 225,465 L 230,480" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.8" strokeDasharray="3,2" />

                                {/* Divider labels */}
                                <text x="50" y="270" className="pointer-events-none select-none">
                                    <tspan fill="#3f3f46" fontSize="6" fontFamily="monospace" letterSpacing="2">RING ROAD</tspan>
                                </text>
                                <text x="220" y="320" className="pointer-events-none select-none" transform="rotate(-10, 220, 320)">
                                    <tspan fill="#3f3f46" fontSize="6" fontFamily="monospace" letterSpacing="2">YAMUNA</tspan>
                                </text>

                                {/* Zone labels - positioned at geographic center of each zone */}
                                {/* North Campus — centered in upper region */}
                                <text x="190" y="165" textAnchor="middle" className="pointer-events-none select-none">
                                    <tspan fill={hoveredZone === 'north' || selectedZone === 'north' ? '#c084fc' : '#a1a1aa'} fontSize="12" fontWeight="bold" fontFamily="monospace">NORTH CAMPUS</tspan>
                                </text>
                                <text x="190" y="180" textAnchor="middle" className="pointer-events-none select-none">
                                    <tspan fill="#52525b" fontSize="8" fontFamily="monospace">Civil Lines · GTB Nagar</tspan>
                                </text>
                                <circle cx="269" cy="206" r="3" fill="#a855f7" opacity="0.8" className="pointer-events-none">
                                    <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                                </circle>
                                <text x="269" y="200" textAnchor="middle" className="pointer-events-none select-none">
                                    <tspan fill="#a855f7" fontSize="5" fontFamily="monospace" opacity="0.6">DU NORTH</tspan>
                                </text>

                                {/* South Campus — centered in southwest region */}
                                <text x="135" y="340" textAnchor="middle" className="pointer-events-none select-none">
                                    <tspan fill={hoveredZone === 'south' || selectedZone === 'south' ? '#60a5fa' : '#a1a1aa'} fontSize="12" fontWeight="bold" fontFamily="monospace">SOUTH CAMPUS</tspan>
                                </text>
                                <text x="135" y="355" textAnchor="middle" className="pointer-events-none select-none">
                                    <tspan fill="#52525b" fontSize="8" fontFamily="monospace">Dhaula Kuan · Moti Bagh</tspan>
                                </text>
                                <circle cx="235" cy="281" r="3" fill="#3b82f6" opacity="0.8" className="pointer-events-none">
                                    <animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
                                </circle>
                                <text x="235" y="275" textAnchor="middle" className="pointer-events-none select-none">
                                    <tspan fill="#3b82f6" fontSize="5" fontFamily="monospace" opacity="0.6">DU SOUTH</tspan>
                                </text>

                                {/* Off Campus — centered in east/southeast region */}
                                <text x="330" y="340" textAnchor="middle" className="pointer-events-none select-none">
                                    <tspan fill={hoveredZone === 'off' || selectedZone === 'off' ? '#fbbf24' : '#71717a'} fontSize="11" fontWeight="bold" fontFamily="monospace">OFF CAMPUS</tspan>
                                </text>
                                <text x="330" y="355" textAnchor="middle" className="pointer-events-none select-none">
                                    <tspan fill="#52525b" fontSize="8" fontFamily="monospace">East Delhi · Shahdara</tspan>
                                </text>
                                <circle cx="335" cy="310" r="2.5" fill="#f59e0b" opacity="0.6" className="pointer-events-none">
                                    <animate attributeName="r" values="2.5;4;2.5" dur="3s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
                                </circle>

                                {/* Title */}
                                <text x="190" y="68" textAnchor="middle" className="pointer-events-none select-none">
                                    <tspan fill="#3f3f46" fontSize="9" fontFamily="monospace" letterSpacing="4">DELHI NCR</tspan>
                                </text>

                                {/* Compass indicator */}
                                <g transform="translate(355, 450)" className="pointer-events-none" opacity="0.3">
                                    <line x1="0" y1="-12" x2="0" y2="12" stroke="white" strokeWidth="0.5" />
                                    <line x1="-8" y1="0" x2="8" y2="0" stroke="white" strokeWidth="0.5" />
                                    <text x="0" y="-15" textAnchor="middle" fill="white" fontSize="6" fontFamily="monospace">N</text>
                                </g>
                            </svg>
                        </div>

                        {/* Scan line CSS */}
                        <style jsx>{`
                            @keyframes scan {
                                0% { top: -2px; }
                                100% { top: 100%; }
                            }
                            .animate-scan {
                                animation: scan 4s linear infinite;
                            }
                        `}</style>
                    </Card>
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Zone Legend */}
                    <Card className="p-4 bg-zinc-900/40 border-white/10 relative">
                        {activeZone && (
                            <div className="absolute top-4 right-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-${activeZone.id === 'north' ? 'purple' : activeZone.id === 'south' ? 'blue' : 'amber'}-500/10 text-${activeZone.id === 'north' ? 'purple' : activeZone.id === 'south' ? 'blue' : 'amber'}-400 border border-${activeZone.id === 'north' ? 'purple' : activeZone.id === 'south' ? 'blue' : 'amber'}-500/20`}>
                                    SELECTED
                                </span>
                            </div>
                        )}
                        <h3 className="text-xs font-bold text-zinc-400 tracking-widest mb-3">DOMINION ZONES</h3>
                        {zones.map(z => (
                            <button
                                key={z.id}
                                onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}
                                onMouseEnter={() => setHoveredZone(z.id)}
                                onMouseLeave={() => setHoveredZone(null)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all duration-300 border text-left ${selectedZone === z.id
                                    ? 'bg-white/10 border-white/20'
                                    : 'bg-transparent border-transparent hover:bg-white/5'
                                    }`}
                            >
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: z.color, boxShadow: selectedZone === z.id ? `0 0 12px ${z.glowColor}` : 'none' }} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-zinc-200 truncate">{z.name}</div>
                                    <div className="text-[10px] text-zinc-600">{z.territories.length} territories</div>
                                </div>
                                <StatusBadge status={z.status} />
                            </button>
                        ))}
                    </Card>

                    {/* Detail Panel */}
                    {activeZone && (
                        <Card className="p-5 bg-zinc-900/60 border-white/10 backdrop-blur-xl animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">{activeZone.icon}</span>
                                <div>
                                    <h3 className="text-sm font-bold" style={{ color: activeZone.color }}>{activeZone.name}</h3>
                                    <p className="text-[10px] text-zinc-500">{activeZone.subtitle}</p>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 mb-4">{activeZone.description}</p>

                            <h4 className="text-[10px] font-bold text-zinc-500 tracking-widest mb-2">TERRITORIES</h4>
                            <div className="space-y-1">
                                {activeZone.territories.map((t: string) => (
                                    <div key={t} className="flex items-center gap-2 text-xs text-zinc-300 p-1.5 rounded hover:bg-white/5 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeZone.color, opacity: 0.6 }} />
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* DB Dominions */}
                    {dominions.length > 0 && (
                        <Card className="p-4 bg-zinc-900/40 border-white/10">
                            <h3 className="text-xs font-bold text-zinc-400 tracking-widest mb-3">DATABASE RECORDS</h3>
                            {dominions.map((d: Dominion) => (
                                <div key={d.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors text-xs mb-1">
                                    <span className="text-zinc-300">{d.name}</span>
                                    <span className="text-zinc-600 font-mono text-[10px]">{String(d.id).slice(0, 8)}</span>
                                </div>
                            ))}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function SurveillanceView({ addLog, addToTerminal }: any) {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<TracedUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleTrace = async () => {
        if (!query) return;
        setLoading(true);
        setError("");
        setResult(null);
        addToTerminal(`trace --target "${query}" --depth full`);

        const supabase = createClient();

        // Search by username or ID
        let userData: any = null;

        // Try by username first
        const { data: byUsername } = await supabase
            .from('user_profiles')
            .select('id, username, real_name, territory_id, verification_status, is_banned, frozen_until, is_anonymous_default, created_at, territories(name)')
            .ilike('username', `%${query}%`)
            .limit(1)
            .single();

        if (byUsername) {
            userData = byUsername;
        } else {
            // Try by ID
            const { data: byId } = await supabase
                .from('user_profiles')
                .select('id, username, real_name, territory_id, verification_status, is_banned, frozen_until, is_anonymous_default, created_at, territories(name)')
                .eq('id', query)
                .single();
            userData = byId;
        }

        if (!userData) {
            setError(`No user found matching "${query}"`);
            addLog('WARN', `Trace failed: No match for "${query}"`, 'text-yellow-500');
            setLoading(false);
            return;
        }

        // Get post count
        const { count } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userData.id);

        setResult({
            id: userData.id,
            username: userData.username,
            real_name: userData.real_name,
            territory_name: userData.territories?.name || 'Unknown',
            verification_status: userData.verification_status,
            is_banned: userData.is_banned,
            frozen_until: userData.frozen_until,
            is_anonymous_default: userData.is_anonymous_default,
            created_at: userData.created_at,
            post_count: count || 0,
        });

        addLog('SUCCESS', `Trace complete: ${userData.username} (${userData.id.slice(0, 8)}...)`, 'text-emerald-500');
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <Card className="p-6 bg-zinc-900/60 border-white/10 backdrop-blur-xl">
                <h2 className="text-lg font-bold text-white mb-2">User Inspector</h2>
                <p className="text-zinc-500 text-xs mb-6">Search by username or user ID to inspect their profile.</p>

                <div className="flex gap-2 mb-8">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Username or UUID..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
                    />
                    <button
                        onClick={handleTrace}
                        disabled={loading || !query}
                        className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-500 font-bold rounded-lg border border-red-500/30 transition-all disabled:opacity-50"
                    >
                        {loading ? 'TRACING...' : 'TRACE'}
                    </button>
                </div>

                {error && (
                    <div className="text-center p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-sm text-red-400">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-6 border-t border-white/5 pt-6 animate-fade-in-up">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-2xl">
                                {result.is_banned ? '⛔' : result.frozen_until && new Date(result.frozen_until) > new Date() ? '❄️' : '🕵️'}
                            </div>
                            <div>
                                <div className="text-xl font-bold text-white">@{result.username}</div>
                                <div className="text-xs text-zinc-500 font-mono">ID: {result.id.slice(0, 12)}...</div>
                                {result.real_name && <div className="text-xs text-zinc-400">{result.real_name}</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <InfoBox label="STATUS" value={result.is_banned ? 'BANNED' : result.frozen_until && new Date(result.frozen_until) > new Date() ? 'FROZEN' : 'ACTIVE'} color={result.is_banned ? 'text-red-500' : 'text-green-400'} />
                            <InfoBox label="VERIFICATION" value={result.verification_status.toUpperCase()} color={result.verification_status === 'approved' ? 'text-green-400' : 'text-yellow-400'} />
                            <InfoBox label="TERRITORY" value={result.territory_name || 'None'} />
                            <InfoBox label="POSTS" value={String(result.post_count)} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <InfoBox label="ANON DEFAULT" value={result.is_anonymous_default ? 'YES' : 'NO'} />
                            <InfoBox label="JOINED" value={new Date(result.created_at).toLocaleDateString()} />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => window.location.href = `/admin/users`}
                                className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-all"
                            >
                                MANAGE IN USER PANEL →
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

function InfoBox({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
    return (
        <div className="p-3 bg-black/40 rounded-lg border border-white/5">
            <div className={`text-sm font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-zinc-500">{label}</div>
        </div>
    );
}

function HierarchyView({ addLog, addToTerminal }: any) {
    const [moderators, setModerators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMods = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('moderators')
                .select('id, user_id, role, scope_type, scope_id, created_at, user_profiles(username)')
                .order('created_at', { ascending: true });
            setModerators(data || []);
            setLoading(false);
        };
        fetchMods();
    }, []);

    const roleDisplay: Record<string, { icon: string; color: string; title: string }> = {
        prime_sovereign: { icon: '👑', color: 'yellow', title: 'PRIME SOVEREIGN' },
        the_hand: { icon: '☠️', color: 'red', title: 'THE HAND' },
        crowned_king: { icon: '🗺️', color: 'purple', title: 'CROWNED KING' },
        steward: { icon: '🩸', color: 'blue', title: 'STEWARD' },
        marshal: { icon: '⚔️', color: 'orange', title: 'MARSHAL' },
        sentinel: { icon: '🛡️', color: 'cyan', title: 'SENTINEL' },
        veil_watcher: { icon: '👁️', color: 'zinc', title: 'VEIL WATCHER' },
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="p-6 bg-zinc-900/60 border-white/10 backdrop-blur-xl">
                <h2 className="text-lg font-bold text-white mb-2">Command Structure</h2>
                <p className="text-zinc-500 text-xs mb-6">Active moderators and their roles from the database.</p>

                {loading ? (
                    <div className="text-center py-12 text-zinc-500 animate-pulse">Loading hierarchy...</div>
                ) : moderators.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">No moderators assigned yet.</div>
                ) : (
                    <div className="space-y-3">
                        {moderators.map((mod: any) => {
                            const display = roleDisplay[mod.role] || { icon: '❓', color: 'zinc', title: mod.role };
                            const colors: Record<string, string> = {
                                yellow: 'border-yellow-500/30 bg-yellow-500/5',
                                red: 'border-red-500/30 bg-red-500/5',
                                purple: 'border-purple-500/30 bg-purple-500/5',
                                blue: 'border-blue-500/30 bg-blue-500/5',
                                orange: 'border-orange-500/30 bg-orange-500/5',
                                cyan: 'border-cyan-500/30 bg-cyan-500/5',
                                zinc: 'border-zinc-500/30 bg-zinc-500/5',
                            };
                            return (
                                <div key={mod.id} className={`flex items-center gap-4 p-4 rounded-xl border ${colors[display.color] || colors.zinc}`}>
                                    <div className="text-2xl">{display.icon}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{display.title}</span>
                                            <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded">{mod.scope_type}</span>
                                        </div>
                                        <div className="text-xs text-zinc-400">
                                            @{mod.user_profiles?.username || 'Unknown'} · {mod.user_id.slice(0, 8)}...
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-zinc-600">
                                        {new Date(mod.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}

// --- Components ---

function NavButton({ label, active, onClick, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active
                ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300 border border-transparent'
                }`}
        >
            <span className="text-lg">{icon}</span>
            <span className="text-xs font-bold tracking-wider">{label}</span>
            {active && <div className="ml-auto w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]" />}
        </button>
    );
}

function StatCard({ label, value, trend, color = "text-white", highlight }: any) {
    return (
        <Card className={`p-5 border-white/5 bg-zinc-900/40 relative overflow-hidden group hover:border-white/10 transition-colors ${highlight ? 'bg-gradient-to-br from-white/5 to-transparent' : ''}`}>
            <div className="flex flex-col h-full justify-between">
                <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mb-2">{label}</span>
                <div>
                    <span className={`text-3xl font-display font-bold ${color} block mb-1`}>{value}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">{trend}</span>
                </div>
            </div>
            {highlight && <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full -mr-12 -mt-12 pointer-events-none" />}
        </Card>
    );
}

function AlertRow({ time, msg, color, type }: any) {
    return (
        <div className="flex gap-3 text-[11px] font-mono items-center py-1 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded -mx-2 transition-colors cursor-default">
            <span className="text-zinc-600 shrink-0">{time}</span>
            <span className={`font-bold w-16 shrink-0 ${color}`}>{type}</span>
            <span className="text-zinc-400 truncate flex-1">{msg}</span>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        NORMAL: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        ELEVATED: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        WATCH: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        LOCKDOWN: "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse",
        QUIET: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
    };
    return (
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status] || styles.NORMAL}`}>
            {status}
        </div>
    );
}

function ActionButton({ icon, label, desc, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-3 rounded-xl border border-transparent transition-all group text-left active:scale-[0.98] hover:bg-white/5 hover:border-white/10"
        >
            <div className="text-xl grayscale group-hover:grayscale-0 transition-all">{icon}</div>
            <div>
                <div className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{label}</div>
                <div className="text-[10px] text-zinc-600 group-hover:text-zinc-400 uppercase tracking-wider">{desc}</div>
            </div>
        </button>
    );
}

function TerminalWidget({ open, setOpen, history, setHistory }: any) {
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [history, open]);

    const handleCommand = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = input.trim().toLowerCase();
            const newHistory = [...history, `> ${input}`];

            if (cmd === 'help') {
                newHistory.push("Commands: clear, status, users, posts, mods, exit");
            } else if (cmd === 'clear') {
                setHistory([]);
                setInput("");
                return;
            } else if (cmd === 'status') {
                const supabase = createClient();
                const { count: userCount } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true });
                const { count: postCount } = await supabase.from('posts').select('id', { count: 'exact', head: true });
                newHistory.push(`System: OPERATIONAL | Users: ${userCount} | Posts: ${postCount}`);
            } else if (cmd === 'users') {
                const supabase = createClient();
                const { data } = await supabase.from('user_profiles').select('username, verification_status, is_banned').limit(10);
                (data || []).forEach((u: any) => {
                    const status = u.is_banned ? '⛔BANNED' : u.verification_status;
                    newHistory.push(`  @${u.username} [${status}]`);
                });
            } else if (cmd === 'posts') {
                const supabase = createClient();
                const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true });
                newHistory.push(`Total posts: ${count}`);
            } else if (cmd === 'mods') {
                const supabase = createClient();
                const { data } = await supabase.from('moderators').select('role, user_profiles(username)');
                (data || []).forEach((m: any) => {
                    newHistory.push(`  ${m.role}: @${m.user_profiles?.username || 'unknown'}`);
                });
            } else if (cmd !== "") {
                newHistory.push(`Command not recognized: ${cmd}. Type 'help' for available commands.`);
            }

            setHistory(newHistory);
            setInput("");
        }
    };

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-[#0c0c0c] border-t border-white/10 transition-all duration-300 z-50 flex flex-col ${open ? 'h-64' : 'h-10'}`}>
            <div
                className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-white/5 cursor-pointer hover:bg-white/10"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-400">TERMINAL</span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                </div>
                <span className="text-xs text-zinc-500">{open ? '▼' : '▲'}</span>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col p-4 font-mono text-xs">
                <div className="flex-1 overflow-y-auto space-y-1 text-zinc-300 mb-2 custom-scrollbar">
                    {history.map((line: string, i: number) => (
                        <div key={i} className="opacity-80">{line}</div>
                    ))}
                    <div ref={bottomRef} />
                </div>
                <div className="flex gap-2 items-center text-zinc-400">
                    <span>$</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleCommand}
                        className="flex-1 bg-transparent focus:outline-none text-white"
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
}
