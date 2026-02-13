
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createPost } from "@/lib/services/posts";
import { AudioRecorder } from "@/components/compose/AudioRecorder";
import { POST_CONFIG, PostType } from "@/types";

export function ComposeModal({ onClose }: { onClose: () => void }) {
    const [content, setContent] = useState("");
    const [type, setType] = useState<PostType>("confession");
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [isRecordingMode, setIsRecordingMode] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim() && !audioBlob) return;

        try {
            setIsSubmitting(true);
            await createPost({
                content,
                type,
                isAnonymous: isAnonymous,
                audioBlob: isRecordingMode ? audioBlob : undefined
            });

            // Reset and close
            setContent("");
            setAudioBlob(null);
            onClose();

            // Refresh feed
            router.refresh();

        } catch (error) {
            console.error("Failed to create post:", error);
            // alert("Failed to post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 sm:p-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <Card className="relative w-full max-w-lg p-0 overflow-hidden shadow-2xl shadow-purple-900/20 animate-fade-in-up border-white/10 !bg-[#0c0c0c]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
                    <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">✨</span> Create Post
                    </h2>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                        ✕
                    </button>
                </div>

                {/* Type Selector */}
                <div className="flex gap-2 overflow-x-auto px-6 py-4 scrollbar-none">
                    {(Object.keys(POST_CONFIG) as PostType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => { setType(t); setIsRecordingMode(false); }}
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-xs font-semibold transition-all duration-200 border
                                ${type === t && !isRecordingMode
                                    ? 'bg-accent-gradient text-white border-transparent shadow-lg shadow-purple-500/20'
                                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                                }
                            `}
                        >
                            <span>{POST_CONFIG[t].icon}</span>
                            <span>{POST_CONFIG[t].label}</span>
                        </button>
                    ))}

                    {/* Voice Note Button */}
                    <button
                        onClick={() => setIsRecordingMode(true)}
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-xs font-semibold transition-all duration-200 border
                            ${isRecordingMode
                                ? 'bg-red-600 text-white border-transparent shadow-lg shadow-red-500/20'
                                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                            }
                        `}
                    >
                        <Mic size={14} />
                        <span>Voice Note</span>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-4">
                    {isRecordingMode ? (
                        <div className="animate-fade-in">
                            <AudioRecorder onRecordingComplete={(blob) => setAudioBlob(blob)} />
                            <div className="mt-4">
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Optional Caption</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Add context to your voice note..."
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-all resize-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={`Share your ${type}...`}
                            rows={5}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-base text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all resize-none"
                        />
                    )}
                </div>

                {/* Options */}
                <div className="px-6 pb-6">
                    <label
                        className="flex items-center gap-3 cursor-pointer group w-fit"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsAnonymous(!isAnonymous);
                        }}
                    >
                        <div className={`relative h-6 w-11 rounded-full transition-all duration-300 ${isAnonymous ? 'bg-purple-600' : 'bg-zinc-700'}`}>
                            <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${isAnonymous ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Post anonymously</span>
                    </label>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-white/5 bg-zinc-900/50">
                    <Button variant="ghost" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isRecordingMode ? !audioBlob : !content.trim() || isSubmitting}
                        className="flex-1"
                    >
                        {isSubmitting ? "Posting..." : "Post"}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
