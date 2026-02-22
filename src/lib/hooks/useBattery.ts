"use client";

import { useState, useEffect } from "react";

interface BatteryState {
    level: number;       // 0 to 1
    charging: boolean;
    supported: boolean;
    isMobile: boolean;
}

/**
 * Custom hook for real-time battery monitoring.
 * Uses the Battery Status API (navigator.getBattery).
 */
export function useBattery(): BatteryState {
    const [state, setState] = useState<BatteryState>({
        level: 1,
        charging: false,
        supported: false,
        isMobile: false,
    });

    useEffect(() => {
        // Detect mobile vs desktop
        const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini|IEMobile/i.test(
            navigator.userAgent
        );

        // Check if Battery API is available
        if (!("getBattery" in navigator)) {
            setState(prev => ({ ...prev, supported: false, isMobile }));
            return;
        }

        let battery: any = null;

        const updateBattery = (b: any) => {
            setState({
                level: b.level,
                charging: b.charging,
                supported: true,
                isMobile,
            });
        };

        (navigator as any).getBattery().then((b: any) => {
            battery = b;
            updateBattery(b);

            b.addEventListener("levelchange", () => updateBattery(b));
            b.addEventListener("chargingchange", () => updateBattery(b));
        }).catch(() => {
            setState(prev => ({ ...prev, supported: false, isMobile }));
        });

        return () => {
            if (battery) {
                battery.removeEventListener("levelchange", () => { });
                battery.removeEventListener("chargingchange", () => { });
            }
        };
    }, []);

    return state;
}

/**
 * Returns the battery threshold for entry based on platform.
 * Mobile: 5%, Desktop: 15%
 */
export function getEntryThreshold(isMobile: boolean): number {
    return isMobile ? 0.05 : 0.15;
}

/**
 * Check if the user is eligible to enter the dying room.
 */
export function isEligible(level: number, charging: boolean, isMobile: boolean): boolean {
    const threshold = getEntryThreshold(isMobile);
    return level <= threshold && !charging;
}
