import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Sidebar() {
    return (
        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-white/5 bg-black/90 backdrop-blur-xl z-50">
            {/* Logo Area */}
            <div className="flex h-20 items-center px-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-rose-700 text-lg shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
                        🧠
                    </div>
                    <span className="font-display text-lg font-bold tracking-tight text-white group-hover:text-red-200 transition-colors">
                        Mind-Flayer
                    </span>
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-8 space-y-2">
                <NavLink href="/feed" icon="🏠" label="Home" active />
                <NavLink href="/explore" icon="🌍" label="Explore" />
                <NavLink href="/notifications" icon="🔔" label="Notifications" badge="3" />
                <NavLink href="/profile" icon="👤" label="Profile" />

                <div className="pt-8">
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 border-0">
                        Post Confession
                    </Button>
                </div>
            </nav>

            {/* User Menu */}
            <div className="p-4 border-t border-white/5">
                <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors text-left group">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                        👻
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-red-200 transition-colors">Anonymous User</p>
                        <p className="text-xs text-zinc-500 truncate">@shadow_walker</p>
                    </div>
                    <div className="text-zinc-500">⋮</div>
                </button>
            </div>
        </aside>
    );
}

function NavLink({ href, icon, label, active = false, badge }: { href: string; icon: string; label: string; active?: boolean; badge?: string }) {
    return (
        <Link
            href={href}
            className={`
                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                ${active
                    ? 'bg-red-600/10 text-red-500 font-bold'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }
            `}
        >
            <div className="flex items-center gap-3">
                <span className={`text-xl ${active ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`}>{icon}</span>
                <span>{label}</span>
            </div>
            {badge && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-red-600/20">
                    {badge}
                </span>
            )}
        </Link>
    );
}
