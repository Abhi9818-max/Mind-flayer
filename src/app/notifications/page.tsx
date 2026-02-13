
"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { Bell, Heart, MessageCircle, AtSign, CheckCheck } from "lucide-react";
import { getNotifications, markAllAsRead, markAsRead, Notification } from "@/lib/services/notifications";
import { formatDistanceToNow } from "date-fns";
import { EmptyNotifications } from "@/components/ui/EmptyState";
import { haptic } from "@/lib/utils/haptic";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            haptic.light();
            await markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleNotificationClick = async (n: Notification) => {
        haptic.light();
        if (!n.is_read) {
            try {
                await markAsRead(n.id);
                setNotifications(notifications.map(item =>
                    item.id === n.id ? { ...item, is_read: true } : item
                ));
            } catch (error) {
                console.error("Failed to mark as read", error);
            }
        }
        // Navigate or handle action based on type if needed
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart className="text-red-500" size={20} fill="currentColor" />;
            case 'comment': return <MessageCircle className="text-blue-400" size={20} />;
            case 'mention': return <AtSign className="text-purple-400" size={20} />;
            default: return <Bell className="text-yellow-400" size={20} />;
        }
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30">
            <LiquidBackground />
            <Navbar />
            <MobileNav />

            <main className="relative z-10 pt-20 lg:pt-24 pb-24 px-4 max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                            <CheckCheck size={14} />
                            Mark all read
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <EmptyNotifications />
                ) : (
                    <div className="space-y-2">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`
                                    flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer
                                    ${n.is_read
                                        ? 'bg-transparent border-transparent hover:bg-white/5 opacity-70'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }
                                `}
                            >
                                <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm ${n.is_read ? 'font-medium text-zinc-400' : 'font-semibold text-zinc-200'}`}>
                                        {n.content}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                {!n.is_read && (
                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
