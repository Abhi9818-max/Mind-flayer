"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { uploadChatAttachment } from "@/lib/services/upload";
import { getChatMessages, sendMessage, markMessagesAsRead, Message } from "@/lib/services/chat";
import { AttachmentMenu, AttachmentType } from "./AttachmentMenu";
import { MessageBubble } from "./MessageBubble";
import { Paperclip, X, ChevronLeft, ChevronUp, MoreVertical, Smile, Mic } from "lucide-react";

export function ChatWindow({
    chatId,
    recipientName = "Anonymous User",
    onClose,
}: {
    chatId: string;
    recipientName?: string;
    onClose: () => void;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Advanced Chat States
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedAttachmentType, setSelectedAttachmentType] = useState<AttachmentType | null>(null);

    // Initial Load & Auth
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            try {
                const msgs = await getChatMessages(chatId);
                setMessages(msgs || []);

                // Mark loaded messages as read
                if (msgs && msgs.length > 0) {
                    await markMessagesAsRead(chatId);
                }
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
            .channel(`chat:${chatId}-${Date.now()}-${Math.random()}`)
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
                    setMessages((prev) => [...prev, newMsg]);

                    if (currentUserId && newMsg.sender_hash !== currentUserId) {
                        markMessagesAsRead(chatId).catch(console.error);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload: any) => {
                    const updatedMsg = payload.new as Message;
                    setMessages((prev) =>
                        prev.map(msg => msg.id === updatedMsg.id ? { ...msg, read_at: updatedMsg.read_at } : msg)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, supabase]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        const tempContent = newMessage;
        setNewMessage(""); // Optimistic clear

        try {
            await sendMessage(chatId, tempContent, replyingTo?.id);
            setReplyingTo(null); // Clear reply state after send
        } catch (error) {
            console.error("Failed to send:", error);
            setNewMessage(tempContent); // Revert on error
        }
    };

    const handleAttachmentSelect = (type: AttachmentType) => {
        setIsAttachmentMenuOpen(false);
        setSelectedAttachmentType(type);

        if (type === 'image' || type === 'document' || type === 'audio') {
            if (fileInputRef.current) {
                if (type === 'image') fileInputRef.current.accept = "image/*";
                if (type === 'document') fileInputRef.current.accept = ".pdf,.doc,.docx,.txt";
                if (type === 'audio') fileInputRef.current.accept = "audio/*";
                fileInputRef.current.click();
            }
        } else {
            console.log("Selected attachment needs custom UI:", type);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedAttachmentType) return;

        setIsUploading(true);
        try {
            const { url, metadata } = await uploadChatAttachment(file);

            await sendMessage(
                chatId,
                "📎 " + (selectedAttachmentType.charAt(0).toUpperCase() + selectedAttachmentType.slice(1)),
                replyingTo?.id,
                url,
                selectedAttachmentType,
                metadata
            );
            setReplyingTo(null);
        } catch (error) {
            console.error("Failed to upload/send attachment:", error);
            alert("Failed to send attachment");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="fixed inset-0 sm:bottom-4 sm:right-4 sm:top-auto sm:left-auto z-50 w-full sm:w-[420px] h-full sm:h-[85vh] flex flex-col bg-black sm:rounded-[40px] shadow-2xl overflow-hidden animate-fade-in-up">

            {/* Floating Header Pill */}
            <div className="absolute top-12 left-4 right-4 sm:top-6 z-20">
                <div className="bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-[30px] px-4 py-3 flex items-center justify-between shadow-2xl">
                    <button onClick={onClose} className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors">
                        <ChevronLeft size={20} />
                        <span className="text-[15px] font-semibold tracking-tight">{recipientName}</span>
                    </button>

                    <div className="text-white font-mono text-[14px] tracking-widest font-bold opacity-90">
                        {new Date().toLocaleTimeString([], { hour12: false })}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-[#111] overflow-hidden bg-zinc-800 z-10">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chatId}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="w-8 h-8 rounded-full border-2 border-[#111] overflow-hidden bg-zinc-700">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <button className="text-white hover:text-white/80 ml-1">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 pt-36 pb-48 w-full bg-black">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500 text-sm">
                        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                        Establishing connection...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-sm italic py-10">
                        The silence is loud.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_hash === currentUserId;
                        return (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isMe={isMe}
                                onReply={(m) => setReplyingTo(m)}
                            />
                        );
                    })
                )}

                {isUploading && (
                    <div className="flex items-center justify-end animate-fade-in-up mt-2">
                        <div className="bg-gradient-to-br from-[#c8d4ff] to-[#e4d3f2] text-black rounded-[24px] rounded-br-[4px] px-4 py-2 text-sm flex items-center gap-2 shadow-sm font-semibold">
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            <span>Uploading {selectedAttachmentType}...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Replying To Indicator inside input area */}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-none">

                {/* Replying notification */}
                {replyingTo && (
                    <div className="px-6 mb-2 pointer-events-auto">
                        <div className="bg-zinc-800/90 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 flex items-center justify-between shadow-xl">
                            <div className="flex flex-col overflow-hidden text-sm">
                                <span className="text-white font-semibold mb-0.5">
                                    Replying to {replyingTo.sender_hash === currentUserId ? 'You' : 'Anonymous'}
                                </span>
                                <span className="text-zinc-400 truncate text-[13px]">
                                    {replyingTo.content}
                                </span>
                            </div>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="p-1.5 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Floating Action Buttons above input */}
                <div className="flex justify-end gap-3 px-6 mb-3 pointer-events-auto">
                    <button className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-black hover:scale-105 transition-transform">
                        <MoreVertical size={24} />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-black hover:scale-105 transition-transform">
                        <Smile size={24} className="text-zinc-600" />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                        <Mic size={24} className="text-transparent border-red-500 z-10" style={{ stroke: 'url(#gradient-mic)' }} fill="url(#gradient-mic)" strokeWidth={0} />
                        <svg width="0" height="0">
                            <linearGradient id="gradient-mic" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop stopColor="#6366f1" offset="0%" />
                                <stop stopColor="#ec4899" offset="100%" />
                            </linearGradient>
                        </svg>
                    </button>
                </div>

                {/* Main Input Pill */}
                <div className="px-4 pb-6 w-full pointer-events-auto">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center bg-white rounded-[32px] p-2 shadow-2xl"
                    >
                        <button
                            type="button"
                            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                            className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${isAttachmentMenuOpen ? 'bg-zinc-100 text-black' : 'text-zinc-400 hover:text-black hover:bg-zinc-50'}`}
                        >
                            <Paperclip size={22} className={isAttachmentMenuOpen ? "transform rotate-45 transition-transform" : "transition-transform"} />
                        </button>

                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Think I can't tha"
                            className="flex-1 bg-transparent px-2 py-2 text-[16px] text-black placeholder-zinc-400 font-medium focus:outline-none"
                        />

                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-12 h-12 shrink-0 rounded-full bg-zinc-100 flex items-center justify-center text-black disabled:opacity-50 transition-colors ml-1 hover:bg-zinc-200"
                        >
                            <ChevronUp size={24} strokeWidth={2.5} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Attachment Menu Popup */}
            <AttachmentMenu
                isOpen={isAttachmentMenuOpen}
                onClose={() => setIsAttachmentMenuOpen(false)}
                onSelect={handleAttachmentSelect}
            />

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
