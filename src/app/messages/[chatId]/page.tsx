"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send, Paperclip, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getChatMessages, sendMessage, Message } from "@/lib/services/chat";
import { haptic } from "@/lib/utils/haptic";
import { AttachmentMenu, AttachmentType } from "@/components/chat/AttachmentMenu";
import { uploadChatAttachment } from "@/lib/services/upload";

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const chatId = params.chatId as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [supabase] = useState(() => createClient());

    // Attachment States
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedAttachmentType, setSelectedAttachmentType] = useState<AttachmentType | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            try {
                const msgs = await getChatMessages(chatId);
                setMessages(msgs || []);
            } catch (error) {
                console.error("Failed to load messages:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [chatId, supabase]);

    // Realtime
    useEffect(() => {
        const channel = supabase
            .channel(`page_chat:${chatId}`)
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
                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [chatId, supabase]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUserId) return;

        const tempContent = newMessage;
        setNewMessage("");
        haptic.whisper();

        const tempMsg: Message = {
            id: `temp-${Date.now()}`,
            chat_id: chatId,
            sender_hash: currentUserId,
            content: tempContent,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const realMsg = await sendMessage(chatId, tempContent);
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? realMsg : m));
        } catch (error) {
            console.error("Failed to send message:", error);
            setNewMessage(tempContent);
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedAttachmentType || !currentUserId) return;

        setIsUploading(true);
        try {
            const { url, metadata } = await uploadChatAttachment(file);
            const content = "📎 " + (selectedAttachmentType.charAt(0).toUpperCase() + selectedAttachmentType.slice(1));

            const tempMsg: Message = {
                id: `temp-${Date.now()}`,
                chat_id: chatId,
                sender_hash: currentUserId,
                content,
                created_at: new Date().toISOString(),
                attachment_url: url,
                attachment_type: selectedAttachmentType,
                attachment_metadata: metadata
            };
            setMessages(prev => [...prev, tempMsg]);

            const realMsg = await sendMessage(chatId, content, null, url, selectedAttachmentType, metadata);
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? realMsg : m));
        } catch (error) {
            console.error("Failed to upload/send attachment:", error);
            alert("Failed to send attachment");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const formatTime = (ts: string) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Group messages by date
    const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((groups, msg) => {
        const date = new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.date === date) {
            lastGroup.msgs.push(msg);
        } else {
            groups.push({ date, msgs: [msg] });
        }
        return groups;
    }, []);

    return (
        <div className="min-h-screen bg-[#030303] text-white flex flex-col">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/[0.06] pt-safe">
                <div className="flex items-center gap-3 px-3 py-2.5 max-w-2xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 rounded-xl hover:bg-white/5 transition-colors active:scale-95"
                    >
                        <ChevronLeft size={20} className="text-zinc-400" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-white/[0.06]">
                        <span className="text-base">🎭</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-semibold text-white truncate">Anonymous Chat</h1>
                        <p className="text-[11px] text-zinc-500">Encrypted • End-to-end</p>
                    </div>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto pt-[calc(env(safe-area-inset-top,20px)+56px)] pb-[76px]">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                            <p className="text-xs text-zinc-600">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                                <span className="text-2xl">💬</span>
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-300 mb-1">Start a conversation</h3>
                            <p className="text-xs text-zinc-600">Send the first message.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {groupedMessages.map((group) => (
                                <div key={group.date}>
                                    {/* Date separator */}
                                    <div className="flex items-center gap-3 py-3">
                                        <div className="flex-1 h-px bg-white/[0.04]" />
                                        <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">{group.date}</span>
                                        <div className="flex-1 h-px bg-white/[0.04]" />
                                    </div>

                                    {/* Messages */}
                                    {group.msgs.map((msg) => {
                                        const isMe = msg.sender_hash === currentUserId;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[78%] group`}>
                                                    <div
                                                        className={`px-3.5 py-2 text-[14px] leading-relaxed ${isMe
                                                            ? 'bg-red-600 text-white rounded-2xl rounded-br-md block'
                                                            : 'bg-zinc-800/80 text-zinc-200 rounded-2xl rounded-bl-md border border-white/[0.04] block'
                                                            }`}
                                                    >
                                                        {msg.attachment_url && msg.attachment_type === 'image' && (
                                                            <div className="mb-2 -mx-2 -mt-1 overflow-hidden rounded-xl bg-black/20">
                                                                <img src={msg.attachment_url} alt="attachment" className="w-full max-h-48 object-cover" />
                                                            </div>
                                                        )}
                                                        {msg.attachment_url && msg.attachment_type === 'document' && (
                                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 mb-2 rounded-lg text-xs font-semibold ${isMe ? 'bg-red-700/50 border border-red-400/30 text-white' : 'bg-zinc-700/50 border border-zinc-600'}`}>
                                                                <FileText size={16} />
                                                                <span className="truncate">{msg.attachment_metadata?.name || 'Document'}</span>
                                                            </a>
                                                        )}
                                                        {msg.attachment_url && msg.attachment_type === 'audio' && (
                                                            <div className="mb-2">
                                                                <audio controls src={msg.attachment_url} className="h-8 max-w-[200px]" />
                                                            </div>
                                                        )}
                                                        <span className="break-words whitespace-pre-wrap">{msg.content}</span>
                                                    </div>
                                                    <span className={`text-[10px] text-zinc-600 mt-0.5 block opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-right pr-1' : 'pl-1'}`}>
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>
            {isUploading && (
                <div className="fixed bottom-20 right-4 z-50">
                    <div className="bg-zinc-800 text-white rounded-2xl p-3 text-sm flex items-center gap-2 border border-white/10 shadow-xl">
                        <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                        <span className="opacity-90">Uploading {selectedAttachmentType}...</span>
                    </div>
                </div>
            )}

            {/* Attachment Menu Popup */}
            <AttachmentMenu
                isOpen={isAttachmentMenuOpen}
                onClose={() => setIsAttachmentMenuOpen(false)}
                onSelect={(type) => {
                    setIsAttachmentMenuOpen(false);
                    setSelectedAttachmentType(type);
                    if (type === 'image' || type === 'document' || type === 'audio') {
                        if (fileInputRef.current) {
                            if (type === 'image') fileInputRef.current.accept = "image/*";
                            if (type === 'document') fileInputRef.current.accept = ".pdf,.doc,.docx,.txt";
                            if (type === 'audio') fileInputRef.current.accept = "audio/*";
                            fileInputRef.current.click();
                        }
                    }
                }}
            />

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Input */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#030303]/90 backdrop-blur-xl border-t border-white/[0.06] pb-safe">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex flex-col gap-2 px-4 py-3 max-w-2xl mx-auto"
                >
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                            className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
                        >
                            <Paperclip size={20} />
                        </button>
                        <div className="flex-1 bg-zinc-900/80 rounded-full border border-white/[0.06] focus-within:border-white/[0.12] transition-colors relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full px-4 py-2.5 bg-transparent text-sm focus:outline-none placeholder:text-zinc-600"
                            />
                        </div>
                        <button
                            type="submit"
                            className="p-2.5 rounded-full bg-red-600 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-all active:scale-90 shrink-0"
                            disabled={!newMessage.trim()}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
