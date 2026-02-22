"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface UnreadCounts {
    messages: number;
    notifications: number;
}

interface UnreadContextType {
    counts: UnreadCounts;
    refresh: () => void;
}

const UnreadContext = createContext<UnreadContextType>({
    counts: { messages: 0, notifications: 0 },
    refresh: () => { },
});

export function useUnread() {
    return useContext(UnreadContext);
}

export function UnreadProvider({ children }: { children: ReactNode }) {
    const [counts, setCounts] = useState<UnreadCounts>({ messages: 0, notifications: 0 });
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch unread counts
    const fetchCounts = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        // Unread notifications
        const { count: notifCount } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        // Unread messages: count chat_messages where sender != me and is_read = false
        const { count: msgCount } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .neq("sender_id", user.id)
            .eq("is_read", false);

        setCounts({
            messages: msgCount || 0,
            notifications: notifCount || 0,
        });
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    // Real-time subscriptions
    useEffect(() => {
        if (!userId) return;

        const supabase = createClient();

        // Listen for new notifications
        const notifChannel = supabase
            .channel("unread_notifications")
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${userId}`,
            }, () => {
                setCounts(prev => ({ ...prev, notifications: prev.notifications + 1 }));
            })
            .on("postgres_changes", {
                event: "UPDATE",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${userId}`,
            }, () => {
                // Re-fetch on update (e.g., mark as read)
                fetchCounts();
            })
            .subscribe();

        // Listen for new messages
        const msgChannel = supabase
            .channel("unread_messages")
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "chat_messages",
            }, (payload: any) => {
                // Only count if the message is NOT from the current user
                if (payload.new && payload.new.sender_id !== userId) {
                    setCounts(prev => ({ ...prev, messages: prev.messages + 1 }));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(notifChannel);
            supabase.removeChannel(msgChannel);
        };
    }, [userId, fetchCounts]);

    return (
        <UnreadContext.Provider value={{ counts, refresh: fetchCounts }}>
            {children}
        </UnreadContext.Provider>
    );
}
