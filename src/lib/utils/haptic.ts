// Haptic feedback utility for mobile devices
// Provides tactile feedback for user interactions

/**
 * Trigger haptic feedback (vibration) on supported devices
 * @param pattern - Vibration pattern: number (ms) or array of [vibrate, pause, vibrate, ...]
 */
export function triggerHaptic(pattern: number | number[] | readonly number[] = 10): void {
    // Check if vibration API is supported
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
        return;
    }

    try {
        if (Array.isArray(pattern)) {
            navigator.vibrate([...pattern]);
        } else if (typeof pattern === 'number') {
            navigator.vibrate(pattern);
        }
    } catch (error) {
        // Silently fail if vibration is not supported or blocked
        console.debug('Haptic feedback not available:', error);
    }
}

/**
 * Predefined haptic patterns for common interactions
 */
export const HapticPatterns = {
    // === Basic Patterns ===
    /** Light tap - for button presses, selections */
    light: 10,

    /** Medium tap - for toggles, confirmations */
    medium: 20,

    /** Heavy tap - for important actions, errors */
    heavy: 30,

    /** Long press - sustained vibration */
    longPress: 50,

    // === Feedback Patterns ===
    /** Success pattern - double tap */
    success: [10, 50, 10],

    /** Error pattern - three quick taps */
    error: [10, 30, 10, 30, 10],

    /** Notification - gentle pulse */
    notification: [15, 100, 15],

    /** Like - heart beat pattern */
    like: [10, 30, 20],

    // === Z-Friction Contextual Patterns ===
    /** Whisper - subtle single tap for DMs and private messages */
    whisper: 5,

    /** Shout - strong triple-burst for mentions and alerts */
    shout: [30, 50, 30, 50, 30],

    /** Secret - heartbeat pattern for anonymous confessions */
    secret: [10, 100, 10, 100, 10],

    /** Discovery - rising intensity for new nearby content */
    discovery: [5, 30, 10, 30, 15, 30, 20],

    /** Mysterious - slow pulsing for The Void content */
    mysterious: [15, 150, 20, 150, 15],

    /** Urgent - rapid triple burst for urgent notifications */
    urgent: [40, 30, 40, 30, 40],
} as const;

/**
 * Convenience functions for common haptic feedback
 */
export const haptic = {
    // Basic patterns
    light: () => triggerHaptic(HapticPatterns.light),
    medium: () => triggerHaptic(HapticPatterns.medium),
    heavy: () => triggerHaptic(HapticPatterns.heavy),
    longPress: () => triggerHaptic(HapticPatterns.longPress),

    // Feedback patterns
    success: () => triggerHaptic(HapticPatterns.success),
    error: () => triggerHaptic(HapticPatterns.error),
    notification: () => triggerHaptic(HapticPatterns.notification),
    like: () => triggerHaptic(HapticPatterns.like),

    // Z-Friction contextual patterns
    whisper: () => triggerHaptic(HapticPatterns.whisper),
    shout: () => triggerHaptic(HapticPatterns.shout),
    secret: () => triggerHaptic(HapticPatterns.secret),
    discovery: () => triggerHaptic(HapticPatterns.discovery),
    mysterious: () => triggerHaptic(HapticPatterns.mysterious),
    urgent: () => triggerHaptic(HapticPatterns.urgent),
};
