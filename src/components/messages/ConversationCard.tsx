"use client";

import Link from "next/link";

interface ConversationCardProps {
    conversation: {
        id: string;
        userId: string;
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
        <Link href={`/messages/${conversation.userId}`}>
            <div
                className="p-4 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-white/10 hover:bg-white/5 transition-all cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${delay}ms` }}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
                            {conversation.isAnonymous ? "🎭" : "👤"}
                        </div>
                        {conversation.unread > 0 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {conversation.unread}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-bold truncate ${conversation.isAnonymous ? 'text-zinc-400' : 'text-white'}`}>
                                {conversation.username}
                            </h3>
                            <span className="text-xs text-zinc-500 flex-shrink-0">{conversation.timestamp}</span>
                        </div>
                        <p className="text-sm text-zinc-400 truncate">{conversation.lastMessage}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
