"use client";

import { Suspense, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { ConversationCard } from "@/components/messages/ConversationCard";
import { Search } from "lucide-react";

const MOCK_CONVERSATIONS = [
    { id: "1", userId: "user1", username: "Fons Mans", lastMessage: "Hey, did you see the assignment?", timestamp: "2m ago", unread: 2, isAnonymous: false },
    { id: "2", userId: "user2", username: "Anonymous #47", lastMessage: "Thanks for the help!", timestamp: "1h ago", unread: 0, isAnonymous: true },
    { id: "3", userId: "user3", username: "Jane Doe", lastMessage: "See you in the study hall room!", timestamp: "3h ago", unread: 1, isAnonymous: false },
    { id: "4", userId: "user4", username: "John Smith", lastMessage: "LOL that meme was great", timestamp: "1d ago", unread: 0, isAnonymous: false },
];

export default function MessagesPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = MOCK_CONVERSATIONS.filter(conv =>
        conv.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const unreadCount = MOCK_CONVERSATIONS.reduce((sum, conv) => sum + conv.unread, 0);

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>
            <MobileNav />

            <main className="relative z-10 pt-8 lg:pt-24 pb-24 px-4 max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                            Messages
                        </h1>
                        {unreadCount > 0 && (
                            <div className="px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full">
                                <span className="text-sm font-bold text-red-400">{unreadCount} unread</span>
                            </div>
                        )}
                    </div>
                    <p className="text-zinc-400">Your private conversations</p>
                </div>

                {/* Search */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-full focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-zinc-600"
                    />
                </div>

                {/* Conversations List */}
                <div className="space-y-3">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map((conv, i) => (
                            <ConversationCard key={conv.id} conversation={conv} delay={i * 50} />
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">💬</div>
                            <p className="text-zinc-400">No conversations found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
