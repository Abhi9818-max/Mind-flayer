"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { POST_CONFIG, PostType } from "@/types";
import { useUI } from "@/lib/context/UIContext";

export function Navbar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isFilterOpen, toggleFilter } = useUI();

    const isHomePage = pathname === "/";
    const isFeedPage = pathname === "/feed" || pathname === "/";
    const activeFilter = searchParams.get("type") as PostType | "all" || "all";

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/40 ${!isFeedPage ? 'hidden lg:block' : ''}`}>
            <Container className="flex h-16 items-center justify-between lg:px-4">
                <Link href="/" className="relative flex items-center gap-3 group active:scale-95 transition-transform duration-200 lg:-ml-2">
                    <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-xl shadow-lg shadow-red-600/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-red-600/40">
                        🧠
                    </div>
                    <span className="font-logo text-lg font-bold tracking-tight text-white leading-none group-hover:text-red-200 transition-colors">
                        Mind-Flayer
                    </span>
                </Link>

                {/* Desktop Navigation */}
                {!isHomePage && (
                    <div className="hidden lg:flex items-center gap-8">
                        <NavLink href="/feed" label="The Stream" active={pathname === "/feed"} />
                        <NavLink href="/rooms" label="Live" active={pathname === "/rooms"} />
                        <NavLink href="/explore" label="Explore" active={pathname === "/explore"} />
                        <NavLink href="/messages" label="Messages" badge="3" active={pathname === "/messages" || pathname.startsWith("/messages/")} />
                        <NavLink href="/notifications" label="Alerts" badge="3" active={pathname === "/notifications"} />
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {/* Filter Toggle (Visible only on Feed, but not on Home) */}
                    {isFeedPage && !isHomePage && (
                        <div className="relative">
                            <button
                                onClick={toggleFilter}
                                className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 active:scale-90 ${isFilterOpen || activeFilter !== 'all' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                                title="Filter Posts"
                            >
                                <span className="text-xl">🎚️</span>
                            </button>
                            {activeFilter !== 'all' && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg pointer-events-none">
                                    !
                                </span>
                            )}
                        </div>
                    )}

                    <Button variant="ghost" href="/login" className="hidden sm:inline-flex text-zinc-400 hover:text-white active:scale-95 transition-transform duration-200">
                        Log in
                    </Button>
                    <Button href="/signup" className="bg-white/10 hover:bg-white/20 border border-white/5 text-white shadow-lg shadow-red-600/10 active:scale-95 transition-transform duration-200">
                        Get Started
                    </Button>
                </div>
            </Container>
        </nav>
    );
}

function NavLink({ href, label, active, badge }: { href: string; label: string; active?: boolean; badge?: string }) {
    return (
        <Link
            href={href}
            className={`
                relative text-sm font-medium transition-transform duration-200 hover:text-white active:scale-95
                ${active ? 'text-white' : 'text-zinc-400'}
            `}
        >
            {label}
            {active && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            )}
            {badge && (
                <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                    {badge}
                </span>
            )}
        </Link>
    );
}
