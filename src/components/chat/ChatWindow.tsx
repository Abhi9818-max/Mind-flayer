"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { uploadChatAttachment } from "@/lib/services/upload";
import { getChatMessages, sendMessage, markMessagesAsRead, Message } from "@/lib/services/chat";
import { AttachmentMenu, AttachmentType } from "./AttachmentMenu";
import { MessageBubble } from "./MessageBubble";
import { Paperclip, X } from "lucide-react";

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

                    // Automatically mark as read if chat is open and we aren't the sender
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
                // Set accept types based on selection
                if (type === 'image') fileInputRef.current.accept = "image/*";
                if (type === 'document') fileInputRef.current.accept = ".pdf,.doc,.docx,.txt";
                if (type === 'audio') fileInputRef.current.accept = "audio/*";
                fileInputRef.current.click();
            }
        } else {
            console.log("Selected attachment needs custom UI:", type);
            // TODO: poll/location modals
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedAttachmentType) return;

        setIsUploading(true);
        try {
            const { url, metadata } = await uploadChatAttachment(file);

            // Send message with attachment
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
        <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-50 w-full sm:w-96 h-[85vh] sm:h-auto flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl border-t sm:border border-purple-500/20 bg-zinc-900 shadow-2xl shadow-purple-900/20 animate-fade-in-up pb-safe">
            {/* Header */}
            <div className="flex items-center justify-between bg-accent-gradient px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm">
                        👤
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white leading-none">
                            {recipientName}
                        </h4>
                        <span className="text-xs text-purple-100 opacity-80">
                            Telepathy Connection
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white"
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 h-80 overflow-y-auto p-4 space-y-3 bg-zinc-900/95">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                        Establishing connection...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-sm italic text-center px-4">
                        This is the start of your telepathic link. Say hello!
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
                    <div className="flex items-center justify-end animate-fade-in-up">
                        <div className="bg-purple-600/50 text-white rounded-2xl rounded-br-none px-4 py-2 text-sm flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="opacity-90">Uploading {selectedAttachmentType}...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Replying To Indicator */}
            {replyingTo && (
                <div className="px-4 py-2 bg-zinc-800/80 border-t border-purple-500/20 flex items-center justify-between">
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-xs text-purple-400 font-semibold mb-0.5">
                            Replying to {replyingTo.sender_hash === currentUserId ? 'yourself' : 'them'}
                        </span>
                        <span className="text-sm text-zinc-300 truncate">
                            {replyingTo.content}
                        </span>
                    </div>
                    <button
                        onClick={() => setReplyingTo(null)}
                        className="p-1 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

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

            {/* Input */}
            <div className="p-3 border-t border-white/5 bg-zinc-900 relative">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 items-end"
                >
                    <button
                        type="button"
                        onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                        className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${isAttachmentMenuOpen ? 'bg-purple-600/20 text-purple-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                        <Paperclip size={20} className={isAttachmentMenuOpen ? "transform rotate-45 transition-transform" : "transition-transform"} />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl bg-black/20 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                    <Button
                        type="submit"
                        className="!px-3 !py-2 shrink-0 rounded-xl bg-purple-600 hover:bg-purple-500"
                        disabled={!newMessage.trim()}
                    >
                        ➤
                    </Button>
                </form>
            </div>
        </div>
    );
}
