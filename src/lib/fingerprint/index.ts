// Fingerprinting utilities for the Visibility Law
// Generates UserHash and DeviceHash for tracking

import { BehaviorSignature, TimePattern } from '@/types';

/**
 * Generate a unique user hash from identifying information
 * This is used to track users pseudonymously
 */
export function generateUserHash(
    email: string,
    userId: string,
    salt: string
): string {
    // In production, use crypto.subtle or a proper hashing library
    const data = `${email}:${userId}:${salt}`;
    return hashString(data);
}

/**
 * Generate a device hash from browser/device fingerprint
 */
export function generateDeviceHash(fingerprint: DeviceFingerprint): string {
    const data = JSON.stringify({
        ua: fingerprint.userAgent,
        lang: fingerprint.language,
        tz: fingerprint.timezone,
        screen: fingerprint.screenResolution,
        platform: fingerprint.platform,
    });
    return hashString(data);
}

/**
 * Collect device fingerprint from browser
 */
export function collectDeviceFingerprint(): DeviceFingerprint {
    if (typeof window === 'undefined') {
        return {
            userAgent: 'server',
            language: 'en',
            timezone: 'UTC',
            screenResolution: '0x0',
            platform: 'server',
        };
    }

    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        platform: navigator.platform,
    };
}

/**
 * Initialize behavior signature for a new user
 */
export function initBehaviorSignature(): BehaviorSignature {
    return {
        avg_session_duration: 0,
        preferred_post_types: [],
        activity_hours: [],
        interaction_patterns: [],
    };
}

/**
 * Initialize time pattern for a new user
 */
export function initTimePattern(): TimePattern {
    const now = new Date().toISOString();
    return {
        first_seen: now,
        last_active: now,
        typical_active_hours: [],
        timezone_offset: new Date().getTimezoneOffset(),
    };
}

/**
 * Update behavior signature based on user action
 */
export function updateBehaviorSignature(
    current: BehaviorSignature,
    action: UserAction
): BehaviorSignature {
    const updated = { ...current };

    // Update activity hours
    const hour = new Date().getHours();
    if (!updated.activity_hours.includes(hour)) {
        updated.activity_hours = [...updated.activity_hours, hour].slice(-24);
    }

    // Update preferred post types
    if (action.type === 'post' && action.postType) {
        if (!updated.preferred_post_types.includes(action.postType)) {
            updated.preferred_post_types = [
                ...updated.preferred_post_types,
                action.postType
            ].slice(-5);
        }
    }

    // Update interaction patterns
    updated.interaction_patterns = [
        ...updated.interaction_patterns,
        action.type
    ].slice(-50);

    return updated;
}

/**
 * Simple string hash function
 * In production, use crypto.subtle.digest or bcrypt
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    // Convert to hex and pad
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `mf_${hexHash}`;
}

// Types for fingerprinting
interface DeviceFingerprint {
    userAgent: string;
    language: string;
    timezone: string;
    screenResolution: string;
    platform: string;
}

interface UserAction {
    type: 'post' | 'like' | 'comment' | 'chat' | 'view';
    postType?: string;
    timestamp?: string;
}
