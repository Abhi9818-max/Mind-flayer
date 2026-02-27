import { useState, useCallback, useEffect } from "react";
import { motion, useAnimation, PanInfo, AnimatePresence } from "framer-motion";
import { Reply, FileText, Play, X } from "lucide-react";
import { Message } from "@/lib/services/chat";

/* ─── Fullscreen Image Lightbox ─── */
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        // Prevent body scroll
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
                <X size={24} />
            </button>

            {/* Image */}
            <motion.img
                src={src}
                alt="Full screen"
                className="relative z-10 max-w-[92vw] max-h-[90vh] object-contain rounded-lg select-none"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                draggable={false}
            />
        </motion.div>
    );
}

/* ─── MessageBubble ─── */
interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
    onReply: (msg: Message) => void;
}

export function MessageBubble({ message, isMe, onReply }: MessageBubbleProps) {
    const controls = useAnimation();
    const [isSwiping, setIsSwiping] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const openLightbox = useCallback(() => setLightboxOpen(true), []);
    const closeLightbox = useCallback(() => setLightboxOpen(false), []);

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
        <>
            {/* Fullscreen Lightbox Portal */}
            <AnimatePresence>
                {lightboxOpen && message.attachment_url && (
                    <ImageLightbox src={message.attachment_url} onClose={closeLightbox} />
                )}
            </AnimatePresence>

            <div className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'} overflow-hidden relative group`}>
                {/* The Reply Icon Background (revealed on swipe) */}
                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 transition-opacity ${isSwiping ? 'opacity-100' : 'opacity-0 delay-150'}`} style={{ left: isMe ? '-2rem' : 'auto', right: isMe ? 'auto' : '-2rem' }}>
                    <Reply size={14} />
                </div>

                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={{ right: 0.2, left: 0 }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    className="relative z-10 touch-pan-y w-full flex"
                >
                    <div className={`flex w-full gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}>

                        {/* Receiver Avatar */}
                        {!isMe && (
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-auto mb-1 opacity-90">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_hash}`} alt="avatar" className="w-full h-full object-cover bg-zinc-800" />
                            </div>
                        )}

                        <div className={`flex flex-col max-w-[80%] sm:max-w-xs ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Quoted Reply Block */}
                            {message.replied_to && (
                                <div className={`relative z-0 mb-[-12px] px-4 pt-3 pb-5 rounded-t-[20px] text-[12px] opacity-90 shadow-inner ${isMe ? 'bg-indigo-900/30 text-indigo-200 border-l-2 border-indigo-400 backdrop-blur-md' : 'bg-zinc-800/60 text-zinc-300 border-l-2 border-zinc-400 backdrop-blur-md'
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
                                className={`relative z-10 break-words px-4 py-3 text-[15px] shadow-sm ${isMe
                                    ? 'bg-gradient-to-br from-[#c8d4ff] via-[#dcdbfc] to-[#e4d3f2] text-black rounded-[24px] rounded-br-[4px]'
                                    : 'bg-white text-black rounded-[24px] rounded-bl-[4px]'
                                    }`}
                            >
                                {/* Header: Name and Time inside bubble */}
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-[13px] text-black/90 tracking-tight">
                                        {isMe ? 'You' : 'Anonymous'}
                                    </span>
                                    <span className="text-[11px] text-black/40 font-medium">
                                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Attachments — Image (tap to fullscreen) */}
                                {message.attachment_url && message.attachment_type === 'image' && (
                                    <div
                                        className="relative mb-2 -mx-1 overflow-hidden rounded-[16px] bg-black/5 shadow-sm cursor-pointer group/img"
                                        onClick={openLightbox}
                                    >
                                        <img
                                            src={message.attachment_url}
                                            alt="attachment"
                                            className="w-full max-h-[300px] object-cover transition-transform duration-500 ease-out group-hover/img:scale-105"
                                            draggable={false}
                                        />
                                        {/* Subtle expand hint on hover */}
                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                            <div className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 bg-black/50 rounded-full p-2">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <polyline points="9 21 3 21 3 15" />
                                                    <line x1="21" y1="3" x2="14" y2="10" />
                                                    <line x1="3" y1="21" x2="10" y2="14" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] pointer-events-none" />
                                    </div>
                                )}
                                {message.attachment_url && message.attachment_type === 'document' && (
                                    <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 mb-2 rounded-xl text-xs font-semibold ${isMe ? 'bg-black/10 hover:bg-black/15' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                                        <FileText size={16} />
                                        <span className="truncate">{message.attachment_metadata?.name || 'Document'}</span>
                                    </a>
                                )}
                                {message.attachment_url && message.attachment_type === 'audio' && (
                                    <div className="mb-2">
                                        <audio controls src={message.attachment_url} className="h-8 max-w-[200px]" />
                                    </div>
                                )}

                                {/* Hide text if it's default attachment string */}
                                {!(message.content.startsWith('[Attached image]: ') || message.content.startsWith('📎 Image')) && (
                                    <span className="whitespace-pre-wrap leading-snug">{message.content}</span>
                                )}
                            </div>
                        </div>

                        {/* Sender Avatar */}
                        {isMe && (
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-auto mb-1 opacity-90 shadow-sm border border-black/5">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_hash}`} alt="avatar" className="w-full h-full object-cover bg-[#e4d3f2]" />
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </>
    );
}
