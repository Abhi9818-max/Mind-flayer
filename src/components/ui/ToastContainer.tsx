"use client";

import { useToast } from "@/lib/context/ToastContext";
import { ToastCard } from "./Toast";
import { useEffect, useState } from "react";

export function ToastContainer() {
    const { toasts } = useToast();
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    // Filter Logic
    const centerToasts = toasts.filter(t => t.rank !== "secondary");
    const cornerToasts = toasts.filter(t => t.rank === "secondary");

    if (toasts.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {/* Center Container */}
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center p-4 gap-4 pointer-events-none">
                {centerToasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto animate-float-up">
                        <ToastCard toast={toast} />
                    </div>
                ))}
            </div>

            {/* Bottom-Right Container */}
            <div className="absolute bottom-0 right-0 p-6 pb-24 lg:pb-6 flex flex-col items-end gap-3 pointer-events-none">
                {cornerToasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto animate-slide-left">
                        <ToastCard toast={toast} />
                    </div>
                ))}
            </div>
        </div>
    );
}
