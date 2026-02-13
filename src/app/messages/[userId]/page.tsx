"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { DirectMessage } from "@/components/messages/DirectMessage";
import { ArrowLeft, Send, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

interface Message {
    id: string;
    content: string;
    timestamp: string;
    isSender: boolean;
}

const MOCK_MESSAGES: Message[] = [
    { id: "1", content: "Hey! How's it going?", timestamp: "10m ago", isSender: false },
    { id: "2", content: "Pretty good! Just finished my assignment", timestamp: "8m ago", isSender: true },
    { id: "3", content: "Nice! Want to study together later?", timestamp: "5m ago", isSender: false },
];

const USER_DATA: Record<string, { name: string; isAnonymous: boolean }> = {
    "user1": { name: "Fons Mans", isAnonymous: false },
    "user2": { name: "Anonymous #47", isAnonymous: true },
    "user3": { name: "Jane Doe", isAnonymous: false },
    "user4": { name: "John Smith", isAnonymous: false },
};

export default function ChatPage() {
    const params = useParams();
    const userId = params.userId as string;
    const user = USER_DATA[userId] || { name: "Unknown User", isAnonymous: false };

    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [newMessage, setNewMessage] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            content: newMessage,
            timestamp: "Just now",
            isSender: true
        };

        setMessages([...messages, message]);
        setNewMessage("");
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30 flex flex-col">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>

            {/* Chat Header */}
            <div className="relative z-10 px-4 pt-8 lg:pt-24 pb-4 border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/messages">
                            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        </Link>
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
                            {user.isAnonymous ? "🎭" : "👤"}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{user.name}</h1>
                            <p className="text-sm text-zinc-400">
                                {user.isAnonymous ? "Anonymous User" : "Active now"}
                            </p>
                        </div>
                    </div>

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

            {/* Messages */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
                <div className="space-y-4">
                    {messages.map((msg, i) => (
                        <DirectMessage key={msg.id} message={msg} delay={i * 50} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="relative z-10 px-4 py-4 border-t border-white/10 bg-black/50 backdrop-blur-md">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder={isAnonymous ? "Type anonymously..." : "Type your message..."}
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
