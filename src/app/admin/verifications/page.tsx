"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { BadgeCheck, X, Check, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Interface matching user_profiles
interface PendingVerification {
    id: string;
    username: string;
    real_name: string;
    id_card_url: string;
    verification_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    territories: {
        name: string;
    } | null;
}

export default function AdminVerificationsPage() {
    const [pendingUsers, setPendingUsers] = useState<PendingVerification[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<PendingVerification | null>(null);

    // For handling rejection
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionModal, setShowRejectionModal] = useState(false);

    const router = useRouter();

    const fetchPendingUsers = async () => {
        setLoading(true);
        setErrorMsg(null);
        const supabase = createClient();

        console.log("Fetching pending users...");

        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
                id, username, real_name, id_card_url, verification_status, created_at,
                territories ( name )
            `)
            .eq('verification_status', 'pending');

        if (error) {
            console.error("Error fetching users:", error);
            setErrorMsg(error.message);
        } else {
            console.log("Users fetched:", data);
            // @ts-ignore - Supabase types might verify
            setPendingUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleViewIdCard = async (user: PendingVerification) => {
        const supabase = createClient();

        // Create a signed URL because the bucket is private
        const { data, error } = await supabase.storage
            .from('verification-docs')
            .createSignedUrl(user.id_card_url, 3600); // 1 hour link

        if (error) {
            console.error("Error getting signed URL:", error);
            alert("Could not load ID Card: " + error.message);
        } else if (data) {
            setIdCardUrl(data.signedUrl);
            setSelectedUser(user);
        }
    };

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        const supabase = createClient();

        const { error } = await supabase
            .from('user_profiles')
            .update({
                verification_status: 'approved',
                is_verified: true
            })
            .eq('id', userId);

        if (error) {
            console.error("Approval failed:", error);
            alert("Failed to approve user");
        } else {
            // Remove from list
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            if (selectedUser?.id === userId) {
                setSelectedUser(null);
                setIdCardUrl(null);
            }
        }
        setActionLoading(null);
    };

    const handleReject = async () => {
        if (!selectedUser) return;
        setActionLoading(selectedUser.id);
        const supabase = createClient();

        const { error } = await supabase
            .from('user_profiles')
            .update({
                verification_status: 'rejected',
                rejection_reason: rejectionReason
            })
            .eq('id', selectedUser.id);

        if (error) {
            console.error("Rejection failed:", error);
            alert("Failed to reject user");
        } else {
            // Remove from list
            setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setSelectedUser(null);
            setIdCardUrl(null);
            setShowRejectionModal(false);
            setRejectionReason("");
        }
        setActionLoading(null);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white bg-black animate-pulse">Scanning the Void...</div>;
    }

    return (
        <div className="min-h-screen text-white bg-black p-8">
            <LiquidBackground />

            <div className="relative z-10 max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">
                            Supreme Being
                        </h1>
                        <p className="text-zinc-500 mt-2">The Verification Codex</p>
                    </div>
                    <Link href="/feed" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors">
                        Back to Feed
                    </Link>
                </header>

                {errorMsg && (
                    <div className="mb-8 p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200 flex items-center gap-3">
                        <AlertTriangle />
                        <div>
                            <p className="font-bold">Access Denied / Error</p>
                            <p className="text-sm">{errorMsg}</p>
                            <p className="text-xs mt-1 opacity-70">Make sure you are logged in as a 'prime_sovereign'.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* List of Pending Users */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-xl font-bold text-zinc-300 mb-4 flex items-center gap-2">
                            <BadgeCheck className="text-yellow-500" />
                            Pending Requests ({pendingUsers.length})
                        </h2>

                        {pendingUsers.length === 0 ? (
                            <p className="text-zinc-600 italic p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
                                No souls waiting in purgatory.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {pendingUsers.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleViewIdCard(user)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedUser?.id === user.id
                                            ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-900/20'
                                            : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-white">{user.real_name}</span>
                                            <span className="text-xs text-zinc-500">{new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-sm text-zinc-400">@{user.username}</div>
                                        <div className="text-xs text-zinc-500 mt-2">{user.territories?.name || 'Unknown Territory'}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detailed View */}
                    <div className="lg:col-span-2">
                        {selectedUser && idCardUrl ? (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sticky top-8 shadow-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">{selectedUser.real_name}</h2>
                                        <p className="text-zinc-400">Claims to be: <span className="text-white">@{selectedUser.username}</span></p>
                                    </div>
                                    <div className="bg-zinc-800 px-4 py-2 rounded-full text-sm font-mono text-zinc-300">
                                        {selectedUser.territories?.name}
                                    </div>
                                </div>

                                {/* ID Card Preview */}
                                <div className="bg-black/50 border border-zinc-700 rounded-2xl overflow-hidden mb-8 h-[400px] flex items-center justify-center relative">
                                    {idCardUrl.includes('.pdf') ? (
                                        <iframe src={idCardUrl} className="w-full h-full" />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={idCardUrl}
                                            alt="ID Card"
                                            className="max-full max-h-full object-contain"
                                        />
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleApprove(selectedUser.id)}
                                        disabled={actionLoading === selectedUser.id}
                                        className="flex-1 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-black flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <Check className="w-5 h-5" />
                                        {actionLoading === selectedUser.id ? 'Sanctifying...' : 'Approve Soul'}
                                    </button>

                                    <button
                                        onClick={() => setShowRejectionModal(true)}
                                        disabled={actionLoading === selectedUser.id}
                                        className="flex-1 py-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-xl font-bold text-red-400 flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <X className="w-5 h-5" />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-700 p-12 border-2 border-dashed border-zinc-900 rounded-3xl">
                                <Eye className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-xl font-bold">Select a user to judge</p>
                                <p className="text-sm mt-2">Their fate is in your hands</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rejection Modal */}
                {showRejectionModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in-up">
                            <h3 className="text-xl font-bold text-white mb-4">Reject Verification</h3>
                            <p className="text-zinc-400 mb-6 text-sm">Why are you rejecting this soul? This reason will be shown to them.</p>

                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="E.g., ID card blurry, Name mismatch..."
                                className="w-full h-32 bg-black border border-zinc-700 rounded-xl p-4 text-white mb-6 focus:outline-none focus:border-red-500"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectionModal(false)}
                                    className="flex-1 py-3 text-zinc-400 hover:text-white font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
