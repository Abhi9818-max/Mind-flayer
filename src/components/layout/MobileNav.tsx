"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Globe, Bell, User, Plus, MessageCircle, Radio } from "lucide-react";

export function MobileNav({ onComposeClick }: { onComposeClick?: () => void }) {
    const pathname = usePathname();

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe">
            <div className="flex justify-around items-center h-16">
                <MobileNavLink href="/feed" icon={<Home size={24} />} active={pathname === "/feed"} />
                <MobileNavLink href="/rooms" icon={<Radio size={24} />} active={pathname === "/rooms"} />
                <MobileNavLink href="/explore" icon={<Globe size={24} />} active={pathname === "/explore"} />

                {/* Center Action Button */}
                <div className="relative -top-5">
                    <button
                        onClick={onComposeClick}
                        className="h-14 w-14 rounded-full bg-black border-2 border-white text-white flex items-center justify-center shadow-lg shadow-white/10 transition-transform active:scale-95 hover:bg-white/10"
                    >
                        <Plus size={28} />
                    </button>
                </div>

                <MobileNavLink href="/messages" icon={<MessageCircle size={24} />} badge="3" active={pathname === "/messages" || pathname.startsWith("/messages/")} />
                <MobileNavLink href="/profile" icon={<User size={24} />} active={pathname === "/profile"} />
            </div>
        </nav>
    );
}

function MobileNavLink({ href, icon, active = false, badge }: { href: string; icon: React.ReactNode; active?: boolean; badge?: string }) {
    return (
        <Link
            href={href}
            className={`
                flex items-center justify-center w-full h-full relative group transition-all duration-200
                ${active ? 'text-white opacity-100 scale-110' : 'text-zinc-400 opacity-60 hover:opacity-100 hover:text-white'}
            `}
        >
            <div className="relative">
                {icon}
                {badge && (
                    <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full">
                        {badge}
                    </span>
                )}
            </div>
        </Link>
    );
}
