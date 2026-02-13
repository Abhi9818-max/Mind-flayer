"use client";

import { MessageCircle, Heart, Copy } from "lucide-react";

interface Post {
    id: string;
    image_url?: string; // Optional, might use color blocks for now
    type: "image" | "video" | "text";
}

const MOCK_POSTS: Post[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `post-${i}`,
    type: i % 3 === 0 ? "video" : "image",
    image_url: `https://picsum.photos/seed/${i + 100}/400/400` // Using picsum for placeholder aesthetics
}));

export function PostGrid() {
    return (
        <div className="grid grid-cols-3 gap-0.5 pb-20">
            {MOCK_POSTS.map((post, i) => (
                <div
                    key={post.id}
                    className="aspect-square relative group cursor-pointer overflow-hidden bg-white/5"
                >
                    {/* Placeholder Image/Color */}
                    <img
                        src={post.image_url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />

                    {/* Video Indicator */}
                    {post.type === "video" && (
                        <div className="absolute top-2 right-2 text-white drop-shadow-lg">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M14.016 12 14.016 12 14.016 12Z" /> {/* Mock */}
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                            </svg>
                        </div>
                    )}

                    {/* Multiple Photos Indicator (Mock) */}
                    {i === 2 && (
                        <div className="absolute top-2 right-2 text-white drop-shadow-lg">
                            <Copy size={16} className="fill-white/20" />
                        </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold">
                        <div className="flex items-center gap-1">
                            <Heart className="fill-white" size={18} />
                            <span>{120 + i * 12}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageCircle className="fill-white" size={18} />
                            <span>{12 + i}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
