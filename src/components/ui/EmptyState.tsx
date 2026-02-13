import React from 'react';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
            {/* Animated icon container */}
            <div className="relative mb-6">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse" />

                {/* Icon */}
                <div className="relative text-zinc-600 animate-float">
                    {icon}
                </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-zinc-300 mb-2">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-sm text-zinc-500 max-w-sm mb-6">
                    {description}
                </p>
            )}

            {/* Optional action button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-red-600/20"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Predefined empty states for common scenarios
export function EmptyNotifications() {
    return (
        <EmptyState
            icon={
                <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor" opacity="0.3" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.5" />
                </svg>
            }
            title="All caught up!"
            description="No new whispers from the void. You're all up to date."
        />
    );
}

export function EmptyFeed() {
    return (
        <EmptyState
            icon={
                <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3" />
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" opacity="0.5" />
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                </svg>
            }
            title="Nothing here yet"
            description="Be the first to share your thoughts with the void."
        />
    );
}

export function EmptySearch() {
    return (
        <EmptyState
            icon={
                <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                    <circle cx="11" cy="11" r="4" fill="currentColor" opacity="0.2" />
                </svg>
            }
            title="No results found"
            description="Try adjusting your search or filters."
        />
    );
}
