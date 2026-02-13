"use client";

interface Message {
    id: string;
    username: string;
    content: string;
    timestamp: string;
    isAnonymous: boolean;
    replyTo?: string;
}

interface ChatMessageProps {
    message: Message;
    delay: number;
    onReplyClick?: (username: string) => void;
    isHighlighted?: boolean;
}

export function ChatMessage({ message, delay, onReplyClick, isHighlighted }: ChatMessageProps) {
    return (
        <div
            className={`animate-fade-in-up transition-all duration-300 ${isHighlighted ? 'scale-105' : ''
                }`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 cursor-pointer hover:bg-white/10 ${isHighlighted
                    ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20'
                    : 'bg-zinc-900/50 border-white/10 hover:border-white/20'
                }`}
                onClick={() => onReplyClick?.(message.username)}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${message.isAnonymous ? 'text-zinc-500' : 'text-white'}`}>
                            {message.isAnonymous ? "🎭 " : ""}{message.username}
                        </span>
                        {message.isAnonymous && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                                Anonymous
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-zinc-500">{message.timestamp}</span>
                </div>

                {/* Reply Tag */}
                {message.replyTo && (
                    <div className="mb-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg inline-block">
                        <span className="text-xs text-zinc-400">
                            Replying to <span className="text-red-400 font-medium">@{message.replyTo}</span>
                        </span>
                    </div>
                )}

                <p className="text-zinc-300 leading-relaxed">{message.content}</p>
            </div>
        </div>
    );
}
