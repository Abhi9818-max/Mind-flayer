"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

export type ToastType = "success" | "error" | "info" | "loading";
export type ToastRank = "primary" | "secondary";

export interface Toast {
    id: string;
    type: ToastType;
    rank: ToastRank;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (props: Omit<Toast, "id">) => void;
    dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(({ duration = 5000, ...props }: Omit<Toast, "id">) => {
        const id = uuidv4();
        const newToast = { ...props, id, duration };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                dismissToast(id);
            }, duration);
        }
    }, [dismissToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
