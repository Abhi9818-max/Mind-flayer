"use client";

import { Suspense, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { CampusWars } from "@/components/explore/CampusWars";
import { Search, User } from "lucide-react";

// Mock user data for search
const MOCK_USERS = [
    { id: "fons_mans", name: "Fons Mans", bio: "UI/UX Designer", avatar: "👤" },
    { id: "jane_doe", name: "Jane Doe", bio: "Developer", avatar: "👩‍💻" },
    { id: "john_smith", name: "John Smith", bio: "Artist", avatar: "🎨" },
    { id: "alice_wonder", name: "Alice Wonder", bio: "Writer", avatar: "✍️" },
    { id: "bob_builder", name: "Bob Builder", bio: "Engineer", avatar: "⚙️" },
];

export default function ExplorePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<typeof MOCK_USERS>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === "") {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const results = MOCK_USERS.filter(user =>
            user.id.toLowerCase().includes(query.toLowerCase()) ||
            user.name.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(results);
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>
            <MobileNav />

            <main className="relative z-10 pt-8 lg:pt-24 pb-24 px-4 max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                        Explore
                    </h1>
                    <p className="text-zinc-400">Discover what's trending across the void.</p>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search users by profile ID or name..."
                            className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-zinc-600"
                        />
                    </div>

                    {/* Search Results */}
                    {isSearching && (
                        <div className="absolute top-full mt-2 w-full bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                            {searchResults.length > 0 ? (
                                <div className="max-h-96 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => window.location.href = `/profile?id=${user.id}`}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
                                                {user.avatar}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="font-bold">{user.name}</h3>
                                                <p className="text-sm text-zinc-400">@{user.id}</p>
                                                <p className="text-xs text-zinc-500">{user.bio}</p>
                                            </div>
                                            <User size={16} className="text-zinc-600" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-zinc-500">
                                    <p className="text-sm">No users found matching "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Campus Wars - Hero Section */}
                <div className="mb-8">
                    <CampusWars />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mock Categories */}
                    {["🔥 Trending", "📢 Confessions", "💔 Heartbreak", "👻 Spooky", "😂 Memes", "📚 Study Hacks"].map((tag, i) => (
                        <div
                            key={i}
                            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group flex items-center justify-between"
                        >
                            <div>
                                <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors">{tag}</h3>
                                <p className="text-zinc-500 text-sm mt-1">1.2k posts this week</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 group-hover:text-red-500 transition-colors">
                                →
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
