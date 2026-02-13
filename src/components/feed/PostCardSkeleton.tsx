import React from 'react';

export function PostCardSkeleton({ delay = 0 }: { delay?: number }) {
    return (
        <div
            className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-6 animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                {/* Avatar skeleton */}
                <div className="h-10 w-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                    {/* Name skeleton */}
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    {/* Time skeleton */}
                    <div className="h-3 w-20 bg-white/5 rounded" />
                </div>
                {/* Type badge skeleton */}
                <div className="h-6 w-24 bg-white/10 rounded-full" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-5/6 bg-white/10 rounded" />
                <div className="h-4 w-4/6 bg-white/10 rounded" />
            </div>

            {/* Actions skeleton */}
            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <div className="h-8 w-16 bg-white/10 rounded-full" />
                <div className="h-8 w-16 bg-white/10 rounded-full" />
                <div className="h-8 w-16 bg-white/10 rounded-full" />
            </div>
        </div>
    );
}

export function PostCardSkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-8">
            {Array.from({ length: count }).map((_, i) => (
                <PostCardSkeleton key={i} delay={i * 100} />
            ))}
        </div>
    );
}
