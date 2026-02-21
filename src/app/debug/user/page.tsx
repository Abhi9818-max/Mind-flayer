"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugUserPage() {
    const [audit, setAudit] = useState<any>(null);

    useEffect(() => {
        const run = async () => {
            const supabase = createClient();

            // Check session first (doesn't validate with server)
            const { data: sessionData } = await supabase.auth.getSession();
            const session = sessionData?.session;

            // Then validate with server
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (user) {
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('id, username, real_name, id_card_url, verification_status, is_verified, territory_id, created_at')
                    .eq('id', user.id)
                    .single();

                const { data: modData } = await supabase
                    .from('moderators')
                    .select('*')
                    .eq('user_id', user.id);

                const { data: pendingUsers, error: pendingError } = await supabase
                    .from('user_profiles')
                    .select('id, username, real_name, verification_status')
                    .eq('verification_status', 'pending');

                setAudit({
                    status: "AUTHENTICATED",
                    authUser: { id: user.id, email: user.email },
                    sessionExists: !!session,
                    profile,
                    profileError: profileError?.message,
                    moderatorRole: modData,
                    pendingUsersVisible: pendingUsers,
                    pendingError: pendingError?.message
                });
            } else {
                setAudit({
                    status: "NOT AUTHENTICATED",
                    sessionExists: !!session,
                    sessionEmail: session?.user?.email || "none",
                    userError: userError?.message || "No user returned",
                    hint: "You need to log in at /login first, then come back here."
                });
            }
        };
        run();
    }, []);

    return (
        <div className="min-h-screen bg-black text-green-400 p-8 font-mono text-sm whitespace-pre-wrap">
            <h1 className="text-2xl text-red-500 mb-4 font-bold">🔍 Full User Audit</h1>
            <p className="text-zinc-500 mb-6">This page shows your exact database state. You must be logged in.</p>
            {audit ? JSON.stringify(audit, null, 2) : "Loading..."}

            <div className="mt-8 border-t border-zinc-800 pt-6">
                <a href="/login" className="text-red-500 underline">Go to Login</a>
                {" | "}
                <a href="/feed" className="text-red-500 underline">Go to Feed</a>
            </div>
        </div>
    );
}
