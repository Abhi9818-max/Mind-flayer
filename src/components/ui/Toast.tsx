"use client";

import { useEffect, useState } from "react";
import { Check, AlertCircle, Info, Loader2, X } from "lucide-react";
import { Toast, useToast } from "@/lib/context/ToastContext";

const icons = {
    success: <Check className="w-5 h-5 text-green-500" />,
    error: <X className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />,
};

const gradients = {
    success: "from-green-500/10 to-transparent",
    error: "from-red-500/10 to-transparent",
    info: "from-blue-500/10 to-transparent",
    loading: "from-zinc-500/10 to-transparent",
};

const borderColors = {
    success: "border-green-500/20",
    error: "border-red-500/20",
    info: "border-blue-500/20",
    loading: "border-zinc-500/20",
};

export function ToastCard({ toast }: { toast: Toast }) {
    const { dismissToast } = useToast();
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => dismissToast(toast.id), 300);
    };

    useEffect(() => {
        if (!toast.duration) return;
        const interval = setInterval(() => {
            setProgress((prev) => Math.max(0, prev - (100 / (toast.duration! / 100))));
        }, 100);
        return () => clearInterval(interval);
    }, [toast.duration]);

    return (
        <div
            className={`
                relative w-full max-w-sm rounded-xl overflow-hidden glass-panel
                border ${borderColors[toast.type]} shadow-2xl backdrop-blur-xl
                transition-all duration-300 transform
                ${isExiting ? "opacity-0 scale-95 translate-y-2" : "opacity-100 scale-100 translate-y-0"}
                animate-fade-in-up
            `}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradients[toast.type]} opacity-50 pointer-events-none`} />

            <div className="relative p-4 flex gap-4 items-start">
                <div className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-md">
                    {icons[toast.type]}
                </div>

                <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-sm text-zinc-100 pr-4">{toast.title}</h4>
                    {toast.message && (
                        <p className="text-xs text-zinc-400 leading-relaxed max-w-[90%]">
                            {toast.message}
                        </p>
                    )}

                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="mt-3 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/10"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>

                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                    <X size={14} />
                </button>
            </div>

            {toast.duration && toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 h-[2px] bg-zinc-700/50 w-full">
                    <div
                        className={`h-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-white'} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}
