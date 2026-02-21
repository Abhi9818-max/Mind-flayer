/**
 * Lightweight sentiment analysis for mood detection
 * No external APIs - pure keyword-based analysis
 */

export type Mood = 'melancholic' | 'energetic' | 'mysterious' | 'neutral';

export type SentimentResult = {
    mood: Mood;
    intensity: number; // 0-1
};

// Keyword dictionaries
const MOOD_KEYWORDS = {
    melancholic: [
        'sad', 'depressed', 'lonely', 'crying', 'tears', 'heartbroken', 'miss', 'lost',
        'empty', 'dark', 'alone', 'hurt', 'pain', 'sorry', 'regret', 'broken',
        'heavy', 'tired', 'exhausted', 'numb', 'cold', 'rain', 'grey'
    ],
    energetic: [
        'excited', 'amazing', 'awesome', 'love', 'happy', 'hyped', 'yes', 'win',
        'party', 'fire', 'lit', 'vibes', 'energy', 'celebration', 'pumped',
        'lets go', 'omg', 'wow', 'incredible', 'best', 'perfect', 'legendary'
    ],
    mysterious: [
        'secret', 'anonymous', 'hidden', 'whisper', 'confession', 'shadow', 'mystery',
        'unknown', 'curious', 'wondering', 'strange', 'weird', 'suspect', 'rumor',
        'heard', 'supposedly', 'allegedly', 'someone', 'they say', 'void', 'night'
    ],
};

/**
 * Analyze text sentiment and return mood + intensity
 */
export function analyzeSentiment(text: string): SentimentResult {
    if (!text || text.trim().length === 0) {
        return { mood: 'neutral', intensity: 0 };
    }

    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    // Count keyword matches for each mood
    const scores = {
        melancholic: 0,
        energetic: 0,
        mysterious: 0,
    };

    for (const mood in MOOD_KEYWORDS) {
        const keywords = MOOD_KEYWORDS[mood as keyof typeof MOOD_KEYWORDS];
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                scores[mood as keyof typeof scores]++;
            }
        }
    }

    // Check for ALL CAPS (indicates high energy)
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.3) {
        scores.energetic += 2;
    }

    // Check for multiple punctuation (excitement indicators)
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    if (exclamationCount > 1) scores.energetic += exclamationCount;
    if (questionCount > 2) scores.mysterious += questionCount;

    // Check for ellipsis (mysterious/melancholic indicator)
    if (text.includes('...')) {
        scores.mysterious += 1;
        scores.melancholic += 1;
    }

    // Find dominant mood
    let dominantMood: Mood = 'neutral';
    let maxScore = 0;

    for (const mood in scores) {
        const score = scores[mood as keyof typeof scores];
        if (score > maxScore) {
            maxScore = score;
            dominantMood = mood as Mood;
        }
    }

    // Calculate intensity (0-1)
    // Cap max score at 5 for reasonable intensity range
    const intensity = Math.min(maxScore / 5, 1);

    // If no strong sentiment, return neutral
    if (maxScore === 0 || intensity < 0.2) {
        return { mood: 'neutral', intensity: 0 };
    }

    return {
        mood: dominantMood,
        intensity,
    };
}

/**
 * Get mood-specific color palette
 */
export function getMoodColors(mood: Mood): {
    primary: string;
    secondary: string;
    accent: string;
} {
    switch (mood) {
        case 'melancholic':
            return {
                primary: '#1e3a8a', // deep blue
                secondary: '#3b82f6', // blue
                accent: '#60a5fa', // light blue
            };
        case 'energetic':
            return {
                primary: '#dc2626', // red
                secondary: '#f59e0b', // amber
                accent: '#fbbf24', // yellow
            };
        case 'mysterious':
            return {
                primary: '#581c87', // deep purple
                secondary: '#7c3aed', // purple
                accent: '#a78bfa', // light purple
            };
        case 'neutral':
        default:
            return {
                primary: '#18181b', // zinc-900
                secondary: '#27272a', // zinc-800
                accent: '#3f3f46', // zinc-700
            };
    }
}
