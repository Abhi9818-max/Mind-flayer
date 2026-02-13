import { createClient } from "@/lib/supabase/client";

export interface Chat {
    id: string;
    post_id: string;
    initiator_id: string;
    recipient_id: string;
    status: 'pending' | 'active' | 'rejected' | 'expired';
    created_at: string;
}

export interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export async function createChat(postId: string, recipientId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Check if chat already exists
    const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .eq('post_id', postId)
        .eq('initiator_id', user.id)
        .eq('recipient_id', recipientId)
        .single();

    if (existingChat) return existingChat;

    const { data, error } = await supabase
        .from('chats')
        .insert({
            post_id: postId,
            initiator_id: user.id,
            recipient_id: recipientId,
            status: 'active' // For MVP, auto-accept
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function sendMessage(chatId: string, content: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            sender_id: user.id,
            content
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getChatMessages(chatId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}
