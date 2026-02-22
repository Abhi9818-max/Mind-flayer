import { useState } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Reply } from "lucide-react";

interface DyingMessage {
    id: string;
    content: string;
    author_name: string;
    author_id?: string;
    created_at: string;
    battery_level: number;
    reply_to_id?: string | null;
    replied_to?: { content: string; author_name: string } | null;
    attachment_url?: string | null;
    attachment_type?: 'image' | 'document' | 'audio' | 'location' | 'poll' | null;
    attachment_metadata?: any;
}

interface DyingMessageBubbleProps {
    message: DyingMessage;
    onReply: (msg: DyingMessage) => void;
}

export function DyingMessageBubble({ message, onReply }: DyingMessageBubbleProps) {
    const controls = useAnimation();
    const [isSwiping, setIsSwiping] = useState(false);

    const handleDragStart = () => {
        setIsSwiping(true);
    };

    const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsSwiping(false);
        const swipeThreshold = 50;

        if (info.offset.x > swipeThreshold) {
            onReply(message);
        }

        controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    };

    return (
        <div className="relative overflow-hidden group">
            {/* The Reply Icon Background */}
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full border border-red-900/30 bg-red-950/40 text-red-500 transition-opacity ${isSwiping ? 'opacity-100' : 'opacity-0 delay-150'}`} style={{ left: '0.5rem' }}>
                <Reply size={14} />
            </div>

            {/* Draggable Bubble */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ right: 0.2, left: 0 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative z-10 touch-pan-y"
            >
                <div className="flex flex-col">
                    {/* Quoted Reply Block */}
                    {message.replied_to && (
                        <div className="relative z-0 mb-[-8px] px-4 pt-2 pb-4 rounded-t-xl text-[11px] opacity-80 backdrop-blur-sm bg-red-950/20 text-red-300 border-l-2 border-red-800">
                            <span className="font-bold block mb-0.5 truncate max-w-[12rem]">
                                {message.replied_to.author_name}
                            </span>
                            <span className="truncate block max-w-[12rem] opacity-70">
                                {message.replied_to.content}
                            </span>
                        </div>
                    )}

                    {/* Main Bubble */}
                    <div className="relative z-10 bg-zinc-950/80 border border-red-950/20 rounded-xl px-4 py-3 group-hover:border-red-900/30 transition-all">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-red-700 tracking-wide flex items-center gap-1.5">
                                {message.author_name}
                                <span className="text-[8px] font-mono text-red-950 px-1 py-0.5 rounded bg-red-950/30">
                                    🔋 {message.battery_level}%
                                </span>
                            </span>
                            <span className="text-[9px] text-zinc-800 font-mono">
                                {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed break-words">
                            {message.content}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
