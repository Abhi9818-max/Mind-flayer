"use client";

import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileHeaderProps {
    username: string;
}

export function ProfileHeader({ username }: ProfileHeaderProps) {
    const router = useRouter();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 pointer-events-none">
            {/* Back Button (Floating Pill) */}
            <button
                onClick={() => router.back()}
                className="pointer-events-auto p-3 bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all rounded-full shadow-lg border border-white/10 active:scale-95"
            >
                <ChevronLeft size={24} />
            </button>

            {/* Menu Button (Floating Pill) */}
            <button className="pointer-events-auto p-3 bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all rounded-full shadow-lg border border-white/10 active:scale-95">
                <MoreHorizontal size={24} />
            </button>
        </header>
    );
}
