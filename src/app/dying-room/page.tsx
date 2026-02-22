"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBattery, isEligible, getEntryThreshold } from "@/lib/hooks/useBattery";
import { useToast } from "@/lib/context/ToastContext";
import { createClient } from "@/lib/supabase/client";
import { BatteryLow, BatteryCharging, Skull, Zap, Send, ArrowLeft } from "lucide-react";

interface DyingMessage {
    id: string;
    content: string;
    author_name: string;
    created_at: string;
    battery_level: number;
}

export default function DyingRoomPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const battery = useBattery();
    const [phase, setPhase] = useState<"checking" | "rejected" | "entering" | "inside" | "kicked">("checking");
    const [messages, setMessages] = useState<DyingMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [glitchFrame, setGlitchFrame] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wasInsideRef = useRef(false);

    const threshold = getEntryThreshold(battery.isMobile);
    const thresholdPercent = Math.round(threshold * 100);
    const batteryPercent = Math.round(battery.level * 100);

    // Fetch user on mount
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }: any) => {
            if (!user) {
                router.push("/login");
                return;
            }
            setCurrentUser(user);
            supabase.from("user_profiles").select("display_name, void_name").eq("id", user.id).single()
                .then(({ data }: any) => setUserProfile(data));
        });
    }, []);

    // Gate logic: check eligibility
    useEffect(() => {
        if (!battery.supported) {
            if (phase === "checking") {
                // Give it a moment to initialize
                const timer = setTimeout(() => {
                    if (!battery.supported) {
                        setPhase("rejected");
                    }
                }, 2000);
                return () => clearTimeout(timer);
            }
            return;
        }

        if (phase === "checking" || phase === "rejected") {
            if (isEligible(battery.level, battery.charging, battery.isMobile)) {
                setPhase("entering");
                setTimeout(() => {
                    setPhase("inside");
                    wasInsideRef.current = true;
                }, 2500); // Dramatic entrance animation
            } else {
                setPhase("rejected");
            }
        }
    }, [battery.supported, battery.level, battery.charging, phase]);

    // Auto-kick: if charging starts while inside
    useEffect(() => {
        if (phase === "inside" && battery.charging) {
            setPhase("kicked");
            showToast({
                title: "⚡ COWARD",
                message: "You plugged in. Connection to the Dying Room has been severed.",
                type: "error",
                rank: "primary",
            });
            setTimeout(() => router.push("/feed"), 3000);
        }
    }, [battery.charging, phase]);

    // Auto-kick: if battery goes above threshold while inside
    useEffect(() => {
        if (phase === "inside" && battery.level > threshold) {
            setPhase("kicked");
            showToast({
                title: "⚡ Signal Lost",
                message: "Your battery recovered. You no longer qualify for the Dying Room.",
                type: "error",
                rank: "primary",
            });
            setTimeout(() => router.push("/feed"), 3000);
        }
    }, [battery.level, phase]);

    // Glitch effect ticker
    useEffect(() => {
        if (phase !== "inside") return;
        const interval = setInterval(() => {
            setGlitchFrame(prev => prev + 1);
        }, 150);
        return () => clearInterval(interval);
    }, [phase]);

    // Load existing messages
    useEffect(() => {
        if (phase !== "inside") return;

        const supabase = createClient();

        async function loadMessages() {
            const { data } = await supabase
                .from("dying_room_messages")
                .select("*")
                .order("created_at", { ascending: true })
                .limit(50);
            if (data) setMessages(data as DyingMessage[]);
        }

        loadMessages();

        // Real-time subscription
        const channel = supabase
            .channel("dying_room")
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "dying_room_messages",
            }, (payload: any) => {
                setMessages(prev => [...prev, payload.new as DyingMessage]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [phase]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || sending || !currentUser) return;
        setSending(true);

        try {
            const supabase = createClient();
            const authorName = userProfile?.void_name || userProfile?.display_name || "Unknown Entity";

            await supabase.from("dying_room_messages").insert({
                content: newMessage.trim(),
                author_name: authorName,
                author_id: currentUser.id,
                battery_level: batteryPercent,
            });

            setNewMessage("");
        } catch (e) {
            console.error("Failed to send:", e);
        } finally {
            setSending(false);
        }
    };

    // ====== RENDER STATES ======

    // CHECKING
    if (phase === "checking") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <Skull size={48} className="text-red-900 animate-pulse mx-auto mb-4" />
                    <p className="text-zinc-600 text-sm font-mono animate-pulse">SCANNING VITALS...</p>
                </div>
            </div>
        );
    }

    // REJECTED
    if (phase === "rejected") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-6">
                <div className="text-center max-w-sm">
                    {/* Locked Icon */}
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 rounded-full border-2 border-red-900/30 animate-pulse" />
                        <div className="absolute inset-2 rounded-full border border-red-900/20" />
                        <div className="w-full h-full rounded-full bg-red-950/20 flex items-center justify-center">
                            <BatteryLow size={36} className="text-red-700" />
                        </div>
                    </div>

                    {/* Rejection Message */}
                    <h1 className="text-2xl font-black text-red-600 tracking-wider mb-3 uppercase">
                        Not Worthy
                    </h1>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                        The Dying Room only opens for those on the edge.
                        {!battery.supported ? (
                            <span className="block mt-2 text-zinc-600 text-xs font-mono">
                                Battery API is not supported on this browser.
                            </span>
                        ) : (
                            <span className="block mt-2 text-zinc-600 text-xs font-mono">
                                Your battery is at <span className="text-red-500 font-bold">{batteryPercent}%</span>.
                                Drain to <span className="text-red-400 font-bold">{thresholdPercent}%</span> to enter.
                            </span>
                        )}
                    </p>

                    {/* Battery Visual Bar */}
                    {battery.supported && (
                        <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden mb-6">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-1000"
                                style={{ width: `${batteryPercent}%` }}
                            />
                        </div>
                    )}

                    {battery.charging && (
                        <div className="flex items-center justify-center gap-2 text-yellow-500 text-xs font-mono mb-4">
                            <BatteryCharging size={14} />
                            <span>CHARGING DETECTED — UNPLUG TO DESCEND</span>
                        </div>
                    )}

                    <button
                        onClick={() => router.push("/feed")}
                        className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-semibold hover:bg-zinc-800 hover:text-white transition-all"
                    >
                        <ArrowLeft size={14} />
                        Return to Safety
                    </button>
                </div>
            </div>
        );
    }

    // ENTERING (dramatic transition)
    if (phase === "entering") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center animate-pulse">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-red-600/20 blur-2xl animate-ping" />
                        <div className="w-full h-full rounded-full bg-red-950/40 flex items-center justify-center border border-red-900/40">
                            <Skull size={32} className="text-red-500" />
                        </div>
                    </div>
                    <p className="text-red-600 text-xs font-mono tracking-[0.3em] uppercase">
                        Descending into the void...
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-1">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce"
                                style={{ animationDelay: `${i * 200}ms` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // KICKED
    if (phase === "kicked") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <Zap size={64} className="text-yellow-500 mx-auto mb-4 animate-bounce" />
                    <h1 className="text-3xl font-black text-yellow-400 tracking-wider mb-2">EJECTED</h1>
                    <p className="text-zinc-500 text-sm font-mono">Connection severed. Redirecting...</p>
                </div>
            </div>
        );
    }

    // ====== INSIDE THE DYING ROOM ======
    const shouldGlitch = glitchFrame % 13 === 0;

    return (
        <div className={`min-h-screen bg-black flex flex-col relative overflow-hidden ${shouldGlitch ? 'translate-x-[1px]' : ''}`}>
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Red heartbeat pulse */}
                <div className="absolute inset-0 bg-red-950/5 animate-pulse" />
                {/* Scanlines */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.1) 2px, rgba(255,0,0,0.1) 4px)",
                    }}
                />
                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,black_100%)]" />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-red-950/30 px-4 py-3">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push("/feed")} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-sm font-black text-red-600 tracking-widest uppercase flex items-center gap-2">
                                <Skull size={14} />
                                The Dying Room
                            </h1>
                            <p className="text-[9px] text-zinc-700 font-mono tracking-wider">
                                ONLY THE DYING MAY SPEAK
                            </p>
                        </div>
                    </div>

                    {/* Live Battery Display */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-950/30 border border-red-900/20">
                            <BatteryLow size={12} className="text-red-500" />
                            <span className="text-[10px] font-mono font-bold text-red-400">
                                {batteryPercent}%
                            </span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 z-10">
                <div className="max-w-lg mx-auto space-y-3">
                    {/* Welcome Message */}
                    <div className="text-center py-6">
                        <p className="text-zinc-700 text-xs font-mono italic">
                            You've entered the threshold. Only the dying can see these words.
                        </p>
                    </div>

                    {messages.length === 0 && (
                        <div className="text-center py-12">
                            <Skull size={24} className="text-red-900/40 mx-auto mb-3" />
                            <p className="text-zinc-800 text-xs font-mono">
                                No whispers yet. Be the first to speak from the edge.
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="group relative bg-zinc-950/80 border border-red-950/20 rounded-xl px-4 py-3 hover:border-red-900/30 transition-all"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-red-700 tracking-wide flex items-center gap-1.5">
                                    {msg.author_name}
                                    <span className="text-[8px] font-mono text-red-950 px-1 py-0.5 rounded bg-red-950/30">
                                        🔋 {msg.battery_level}%
                                    </span>
                                </span>
                                <span className="text-[9px] text-zinc-800 font-mono">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                {msg.content}
                            </p>
                        </div>
                    ))}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input */}
            <div className="sticky bottom-0 z-30 bg-black/90 backdrop-blur-xl border-t border-red-950/20 px-4 py-3">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Whisper from the edge..."
                        className="flex-1 bg-zinc-950 border border-red-950/20 rounded-xl px-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-red-800/40 transition-colors font-mono"
                        maxLength={280}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/30 flex items-center justify-center text-red-500 hover:bg-red-900/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
