import { createClient } from "@/lib/supabase/client";

export interface Room {
    id: string;
    name: string;
    description: string | null;
    emoji: string | null;
    category: string | null;
    created_at: string;
}

export interface RoomWithStats extends Room {
    activeUsers: number;
}

/**
 * Fetch all rooms from the database
 */
export async function getRooms(): Promise<Room[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('live_rooms')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error("Error fetching rooms:", error);
        return [];
    }

    return data as Room[];
}

/**
 * Get active user count for a specific room
 * This counts unique users who have sent messages in the last 10 minutes
 */
export async function getRoomActiveUsers(roomId: string): Promise<number> {
    const supabase = createClient();

    // Get messages from the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('live_messages')
        .select('user_id')
        .eq('room_id', roomId)
        .gte('created_at', tenMinutesAgo);

    if (error) {
        console.error("Error fetching active users:", error);
        return 0;
    }

    // Count unique users
    const uniqueUsers = new Set(data.map((msg: any) => msg.user_id));
    return uniqueUsers.size;
}

/**
 * Get rooms with active user counts
 */
export async function getRoomsWithStats(): Promise<RoomWithStats[]> {
    const rooms = await getRooms();

    // Fetch active users for all rooms in parallel
    const roomsWithStats = await Promise.all(
        rooms.map(async (room) => {
            const activeUsers = await getRoomActiveUsers(room.id);
            return {
                ...room,
                activeUsers
            };
        })
    );

    return roomsWithStats;
}
