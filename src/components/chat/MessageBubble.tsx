import { useState } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Reply, FileText, Play } from "lucide-react";
import { Message } from "@/lib/services/chat";

interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
    onReply: (msg: Message) => void;
}

export function MessageBubble({ message, isMe, onReply }: MessageBubbleProps) {
    const controls = useAnimation();
    const [isSwiping, setIsSwiping] = useState(false);

    const handleDragStart = () => {
        setIsSwiping(true);
    };

    const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsSwiping(false);
        const swipeThreshold = 50; // How far to swipe before triggering reply

        if (info.offset.x > swipeThreshold) {
            // Trigger reply action
            onReply(message);
        }

        // Snap back to original position
        controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    };

    return (
        <div className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'} overflow-hidden`}>
            {/* The Reply Icon Background (revealed on swipe) */}
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 transition-opacity ${isSwiping ? 'opacity-100' : 'opacity-0 delay-150'}`} style={{ left: '0.5rem' }}>
                <Reply size={14} />
            </div>

            {/* The Draggable Message Bubble */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ right: 0.2, left: 0 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative z-10 touch-pan-y"
            >
                <div className={`flex flex-col max-w-[15rem] sm:max-w-xs ${isMe ? 'items-end' : 'items-start'}`}>

                    {/* Quoted Reply Block */}
                    {message.replied_to && (
                        <div className={`relative z-0 mb-[-8px] px-4 pt-2 pb-4 rounded-t-2xl text-[11px] opacity-80 backdrop-blur-sm shadow-inner ${isMe ? 'bg-purple-900/40 text-purple-200 border-l-2 border-purple-400' : 'bg-zinc-700/40 text-zinc-300 border-l-2 border-zinc-400'
                            }`}>
                            <span className="font-semibold block mb-0.5 truncate max-w-[12rem]">
                                {message.replied_to.sender_hash === message.sender_hash ? 'Themselves' : 'Sender'}
                            </span>
                            <span className="truncate block max-w-[12rem] opacity-80">
                                {message.replied_to.content}
                            </span>
                        </div>
                    )}

                    {/* Main Bubble */}
                    <div
                        className={`relative z-10 break-words rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
                            }`}
                    >
                        {/* Attachments */}
                        {message.attachment_url && message.attachment_type === 'image' && (
                            <div className="mb-2 -mx-2 -mt-1 overflow-hidden rounded-xl">
                                <img src={message.attachment_url} alt="attachment" className="w-full max-h-48 object-cover hover:scale-105 transition-transform cursor-pointer" />
                            </div>
                        )}
                        {message.attachment_url && message.attachment_type === 'document' && (
                            <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 mb-2 rounded-lg text-xs font-semibold ${isMe ? 'bg-purple-700/50 hover:bg-purple-700 border border-purple-400/30' : 'bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600'}`}>
                                <FileText size={16} />
                                <span className="truncate">{message.attachment_metadata?.name || 'Document'}</span>
                            </a>
                        )}
                        {message.attachment_url && message.attachment_type === 'audio' && (
                            <div className="mb-2">
                                <audio controls src={message.attachment_url} className="h-8 max-w-[200px]" />
                            </div>
                        )}

                        <span className="whitespace-pre-wrap">{message.content}</span>
                    </div>
                </div>
            </motion.div>

            <div className="flex items-center justify-end gap-1 mt-1 px-1">
                <span className="text-[10px] text-zinc-500">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isMe && (
                    <span className="text-[12px] leading-none">
                        {message.read_at ? (
                            <span className="text-blue-500">✓✓</span>
                        ) : (
                            <span className="text-zinc-500">✓✓</span>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}
