"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Home, Radio, Compass, MessageCircle, Bell, User as UserIcon, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const isHomePage = pathname === "/";

    useEffect(() => {
        let mounted = true;
        const supabase = createClient();

        // Check active session
        supabase.auth.getUser().then((res: any) => {
            const user = res.data?.user;
            if (mounted) {
                setUser(user);
                setLoading(false);
            }
        }).catch(() => {
            if (mounted) {
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (mounted) {
                setUser(session?.user ?? null);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (isHomePage) return null;

    return (
        <header className="fixed top-0 left-0 right-0 sm:top-4 sm:left-4 sm:right-4 z-50 min-h-[56px] sm:min-h-[64px] glass-panel border-b sm:border border-white/10 rounded-none sm:rounded-2xl flex items-center shadow-2xl shadow-black/50 pt-safe sm:pt-0">
            <div className="w-full px-4 sm:px-6 py-2 sm:py-0 flex items-center justify-between">
                {/* Logo - Far Left */}
                <Link href="/feed" className="flex items-center gap-1 transition-opacity hover:opacity-80 shrink-0">
                    <Logo />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    <NavItem href="/feed" icon={<Home size={20} />} label="Feed" active={pathname === "/feed"} />
                    <NavItem href="/rooms" icon={<Radio size={20} />} label="Rooms" active={pathname === "/rooms"} />
                    <NavItem href="/explore" icon={<Compass size={20} />} label="Explore" active={pathname === "/explore"} />
                    <NavItem href="/messages" icon={<MessageCircle size={20} />} label="Messages" badge={3} active={pathname.startsWith("/messages")} />
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {loading ? (
                        <div className="w-20 h-8 bg-zinc-800 rounded animate-pulse" />
                    ) : user ? (
                        <>
                            {/* Notifications */}
                            <Link
                                href="/notifications"
                                className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <Bell size={20} />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-black" />
                            </Link>

                            {/* Profile Dropdown (Hidden on Mobile) */}
                            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-800">
                                <Link
                                    href="/profile"
                                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <UserIcon size={20} />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="px-4 py-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/signup"
                                className="px-4 py-1.5 text-sm bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function NavItem({
    href,
    icon,
    label,
    active,
    badge
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${active
                ? 'text-black bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            <span>{label}</span>
            {badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </Link>
    );
}
