"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { getChatMessages, sendMessage, Message } from "@/lib/services/chat";

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
    const supabase = createClient();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Initial Load & Auth
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

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel(`chat:${chatId}`)
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
            await sendMessage(chatId, tempContent);
        } catch (error) {
            console.error("Failed to send:", error);
            setNewMessage(tempContent); // Revert on error
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 flex flex-col overflow-hidden rounded-2xl border border-purple-500/20 bg-zinc-900 shadow-2xl shadow-purple-900/20 animate-fade-in-up">
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
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
                                        ? 'bg-purple-600 text-white rounded-br-none'
                                        : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-zinc-500 mt-1 px-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 bg-zinc-900">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
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
