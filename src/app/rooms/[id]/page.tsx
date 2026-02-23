"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send, Users, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AttachmentMenu, AttachmentType } from "@/components/chat/AttachmentMenu";
import { uploadChatAttachment } from "@/lib/services/upload";

interface Message {
    id: string;
    username: string;
    content: string;
    timestamp: string;
    isAnonymous: boolean;
    user_id?: string;
    avatar_url?: string;
}

const ROOM_DATA: Record<string, { name: string; emoji: string }> = {
    "1": { name: "The Void", emoji: "🌀" },
    "2": { name: "Study Hall", emoji: "📚" },
    "3": { name: "Confession Box", emoji: "🤫" },
    "4": { name: "Meme Factory", emoji: "😂" },
    "5": { name: "Late Night Thoughts", emoji: "🌙" },
    "6": { name: "Dating Advice", emoji: "💕" },
};

const MAX_MESSAGES = 100;

function RoomChatContent() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as string;
    const room = ROOM_DATA[roomId] || { name: "Unknown Room", emoji: "❓" };
    const [supabase] = useState(() => createClient());

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
    const [memberCount, setMemberCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedAttachmentType, setSelectedAttachmentType] = useState<AttachmentType | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then((res: any) => {
            setUserId(res.data?.user?.id || null);
        });
    }, [supabase]);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('live_messages')
                    .select(`*, user_profiles(username, avatar_url)`)
                    .eq('room_id', roomId)
                    .order('created_at', { ascending: true })
                    .limit(MAX_MESSAGES);

                if (error) throw error;

                if (data) {
                    const formatted: Message[] = data.map((msg: any) => ({
                        id: msg.id,
                        username: msg.is_anonymous ? 'Anonymous' : (msg.user_profiles?.username || 'Unknown'),
                        content: msg.content,
                        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isAnonymous: msg.is_anonymous,
                        user_id: msg.user_id,
                        avatar_url: msg.user_profiles?.avatar_url
                    }));
                    setMessages(formatted);
                    // Count unique users
                    const uniqueUsers = new Set(data.map((m: any) => m.user_id));
                    setMemberCount(uniqueUsers.size);
                }
            } catch (err: any) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        };

        fetchMessages();

        const channel = supabase
            .channel(`room:${roomId}-${Date.now()}-${Math.random()}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'live_messages', filter: `room_id=eq.${roomId}` },
                async (payload: any) => {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('username, avatar_url')
                        .eq('id', payload.new.user_id)
                        .single();

                    const newMsg: Message = {
                        id: payload.new.id,
                        username: payload.new.is_anonymous ? 'Anonymous' : (profile?.username || 'Unknown'),
                        content: payload.new.content,
                        timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isAnonymous: payload.new.is_anonymous,
                        user_id: payload.new.user_id,
                        avatar_url: profile?.avatar_url
                    };

                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg].slice(-MAX_MESSAGES);
                    });
                    scrollToBottom();
                }
            )
            .subscribe((status: string, err: any) => {
                if (status === 'SUBSCRIBED') {
                    setStatus('CONNECTED');
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error("Room Subscription Error/Closed:", status, err);
                    setStatus('DISCONNECTED');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, supabase]);

    const scrollToBottom = () => {
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !userId) return;
        const content = newMessage.trim();
        setNewMessage("");

        const tempId = `temp-${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            username: isAnonymous ? 'Anonymous' : 'You',
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAnonymous: isAnonymous,
            user_id: userId,
        };

        // Optimistic UI update
        setMessages(prev => {
            if (prev.some(m => m.id === tempId)) return prev;
            return [...prev, tempMsg].slice(-MAX_MESSAGES);
        });
        scrollToBottom();

        const { data, error } = await supabase
            .from('live_messages')
            .insert({ room_id: roomId, content, is_anonymous: isAnonymous, user_id: userId })
            .select()
            .single();

        if (error) {
            console.error("Failed to send:", error);
            setNewMessage(content);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else if (data) {
            // Replace the temporary message with the real one to fix the key
            setMessages(prev => prev.map(m => m.id === tempId ? {
                ...tempMsg,
                id: data.id,
                timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } : m));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedAttachmentType || !userId) return;

        setIsUploading(true);
        try {
            const { url, metadata } = await uploadChatAttachment(file);
            const content = `[Attached ${selectedAttachmentType}]: ${url}`;

            const tempId = `temp-${Date.now()}`;
            const tempMsg: Message = {
                id: tempId,
                username: isAnonymous ? 'Anonymous' : 'You',
                content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isAnonymous: isAnonymous,
                user_id: userId,
            };

            // Optimistic UI update
            setMessages(prev => {
                if (prev.some(m => m.id === tempId)) return prev;
                return [...prev, tempMsg].slice(-MAX_MESSAGES);
            });
            scrollToBottom();

            // Send room message with attachment
            const { data, error } = await supabase
                .from('live_messages')
                .insert({
                    room_id: roomId,
                    content,
                    is_anonymous: isAnonymous,
                    user_id: userId
                })
                .select()
                .single();
            if (error) throw error;
            if (data) {
                setMessages(prev => prev.map(m => m.id === tempId ? {
                    ...tempMsg,
                    id: data.id,
                    timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                } : m));
            }

        } catch (error) {
            console.error("Failed to upload/send attachment:", error);
            alert("Failed to send attachment");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

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
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-white/[0.06]">
                        <span className="text-lg">{room.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-semibold text-white truncate">{room.name}</h1>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${status === 'CONNECTED' ? 'bg-green-500' : 'bg-zinc-600'}`} />
                            <span className="text-[11px] text-zinc-500">
                                {status === 'CONNECTED' ? 'Live' : status.toLowerCase()}
                            </span>
                            {memberCount > 0 && (
                                <>
                                    <span className="text-zinc-700">•</span>
                                    <Users size={10} className="text-zinc-600" />
                                    <span className="text-[11px] text-zinc-500">{memberCount}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Anonymous toggle */}
                    <button
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${isAnonymous
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-white/[0.04] border-white/[0.08] text-zinc-400'
                            }`}
                    >
                        {isAnonymous ? '🌑 Anon' : '👤 Public'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto pt-[calc(env(safe-area-inset-top,20px)+56px)] pb-[76px]">
                <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                            <p className="text-xs text-zinc-600">Loading room...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="text-4xl mb-4">{room.emoji}</div>
                            <h3 className="text-sm font-semibold text-zinc-300 mb-1">Room is quiet</h3>
                            <p className="text-xs text-zinc-600">Be the first to say something.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.user_id === userId;
                            return (
                                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    {!isMe && (
                                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center border border-white/[0.04] shrink-0 mt-0.5 overflow-hidden">
                                            {msg.isAnonymous ? (
                                                <span className="text-xs">🌑</span>
                                            ) : msg.avatar_url ? (
                                                <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-zinc-500">{msg.username[0]}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        {/* Username for others */}
                                        {!isMe && (
                                            <span className="text-[10px] font-semibold text-zinc-500 ml-1 mb-0.5 block">
                                                {msg.username}
                                            </span>
                                        )}
                                        <div
                                            className={`px-3.5 py-2 text-[13px] leading-relaxed relative ${isMe
                                                ? 'bg-red-600 text-white rounded-2xl rounded-br-md'
                                                : 'bg-zinc-800/80 text-zinc-200 rounded-2xl rounded-bl-md border border-white/[0.04]'
                                                }`}
                                        >
                                            {/* Render parsed attachments from content string */}
                                            {msg.content.startsWith('[Attached image]:') && (
                                                <div className="relative mb-2 mt-1 -mx-2 group overflow-hidden rounded-[12px] bg-black/40 border border-white/5 shadow-md">
                                                    <img
                                                        src={msg.content.replace('[Attached image]: ', '').trim()}
                                                        alt="attachment"
                                                        className="w-full max-h-[250px] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] cursor-pointer"
                                                    />
                                                    <div className="absolute inset-0 rounded-[12px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] pointer-events-none" />
                                                </div>
                                            )}

                                            {msg.content.startsWith('[Attached document]:') && (
                                                <a href={msg.content.replace('[Attached document]: ', '').trim()} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 mb-2 mt-1 rounded-lg text-xs font-semibold ${isMe ? 'bg-red-700/50 hover:bg-red-700 border border-red-400/30' : 'bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600'}`}>
                                                    <Paperclip size={16} />
                                                    <span className="truncate">Attached Document</span>
                                                </a>
                                            )}

                                            {msg.content.startsWith('[Attached audio]:') && (
                                                <div className="mb-2 mt-1">
                                                    <audio controls src={msg.content.replace('[Attached audio]: ', '').trim()} className="h-8 max-w-[200px]" />
                                                </div>
                                            )}

                                            {/* Hide the text content if it's an attachment to look premium */}
                                            {!(msg.content.startsWith('[Attached image]:') || msg.content.startsWith('[Attached document]:') || msg.content.startsWith('[Attached audio]:')) && (
                                                <span className="whitespace-pre-wrap">{msg.content}</span>
                                            )}
                                        </div>
                                        <span className={`text-[9px] text-zinc-700 mt-0.5 block ${isMe ? 'text-right pr-1' : 'pl-1'}`}>
                                            {msg.timestamp}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {isUploading && (
                        <div className="flex items-center justify-end animate-fade-in-up">
                            <div className="bg-zinc-800 text-white rounded-2xl p-3 text-sm flex items-center gap-2 border border-white/10">
                                <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                <span className="opacity-90">Uploading {selectedAttachmentType}...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

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
                    } else {
                        console.log("Room Attachment Selected:", type);
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
                <div className="flex items-center gap-2 px-4 py-3 max-w-2xl mx-auto">
                    <button
                        onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                        className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${isAttachmentMenuOpen ? 'bg-red-600/20 text-red-500' : 'hover:bg-zinc-800 text-zinc-500 hover:text-white'}`}
                    >
                        <Paperclip size={20} className={isAttachmentMenuOpen ? "transform rotate-45 transition-transform" : "transition-transform"} />
                    </button>
                    <div className="flex-1 bg-zinc-900/80 rounded-full border border-white/[0.06] focus-within:border-white/[0.12] transition-colors">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder={isAnonymous ? "Type anonymously..." : "Type a message..."}
                            className="w-full px-4 py-2.5 bg-transparent text-sm focus:outline-none placeholder:text-zinc-600"
                            maxLength={500}
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        className="p-2.5 rounded-full bg-red-600 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-all active:scale-90"
                        disabled={!newMessage.trim() || !userId}
                    >
                        <Send size={16} />
                    </button>
                </div>
                {!userId && (
                    <p className="text-[11px] text-center text-red-400 pb-2">Log in to chat</p>
                )}
            </div>
        </div>
    );
}

export default function RoomChatPage() {
    return <RoomChatContent />;
}
