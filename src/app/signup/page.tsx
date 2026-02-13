"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { Eye, EyeOff, Mail, Lock, User, MapPin, GraduationCap, Check } from "lucide-react";

const NCR_TERRITORIES = [
    { id: "delhi-central", name: "Delhi Central", icon: "🏛️", colleges: ["DU North Campus", "DU South Campus", "JNU", "Jamia Millia Islamia"] },
    { id: "noida", name: "Noida", icon: "🏙️", colleges: ["Amity University", "JIIT", "GBU", "Sharda University"] },
    { id: "gurgaon", name: "Gurgaon", icon: "🌆", colleges: ["GD Goenka", "Sushant University", "MDU"] },
    { id: "greater-noida", name: "Greater Noida", icon: "🎓", colleges: ["Bennett University", "GL Bajaj", "NIET", "Galgotias"] },
];

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [territory, setTerritory] = useState("");
    const [college, setCollege] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const selectedTerritory = NCR_TERRITORIES.find(t => t.id === territory);

    const validateCollegeEmail = (email: string): boolean => {
        const validDomains = ['.edu', '.edu.in', '.ac.in', 'du.ac.in', 'jnu.ac.in', 'jmi.ac.in', 'amity.edu', 'jiit.ac.in', 'sharda.ac.in', 'bennett.edu.in', 'galgotiasuniversity.edu.in'];
        return validDomains.some(domain => email.toLowerCase().includes(domain));
    };

    const handleNext = () => {
        setError(null);

        if (step === 1) {
            if (!validateCollegeEmail(email)) {
                setError("Please use your college email address");
                return;
            }
            if (password.length < 8) {
                setError("Password must be at least 8 characters");
                return;
            }
            if (password !== confirmPassword) {
                setError("Passwords don't match");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!territory || !college) {
                setError("Please select your territory and college");
                return;
            }
            setStep(3);
        }
    };

    const handleSignup = async () => {
        setError(null);

        if (!username || username.length < 3) {
            setError("Username must be at least 3 characters");
            return;
        }

        setLoading(true);

        try {
            // Using mock auth for now - replace with Supabase later
            const { mockAuth } = await import('@/lib/auth/mockAuth');
            const { data, error: signUpError } = await mockAuth.signUp(email, password, {
                username,
                territory_id: territory,
                college_name: college
            });

            if (signUpError) {
                console.error("Signup error:", signUpError);
                setError(signUpError.message);
            } else if (data) {
                console.log("Signup successful:", data);
                // Skip email verification for mock auth
                router.push("/feed");
            }
        } catch (err) {
            console.error("Unexpected error during signup:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30 flex items-center justify-center px-4 py-12">
            <LiquidBackground />

            <div className="relative z-10 w-full max-w-2xl animate-fade-in-up">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-3xl shadow-lg shadow-red-600/30 group-hover:scale-105 transition-all duration-300 group-hover:shadow-red-600/50">
                        🧠
                    </div>
                </Link>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black mb-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                        Join the Void
                    </h1>
                    <p className="text-zinc-400 text-lg">Create your anonymous identity</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className="flex items-center">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${step >= num
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-lg shadow-red-900/30'
                                : 'bg-white/5 border border-white/10'
                                }`}>
                                {step > num ? (
                                    <Check size={16} className="text-white" />
                                ) : (
                                    <span className="text-sm font-bold">{num}</span>
                                )}
                                <span className="text-xs font-medium hidden sm:inline">
                                    {num === 1 ? 'Account' : num === 2 ? 'Campus' : 'Identity'}
                                </span>
                            </div>
                            {num < 3 && (
                                <div className={`w-12 h-0.5 mx-1 ${step > num ? 'bg-red-500' : 'bg-white/10'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Step 1: Credentials */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-zinc-300">College Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@college.edu.in"
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-600 hover:border-white/20"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">Use your official college email for verification</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-zinc-300">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 8 characters"
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

                            <div>
                                <label className="block text-sm font-medium mb-2 text-zinc-300">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat password"
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-600 hover:border-white/20"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Territory & College */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div>
                                <label className="block text-sm font-medium mb-3 text-zinc-300">Select Your Territory</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {NCR_TERRITORIES.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => { setTerritory(t.id); setCollege(""); }}
                                            className={`p-4 rounded-2xl border transition-all text-left ${territory === t.id
                                                ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-900/20'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <span className="text-3xl mb-2 block">{t.icon}</span>
                                            <span className="font-bold block mb-1">{t.name}</span>
                                            <span className="text-xs text-zinc-500">{t.colleges.length} colleges</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedTerritory && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-sm font-medium mb-2 text-zinc-300">Select Your College</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                        <select
                                            value={college}
                                            onChange={(e) => setCollege(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer hover:border-white/20"
                                        >
                                            <option value="">Choose your college...</option>
                                            {selectedTerritory.colleges.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Username */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-zinc-300">Choose Your Username</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        placeholder="anonymous_student"
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-600 hover:border-white/20"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">This is your public identity. Choose wisely.</p>
                            </div>

                            {/* Summary */}
                            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                                <h3 className="text-sm font-bold mb-4 text-zinc-300">Your Profile</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Email</span>
                                        <span className="text-zinc-200 truncate ml-4">{email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Territory</span>
                                        <span className="text-zinc-200">{selectedTerritory?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">College</span>
                                        <span className="text-zinc-200 truncate ml-4">{college}</span>
                                    </div>
                                    {username && (
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Username</span>
                                            <span className="text-red-400 font-bold">@{username}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in-up">
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="flex-1 py-4 rounded-2xl border border-white/10 hover:bg-white/5 font-bold transition-all active:scale-95"
                            >
                                Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 font-bold transition-all active:scale-95 shadow-lg shadow-red-900/30 hover:shadow-red-900/50"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSignup}
                                disabled={loading}
                                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/30 hover:shadow-red-900/50"
                            >
                                {loading ? "Creating..." : "Enter the Void"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-zinc-500 text-sm mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-red-400 hover:text-red-300 font-medium">
                        Log in
                    </Link>
                </p>

                <p className="text-center text-zinc-600 text-xs mt-4">
                    By signing up, you accept the Visibility Law.
                </p>
            </div>
        </div>
    );
}
