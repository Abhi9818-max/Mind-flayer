/**
 * Local analytics service - tracks user behavior patterns in localStorage
 * No server telemetry, fully privacy-preserving
 */

type PageVisit = {
    page: string;
    timestamp: number;
    timeOfDay: number; // Hour (0-23)
};

type AnalyticsData = {
    visits: PageVisit[];
    pageFrequency: Record<string, number>;
    timeBasedPatterns: Record<string, number[]>; // page -> [hours visited]
};

const STORAGE_KEY = 'mind_flayer_analytics';
const MAX_VISITS = 1000; // Keep last 1000 visits

/**
 * Get current analytics data
 */
function getAnalytics(): AnalyticsData {
    if (typeof window === 'undefined') {
        return { visits: [], pageFrequency: {}, timeBasedPatterns: {} };
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return { visits: [], pageFrequency: {}, timeBasedPatterns: {} };
        }
        return JSON.parse(stored);
    } catch {
        return { visits: [], pageFrequency: {}, timeBasedPatterns: {} };
    }
}

/**
 * Save analytics data
 */
function saveAnalytics(data: AnalyticsData): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.debug('Failed to save analytics:', error);
    }
}

/**
 * Track a page visit
 */
export function trackPageVisit(page: string): void {
    const now = Date.now();
    const hour = new Date().getHours();

    const analytics = getAnalytics();

    // Add new visit
    const visit: PageVisit = {
        page,
        timestamp: now,
        timeOfDay: hour,
    };

    analytics.visits.push(visit);

    // Trim old visits
    if (analytics.visits.length > MAX_VISITS) {
        analytics.visits = analytics.visits.slice(-MAX_VISITS);
    }

    // Update frequency
    analytics.pageFrequency[page] = (analytics.pageFrequency[page] || 0) + 1;

    // Update time-based patterns
    if (!analytics.timeBasedPatterns[page]) {
        analytics.timeBasedPatterns[page] = [];
    }
    analytics.timeBasedPatterns[page].push(hour);

    saveAnalytics(analytics);
}

/**
 * Get most visited pages (overall)
 */
export function getMostVisitedPages(): Array<{ page: string; count: number }> {
    const analytics = getAnalytics();

    return Object.entries(analytics.pageFrequency)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Get pages most visited at current time of day
 */
export function getPagesForCurrentTime(): Array<{ page: string; score: number }> {
    const currentHour = new Date().getHours();
    const analytics = getAnalytics();

    const scores: Record<string, number> = {};

    for (const [page, hours] of Object.entries(analytics.timeBasedPatterns)) {
        // Count how many times this page was visited in the current hour ±1
        const relevantVisits = hours.filter(h =>
            Math.abs(h - currentHour) <= 1 ||
            Math.abs(h - currentHour) >= 23 // Handle wrap-around (23->0)
        );

        scores[page] = relevantVisits.length;
    }

    return Object.entries(scores)
        .map(([page, score]) => ({ page, score }))
        .sort((a, b) => b.score - a.score);
}

/**
 * Get combined ranking (frequency + time-based)
 */
export function getAdaptivePageRanking(): string[] {
    const mostVisited = getMostVisitedPages();
    const timeRelevant = getPagesForCurrentTime();

    // Combine scores (60% time-based, 40% overall frequency)
    const combinedScores: Record<string, number> = {};

    // Time-based weight
    timeRelevant.forEach(({ page, score }) => {
        combinedScores[page] = score * 0.6;
    });

    // Frequency weight
    mostVisited.forEach(({ page, count }) => {
        combinedScores[page] = (combinedScores[page] || 0) + count * 0.4;
    });

    return Object.entries(combinedScores)
        .sort((a, b) => b[1] - a[1])
        .map(([page]) => page);
}

/**
 * Clear all analytics (for testing/demo purposes)
 */
export function clearAnalytics(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Seed analytics with demo data for immediate testing
 */
export function seedDemoAnalytics(): void {
    const currentHour = new Date().getHours();

    const demoData: AnalyticsData = {
        visits: [],
        pageFrequency: {
            '/feed': 45,
            '/rooms': 32,
            '/explore': 18,
            '/messages': 28,
            '/profile': 12,
        },
        timeBasedPatterns: {
            '/feed': Array(20).fill(currentHour), // Simulate frequent visits right now
            '/rooms': Array(15).fill((currentHour + 2) % 24), // Different time
            '/explore': Array(10).fill(currentHour),
            '/messages': Array(12).fill(currentHour - 1),
            '/profile': Array(5).fill(currentHour - 3),
        },
    };

    saveAnalytics(demoData);
}
