
import { createClient } from "@/lib/supabase/client";

export interface Notification {
    id: string;
    user_id: string;
    type: 'like' | 'comment' | 'system' | 'mention';
    reference_id: string | null;
    content: string;
    is_read: boolean;
    created_at: string;
}

export async function getNotifications(limit = 20): Promise<Notification[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }

    return data as Notification[];
}

export async function markAsRead(notificationId: string) {
    const supabase = createClient();

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw error;
}

export async function markAllAsRead() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) throw error;
}

// Helper to create notifications (to be used by other services)
export async function createNotification(
    userId: string,
    type: 'like' | 'comment' | 'system' | 'mention',
    content: string,
    referenceId?: string
) {
    const supabase = createClient();

    // Insert notification into database
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            content,
            reference_id: referenceId
        });

    if (error) {
        console.error("Error creating notification:", error);
        return;
    }

    // Send push notification
    try {
        await fetch('/api/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                title: getNotificationTitle(type),
                body: content,
                url: getNotificationUrl(type, referenceId),
                tag: type,
            }),
        });
    } catch (error) {
        console.error("Error sending push notification:", error);
        // Don't throw - push notification failure shouldn't break the flow
    }
}

// Helper to get notification title based on type
function getNotificationTitle(type: string): string {
    switch (type) {
        case 'like':
            return '❤️ New Like';
        case 'comment':
            return '💬 New Comment';
        case 'mention':
            return '📢 You were mentioned';
        case 'system':
            return '🔔 Mind-Flayer';
        default:
            return 'Mind-Flayer';
    }
}

// Helper to get notification URL based on type
function getNotificationUrl(type: string, referenceId?: string): string {
    if (referenceId) {
        switch (type) {
            case 'like':
            case 'comment':
                return `/post/${referenceId}`;
            default:
                return '/notifications';
        }
    }
    return '/notifications';
}

