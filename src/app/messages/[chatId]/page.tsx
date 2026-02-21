"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { DirectMessage } from "@/components/messages/DirectMessage";
import { ArrowLeft, Send, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { haptic } from "@/lib/utils/haptic";
import { createClient } from "@/lib/supabase/client";
import { getChatMessages, sendMessage, Message } from "@/lib/services/chat";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
    const params = useParams();
    const chatId = params.chatId as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Initial Load
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            try {
                const msgs = await getChatMessages(chatId);
                setMessages(msgs || []);
            } catch (error) {
                console.error("Failed to load messages:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [chatId, supabase]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel(`page_chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload: any) => {
                    const newMsg = payload.new as Message;
                    // Prevent duplicates if we already optimistically added it
                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, supabase]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUserId) return;

        const tempContent = newMessage;
        setNewMessage("");
        haptic.whisper();

        // Optimistic update
        const tempMsg: Message = {
            id: `temp-${Date.now()}`,
            chat_id: chatId,
            sender_hash: currentUserId,
            content: tempContent,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const realMsg = await sendMessage(chatId, tempContent);
            // Replace temp msg with real one
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? realMsg : m));
        } catch (error) {
            console.error("Failed to send message:", error);
            // Revert on failure
            setNewMessage(tempContent);
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        }
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30 flex flex-col">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>

            {/* Chat Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 px-4 pt-8 lg:pt-24 pb-4 border-b border-white/10 bg-black/60 backdrop-blur-xl"
            >
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/messages">
                            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                                <ArrowLeft size={20} />
                            </button>
                        </Link>
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-red-600 flex items-center justify-center text-2xl shadow-lg shadow-red-500/20">
                                🎭
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-display tracking-wide">Encrypted Channel</h1>
                            <p className="text-xs text-red-400 font-mono">
                                Connection Secure // Live
                            </p>
                        </div>
                    </div>

                    {/* Anonymous Toggle - visual flair only for MVP */}
                    <button
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${isAnonymous ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                        {isAnonymous ? <ToggleRight size={20} className="text-red-500" /> : <ToggleLeft size={20} />}
                        <span className="text-sm hidden sm:inline">{isAnonymous ? "Ghost Mode" : "Public"}</span>
                    </button>
                </div>
            </motion.div>

            {/* Messages Area */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full custom-scrollbar">
                {loading ? (
                    <div className="h-full flex items-center justify-center flex-col gap-4">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                        <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest animate-pulse">Establishing Neural Link...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center flex-col gap-4 opacity-50">
                        <div className="text-6xl mb-4">🔮</div>
                        <h3 className="text-xl font-display font-bold">The Void is Listening</h3>
                        <p className="text-sm text-zinc-400">Send a message to tear the veil.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence>
                            {messages.map((msg, i) => {
                                const isMe = msg.sender_hash === currentUserId;
                                return (
                                    <motion.div
                                        key={msg.id || i}
                                        initial={{ opacity: 0, scale: 0.95, y: 10, originX: isMe ? 1 : 0 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] px-5 py-3 text-sm md:text-base ${isMe
                                                ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-2xl rounded-tr-sm shadow-[0_5px_15px_rgba(225,29,72,0.2)]'
                                                : 'bg-zinc-800/80 backdrop-blur-md border border-white/5 text-zinc-200 rounded-2xl rounded-tl-sm'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-zinc-500 mt-1.5 px-2 font-mono uppercase tracking-wider">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 px-4 py-4 border-t border-white/10 bg-black/60 backdrop-blur-xl"
            >
                <div className="max-w-4xl mx-auto">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-full border border-white/10 focus-within:border-red-500/50 focus-within:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-500"
                    >
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Transmit thought to the shadow network..."
                            className="flex-1 px-4 py-2 bg-transparent text-sm md:text-base focus:outline-none placeholder:text-zinc-600 text-white"
                        />
                        <button
                            type="submit"
                            className="p-3 rounded-full bg-white hover:bg-zinc-200 text-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                            disabled={!newMessage.trim()}
                        >
                            <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
