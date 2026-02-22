import { createClient } from "@/lib/supabase/client";

export interface Chat {
    id: string;
    post_id?: string;
    initiator_hash: string;
    responder_hash: string;
    is_revealed: boolean;
    expires_at: string;
    created_at: string;
}

export interface Message {
    id: string;
    chat_id: string;
    sender_hash: string;
    content: string;
    created_at: string;
    reply_to_id?: string | null;
    attachment_url?: string | null;
    attachment_type?: 'image' | 'document' | 'audio' | 'location' | 'poll' | null;
    attachment_metadata?: any;
    read_at?: string | null;
    replied_to?: { content: string; sender_hash: string } | null;
}

export async function createChat(postId: string, recipientHash: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // The user_hash logic should ideally match how we generated it in posts.ts
    // For now, we use the user.id as the hash for logged-in users initiating chats
    const initiatorHash = user.id;

    // Check if chat already exists
    const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .eq('post_id', postId)
        .eq('initiator_hash', initiatorHash)
        .eq('responder_hash', recipientHash)
        .single();

    if (existingChat) return existingChat;

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
        .from('chats')
        .insert({
            post_id: postId,
            initiator_hash: initiatorHash,
            responder_hash: recipientHash,
            is_revealed: false,
            expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getConversations() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const userHash = user.id;

    // Fetch chats where user is either initiator or responder
    const { data, error } = await supabase
        .from('chats')
        .select(`
            *,
            chat_messages:chat_messages(content, created_at, sender_hash)
        `)
        .or(`initiator_hash.eq.${userHash},responder_hash.eq.${userHash}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }

    return data;
}

export async function sendMessage(
    chatId: string,
    content: string,
    replyToId?: string | null,
    attachmentUrl?: string | null,
    attachmentType?: string | null,
    attachmentMetadata?: any
) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from('chat_messages')
        .insert({
            chat_id: chatId,
            sender_hash: user.id,
            content,
            reply_to_id: replyToId,
            attachment_url: attachmentUrl,
            attachment_type: attachmentType,
            attachment_metadata: attachmentMetadata
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getChatMessages(chatId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('chat_messages')
        .select(`
            *,
            replied_to:reply_to_id(content, sender_hash)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    // Map array wrapping issue with Supabase self joins (sometimes returns arrays)
    return data.map((msg: any) => ({
        ...msg,
        replied_to: Array.isArray(msg.replied_to) ? msg.replied_to[0] : msg.replied_to
    })) as Message[];
}

export async function markMessagesAsRead(chatId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Mark all unread messages in this chat NOT sent by the current user as read
    const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .neq('sender_hash', user.id)
        .is('read_at', null);

    if (error) console.error("Error marking messages as read:", error);
}
