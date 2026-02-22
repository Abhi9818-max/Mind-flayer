import { createClient } from "@/lib/supabase/client";

export async function uploadChatAttachment(file: File): Promise<{ url: string; metadata: any }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from('chat_attachments')
        .upload(fileName, file);

    if (error) {
        throw new Error("Failed to upload attachment: " + error.message);
    }

    const { data: publicUrlData } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(fileName);

    return {
        url: publicUrlData.publicUrl,
        metadata: {
            name: file.name,
            size: file.size,
            type: file.type
        }
    };
}
