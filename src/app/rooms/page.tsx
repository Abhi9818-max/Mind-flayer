"use client";

import { Suspense, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { RoomCard } from "@/components/rooms/RoomCard";
import { Users, Plus, Skull, BatteryLow, ArrowRight } from "lucide-react";
import { getRoomsWithStats, RoomWithStats } from "@/lib/services/rooms";
import Link from "next/link";

export default function RoomsPage() {
    const [rooms, setRooms] = useState<RoomWithStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRooms();

        // Refresh active user counts every 30 seconds
        const interval = setInterval(fetchRooms, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchRooms = async () => {
        try {
            const data = await getRoomsWithStats();
            setRooms(data);
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalUsers = rooms.reduce((sum, room) => sum + room.activeUsers, 0);
    const trendingRooms = rooms
        .sort((a, b) => b.activeUsers - a.activeUsers)
        .slice(0, 4);

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>
            <MobileNav />

            <main className="relative z-10 pt-[calc(env(safe-area-inset-top,20px)+72px)] lg:pt-24 pb-24 px-4 max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-2">
                                The Void
                            </h1>
                            <p className="text-zinc-400">Live anonymous chat rooms • Be yourself, be nobody</p>
                        </div>
                        <button className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-900/20">
                            <Plus size={24} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Users size={16} />
                        <span>
                            {loading ? "..." : `${totalUsers} people chatting now`}
                        </span>
                    </div>
                </div>

                {/* ====== THE DYING ROOM — Special Pinned Card ====== */}
                <div className="mb-8">
                    <Link href="/dying-room" className="block group">
                        <div className="relative overflow-hidden rounded-2xl border border-red-900/30 bg-gradient-to-br from-black via-red-950/20 to-black p-5 transition-all duration-300 hover:border-red-700/50 hover:shadow-lg hover:shadow-red-900/20 active:scale-[0.99]">
                            {/* Animated background pulse */}
                            <div className="absolute inset-0 bg-red-950/5 animate-pulse pointer-events-none" />
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.15) 2px, rgba(255,0,0,0.15) 4px)" }} />

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Skull Icon with Aura */}
                                    <div className="relative">
                                        <div className="absolute -inset-2 rounded-full bg-red-600/10 blur-xl animate-pulse" />
                                        <div className="relative w-12 h-12 rounded-xl bg-red-950/50 border border-red-900/40 flex items-center justify-center">
                                            <Skull size={24} className="text-red-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-black text-red-500 tracking-wider uppercase flex items-center gap-2">
                                            The Dying Room
                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/50 border border-red-900/30 text-red-400 normal-case tracking-normal">
                                                EXCLUSIVE
                                            </span>
                                        </h3>
                                        <p className="text-zinc-500 text-xs mt-0.5">Only the dying may speak. Battery ≤ 5% to enter.</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/30 border border-red-900/20">
                                        <BatteryLow size={14} className="text-red-600" />
                                        <span className="text-[10px] font-mono font-bold text-red-500">GATED</span>
                                    </div>
                                    <ArrowRight size={16} className="text-zinc-600 group-hover:text-red-400 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Trending Rooms */}
                        {trendingRooms.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4">🔥 Trending Rooms</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {trendingRooms.map((room, i) => (
                                        <RoomCard key={room.id} room={room} delay={i * 100} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Rooms */}
                        <div>
                            <h2 className="text-xl font-bold mb-4">All Rooms</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rooms.map((room, i) => (
                                    <RoomCard key={room.id} room={room} delay={i * 100} />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
