"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronUp, Users, Paperclip, MoreVertical, Smile, Mic } from "lucide-react";
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
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            {/* Floating Header Pill */}
            <div className="absolute top-4 sm:top-6 left-4 right-4 z-50">
                <div className="bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-[30px] px-4 py-3 flex items-center justify-between shadow-2xl">
                    <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors">
                        <ChevronLeft size={20} />
                        <span className="text-[15px] font-semibold tracking-tight truncate max-w-[120px]">{room.name}</span>
                    </button>

                    <div className="text-white font-mono text-[14px] tracking-widest font-bold opacity-90">
                        {room.emoji}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-zinc-800/80 px-2 py-1 flex-shrink-0 rounded-full border border-white/5">
                            <div className={`w-1.5 h-1.5 rounded-full ${status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <Users size={12} className="text-zinc-400" />
                            <span className="text-[11px] text-zinc-300 font-medium">{memberCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 pt-28 pb-48 w-full bg-black">
                <div className="max-w-2xl mx-auto space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                            <p className="text-sm text-zinc-500">Entering {room.name}...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="text-4xl mb-4 opacity-50">{room.emoji}</div>
                            <h3 className="text-sm font-semibold text-zinc-500 mb-1">Silence.</h3>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.user_id === userId;
                            return (
                                <div key={msg.id} className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'} overflow-hidden relative group`}>
                                    <div className={`flex w-full gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}>

                                        {/* Avatar (For Received) */}
                                        {!isMe && (
                                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-auto mb-1 opacity-90">
                                                {msg.avatar_url && !msg.isAnonymous ? (
                                                    <img src={msg.avatar_url} alt="avatar" className="w-full h-full object-cover bg-zinc-800" />
                                                ) : (
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`} alt="avatar" className="w-full h-full object-cover bg-zinc-800" />
                                                )}
                                            </div>
                                        )}

                                        <div className={`flex flex-col max-w-[80%] sm:max-w-xs ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div
                                                className={`relative z-10 break-words px-4 py-3 text-[15px] shadow-sm ${isMe
                                                        ? 'bg-gradient-to-br from-[#c8d4ff] via-[#dcdbfc] to-[#e4d3f2] text-black rounded-[24px] rounded-br-[4px]'
                                                        : 'bg-white text-black rounded-[24px] rounded-bl-[4px]'
                                                    }`}
                                            >
                                                {/* Header: Name and Time inside bubble */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-[13px] text-black/90 tracking-tight">
                                                        {isMe ? 'You' : msg.username}
                                                    </span>
                                                    <span className="text-[11px] text-black/40 font-medium">
                                                        {msg.timestamp}
                                                    </span>
                                                </div>

                                                {/* Attachments */}
                                                {msg.content.startsWith('[Attached image]:') && (
                                                    <div className="relative mb-2 mt-1 -mx-1 group overflow-hidden rounded-[16px] bg-black/5 shadow-sm">
                                                        <img
                                                            src={msg.content.replace('[Attached image]: ', '').trim()}
                                                            alt="attachment"
                                                            className="w-full max-h-[250px] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] cursor-pointer"
                                                        />
                                                        <div className="absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] pointer-events-none" />
                                                    </div>
                                                )}

                                                {msg.content.startsWith('[Attached document]:') && (
                                                    <a href={msg.content.replace('[Attached document]: ', '').trim()} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 mb-2 mt-1 rounded-xl text-xs font-semibold ${isMe ? 'bg-black/10 hover:bg-black/15' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                                                        <Paperclip size={16} />
                                                        <span className="truncate">Attached Document</span>
                                                    </a>
                                                )}

                                                {msg.content.startsWith('[Attached audio]:') && (
                                                    <div className="mb-2 mt-1">
                                                        <audio controls src={msg.content.replace('[Attached audio]: ', '').trim()} className="h-8 max-w-[200px]" />
                                                    </div>
                                                )}

                                                {/* Message Content */}
                                                {!(msg.content.startsWith('[Attached image]:') || msg.content.startsWith('[Attached document]:') || msg.content.startsWith('[Attached audio]:')) && (
                                                    <span className="whitespace-pre-wrap leading-snug text-[15px]">{msg.content}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Avatar (For Sent) */}
                                        {isMe && (
                                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-auto mb-1 opacity-90 shadow-sm border border-black/5">
                                                {msg.avatar_url && !msg.isAnonymous && !isAnonymous ? (
                                                    <img src={msg.avatar_url} alt="avatar" className="w-full h-full object-cover bg-[#e4d3f2]" />
                                                ) : (
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`} alt="avatar" className="w-full h-full object-cover bg-[#e4d3f2]" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
            </div>

            {/* Bottom Input UI */}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-none pb-safe max-w-2xl mx-auto w-full">

                {/* Mode Toggle & Floating Buttons */}
                <div className="flex items-end justify-between px-6 mb-3 pointer-events-auto">
                    <button
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all shadow-lg ${isAnonymous
                            ? 'bg-zinc-800/90 border-white/10 text-zinc-300 backdrop-blur-md'
                            : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300 backdrop-blur-md'
                            }`}
                    >
                        {isAnonymous ? '🌑 Anon' : '👤 Public'}
                    </button>

                    <div className="flex gap-3">
                        <button className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-black hover:scale-105 transition-transform">
                            <Smile ml-0 size={24} className="text-zinc-600" />
                        </button>
                        <button className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="url(#gradient-mic-room)" stroke="none" xmlns="http://www.w3.org/2000/svg" className="z-10 relative">
                                <path d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2ZM19 11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11H7C7 13.76 9.24 16 12 16C14.76 16 17 13.76 17 11H19Z" />
                            </svg>
                            <svg width="0" height="0">
                                <linearGradient id="gradient-mic-room" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop stopColor="#6366f1" offset="0%" />
                                    <stop stopColor="#ec4899" offset="100%" />
                                </linearGradient>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Input Pill */}
                <div className="px-4 pb-6 w-full pointer-events-auto">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
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
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder={isAnonymous ? "Type anonymously..." : "Type a message..."}
                            className="flex-1 bg-transparent px-2 py-2 text-[16px] text-black placeholder-zinc-400 font-medium focus:outline-none"
                            maxLength={500}
                        />

                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !userId}
                            className="w-12 h-12 shrink-0 rounded-full bg-zinc-100 flex items-center justify-center text-black disabled:opacity-50 transition-colors ml-1 hover:bg-zinc-200"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                        </button>
                    </form>
                    {!userId && (
                        <div className="flex justify-center mt-2">
                            <span className="text-[11px] text-red-400 pointer-events-none">Log in to chat</span>
                        </div>
                    )}
                </div>
            </div>

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

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}

export default function RoomChatPage() {
    return <RoomChatContent />;
}
