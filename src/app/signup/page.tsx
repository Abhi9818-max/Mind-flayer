"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { Eye, EyeOff, Mail, Lock, User, MapPin, GraduationCap, Check, Upload, BadgeCheck, FileText } from "lucide-react";

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

    // Step 4: Verification
    const [realName, setRealName] = useState("");
    const [idFile, setIdFile] = useState<File | null>(null);

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
        } else if (step === 3) {
            if (!username || username.length < 3) {
                setError("Username must be at least 3 characters");
                return;
            }
            setStep(4);
        }
    };

    const handleSignup = async () => {
        setError(null);

        if (!realName || !idFile) {
            setError("Please provide your real name and ID card");
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            // Get the UUID for the selected college
            const { TERRITORY_IDS } = await import('@/lib/constants/territories');

            // Cast strictly to ensure type safety
            const territoryId = TERRITORY_IDS[college as keyof typeof TERRITORY_IDS];

            if (!territoryId) {
                throw new Error("Invalid college selection");
            }

            // 1. Sign Up
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        territory_id: territoryId,
                        college_name: college,
                    },
                },
            });

            if (signUpError) {
                console.error("Signup error:", signUpError);
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            if (data.user) {
                console.log("Signup successful. User ID:", data.user.id);
                console.log("Session present?", !!data.session);

                // FORCE LOGIN if session is missing (common with auto-confirm triggers)
                if (!data.session) {
                    console.log("No session returned. Attempting auto-login...");
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });

                    if (signInError) {
                        console.error("Auto-login failed:", signInError);
                        setError("Account created, but auto-login failed. Please log in manually.");
                        setLoading(false);
                        return;
                    }
                    console.log("Auto-login successful!", !!signInData.session);
                }

                console.log("Uploading ID...");

                // 2. Upload ID Card
                const fileExt = idFile.name.split('.').pop();
                const fileName = `${data.user.id}/id_card.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('verification-docs')
                    .upload(fileName, idFile);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    // Continue anyway, user can re-upload later or we verify manually? 
                    // Ideally check error.
                    setError("Account created but ID upload failed. Please contact support.");
                    // But we proceed for now
                }

                // 3. Update Profile with Verification Info
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update({
                        display_name: realName,
                        void_name: username, // Explicitly save username as void_name too
                        real_name: realName, // Keep legacy field if needed by RLS
                        id_card_url: fileName,
                        verification_status: 'pending'
                    })
                    .eq('id', data.user.id);

                if (updateError) {
                    console.error("Profile update error:", updateError);
                }

                // Redirect to feed
                router.push("/feed");
                router.refresh();
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
                    {[1, 2, 3, 4].map((num) => (
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
                                    {num === 1 ? 'Account' : num === 2 ? 'Campus' : num === 3 ? 'Identity' : 'Verify'}
                                </span>
                            </div>
                            {num < 4 && (
                                <div className={`w-8 h-0.5 mx-1 ${step > num ? 'bg-red-500' : 'bg-white/10'}`} />
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
                                <label className="block text-sm font-medium mb-2 text-zinc-300">Choose Your Void Alias</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        placeholder="Sector_7_Lurker"
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-600 hover:border-white/20"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">This is your <strong>Anonymous Identity</strong>. Visible when you post anonymously.</p>
                            </div>

                            {/* Summary Preview */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-sm font-bold mb-4 text-zinc-300">Your Identities</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">College</span>
                                        <span className="text-zinc-200 truncate ml-4">{college}</span>
                                    </div>
                                    {username && (
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Void Alias</span>
                                            <span className="text-white font-bold">@{username}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Verification */}
                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
                                <div className="flex items-start gap-4">
                                    <BadgeCheck className="text-red-500 flex-shrink-0" size={24} />
                                    <div>
                                        <h3 className="font-bold text-red-200 mb-1">Identity Verification</h3>
                                        <p className="text-sm text-red-200/70 leading-relaxed">
                                            This data is <strong>never</strong> shared publicly. It is only used by the Supreme Being to verify you belong to {college}.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-zinc-300">Real Identity (Hidden)</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                    <input
                                        type="text"
                                        value={realName}
                                        onChange={(e) => setRealName(e.target.value)}
                                        placeholder="As on your ID card"
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-600 hover:border-white/20"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">Visible <strong>only</strong> when you toggle off "Anonymous" on a post.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-zinc-300">Upload College ID</label>
                                <div className="relative group">
                                    <div className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${idFile
                                        ? 'border-green-500/50 bg-green-500/10'
                                        : 'border-zinc-700 bg-black/30 hover:border-zinc-500 hover:bg-black/50'
                                        }`}>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />

                                        {idFile ? (
                                            <div className="text-center animate-pulse">
                                                <BadgeCheck className="w-10 h-10 text-green-500 mb-3 mx-auto" />
                                                <p className="text-green-200 font-medium">{idFile.name}</p>
                                                <p className="text-xs text-green-200/60 mt-1">{(idFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="w-10 h-10 text-zinc-500 mb-3 mx-auto group-hover:text-zinc-300 transition-colors" />
                                                <p className="text-zinc-400 font-medium group-hover:text-zinc-200">Tap to upload ID Card</p>
                                                <p className="text-xs text-zinc-600 mt-1">JPG, PNG or PDF (Max 5MB)</p>
                                            </div>
                                        )}
                                    </div>
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

                        {step < 4 ? (
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
                                {loading ? "Verifying..." : "Submit for Verification"}
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
