"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { ChatMessage } from "@/components/rooms/ChatMessage";
import { ArrowLeft, Send, Users, ToggleLeft, ToggleRight, Menu, X } from "lucide-react";
import Link from "next/link";

interface Message {
    id: string;
    username: string;
    content: string;
    timestamp: string;
    isAnonymous: boolean;
    replyTo?: string; // Username being replied to
}

const MOCK_MESSAGES: Message[] = [
    { id: "1", username: "Fons Mans", content: "Anyone else procrastinating on their assignment?", timestamp: "2m ago", isAnonymous: false },
    { id: "2", username: "Anonymous", content: "Always 💀", timestamp: "1m ago", isAnonymous: true },
    { id: "3", username: "Jane Doe", content: "What's the deadline again?", timestamp: "30s ago", isAnonymous: false },
];

const ROOM_DATA: Record<string, { name: string; emoji: string }> = {
    "1": { name: "The Void", emoji: "🌀" },
    "2": { name: "Study Hall", emoji: "📚" },
    "3": { name: "Confession Box", emoji: "🤫" },
    "4": { name: "Meme Factory", emoji: "😂" },
    "5": { name: "Late Night Thoughts", emoji: "🌙" },
    "6": { name: "Dating Advice", emoji: "💕" },
};

// Mock active users
const MOCK_ACTIVE_USERS = [
    { id: "1", username: "Fons Mans", isAnonymous: false },
    { id: "2", username: "Anonymous #1", isAnonymous: true },
    { id: "3", username: "Jane Doe", isAnonymous: false },
    { id: "4", username: "Anonymous #2", isAnonymous: true },
    { id: "5", username: "John Smith", isAnonymous: false },
    { id: "6", username: "Anonymous #3", isAnonymous: true },
    { id: "7", username: "Alice Wonder", isAnonymous: false },
];

const MAX_MESSAGES = 40;

export default function RoomChatPage() {
    const params = useParams();
    const roomId = params.id as string;
    const room = ROOM_DATA[roomId] || { name: "Unknown Room", emoji: "❓" };

    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [newMessage, setNewMessage] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [mentionedMessageId, setMentionedMessageId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<typeof MOCK_ACTIVE_USERS[0] | null>(null);
    const [onlineCount] = useState(MOCK_ACTIVE_USERS.length);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize notification sound
    useEffect(() => {
        notificationAudioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTQwOUKfh77VgGwU7k9jxxHInBSl+zPLaizsKGGS45ep9LgMTPqXh8bllHAU3jtT0yH4uBSZ7yfHajz0KFma87OmPPAoVaLvv6JZECxNnvPDmnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnEYMGWi77+eaRAsTaMDy5JdGCxVpvPLjnE');
    }, []);

    const handleReplyClick = (username: string) => {
        setReplyingTo(username);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            username: isAnonymous ? "Anonymous" : "You",
            content: newMessage,
            timestamp: "Just now",
            isAnonymous,
            replyTo: replyingTo || undefined
        };

        // Add new message and limit to MAX_MESSAGES
        setMessages(prev => {
            const updated = [...prev, message];
            // Keep only the last MAX_MESSAGES
            return updated.slice(-MAX_MESSAGES);
        });

        // If replying to someone, play notification and highlight their message
        if (replyingTo) {
            // Play notification sound
            notificationAudioRef.current?.play().catch(e => console.log("Audio play failed:", e));

            // Find and highlight the mentioned user's latest message
            const mentionedMsg = messages.findLast(msg => msg.username === replyingTo);
            if (mentionedMsg) {
                setMentionedMessageId(mentionedMsg.id);
                setTimeout(() => setMentionedMessageId(null), 3000); // Remove highlight after 3s
            }
        }

        setNewMessage("");
        setReplyingTo(null);
    };

    const handleUserClick = (user: typeof MOCK_ACTIVE_USERS[0]) => {
        setSelectedUser(user);
    };

    const handleViewProfile = () => {
        if (selectedUser) {
            window.location.href = `/profile?id=${selectedUser.id}`;
        }
        setSelectedUser(null);
    };

    const handleReplyUser = () => {
        if (selectedUser) {
            setReplyingTo(selectedUser.username);
            setSelectedUser(null);
            setIsSidebarOpen(false);
        }
    };

    const handlePersonalChat = () => {
        if (selectedUser) {
            // Navigate to personal chat page
            window.location.href = `/messages/${selectedUser.id}`;
        }
        setSelectedUser(null);
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30 flex flex-col">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>

            {/* Room Header */}
            <div className="relative z-10 px-4 pt-8 lg:pt-24 pb-4 border-b border-white/10 bg-black/50 backdrop-blur-md">
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
                                <Users size={14} />
                                <span>{onlineCount} online</span>
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

                        {/* Users Sidebar Toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* User List Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-zinc-900 border-l border-white/10 z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Active Users</h2>
                            <p className="text-sm text-zinc-400">{onlineCount} online</p>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* User List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {MOCK_ACTIVE_USERS.map((user, i) => (
                            <button
                                key={user.id}
                                onClick={() => handleUserClick(user)}
                                className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors animate-fade-in-up cursor-pointer"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                        {user.isAnonymous ? "🎭" : "👤"}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${user.isAnonymous ? 'text-zinc-400' : 'text-white'}`}>
                                            {user.username}
                                        </p>
                                        {user.isAnonymous && (
                                            <p className="text-xs text-zinc-500">Anonymous</p>
                                        )}
                                    </div>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Action Menu */}
            {selectedUser && (
                <>
                    <div
                        onClick={() => setSelectedUser(null)}
                        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
                    />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 bg-zinc-900 border border-white/10 rounded-2xl p-6 animate-scale-in shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-3xl">
                                {selectedUser.isAnonymous ? "🎭" : "👤"}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{selectedUser.username}</h3>
                                {selectedUser.isAnonymous && (
                                    <p className="text-sm text-zinc-400">Anonymous User</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={handleViewProfile}
                                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    👁️
                                </div>
                                <div>
                                    <p className="font-medium">View Profile</p>
                                    <p className="text-xs text-zinc-400">See their posts and info</p>
                                </div>
                            </button>

                            <button
                                onClick={handleReplyUser}
                                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    💬
                                </div>
                                <div>
                                    <p className="font-medium">Reply in Chat</p>
                                    <p className="text-xs text-zinc-400">Start replying to them</p>
                                </div>
                            </button>

                            <button
                                onClick={handlePersonalChat}
                                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                    📨
                                </div>
                                <div>
                                    <p className="font-medium">Personal Chat</p>
                                    <p className="text-xs text-zinc-400">Start private conversation</p>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedUser(null)}
                            className="mt-4 w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </>
            )}

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
                />
            )}

            {/* Messages */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
                <div className="space-y-4">
                    {messages.map((msg, i) => (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            delay={i * 50}
                            onReplyClick={handleReplyClick}
                            isHighlighted={msg.id === mentionedMessageId}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="relative z-10 px-4 py-4 border-t border-white/10 bg-black/50 backdrop-blur-md">
                {/* Reply Indicator */}
                {replyingTo && (
                    <div className="max-w-4xl mx-auto mb-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-red-400">Replying to <span className="font-bold">{replyingTo}</span></span>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="text-zinc-400 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder={replyingTo ? `Reply to ${replyingTo}...` : (isAnonymous ? "Type anonymously..." : "Type your message...")}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-zinc-600"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!newMessage.trim()}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
