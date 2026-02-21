"use client";

import Link from "next/link";
import { Users } from "lucide-react";

interface Room {
    id: string;
    name: string;
    description: string | null;
    emoji: string | null;
    category: string | null;
    activeUsers: number;
}

interface RoomCardProps {
    room: Room;
    delay: number;
}

export function RoomCard({ room, delay }: RoomCardProps) {
    return (
        <Link href={`/rooms/${room.id}`}>
            <div
                className="group p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${delay}ms` }}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl group-hover:scale-110 transition-transform">
                        {room.emoji || "💬"}
                    </div>
                    {room.category && (
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
                            {room.category}
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-bold mb-1 group-hover:text-red-400 transition-colors">
                    {room.name}
                </h3>
                <p className="text-sm text-zinc-400 mb-4">{room.description || "No description"}</p>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                        <div className="relative">
                            <Users size={16} />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <span className="font-mono font-bold">{room.activeUsers}</span>
                        <span>online</span>
                    </div>
                </div>

                <div className="mt-4 py-2 px-4 bg-white/5 group-hover:bg-red-600 rounded-full text-center font-medium text-sm transition-colors">
                    Join Room →
                </div>
            </div>
        </Link>
    );
}
