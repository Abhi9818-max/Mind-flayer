import { PostType } from '@/types';

/**
 * Post type color configuration
 * Provides consistent color theming across the app
 */
export const POST_TYPE_COLORS = {
    confession: {
        primary: '#a855f7',      // purple-500
        light: '#c084fc',        // purple-400
        dark: '#7e22ce',         // purple-700
        glow: 'rgba(168, 85, 247, 0.3)',
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        hover: 'hover:border-purple-500/50',
    },
    crush: {
        primary: '#ec4899',      // pink-500
        light: '#f472b6',        // pink-400
        dark: '#be185d',         // pink-700
        glow: 'rgba(236, 72, 153, 0.3)',
        border: 'border-pink-500/30',
        bg: 'bg-pink-500/10',
        text: 'text-pink-400',
        hover: 'hover:border-pink-500/50',
    },
    rumor: {
        primary: '#f97316',      // orange-500
        light: '#fb923c',        // orange-400
        dark: '#c2410c',         // orange-700
        glow: 'rgba(249, 115, 22, 0.3)',
        border: 'border-orange-500/30',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        hover: 'hover:border-orange-500/50',
    },
    rant: {
        primary: '#ef4444',      // red-500
        light: '#f87171',        // red-400
        dark: '#b91c1c',         // red-700
        glow: 'rgba(239, 68, 68, 0.3)',
        border: 'border-red-500/30',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        hover: 'hover:border-red-500/50',
    },
    question: {
        primary: '#3b82f6',      // blue-500
        light: '#60a5fa',        // blue-400
        dark: '#1d4ed8',         // blue-700
        glow: 'rgba(59, 130, 246, 0.3)',
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        hover: 'hover:border-blue-500/50',
    },
    voice: {
        primary: '#8b5cf6',      // violet-500
        light: '#a78bfa',        // violet-400
        dark: '#6d28d9',         // violet-700
        glow: 'rgba(139, 92, 246, 0.3)',
        border: 'border-violet-500/30',
        bg: 'bg-violet-500/10',
        text: 'text-violet-400',
        hover: 'hover:border-violet-500/50',
    },
} as const;

/**
 * Get color configuration for a post type
 */
export function getPostTypeColor(type: PostType) {
    return POST_TYPE_COLORS[type] || POST_TYPE_COLORS.confession;
}

/**
 * Get Tailwind classes for post type styling
 */
export function getPostTypeClasses(type: PostType) {
    const colors = getPostTypeColor(type);
    return {
        border: colors.border,
        bg: colors.bg,
        text: colors.text,
        hover: colors.hover,
    };
}
