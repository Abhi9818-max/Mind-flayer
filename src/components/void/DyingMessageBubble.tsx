import { useState } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Reply, FileText } from "lucide-react";

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
        <div className="relative overflow-hidden group mb-4">
            {/* The Reply Icon Background */}
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full border border-zinc-900/30 bg-zinc-950/40 text-zinc-500 transition-opacity ${isSwiping ? 'opacity-100' : 'opacity-0 delay-150'}`} style={{ left: '0.5rem' }}>
                <Reply size={14} />
            </div>

            {/* Draggable Bubble Wrapper */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ right: 0.2, left: 0 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative z-10 touch-pan-y"
            >
                <div className="flex w-full gap-2 items-end justify-start">

                    {/* Receiver Avatar */}
                    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-auto mb-1 opacity-90 border border-zinc-200">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.author_name}`} alt="avatar" className="w-full h-full object-cover bg-zinc-800" />
                    </div>

                    <div className="flex flex-col max-w-[80%] sm:max-w-xs items-start">

                        {/* Quoted Reply Block */}
                        {message.replied_to && (
                            <div className="relative z-0 mb-[-8px] px-4 pt-2 pb-4 rounded-t-2xl text-[11px] opacity-80 backdrop-blur-sm bg-black/20 text-white border-l-2 border-indigo-500 ml-2 shadow-sm">
                                <span className="font-bold block mb-0.5 truncate max-w-[12rem]">
                                    {message.replied_to.author_name}
                                </span>
                                <span className="truncate block max-w-[12rem] opacity-70">
                                    {message.replied_to.content}
                                </span>
                            </div>
                        )}

                        {/* Main White Bubble */}
                        <div className="relative z-10 bg-white text-black break-words px-4 py-3 text-[15px] shadow-sm rounded-[24px] rounded-bl-[4px]">

                            {/* Header: Name and Time inside bubble */}
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-bold text-[13px] text-black/90 tracking-tight flex items-center gap-1.5">
                                    {message.author_name}
                                    <span className="text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded bg-black">
                                        🔋 {message.battery_level}%
                                    </span>
                                </span>
                                <span className="text-[11px] text-black/40 font-medium">
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Attachments */}
                            {message.attachment_url && message.attachment_type === 'image' && (
                                <div className="relative mb-2 -mx-1 group overflow-hidden rounded-[16px] bg-black/5 shadow-sm mt-1">
                                    <img
                                        src={message.attachment_url}
                                        alt="attachment"
                                        className="w-full max-h-[250px] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] cursor-pointer"
                                    />
                                    <div className="absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] pointer-events-none" />
                                </div>
                            )}
                            {message.attachment_url && message.attachment_type === 'document' && (
                                <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 mb-2 mt-1 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200">
                                    <FileText size={16} />
                                    <span className="truncate">{message.attachment_metadata?.name || 'Document'}</span>
                                </a>
                            )}
                            {message.attachment_url && message.attachment_type === 'audio' && (
                                <div className="mb-2 mt-1">
                                    <audio controls src={message.attachment_url} className="h-8 max-w-[200px]" />
                                </div>
                            )}

                            {!(message.content.startsWith('[Attached image]: ') || message.content.startsWith('📎 Image')) && (
                                <span className="whitespace-pre-wrap leading-snug text-[15px]">
                                    {message.content}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
