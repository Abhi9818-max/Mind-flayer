"use client";

import { Suspense, useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { ConversationCard } from "@/components/messages/ConversationCard";
import { Search, MessageSquareX, Loader2 } from "lucide-react";
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
                    // Process chats into frontend format
                    const processed = chats.map((chat: any) => {
                        const messages = chat.chat_messages;
                        const lastMsg = messages && messages.length > 0
                            ? messages[messages.length - 1]
                            : null;

                        const partnerHash = chat.initiator_hash === user.id ? chat.responder_hash : chat.initiator_hash;

                        return {
                            id: chat.id,
                            username: chat.is_revealed ? "Revealed User" : "Anonymous Entity", // Ideally fetch profile if revealed
                            lastMessage: lastMsg ? lastMsg.content : "Tap to start chatting",
                            timestamp: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            unread: 0, // Implement read receipts later
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

    const unreadCount = conversations.reduce((sum, conv) => sum + conv.unread, 0);

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30 overflow-x-hidden">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>
            <MobileNav />

            <main className="relative z-10 pt-[calc(env(safe-area-inset-top,20px)+72px)] sm:pt-24 pb-24 px-4 max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-5xl md:text-7xl font-black font-display tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-transparent">
                            Messages
                        </h1>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-4 py-1.5 bg-red-600/10 border border-red-500/50 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                            >
                                <span className="text-sm font-bold text-red-500 uppercase tracking-widest">{unreadCount} New</span>
                            </motion.div>
                        )}
                    </div>
                    <p className="text-zinc-400 font-mono text-sm tracking-wide">Direct neural connections to the shadow network</p>
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 relative group"
                >
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-red-500" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations or messages..."
                        className="w-full pl-14 pr-4 py-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all focus:bg-black/60 placeholder:text-zinc-600 shadow-inner text-lg"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/0 to-transparent group-focus-within:via-red-500/50 transition-all duration-500" />
                </motion.div>

                {/* Conversations List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                            <p className="text-zinc-500 font-mono uppercase tracking-widest text-sm animate-pulse">Scanning the void...</p>
                        </div>
                    ) : filteredConversations.length > 0 ? (
                        <AnimatePresence>
                            {filteredConversations.map((conv, i) => (
                                <ConversationCard key={conv.id} conversation={conv} delay={i} />
                            ))}
                        </AnimatePresence>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            className="text-center py-24 flex flex-col items-center justify-center bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm"
                        >
                            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5 relative">
                                <MessageSquareX size={32} className="text-zinc-600" />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                            </div>
                            <h3 className="text-2xl font-display font-bold text-white mb-2">Silence in the Void</h3>
                            <p className="text-zinc-400 max-w-sm">No conversations found. Explore the feed to establish new connections.</p>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
