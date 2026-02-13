"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";

interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const chunks = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);

            // Audio Visualization Setup
            const isSafari = typeof (window as any).webkitAudioContext !== "undefined";
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContext();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks.current, { type: "audio/webm" });
                setAudioBlob(blob);
                chunks.current = [];
                onRecordingComplete(blob);

                // Stop visualization
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 30) {
                        stopRecording();
                        return 30;
                    }
                    return prev + 1;
                });
            }, 1000);

            drawVisualizer();

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray as any);

            ctx.clearRect(0, 0, width, height);

            const barWidth = (width / dataArray.length) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < dataArray.length; i++) {
                barHeight = dataArray[i] / 2;

                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#ef4444'); // Red-500
                gradient.addColorStop(1, '#991b1b'); // Red-800

                ctx.fillStyle = gradient;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const togglePreview = () => {
        if (!audioBlob) return;

        if (!audioRef.current) {
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            // Apply pitch shift simulation for preview
            audio.playbackRate = 0.85;
            audio.preservesPitch = false;

            audio.onended = () => setIsPlaying(false);
            audioRef.current = audio;
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 rounded-xl bg-black/40 border border-white/5 w-full">
            {/* Visualizer / Status */}
            <div className="w-full h-16 bg-black/60 rounded-lg flex items-center justify-center relative overflow-hidden border border-white/5">
                {isRecording ? (
                    <canvas ref={canvasRef} width={300} height={64} className="w-full h-full" />
                ) : audioBlob ? (
                    <div className="flex items-center gap-2 text-red-500 font-mono animate-pulse">
                        <span className="text-2xl">REDACTED_AUDIO_FILE</span>
                    </div>
                ) : (
                    <div className="text-zinc-600 text-xs font-mono">READY TO RECORD...</div>
                )}

                {/* Timer Overlay */}
                <div className="absolute top-2 right-2 text-xs font-mono font-bold text-red-500 bg-black/80 px-2 rounded">
                    {formatTime(recordingTime)} / 0:30
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
                {!audioBlob ? (
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`
                            h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-2
                            ${isRecording
                                ? 'bg-red-500/20 text-red-500 border-red-500 scale-110 animate-pulse shadow-red-500/30'
                                : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:scale-105'
                            }
                        `}
                    >
                        {isRecording ? <Square fill="currentColor" size={24} /> : <Mic size={28} />}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={resetRecording}
                            className="h-12 w-12 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all hover:bg-zinc-700"
                        >
                            <Trash2 size={20} />
                        </button>

                        <button
                            onClick={togglePreview}
                            className="h-16 w-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 hover:scale-105 transition-all"
                        >
                            {isPlaying ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} />}
                        </button>

                        <div className="text-xs text-zinc-500 font-mono">
                            PREVIEW (DEMON_MODE)
                        </div>
                    </>
                )}
            </div>

            <p className="text-[10px] text-zinc-500 text-center max-w-xs">
                Your voice will be anonymously pitch-shifted. <br />
                Max duration: 30 seconds.
            </p>
        </div>
    );
}
