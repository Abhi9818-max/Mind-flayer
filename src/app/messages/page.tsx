"use client";

import { Suspense, useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { ConversationCard } from "@/components/messages/ConversationCard";
import { Search, MessageCircle } from "lucide-react";
import { getConversations } from "@/lib/services/chat";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function MessagesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                try {
                    const chats = await getConversations();
                    const processed = chats.map((chat: any) => {
                        const messages = chat.chat_messages;
                        const lastMsg = messages && messages.length > 0
                            ? messages[messages.length - 1]
                            : null;

                        return {
                            id: chat.id,
                            username: chat.is_revealed ? "Revealed User" : "Anonymous Entity",
                            lastMessage: lastMsg ? lastMsg.content : "Tap to start chatting",
                            timestamp: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            unread: 0,
                            isAnonymous: !chat.is_revealed
                        };
                    });
                    setConversations(processed);
                } catch (error) {
                    console.error("Failed to load conversations:", error);
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    const filteredConversations = conversations.filter(conv =>
        conv.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>
            <MobileNav />

            <main className="pt-[calc(env(safe-area-inset-top,20px)+16px)] sm:pt-24 pb-24 px-4 max-w-2xl mx-auto">
                {/* Title */}
                <div className="mb-5 pt-2">
                    <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                </div>

                {/* Search */}
                <div className="mb-4 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/[0.06] rounded-xl focus:outline-none focus:border-white/[0.12] transition-colors placeholder:text-zinc-600 text-sm"
                    />
                </div>

                {/* Conversations */}
                <div className="space-y-1">
                    {loading ? (
                        <div className="space-y-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 rounded-xl bg-white/[0.02] animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>
                    ) : filteredConversations.length > 0 ? (
                        <AnimatePresence>
                            {filteredConversations.map((conv, i) => (
                                <ConversationCard key={conv.id} conversation={conv} delay={i} />
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                                <MessageCircle size={24} className="text-zinc-600" />
                            </div>
                            <h3 className="text-base font-semibold text-zinc-300 mb-1">No conversations yet</h3>
                            <p className="text-[13px] text-zinc-600 max-w-xs">Tap Connect on a post to start chatting with someone.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
