"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { ChatMessage } from "@/components/rooms/ChatMessage";
import { ArrowLeft, Send, Users, ToggleLeft, ToggleRight, Menu, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Message {
    id: string;
    username: string;
    content: string;
    timestamp: string;
    isAnonymous: boolean;
    replyTo?: string;
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
    const roomId = params.id as string;
    const room = ROOM_DATA[roomId] || { name: "Unknown Room", emoji: "❓" };
    // Use useState to initialize client once and keep reference stable
    const [supabase] = useState(() => createClient());

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null); // Username only for now
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // const notificationAudioRef = useRef<HTMLAudioElement | null>(null); // Commented out for now, can restore if requested

    // Auth Check
    useEffect(() => {
        supabase.auth.getUser().then((res: any) => {
            const user = res.data?.user;
            setUserId(user?.id || null);
        });
    }, [supabase]);

    // Initial Fetch & Subscribe
    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('live_messages')
                    .select(`
                        *,
                        user_profiles(username, avatar_url)
                    `)
                    .eq('room_id', roomId)
                    .order('created_at', { ascending: true })
                    .limit(MAX_MESSAGES);

                if (error) {
                    throw error;
                }

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
                }
            } catch (err: any) {
                console.error("Fetch Error:", err);
                // alert(`Failed to load messages: ${err.message}`); // Optional: alert user
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        };

        fetchMessages();

        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'live_messages',
                    filter: `room_id=eq.${roomId}`
                },
                async (payload: any) => {
                    // Fetch profile for new message
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
                        const updated = [...prev, newMsg];
                        return updated.slice(-MAX_MESSAGES);
                    });
                    scrollToBottom();
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') setStatus('CONNECTED');
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setStatus('DISCONNECTED');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, supabase]);


    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !userId) return;

        const content = newMessage.trim();
        setNewMessage(""); // Optimistic clear
        setReplyingTo(null);

        const { error } = await supabase
            .from('live_messages')
            .insert({
                room_id: roomId,
                content: content,
                is_anonymous: isAnonymous,
                user_id: userId
            });

        if (error) {
            console.error("Failed to send:", error);
            alert("Failed to send message. Please try again.");
            setNewMessage(content); // Restore message
        }
    };

    const handleReplyClick = (username: string) => {
        setReplyingTo(username);
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30 flex flex-col">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>

            {/* Room Header */}
            <div className="relative z-10 px-4 pt-20 lg:pt-24 pb-4 border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/rooms">
                            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        </Link>
                        <div className="text-3xl">{room.emoji}</div>
                        <div>
                            <h1 className="text-xl font-bold">{room.name}</h1>
                            <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                                <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span>{status === 'CONNECTED' ? 'Live' : status}</span>
                                {loading && <Loader2 size={12} className="animate-spin ml-2" />}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Anonymous Toggle */}
                        <button
                            onClick={() => setIsAnonymous(!isAnonymous)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            {isAnonymous ? <ToggleRight size={20} className="text-red-500" /> : <ToggleLeft size={20} />}
                            <span className="text-sm hidden sm:inline">{isAnonymous ? "Anonymous" : "Public"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="relative z-10 flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-zinc-800 pb-32"> {/* Added pb-32 to ensure content isn't hidden behind input */}
                <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                    {messages.length === 0 && !loading && (
                        <div className="text-center text-zinc-500 py-20 animate-fade-in">
                            <p>No messages yet.</p>
                            <p className="text-sm">Be the first to speak into the void.</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <ChatMessage
                            key={msg.id}
                            message={msg as any}
                            delay={0}
                            onReplyClick={handleReplyClick}
                            isHighlighted={false}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4 border-t border-white/10 bg-black/80 backdrop-blur-xl pb-safe">
                <div className="max-w-4xl mx-auto">
                    {replyingTo && (
                        <div className="mb-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between animate-in slide-in-from-bottom-2">
                            <span className="text-sm text-red-400">Replying to <span className="font-bold">{replyingTo}</span></span>
                            <button onClick={() => setReplyingTo(null)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder={replyingTo ? `Reply to ${replyingTo}...` : (isAnonymous ? "Type anonymously..." : "Type your message...")}
                            className="flex-1 px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-full focus:outline-none focus:border-white/20 transition-colors placeholder:text-zinc-600 text-white"
                            maxLength={500}
                        />
                        <button
                            onClick={handleSendMessage}
                            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                            disabled={!newMessage.trim() || !userId}
                        >
                            <Send size={20} className={newMessage.trim() ? "fill-white" : ""} />
                        </button>
                    </div>
                    {!userId && (
                        <p className="text-xs text-center text-red-400 mt-2">Log in to chat</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function RoomChatPage() {
    return <RoomChatContent />;
}
