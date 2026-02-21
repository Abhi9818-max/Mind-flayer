"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, AlertTriangle, X, Send, EyeOff, Eye } from "lucide-react";
import { createPost } from "@/lib/services/posts";
import { getUserProfile, UserProfile } from "@/lib/services/user";
import { AudioRecorder } from "@/components/compose/AudioRecorder";
import { POST_CONFIG, PostType } from "@/types";
import { useToast } from "@/lib/context/ToastContext";

export function ComposeModal({ onClose, onSuccess }: { onClose: () => void, onSuccess?: () => void }) {
    const { showToast } = useToast();
    const router = useRouter();

    const [content, setContent] = useState("");
    const [type, setType] = useState<PostType>("confession");
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [isRecordingMode, setIsRecordingMode] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Verification state
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
        let mounted = true;
        getUserProfile().then(p => {
            if (mounted) {
                setProfile(p);
                setIsLoadingProfile(false);
            }
        });
        return () => { mounted = false; };
    }, []);

    const isVerified = profile?.verification_status === 'approved';

    // Dynamic header styling based on post type
    const headerDetails: Record<PostType, { title: string, subtitle: string, color: string }> = {
        confession: { title: "Whisper a Confession", subtitle: "Speak your truth into the void.", color: "from-purple-500 to-indigo-500" },
        rumor: { title: "Spread a Rumor", subtitle: "Let the whispers fly across campus.", color: "from-amber-500 to-yellow-500" },
        crush: { title: "Declare a Crush", subtitle: "Secretly admire from afar.", color: "from-pink-500 to-rose-500" },
        rant: { title: "Unleash a Rant", subtitle: "Let the frustration flow.", color: "from-red-500 to-orange-500" },
        question: { title: "Ask the Void", subtitle: "Seek answers from the collective.", color: "from-emerald-500 to-teal-500" },
        voice: { title: "Record Voice Note", subtitle: "Let them hear your actual voice.", color: "from-red-600 to-rose-600" }
    };

    const currentHeader = isRecordingMode ? headerDetails.voice : (headerDetails[type] || headerDetails.confession);

    const handleSubmit = async () => {
        if (!content.trim() && !audioBlob) return;
        if (!isVerified) return;

        try {
            setIsSubmitting(true);
            await createPost({
                content,
                type,
                isAnonymous: isAnonymous,
                audioBlob: isRecordingMode ? audioBlob : undefined
            });

            setContent("");
            setAudioBlob(null);
            onClose();

            if (onSuccess) onSuccess();
            router.refresh();

        } catch (error) {
            console.error("Failed to create post:", error);
            showToast({
                title: "Transmission Failed",
                message: "Your secret could not be whispered to the void.",
                type: "error",
                rank: "secondary"
            });
            setIsSubmitting(false); // only toggle false if error, otherwise unmount happens
        }
    };

    if (isLoadingProfile) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
                    <span className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Verifying Link</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex sm:items-center justify-center items-end p-0 sm:p-4">
            {/* Backdrop with animated subtle glow */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-500"
                onClick={onClose}
            >
                {/* Dynamic radial glow reflecting the current post type */}
                <div
                    className={`absolute inset-0 opacity-20 transition-all duration-1000 bg-gradient-to-tr ${currentHeader.color} [mask-image:radial-gradient(circle_at_center,black_0%,transparent_70%)]`}
                />
            </div>

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-[#0a0a0c]/90 sm:rounded-3xl rounded-t-3xl border sm:border-white/10 border-t-white/10 border-x-transparent border-b-transparent shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] pb-safe animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-400 ease-out sm:mb-0">

                {/* Header Area */}
                <div className="flex items-start justify-between p-6 pb-2 relative z-10">
                    <div>
                        <h2 className={`text-2xl sm:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${currentHeader.color} transition-all duration-500`}>
                            {currentHeader.title}
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">{currentHeader.subtitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-all duration-200 active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {!isVerified ? (
                    <div className="p-8 sm:p-12 text-center flex flex-col items-center flex-1">
                        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                            <AlertTriangle className="text-yellow-500" size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Verification Pending</h3>
                        <p className="text-zinc-400 max-w-sm mb-8 leading-relaxed">
                            To ensure the quality of the Void, you must have a verified college ID to post. Your documents are currently under review by the Supreme Being.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all active:scale-95 border border-white/10"
                        >
                            Return to Feed
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden relative z-10">
                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">

                            {/* Input Region */}
                            <div className="min-h-[160px] sm:min-h-[200px] flex flex-col justify-center">
                                {isRecordingMode ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center py-8">
                                        <AudioRecorder onRecordingComplete={(blob) => setAudioBlob(blob)} />
                                        <div className="w-full max-w-sm mt-8">
                                            <input
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                placeholder="Add an optional caption..."
                                                className="w-full bg-transparent border-b border-white/10 focus:border-red-500/50 py-3 text-center text-white placeholder-zinc-600 focus:outline-none transition-colors text-lg"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder={`Start typing...`}
                                        className="w-full h-full min-h-[160px] sm:min-h-[200px] bg-transparent text-xl sm:text-2xl text-white placeholder-zinc-700/80 focus:outline-none resize-none leading-relaxed transition-all p-2 rounded-xl"
                                        autoFocus
                                    />
                                )}
                            </div>

                            {/* Type Selector (Pills) */}
                            <div className="mt-8">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 block px-2">Select Channel</span>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.keys(POST_CONFIG) as PostType[]).map((t) => {
                                        const isSelected = type === t && !isRecordingMode;
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => { setType(t); setIsRecordingMode(false); }}
                                                className={`
                                                    flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-semibold transition-all duration-300 border
                                                    ${isSelected
                                                        ? 'bg-white text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105'
                                                        : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-white'
                                                    }
                                                `}
                                            >
                                                <span className={isSelected ? "text-black" : "opacity-70"}>{POST_CONFIG[t].icon}</span>
                                                <span>{POST_CONFIG[t].label}</span>
                                            </button>
                                        );
                                    })}

                                    {/* Voice Note Tab */}
                                    <button
                                        onClick={() => setIsRecordingMode(true)}
                                        className={`
                                            flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-semibold transition-all duration-300 border
                                            ${isRecordingMode
                                                ? 'bg-red-600 text-white border-transparent shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-105'
                                                : 'bg-zinc-900/50 text-red-500/60 border-red-500/10 hover:bg-zinc-800 hover:text-red-400'
                                            }
                                        `}
                                    >
                                        <Mic size={16} />
                                        <span>Voice Note</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer / Controls */}
                        <div className="w-full bg-[#0a0a0c] border-t border-white/5 p-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between relative z-20">

                            {/* Left: Anonymity Toggle */}
                            <label
                                className="flex items-center gap-3 cursor-pointer group w-fit select-none"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsAnonymous(!isAnonymous);
                                }}
                            >
                                <div className={`relative h-8 w-14 rounded-full transition-all duration-300 border border-white/10 ${isAnonymous ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-zinc-800'}`}>
                                    <div className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`}>
                                        {isAnonymous ? <EyeOff size={12} className="text-purple-600" /> : <Eye size={12} className="text-zinc-400" />}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold transition-colors ${isAnonymous ? 'text-white' : 'text-zinc-500'}`}>
                                        Anonymous
                                    </span>
                                    <span className="text-[10px] text-zinc-600 leading-none">
                                        {isAnonymous ? 'Identity masked' : 'Identity revealed'}
                                    </span>
                                </div>
                            </label>

                            {/* Right: Post Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isRecordingMode ? !audioBlob : !content.trim() || isSubmitting}
                                className={`
                                    flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-300
                                    ${(isRecordingMode ? audioBlob : content.trim()) && !isSubmitting
                                        ? `bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]`
                                        : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'
                                    }
                                `}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        <span>Transmitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Release</span>
                                        <Send size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
