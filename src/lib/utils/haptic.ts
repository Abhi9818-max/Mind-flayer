// Haptic feedback utility for mobile devices
// Provides tactile feedback for user interactions

/**
 * Trigger haptic feedback (vibration) on supported devices
 * @param pattern - Vibration pattern: number (ms) or array of [vibrate, pause, vibrate, ...]
 */
export function triggerHaptic(pattern: number | number[] = 10): void {
    // Check if vibration API is supported
    if (!('vibrate' in navigator)) {
        return;
    }

    try {
        navigator.vibrate(pattern);
    } catch (error) {
        // Silently fail if vibration is not supported or blocked
        console.debug('Haptic feedback not available:', error);
    }
}

/**
 * Predefined haptic patterns for common interactions
 */
export const HapticPatterns = {
    /** Light tap - for button presses, selections */
    light: 10,

    /** Medium tap - for toggles, confirmations */
    medium: 20,

    /** Heavy tap - for important actions, errors */
    heavy: 30,

    /** Success pattern - double tap */
    success: [10, 50, 10],

    /** Error pattern - three quick taps */
    error: [10, 30, 10, 30, 10],

    /** Notification - gentle pulse */
    notification: [15, 100, 15],

    /** Like - heart beat pattern */
    like: [10, 30, 20],

    /** Long press - sustained vibration */
    longPress: 50,
} as const;

/**
 * Convenience functions for common haptic feedback
 */
export const haptic = {
    light: () => triggerHaptic(HapticPatterns.light),
    medium: () => triggerHaptic(HapticPatterns.medium),
    heavy: () => triggerHaptic(HapticPatterns.heavy),
    success: () => triggerHaptic(HapticPatterns.success),
    error: () => triggerHaptic(HapticPatterns.error),
    notification: () => triggerHaptic(HapticPatterns.notification),
    like: () => triggerHaptic(HapticPatterns.like),
    longPress: () => triggerHaptic(HapticPatterns.longPress),
};
