"use client";

import { useEffect, useState } from "react";
import { getUserProfile, UserProfile } from "@/lib/services/user";
import { AlertCircle, Clock, XCircle } from "lucide-react";

export function VerificationBanner() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                console.log("VerificationBanner: Fetching profile...");
                const p = await getUserProfile();
                console.log("VerificationBanner: Profile result:", p);
                setProfile(p);
            } catch (e) {
                console.error("VerificationBanner: Error", e);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    if (loading || !profile || profile.verification_status === 'approved') return null;

    if (profile.verification_status === 'pending') {
        return (
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-md px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-3 text-yellow-200">
                    <Clock size={20} className="shrink-0 animate-pulse" />
                    <p className="text-sm font-medium">
                        Verification Pending. You can browse, but posting is restricted until your ID is verified.
                    </p>
                </div>
            </div>
        );
    }

    if (profile.verification_status === 'rejected') {
        return (
            <div className="bg-red-500/10 border-b border-red-500/20 backdrop-blur-md px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center gap-3 text-red-200">
                    <XCircle size={20} className="shrink-0" />
                    <div>
                        <p className="text-sm font-bold">Verification Rejected</p>
                        <p className="text-xs opacity-80">{profile.rejection_reason || "Details incorrect."} Contact support.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Default unverified (shouldnt happen after signup flow)
    return (
        <div className="bg-blue-500/10 border-b border-blue-500/20 backdrop-blur-md px-4 py-3">
            <div className="max-w-3xl mx-auto flex items-center gap-3 text-blue-200">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-medium">
                    Account unverified. Please complete your profile.
                </p>
            </div>
        </div>
    );
}
