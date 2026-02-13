"use client";

import { PostCard } from "@/components/feed/PostCard";
import { PostType } from "@/types";

interface Post {
    id: string;
    type: PostType | 'voice';
    content: string;
    media_url?: string;
    is_anonymous: boolean;
    like_count: number;
    comment_count: number;
    created_at: string;
}

interface MasonryGridProps {
    posts: Post[];
}

export function MasonryGrid({ posts }: MasonryGridProps) {
    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold mb-2">No posts yet</h3>
                <p className="text-zinc-400 text-sm">Start sharing your thoughts with the world!</p>
            </div>
        );
    }

    return (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4 pb-20 px-4">
            {posts.map((post, i) => (
                <div key={post.id} className="break-inside-avoid mb-4">
                    <PostCard
                        post={post as any}
                        delay={i * 100}
                    />
                </div>
            ))}
        </div>
    );
}
