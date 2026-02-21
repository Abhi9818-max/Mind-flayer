"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Globe, Bell, User, Plus, MessageCircle, Radio } from "lucide-react";
import { useAdaptiveLayout } from "@/lib/hooks/useAdaptiveLayout";

export function MobileNav({ onComposeClick }: { onComposeClick?: () => void }) {
    const pathname = usePathname();

    // Define nav items in standard exact order
    const navItems = [
        { href: "/feed", icon: <Home size={24} />, label: "Feed" },
        { href: "/explore", icon: <Globe size={24} />, label: "Explore" },
        { href: "/messages", icon: <MessageCircle size={24} />, label: "Messages" },
        { href: "/profile", icon: <User size={24} />, label: "Profile" },
    ];

    // Split into left and right sections (center will be the compose button)
    const leftItems = navItems.slice(0, 2);
    const rightItems = navItems.slice(2, 4);

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe">
            <div className="flex justify-around items-center h-16">
                {leftItems.map((item) => (
                    <MobileNavLink
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        active={pathname === item.href || (item.href === "/messages" && pathname.startsWith("/messages/"))}
                    />
                ))}

                {/* Center Action Button */}
                <div className="relative -top-5">
                    <button
                        onClick={onComposeClick}
                        className="h-14 w-14 rounded-full bg-black border-2 border-white text-white flex items-center justify-center shadow-lg shadow-white/10 transition-transform active:scale-95 hover:bg-white/10"
                    >
                        <Plus size={28} />
                    </button>
                </div>

                {rightItems.map((item) => (
                    <MobileNavLink
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        active={pathname === item.href || (item.href === "/messages" && pathname.startsWith("/messages/"))}
                    />
                ))}
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
