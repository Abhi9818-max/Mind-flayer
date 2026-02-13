"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Login button clicked!");
        console.log("Email:", email);

        setError(null);
        setLoading(true);

        try {
            console.log("Attempting login...");
            // Using mock auth for now - replace with Supabase later
            const { mockAuth } = await import('@/lib/auth/mockAuth');
            console.log("Mock auth loaded");

            const { data, error } = await mockAuth.signIn(email, password);
            console.log("Login response:", { data, error });

            if (error) {
                console.error("Login error:", error);
                setError(error.message);
            } else if (data) {
                console.log("Login successful! Redirecting...");
                router.push("/feed");
            } else {
                console.error("No data or error returned");
                setError("Login failed - no response");
            }
        } catch (err) {
            console.error("Unexpected error during login:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            console.log("Login process finished");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30 flex items-center justify-center px-4">
            <LiquidBackground />

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-3xl shadow-lg shadow-red-600/30 group-hover:scale-105 transition-all duration-300 group-hover:shadow-red-600/50">
                        🧠
                    </div>
                </Link>

                {/* Title */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black mb-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                        Welcome Back
                    </h1>
                    <p className="text-zinc-400 text-lg">Enter the void where minds connect</p>
                </div>

                {/* Form Card */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-zinc-300">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@college.edu"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-600 hover:border-white/20"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-zinc-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-12 pr-12 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-600 hover:border-white/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in-up">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/30 hover:shadow-red-900/50"
                        >
                            {loading ? "Entering..." : "Enter the Void"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-zinc-900/50 px-4 text-zinc-500 font-medium">
                                New to Mind-Flayer?
                            </span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <Link
                        href="/signup"
                        className="block w-full py-4 rounded-2xl border border-white/10 hover:bg-white/5 font-bold text-center transition-all active:scale-95"
                    >
                        Create Account
                    </Link>
                </div>

                {/* Footer Note */}
                <p className="text-center text-zinc-600 text-xs mt-8 leading-relaxed">
                    By continuing, you agree to the <span className="text-zinc-400">Visibility Law</span>.<br />
                    All actions are logged. Anonymity is an illusion.
                </p>
            </div>
        </div>
    );
}
