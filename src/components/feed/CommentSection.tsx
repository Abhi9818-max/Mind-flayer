"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Comment {
    id: string;
    author: string;
    avatar: string;
    content: string;
    timestamp: string;
    isAnonymous: boolean;
}

const MOCK_COMMENTS: Comment[] = [
    {
        id: "1",
        author: "Anonymous",
        avatar: "🕵️",
        content: "This is so relatable! keeping up appearances is exhausting.",
        timestamp: "1h ago",
        isAnonymous: true,
    },
    {
        id: "2",
        author: "Rohan K.",
        avatar: "👨‍💻",
        content: "Don't stress too much about it. Grades aren't everything.",
        timestamp: "30m ago",
        isAnonymous: false,
    },
];

export function CommentSection({
    postId,
    onClose,
}: {
    postId: string;
    onClose: () => void;
}) {
    const [comments, setComments] = useState(MOCK_COMMENTS);
    const [newComment, setNewComment] = useState("");

    const handleSend = () => {
        if (!newComment.trim()) return;
        const comment: Comment = {
            id: Date.now().toString(),
            author: "You",
            avatar: "🧠",
            content: newComment,
            timestamp: "Just now",
            isAnonymous: true,
        };
        setComments([comment, ...comments]);
        setNewComment("");
    };

    return (
        <div className="overflow-hidden bg-black/40 border-t border-white/5 animate-slide-down">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/5">
                <h3 className="font-display text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <span>💬</span> Comments <span className="text-zinc-500">({comments.length})</span>
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Comments List */}
            <div className="max-h-[400px] overflow-y-auto p-4 space-y-4 dark-scrollbar">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 group">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/5 text-sm shadow-sm">
                            {comment.avatar}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-zinc-300">
                                    {comment.author}
                                </span>
                                <span className="text-[10px] text-zinc-600">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                {comment.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white/5 mx-4 mb-4 rounded-xl border border-white/5">
                <div className="relative flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newComment.trim()}
                        className="text-red-500 font-bold text-xs uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:text-red-400 transition-colors"
                    >
                        Post
                    </button>
                </div>
            </div>

            <style jsx>{`
        .dark-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .dark-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        @keyframes slide-down {
          from { height: 0; opacity: 0; }
          to { height: auto; opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
        </div>
    );
}
