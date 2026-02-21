"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Ban, Snowflake, X, Check } from "lucide-react";

interface AccountStatus {
    is_banned: boolean;
    ban_reason: string | null;
    frozen_until: string | null;
    freeze_reason: string | null;
}

type PopupType = 'banned' | 'frozen' | 'unbanned' | 'unfrozen' | null;

export function AccountStatusBanner() {
    const [status, setStatus] = useState<AccountStatus | null>(null);
    const [popup, setPopup] = useState<PopupType>(null);
    const [popupReason, setPopupReason] = useState<string>("");
    const [showCornerIcon, setShowCornerIcon] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkStatus = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select('is_banned, ban_reason, frozen_until, freeze_reason')
            .eq('id', user.id)
            .single();

        if (error || !data) {
            setLoading(false);
            return;
        }

        const isFrozen = data.frozen_until && new Date(data.frozen_until) > new Date();
        const prevState = localStorage.getItem('mf_account_status');

        // Detect status changes
        if (prevState) {
            const prev = JSON.parse(prevState);

            // Was banned, now unbanned
            if (prev.is_banned && !data.is_banned) {
                setPopup('unbanned');
                setPopupReason("Your ban has been lifted. Welcome back!");
                localStorage.setItem('mf_account_status', JSON.stringify({ is_banned: false, was_frozen: false }));
                setStatus(data);
                setLoading(false);
                return;
            }

            // Was frozen, now unfrozen (time expired or admin unfroze)
            if (prev.was_frozen && !isFrozen) {
                setPopup('unfrozen');
                setPopupReason("Your freeze period is over. You can post again!");
                localStorage.setItem('mf_account_status', JSON.stringify({ is_banned: false, was_frozen: false }));
                setStatus(data);
                setLoading(false);
                return;
            }
        }

        // Currently banned — show popup
        if (data.is_banned) {
            localStorage.setItem('mf_account_status', JSON.stringify({ is_banned: true, was_frozen: false }));
            const alreadySeen = sessionStorage.getItem('mf_ban_popup_seen');
            if (!alreadySeen) {
                setPopup('banned');
                setPopupReason(data.ban_reason || "You have violated the community guidelines.");
            } else {
                setShowCornerIcon(true);
            }
        }
        // Currently frozen — show popup
        else if (isFrozen) {
            localStorage.setItem('mf_account_status', JSON.stringify({ is_banned: false, was_frozen: true }));
            const alreadySeen = sessionStorage.getItem('mf_freeze_popup_seen');
            if (!alreadySeen) {
                setPopup('frozen');
                setPopupReason(data.freeze_reason || "Temporarily suspended by admin.");
            } else {
                setShowCornerIcon(true);
            }
        } else {
            localStorage.setItem('mf_account_status', JSON.stringify({ is_banned: false, was_frozen: false }));
        }

        setStatus(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        checkStatus();

        // Poll every 30s to detect unban/unfreeze
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    // Also check if freeze expired while on page
    useEffect(() => {
        if (!status?.frozen_until) return;
        const until = new Date(status.frozen_until).getTime();
        const now = Date.now();
        const remaining = until - now;

        if (remaining > 0 && remaining < 86400000) { // Less than 24h, set a timer
            const timer = setTimeout(() => {
                setPopup('unfrozen');
                setPopupReason("Your freeze period is over. You can post again!");
                setShowCornerIcon(false);
                localStorage.setItem('mf_account_status', JSON.stringify({ is_banned: false, was_frozen: false }));
            }, remaining);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleDismissPopup = () => {
        if (popup === 'banned') {
            sessionStorage.setItem('mf_ban_popup_seen', 'true');
            setShowCornerIcon(true);
        } else if (popup === 'frozen') {
            sessionStorage.setItem('mf_freeze_popup_seen', 'true');
            setShowCornerIcon(true);
        }
        // For unbanned/unfrozen, just close
        setPopup(null);
    };

    if (loading) return null;

    const isFrozen = status?.frozen_until && new Date(status.frozen_until) > new Date();
    const frozenTimeLeft = isFrozen ? getTimeRemaining(new Date(status!.frozen_until!)) : '';

    return (
        <>
            {/* === CENTER POPUP === */}
            {popup && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl" style={{ animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

                        {/* Banned Popup */}
                        {popup === 'banned' && (
                            <div className="bg-gradient-to-b from-zinc-900 to-black border border-red-500/20">
                                <div className="bg-gradient-to-br from-red-600 to-red-900 p-8 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                                        <Ban className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-xl font-black text-white">Account Banned</h2>
                                </div>
                                <div className="p-6">
                                    <div className="bg-red-950/30 border border-red-500/15 rounded-2xl p-4 mb-6">
                                        <p className="text-xs text-red-400/60 font-bold uppercase tracking-wider mb-1">Reason</p>
                                        <p className="text-sm text-red-200/90 leading-relaxed">{popupReason}</p>
                                    </div>
                                    <button
                                        onClick={handleDismissPopup}
                                        className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all active:scale-95"
                                    >
                                        I Understand
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Frozen Popup */}
                        {popup === 'frozen' && (
                            <div className="bg-gradient-to-b from-zinc-900 to-black border border-blue-500/20">
                                <div className="bg-gradient-to-br from-blue-600 to-cyan-800 p-8 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                                        <Snowflake className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
                                    </div>
                                    <h2 className="text-xl font-black text-white">Account Frozen</h2>
                                    <p className="text-sm text-blue-200/80 mt-2">{frozenTimeLeft}</p>
                                </div>
                                <div className="p-6">
                                    <div className="bg-blue-950/30 border border-blue-500/15 rounded-2xl p-4 mb-6">
                                        <p className="text-xs text-blue-400/60 font-bold uppercase tracking-wider mb-1">Reason</p>
                                        <p className="text-sm text-blue-200/90 leading-relaxed">{popupReason}</p>
                                    </div>
                                    <button
                                        onClick={handleDismissPopup}
                                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-95"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Unbanned Popup */}
                        {popup === 'unbanned' && (
                            <div className="bg-gradient-to-b from-zinc-900 to-black border border-green-500/20">
                                <div className="bg-gradient-to-br from-green-600 to-emerald-800 p-8 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                                        <Check className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-xl font-black text-white">You&apos;re Unbanned!</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-zinc-400 text-center mb-6">
                                        Your ban has been lifted by the Supreme Being. You can now post, chat, and interact again.
                                    </p>
                                    <button
                                        onClick={handleDismissPopup}
                                        className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all active:scale-95"
                                    >
                                        Welcome Back!
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Unfrozen Popup */}
                        {popup === 'unfrozen' && (
                            <div className="bg-gradient-to-b from-zinc-900 to-black border border-green-500/20">
                                <div className="bg-gradient-to-br from-teal-600 to-cyan-800 p-8 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                                        <Check className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-xl font-black text-white">You&apos;re Unfrozen!</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-zinc-400 text-center mb-6">
                                        Your freeze period is over. You can post and interact again. Stay cool! ❄️
                                    </p>
                                    <button
                                        onClick={handleDismissPopup}
                                        className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all active:scale-95"
                                    >
                                        Let&apos;s Go!
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === CORNER ICON (after popup dismissed) === */}
            {showCornerIcon && !popup && (
                <div className="fixed bottom-20 right-4 z-50" style={{ animation: 'popIn 0.3s ease-out' }}>
                    {status?.is_banned ? (
                        <button
                            onClick={() => { setPopup('banned'); setPopupReason(status.ban_reason || "Community guidelines violation."); }}
                            className="group w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(153, 27, 27, 0.25))',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                boxShadow: '0 8px 32px rgba(220, 38, 38, 0.2), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(220, 38, 38, 0.1)',
                            }}
                            title="Account Banned — Tap for details"
                        >
                            <Ban className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        </button>
                    ) : isFrozen ? (
                        <button
                            onClick={() => { setPopup('frozen'); setPopupReason(status!.freeze_reason || "Temporarily suspended."); }}
                            className="group w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.2))',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(96, 165, 250, 0.25)',
                                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(59, 130, 246, 0.1)',
                            }}
                            title="Account Frozen — Tap for details"
                        >
                            <Snowflake className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors animate-spin drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" style={{ animationDuration: '4s' }} />
                        </button>
                    ) : null}
                </div>
            )}
        </>
    );
}

function getTimeRemaining(until: Date): string {
    const now = new Date();
    const diff = until.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 48) {
        const days = Math.floor(hours / 24);
        return `${days} days remaining`;
    }
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
}
