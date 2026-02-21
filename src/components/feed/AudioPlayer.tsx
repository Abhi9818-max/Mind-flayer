"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
    src: string; // URL to the audio file
}

export function AudioPlayer({ src }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;

        // CRITICAL: Apply Pitch Shift for Anonymity
        audio.playbackRate = 0.85;
        audio.preservesPitch = false; // Required for pitch shift when changing speed

        audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
        });

        audio.addEventListener('timeupdate', () => {
            const calculatedProgress = (audio.currentTime / audio.duration) * 100;
            setProgress(isNaN(calculatedProgress) ? 0 : calculatedProgress);
        });

        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setProgress(0);
        });

        return () => {
            audio.pause();
            audio.src = "";
        };
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const val = parseFloat(e.target.value);
        const time = (val / 100) * duration;
        audioRef.current.currentTime = time;
        setProgress(val);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-black/40 border border-white/5 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm group hover:border-red-500/20 transition-colors">
            {/* Play Button */}
            <button
                onClick={togglePlay}
                className="h-10 w-10 shrink-0 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20 hover:scale-105 transition-all outline-none focus:ring-2 focus:ring-red-500/50"
            >
                {isPlaying ? <Pause fill="currentColor" size={18} /> : <Play fill="currentColor" size={18} className="translate-x-0.5" />}
            </button>

            <div className="flex-1 flex flex-col justify-center gap-1">
                {/* Visual Fake Waveform */}
                <div className="flex items-center gap-0.5 h-6 opacity-50 overflow-hidden mask-image-linear-to-r">
                    {Array.from({ length: 40 }).map((_, i) => {
                        // Deterministic height based on index (pseudo-random pattern)
                        const height = 30 + ((i * 17 + 31) % 70);
                        return (
                            <div
                                key={i}
                                className={`w-1 rounded-full bg-current transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                                style={{
                                    height: `${height}%`,
                                    animationDelay: `${i * 0.05}s`
                                }}
                            />
                        );
                    })}
                </div>

                {/* Progress Slider */}
                <div className="relative h-1 w-full bg-white/10 rounded-full cursor-pointer group/slider">
                    <div
                        className="absolute h-full bg-red-600 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                </div>

                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                    <span>{formatTime((progress / 100) * duration || 0)}</span>
                    <span className="text-red-500/80 tracking-wider">VOICE_ENCRYPTED</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Mute Toggle */}
            <button
                onClick={toggleMute}
                className="text-zinc-500 hover:text-white transition-colors p-2"
            >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
        </div>
    );
}
