"use client";

import { TrendingUp, Heart, MessageCircle, Eye, Award, Calendar } from "lucide-react";

interface Stat {
    label: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    color: string;
}

export function StatsPanel({ admirerCount = 12 }: { admirerCount?: number }) {
    const stats: Stat[] = [
        { label: "Total Posts", value: 147, change: "+12 this week", icon: <TrendingUp size={20} />, color: "text-blue-500" },
        { label: "Admirers", value: admirerCount, change: "+3 new", icon: <Heart size={20} />, color: "text-rose-500" },
        { label: "Total Comments", value: 486, change: "+56 this week", icon: <MessageCircle size={20} />, color: "text-green-500" },
        { label: "Post Views", value: "12.4k", change: "+1.2k this week", icon: <Eye size={20} />, color: "text-purple-500" },
    ];

    const level = {
        current: "Campus Legend",
        progress: 78,
        nextLevel: "Void Master"
    };

    // Mock activity data (last 7 days)
    const activityData = [
        { day: "Mon", posts: 3 },
        { day: "Tue", posts: 5 },
        { day: "Wed", posts: 2 },
        { day: "Thu", posts: 7 },
        { day: "Fri", posts: 4 },
        { day: "Sat", posts: 1 },
        { day: "Sun", posts: 6 },
    ];
    const maxPosts = Math.max(...activityData.map(d => d.posts));

    return (
        <div className="space-y-6 px-4 pb-20">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-4 animate-fade-in-up"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className={`mb-2 ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div className="text-2xl font-bold mb-1">{stat.value}</div>
                        <div className="text-xs text-zinc-400 mb-1">{stat.label}</div>
                        {stat.change && (
                            <div className="text-xs text-green-500">{stat.change}</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Campus Rank */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-yellow-500/10">
                        <Award size={24} className="text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{level.current}</h3>
                        <p className="text-sm text-zinc-400">{level.progress}% to {level.nextLevel}</p>
                    </div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-1000"
                        style={{ width: `${level.progress}%` }}
                    />
                </div>
            </div>

            {/* Activity Graph */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="flex items-center gap-3 mb-4">
                    <Calendar size={20} className="text-blue-500" />
                    <h3 className="font-bold">7-Day Activity</h3>
                </div>
                <div className="flex items-end justify-between gap-2 h-32">
                    {activityData.map((data, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-zinc-800 rounded-t-lg relative overflow-hidden" style={{ height: `${(data.posts / maxPosts) * 100}%` }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-red-500 to-orange-500 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }} />
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                                    {data.posts}
                                </div>
                            </div>
                            <div className="text-xs text-zinc-500">{data.day}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Engagement Rate */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <h3 className="font-bold mb-4">Engagement Breakdown</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-zinc-400">Likes</span>
                            <span className="text-sm font-bold">68%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: '68%' }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-zinc-400">Comments</span>
                            <span className="text-sm font-bold">24%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '24%' }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-zinc-400">Shares</span>
                            <span className="text-sm font-bold">8%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '8%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
