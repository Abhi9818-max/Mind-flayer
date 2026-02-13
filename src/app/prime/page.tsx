"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

// Mock Data Types
interface Log {
    id: string;
    time: string;
    type: string;
    msg: string;
    color: string;
}

interface Dominion {
    id: number;
    name: string;
    status: "NORMAL" | "ELEVATED" | "WATCH" | "LOCKDOWN" | "QUIET";
    risk: number;
}

export default function PrimeDashboard() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'dominions' | 'surveillance' | 'hierarchy'>('overview');

    // Shared State
    const [logs, setLogs] = useState<Log[]>([
        { id: '1', time: "10:45", type: "CRIT", msg: "Unauthorized access attempt [IP blocked]", color: "text-red-500" },
        { id: '2', time: "10:42", type: "INFO", msg: "Spike in 'Confession' posts detected", color: "text-blue-500" },
    ]);
    const [dominions, setDominions] = useState<Dominion[]>([
        { id: 1001, name: "DU North Campus", status: "NORMAL", risk: 12 },
        { id: 1002, name: "DU South Campus", status: "NORMAL", risk: 8 },
        { id: 1003, name: "JNU", status: "ELEVATED", risk: 65 },
        { id: 1004, name: "Jamia Millia", status: "NORMAL", risk: 24 },
        { id: 1005, name: "Amity Noida", status: "WATCH", risk: 45 },
        { id: 1006, name: "IIT Delhi", status: "QUIET", risk: 5 },
        { id: 1007, name: "DTU", status: "NORMAL", risk: 15 },
        { id: 1008, name: "NSUT", status: "NORMAL", risk: 18 },
    ]);
    const [terminalHistory, setTerminalHistory] = useState<string[]>([
        "Mind-Flayer OS v4.2.0 [Secure Boot]",
        "Connected to NCR Node...",
        "Awaiting input..."
    ]);
    const [terminalOpen, setTerminalOpen] = useState(false);

    // Actions
    const addLog = useCallback((type: string, msg: string, color: string = "text-zinc-400") => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLogs(prev => [{ id: Date.now().toString(), time: timeStr, type, msg, color }, ...prev]);
    }, []);

    const addToTerminal = useCallback((line: string) => {
        setTerminalHistory(prev => [...prev, `> ${line}`]);
        setTerminalOpen(true); // Auto-open on system action
    }, []);

    useEffect(() => {
        if (!document.cookie.includes("mindflayer-role=prime_sovereign")) {
            router.push("/prime/access");
        } else {
            setAuthorized(true);
        }
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
                <div className="flex gap-1 text-[10px] text-zinc-500">
                    <span>LATENCY: 12ms</span>
                    <span className="mx-2">|</span>
                    <span>UPTIME: 99.99%</span>
                </div>
            </header>

            {/* Main Layout */}
            <main className="pt-20 pb-64 px-6 max-w-[1600px] mx-auto grid grid-cols-12 gap-6">

                {/* Sidebar Navigation */}
                <nav className="col-span-12 lg:col-span-2 flex flex-col gap-2">
                    <NavButton label="OVERVIEW" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon="⚡" />
                    <NavButton label="DOMINIONS" active={activeTab === 'dominions'} onClick={() => setActiveTab('dominions')} icon="🗺️" />
                    <NavButton label="HIERARCHY" active={activeTab === 'hierarchy'} onClick={() => setActiveTab('hierarchy')} icon="👑" />

                    <div className="mt-8 p-4 border border-red-900/30 bg-red-950/10 rounded-xl">
                        <h3 className="text-[10px] font-bold text-red-500 mb-2 tracking-widest">THREAT LEVEL</h3>
                        <div className="text-2xl font-bold text-red-500 animate-pulse">ELEVATED</div>
                        <div className="mt-2 text-xs text-red-400/70">
                            Anomalous pattern detected in Sector 7 (DU North).
                        </div>
                    </div>
                </nav>

                {/* Content Area */}
                <div className="col-span-12 lg:col-span-10 space-y-6">

                    {activeTab === 'overview' && (
                        <OverviewView
                            logs={logs}
                            addLog={addLog}
                            addToTerminal={addToTerminal}
                        />
                    )}
                    {activeTab === 'dominions' && (
                        <DominionsView
                            dominions={dominions}
                            setDominions={setDominions}
                            addLog={addLog}
                            addToTerminal={addToTerminal}
                        />
                    )}
                    {activeTab === 'surveillance' && (
                        <SurveillanceView
                            addLog={addLog}
                            addToTerminal={addToTerminal}
                        />
                    )}
                    {activeTab === 'hierarchy' && (
                        <HierarchyView
                            addLog={addLog}
                            addToTerminal={addToTerminal}
                        />
                    )}

                </div>
            </main>

            {/* Floating Terminal */}
            <TerminalWidget
                open={terminalOpen}
                setOpen={setTerminalOpen}
                history={terminalHistory}
                setHistory={setTerminalHistory}
            />
        </div>
    );
}

// --- Views ---

function HierarchyView({ addLog, addToTerminal }: any) {
    const [selectedRole, setSelectedRole] = useState<string>("crowned_king");
    const [scope, setScope] = useState<string>("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);

    const roles = [
        { id: "the_hand", label: "The Hand", desc: "Global Executioner", color: "text-red-500", border: "border-red-500", scopes: ["Global"] },
        { id: "crowned_king", label: "Crowned King", desc: "Dominion Ruler (Region)", color: "text-purple-500", border: "border-purple-500", scopes: ["DU North", "DU South", "Amity", "JNU"] },
        { id: "steward", label: "Steward", desc: "Territory Lead (College)", color: "text-blue-500", border: "border-blue-500", scopes: ["Hansraj", "Hindu", "Stephens", "Miranda"] },
        { id: "marshal", label: "Marshal", desc: "College Enforcer", color: "text-orange-500", border: "border-orange-500", scopes: ["Hansraj", "Hindu", "Stephens", "Miranda"] },
        { id: "veil_watcher", label: "Veil Watcher", desc: "College Surveillance", color: "text-zinc-400", border: "border-zinc-500", scopes: ["Hansraj", "Hindu", "Stephens", "Miranda"] },
    ];

    const currentRoleConfig = roles.find(r => r.id === selectedRole);

    const handleAppoint = () => {
        if (!username) return;
        setLoading(true);
        const scopeCmd = currentRoleConfig?.scopes[0] === "Global" ? "--global" : `--scope "${scope || 'General'}"`;
        addToTerminal(`grant-role --user ${username} --role ${selectedRole} ${scopeCmd} --force`);

        setTimeout(() => {
            setLoading(false);
            addLog('AUTH', `Appointed ${username} as ${selectedRole.toUpperCase().replace('_', ' ')} [${scope || 'Global'}]`, 'text-yellow-400');
            addToTerminal(`Permissions updated for ${username}. Hierarchy node created.`);
            setUsername("");
            setScope("");
        }, 1000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Appointment Panel */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="p-6 bg-zinc-900/60 border-white/10 backdrop-blur-xl h-full">
                    <h2 className="text-lg font-bold text-white mb-2">Appoint Official</h2>
                    <p className="text-zinc-500 text-xs mb-6">Designate authority levels and jurisdiction.</p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400">SELECT RANK</label>
                            <div className="grid grid-cols-1 gap-2">
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        onClick={() => { setSelectedRole(role.id); setScope(""); }}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${selectedRole === role.id
                                            ? `bg-white/10 ${role.border} ${role.color}`
                                            : 'bg-black/40 border-white/5 text-zinc-500 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-sm">{role.label}</div>
                                            <div className="text-[10px] opacity-70">{role.desc}</div>
                                        </div>
                                        {selectedRole === role.id && <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_5px_currentColor]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {currentRoleConfig?.scopes[0] !== "Global" && (
                            <div className="space-y-2 animate-fade-in">
                                <label className="text-xs font-bold text-zinc-400">JURISDICTION (SCOPE)</label>
                                <select
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 font-mono appearance-none"
                                    value={scope}
                                    onChange={(e) => setScope(e.target.value)}
                                >
                                    <option value="" disabled>Select Jurisdiction...</option>
                                    {currentRoleConfig?.scopes.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400">TARGET IDENTIFIER</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username or Hash..."
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 font-mono"
                            />
                        </div>

                        <button
                            onClick={handleAppoint}
                            disabled={loading || !username || (currentRoleConfig?.scopes[0] !== "Global" && !scope)}
                            className="w-full py-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 font-bold rounded-lg border border-yellow-500/30 transition-all disabled:opacity-50 mt-4"
                        >
                            {loading ? 'PROCESSING...' : 'CONFIRM APPOINTMENT'}
                        </button>
                    </div>
                </Card>
            </div>

            {/* Hierarchy Tree Visual */}
            <div className="lg:col-span-2">
                <Card className="p-0 bg-zinc-900/40 border-white/10 h-full relative overflow-hidden flex flex-col">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-lg font-bold text-white">Command Structure</h2>
                        <p className="text-[10px] text-zinc-500">Visualizing active chains of command.</p>
                    </div>

                    <div className="flex-1 p-8 overflow-auto custom-scrollbar flex flex-col items-center relative z-10 min-w-[500px]">
                        {/* Level 1: Global */}
                        <div className="flex gap-16 mb-8">
                            <div className="flex flex-col items-center">
                                <RoleNode icon="☠️" title="THE HAND" user="Second Command" color="red" />
                            </div>
                            <div className="flex flex-col items-center relative -top-6">
                                <div className="w-20 h-20 rounded-full border-2 border-yellow-500 bg-yellow-500/10 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(234,179,8,0.4)] mb-2 relative z-20">
                                    👑
                                </div>
                                <div className="text-yellow-500 font-bold text-sm">PRIME SOVEREIGN</div>
                                <div className="text-zinc-500 text-[10px]">YOU</div>
                            </div>
                        </div>

                        {/* Connector Main */}
                        <div className="w-px h-8 bg-zinc-700 mb-8" />

                        {/* Level 2: Kings (Regions) */}
                        <div className="grid grid-cols-2 gap-20 w-full mb-8 relative">
                            {/* Connector Horizontal */}
                            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-zinc-700 -mt-8" />
                            <div className="absolute top-0 left-1/4 h-8 w-px bg-zinc-700 -mt-8" />
                            <div className="absolute top-0 right-1/4 h-8 w-px bg-zinc-700 -mt-8" />

                            {/* Region 1 */}
                            <div className="flex flex-col items-center">
                                <RoleNode icon="🗺️" title="CROWNED KING" user="DU North (Region)" color="purple" active />
                                <div className="w-px h-6 bg-purple-500/30 my-2" />
                                {/* Level 3: Stewards (Colleges) */}
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <RoleNode icon="🩸" title="STEWARD" user="Hansraj" color="blue" small />
                                        <div className="w-px h-3 bg-zinc-800 my-1" />
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" title="Marshal" />
                                            <div className="w-2 h-2 rounded-full bg-zinc-500" title="Watcher" />
                                            <div className="w-2 h-2 rounded-full bg-zinc-500" title="Watcher" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <RoleNode icon="🩸" title="STEWARD" user="Hindu" color="blue" small />
                                        <div className="w-px h-3 bg-zinc-800 my-1" />
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" title="Marshal" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Region 2 */}
                            <div className="flex flex-col items-center opacity-50 grayscale">
                                <RoleNode icon="🗺️" title="CROWNED KING" user="Amity (Region)" color="purple" />
                                <div className="w-px h-6 bg-purple-500/30 my-2" />
                                <div className="flex gap-4">
                                    <RoleNode icon="🩸" title="STEWARD" user="Amity Noida" color="blue" small />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function RoleNode({ icon, title, user, color, active, small }: any) {
    const colors: any = {
        red: "border-red-500 text-red-500 bg-red-500/10",
        purple: "border-purple-500 text-purple-500 bg-purple-500/10",
        blue: "border-blue-500 text-blue-500 bg-blue-500/10",
        orange: "border-orange-500 text-orange-500 bg-orange-500/10",
        zinc: "border-zinc-500 text-zinc-500 bg-zinc-500/10",
    };

    return (
        <div className={`flex flex-col items-center ${active ? 'opacity-100' : 'opacity-70 grayscale hover:grayscale-0 transition-all'}`}>
            <div className={`rounded-xl border ${colors[color]} flex items-center justify-center ${small ? 'w-10 h-10 text-lg mb-1' : 'w-12 h-12 text-xl mb-2'} backdrop-blur-md`}>
                {icon}
            </div>
            <div className={`font-bold ${small ? 'text-[10px]' : 'text-xs'} text-zinc-300`}>{title}</div>
            <div className="text-zinc-600 text-[9px]">{user}</div>
        </div>
    );
}

function OverviewView({ logs, addLog, addToTerminal }: any) {
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="TOTAL USERS" value="12,842" trend="+124 today" />
                <StatCard label="ACTIVE POSTS" value="842" trend="+12% activity" highlight />
                <StatCard label="SHADOW BANS" value="89" trend="3 new" color="text-purple-400" />
                <StatCard label="REPORTS" value="14" trend="Requires Action" color="text-yellow-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Graph */}
                <div className="lg:col-span-2 h-80 bg-zinc-900/40 border border-white/10 rounded-xl p-4 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-zinc-400 tracking-wider">NETWORK TRAFFIC</h3>
                        <div className="flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] text-zinc-500">LIVE</span>
                        </div>
                    </div>
                    {/* Fake Graph Lines */}
                    <div className="absolute inset-x-0 bottom-0 h-64 opacity-50">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 80 C 20 70, 40 90, 60 60 C 80 40, 90 20, 100 50 V 100 H 0 Z" fill="url(#grad1)" fillOpacity="0.2" />
                            <path d="M0 80 C 20 70, 40 90, 60 60 C 80 40, 90 20, 100 50" stroke="#3b82f6" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />
                </div>

                {/* Live Logs */}
                <div className="h-80 bg-zinc-900/40 border border-white/10 rounded-xl p-4 flex flex-col">
                    <h3 className="text-xs font-bold text-zinc-400 tracking-wider mb-4">LIVE LOGS</h3>
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
                    <h3 className="text-sm font-bold text-zinc-300 mb-2">Emergency Protocols</h3>
                    <ActionButton
                        icon="🛑" label="Emergency Freeze" desc="Halt all posting globally" variant="danger"
                        onClick={() => handleAction("Emergency Freeze", "Global posting suspended.")}
                    />
                    <ActionButton
                        icon="👁️" label="Reveal All" desc="Bypass anonymity layer temporarily" variant="warning"
                        onClick={() => handleAction("Reveal All", "Anonymity layer bypassed for 60s.")}
                    />
                    <ActionButton
                        icon="🗑️" label="Purge Cache" desc="Clear systemic cache nodes" variant="neutral"
                        onClick={() => handleAction("Purge Cache", "Redis nodes flushed.")}
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
                placeholder="Broadcast a message to all users... (e.g., 'The Eye is Watching')"
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

function DominionsView({ dominions, setDominions, addLog, addToTerminal }: any) {
    const toggleLockdown = (id: number) => {
        setDominions((prev: Dominion[]) => prev.map(d => {
            if (d.id === id) {
                const newStatus = d.status === 'LOCKDOWN' ? 'NORMAL' : 'LOCKDOWN';
                const action = newStatus === 'LOCKDOWN' ? 'INITIATED' : 'LIFTED';

                addLog('WARN', `Lockdown ${action}: ${d.name}`, newStatus === 'LOCKDOWN' ? 'text-red-500' : 'text-emerald-500');
                addToTerminal(`sudo dominion --target ${d.id} --set-status ${newStatus}`);

                return { ...d, status: newStatus, risk: newStatus === 'LOCKDOWN' ? 99 : 15 };
            }
            return d;
        }));
    };

    const inspectDominion = (d: Dominion) => {
        addToTerminal(`inspect --deep ${d.name.replace(/\s+/g, '_').toLowerCase()}`);
        addLog('INFO', `Deep Scan started: ${d.name}`, 'text-blue-400');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {dominions.map((d: Dominion) => (
                <Card key={d.id} className={`p-4 bg-zinc-900/40 border-white/10 transition-all duration-500 group ${d.status === 'LOCKDOWN' ? 'border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'hover:border-white/20'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-zinc-200">{d.name}</h3>
                            <span className="text-[10px] text-zinc-500 tracking-widest uppercase">DOMINION ID: {d.id}</span>
                        </div>
                        <StatusBadge status={d.status} />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Risk Score</span>
                            <span>{d.risk}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${d.risk > 50 ? 'bg-red-500' : d.risk > 30 ? 'bg-yellow-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${d.risk}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => toggleLockdown(d.id)}
                            className={`flex-1 py-1 text-[10px] rounded border transition-all ${d.status === 'LOCKDOWN'
                                    ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300'
                                }`}
                        >
                            {d.status === 'LOCKDOWN' ? 'LIFT LOCKDOWN' : 'LOCKDOWN'}
                        </button>
                        <button
                            onClick={() => inspectDominion(d)}
                            className="flex-1 py-1 text-[10px] bg-white/5 hover:bg-white/10 rounded border border-white/5 text-zinc-300"
                        >
                            INSPECT
                        </button>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function SurveillanceView({ addLog, addToTerminal }: any) {
    const [hash, setHash] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleTrace = () => {
        if (!hash) return;
        setLoading(true);
        addToTerminal(`trace --hash ${hash} --depth full`);

        setTimeout(() => {
            setLoading(false);
            setResult({
                hash: hash,
                score: Math.floor(Math.random() * 1000),
                status: Math.random() > 0.8 ? 'FLAGGED' : 'ACTIVE',
                location: 'DU North Campus',
                record: Math.random() > 0.9 ? 'Shadow Banned' : 'Clean'
            });
            addLog('SUCCESS', `Trace complete for ${hash}`, 'text-emerald-500');
        }, 1200);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <Card className="p-6 bg-zinc-900/60 border-white/10 backdrop-blur-xl">
                <h2 className="text-lg font-bold text-white mb-2">User Inspector</h2>
                <p className="text-zinc-500 text-xs mb-6">Enter a user hash to reveal their digital footprint.</p>

                <div className="flex gap-2 mb-8">
                    <input
                        type="text"
                        value={hash}
                        onChange={(e) => setHash(e.target.value)}
                        placeholder="e.g. 8f3a9..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
                    />
                    <button
                        onClick={handleTrace}
                        disabled={loading || !hash}
                        className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-500 font-bold rounded-lg border border-red-500/30 transition-all disabled:opacity-50"
                    >
                        {loading ? 'TRACING...' : 'TRACE'}
                    </button>
                </div>

                {/* Result */}
                {result && (
                    <div className="space-y-6 border-t border-white/5 pt-6 animate-fade-in-up">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-2xl">
                                🕵️
                            </div>
                            <div>
                                <div className="text-xl font-bold text-white">Target Entity</div>
                                <div className="text-xs text-zinc-500 font-mono">HASH: {result.hash}</div>
                            </div>
                            <div className="ml-auto text-right">
                                <div className={`text-2xl font-bold ${result.score < 500 ? 'text-red-500' : 'text-yellow-500'}`}>
                                    {result.score}
                                </div>
                                <div className="text-[10px] text-zinc-600 uppercase">SOCIAL CREDIT</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                                <div className={`text-sm font-bold ${result.status === 'FLAGGED' ? 'text-red-500' : 'text-white'}`}>
                                    {result.status}
                                </div>
                                <div className="text-[10px] text-zinc-500">STATUS</div>
                            </div>
                            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                                <div className="text-sm font-bold text-white">{result.location}</div>
                                <div className="text-[10px] text-zinc-500">LOCATION</div>
                            </div>
                            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
                                <div className="text-sm font-bold text-white">{result.record}</div>
                                <div className="text-[10px] text-zinc-500">RECORD</div>
                            </div>
                        </div>
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
        <div className="flex gap-3 text-[11px] font-mono items-center py-1 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded -mx-2 transition-colors cursor-default animate-fade-in-left">
            <span className="text-zinc-600 shrink-0">{time}</span>
            <span className={`font-bold w-12 shrink-0 ${color}`}>{type}</span>
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

function ActionButton({ icon, label, desc, variant, onClick }: any) {
    const bgColors = {
        danger: "hover:bg-red-500/10 hover:border-red-500/30",
        warning: "hover:bg-yellow-500/10 hover:border-yellow-500/30",
        neutral: "hover:bg-white/5 hover:border-white/20"
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-3 rounded-xl border border-transparent transition-all group text-left active:scale-[0.98] ${bgColors[variant as keyof typeof bgColors]}`}
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

    const handleCommand = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = input.trim().toLowerCase();
            const newHistory = [...history, `> ${input}`];

            if (cmd === 'help') {
                newHistory.push("Available commands: clear, status, purge, exit");
            } else if (cmd === 'clear') {
                setHistory([]);
                setInput("");
                return;
            } else if (cmd === 'status') {
                newHistory.push("System: OPERATIONAL | Load: 45%");
            } else if (cmd !== "") {
                newHistory.push(`Command not recognized: ${cmd}`);
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
