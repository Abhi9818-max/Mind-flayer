"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface ConversationCardProps {
    conversation: {
        id: string;
        username: string;
        lastMessage: string;
        timestamp: string;
        unread: number;
        isAnonymous: boolean;
    };
    delay: number;
}

export function ConversationCard({ conversation, delay }: ConversationCardProps) {
    return (
        <Link href={`/messages/${conversation.id}`} className="block">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: delay * 0.05, ease: "easeOut" }}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.98 }}
                className="relative p-4 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/5 overflow-hidden group"
            >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-red-500/10 via-transparent to-transparent pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                            {conversation.isAnonymous ? "🎭" : "👤"}
                        </div>
                        {conversation.unread > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold shadow-[0_0_10px_rgba(220,38,38,0.5)] border-2 border-zinc-900"
                            >
                                {conversation.unread}
                            </motion.div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-bold font-display truncate tracking-wide ${conversation.isAnonymous ? 'text-zinc-400 bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 to-zinc-600' : 'text-white'}`}>
                                {conversation.username}
                            </h3>
                            <span className="text-[10px] text-zinc-500 flex-shrink-0 font-mono tracking-wider ml-2">{conversation.timestamp}</span>
                        </div>
                        <p className={`text-sm truncate pr-4 ${conversation.unread > 0 ? "text-white font-medium" : "text-zinc-400"}`}>
                            {conversation.lastMessage || "Click to view messages"}
                        </p>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
