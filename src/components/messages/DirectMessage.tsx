"use client";

interface DirectMessageProps {
    message: {
        id: string;
        content: string;
        timestamp: string;
        isSender: boolean;
    };
    delay: number;
}

export function DirectMessage({ message, delay }: DirectMessageProps) {
    return (
        <div
            className={`flex ${message.isSender ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`max-w-[70%] p-4 rounded-2xl backdrop-blur-sm border ${message.isSender
                    ? 'bg-red-600/20 border-red-500/30 rounded-br-md'
                    : 'bg-zinc-900/50 border-white/10 rounded-bl-md'
                }`}>
                <p className="text-zinc-200 leading-relaxed mb-1">{message.content}</p>
                <span className="text-xs text-zinc-500">{message.timestamp}</span>
            </div>
        </div>
    );
}
