"use client";

import { seedDemoAnalytics, clearAnalytics } from "@/lib/services/analytics";
import { useState } from "react";
import { useToast } from "@/lib/context/ToastContext";

/**
 * Debug component to test adaptive UI
 * Press Ctrl+Shift+D to toggle
 */
export function AdaptiveUIDebug() {
    const { showToast } = useToast();
    const [isVisible, setIsVisible] = useState(false);

    // Toggle visibility with Ctrl+Shift+D
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                setIsVisible(prev => !prev);
            }
        });
    }

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 right-4 z-[100] p-4 bg-black border border-red-500 rounded-lg shadow-xl max-w-xs">
            <h3 className="text-red-500 font-bold mb-2">🧪 Adaptive UI Debug</h3>
            <p className="text-xs text-zinc-400 mb-3">
                Test navigation reordering without waiting for real data
            </p>

            <div className="space-y-2">
                <button
                    onClick={() => {
                        seedDemoAnalytics();
                        showToast({ title: "Debug Mode", message: "Time set to 09:00. Nav reordered.", type: "info", rank: "secondary" });
                    }}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
                >
                    Seed Demo Data
                </button>

                <button
                    onClick={() => {
                        clearAnalytics();
                        showToast({ title: "System Cleared", message: "Analytics data purged.", type: "info", rank: "secondary" });
                    }}
                    className="w-full px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-medium transition-colors"
                >
                    Clear Analytics
                </button>
            </div>

            <p className="text-[10px] text-zinc-500 mt-3">
                Press Ctrl+Shift+D to hide
            </p>
        </div>
    );
}
