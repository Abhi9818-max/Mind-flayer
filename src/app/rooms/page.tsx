"use client";

import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { RoomCard } from "@/components/rooms/RoomCard";
import { Users, Plus } from "lucide-react";

const MOCK_ROOMS = [
    { id: "1", name: "The Void", description: "General anonymous chat", emoji: "🌀", category: "General", activeUsers: 42 },
    { id: "2", name: "Study Hall", description: "Focused study sessions", emoji: "📚", category: "Study", activeUsers: 28 },
    { id: "3", name: "Confession Box", description: "Share your secrets", emoji: "🤫", category: "Confessions", activeUsers: 67 },
    { id: "4", name: "Meme Factory", description: "Share and laugh", emoji: "😂", category: "Memes", activeUsers: 91 },
    { id: "5", name: "Late Night Thoughts", description: "3 AM conversations", emoji: "🌙", category: "General", activeUsers: 15 },
    { id: "6", name: "Dating Advice", description: "Love and relationships", emoji: "💕", category: "Advice", activeUsers: 34 },
];

export default function RoomsPage() {
    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>
            <MobileNav />

            <main className="relative z-10 pt-8 lg:pt-24 pb-24 px-4 max-w-4xl mx-auto">
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
                        <span>{MOCK_ROOMS.reduce((sum, room) => sum + room.activeUsers, 0)} people chatting now</span>
                    </div>
                </div>

                {/* Featured Rooms */}
                <div className="mb-8">
                    <h2 className="text-xl fontbold mb-4">🔥 Trending Rooms</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MOCK_ROOMS.slice(0, 4).map((room, i) => (
                            <RoomCard key={room.id} room={room} delay={i * 100} />
                        ))}
                    </div>
                </div>

                {/* All Rooms */}
                <div>
                    <h2 className="text-xl font-bold mb-4">All Rooms</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MOCK_ROOMS.map((room, i) => (
                            <RoomCard key={room.id} room={room} delay={i * 100} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
