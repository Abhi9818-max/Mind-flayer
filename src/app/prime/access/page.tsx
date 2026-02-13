"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Actually, check imports. standard is next/navigation for app dir.
// I will use next/navigation.

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
// Background noise handled via CSS/Div
// I'll stick to raw classes to be safe, I know globals.css has the noise.

export default function PrimeAccessPage() {
    const [passcode, setPasscode] = useState("");
    const [loading, setLoading] = useState(false);
    // We'll use a simple mock auth for this prototype
    // In real app, this would be a server action verifying against a secure key
    const router = useRouter(); // Error: useRouter is not imported from next/navigation. 
    // I must import it correctly.

    const handleAccess = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800)); // Dramatic delay

        if (passcode === "voight-kampff" || passcode === "admin") { // Secret codes
            // Set a cookie to simulate the role
            document.cookie = "mindflayer-role=prime_sovereign; path=/; max-age=3600";
            // Redirect to dashboard
            window.location.href = "/prime";
        } else {
            alert("Access Denied. The Eye does not see you.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 via-black to-black pointer-events-none" />

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="mb-8 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500/20 to-purple-600/20 mb-4 border border-yellow-500/30 shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]">
                        <span className="text-3xl">👑</span>
                    </div>
                    <h1 className="font-display text-3xl font-bold text-white mb-2 tracking-tight">
                        Prime Access
                    </h1>
                    <p className="text-zinc-500 text-sm uppercase tracking-widest">
                        Restricted Clearance
                    </p>
                </div>

                <Card className="p-1 space-y-0 bg-zinc-900/50 border-white/10 backdrop-blur-xl">
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-400 ml-1">ACCESS CODE</label>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all font-mono tracking-widest text-center"
                                onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
                            />
                        </div>

                        <Button
                            onClick={handleAccess}
                            disabled={loading || !passcode}
                            className="w-full py-4 text-base font-bold tracking-wide relative overflow-hidden group"
                            variant="primary" // Assuming Button has variants, checking memory. Yes, created in previous turn.
                        >
                            {loading ? (
                                <span className="animate-pulse">AUTHENTICATING...</span>
                            ) : (
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    GRANT ACCESS <span className="text-yellow-400 group-hover:translate-x-1 transition-transform">→</span>
                                </span>
                            )}
                            {/* Gold glow implementation since variant might be purple-based */}
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0" />
                        </Button>
                    </div>
                    <div className="bg-black/40 p-4 rounded-b-[inherit] text-center border-t border-white/5">
                        <p className="text-[10px] text-zinc-600 font-mono">
                            ATTEMPTING UNAUTHORIZED ACCESS IS TREASON.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
