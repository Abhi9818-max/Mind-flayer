"use client";

import { useState } from "react";
import { Trophy, Skull, Heart, Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";

type WarTab = "toxic" | "wholesome" | "active";

const MOCK_LEADERBOARD = {
    toxic: [
        { rank: 1, name: "North Campus", score: 98, trend: "up", color: "text-red-500" },
        { rank: 2, name: "South Campus", score: 92, trend: "down", color: "text-orange-500" },
        { rank: 3, name: "DTU", score: 88, trend: "same", color: "text-yellow-500" },
        { rank: 4, name: "IIT Delhi", score: 75, trend: "up", color: "text-zinc-400" },
        { rank: 5, name: "JNU", score: 60, trend: "down", color: "text-zinc-500" },
    ],
    wholesome: [
        { rank: 1, name: "SRCC", score: 95, trend: "up", color: "text-pink-500" },
        { rank: 2, name: "St. Stephens", score: 90, trend: "same", color: "text-purple-500" },
        { rank: 3, name: "LSR", score: 85, trend: "up", color: "text-blue-400" },
        { rank: 4, name: "Miranda House", score: 80, trend: "down", color: "text-zinc-400" },
        { rank: 5, name: "Hindu College", score: 72, trend: "up", color: "text-zinc-500" },
    ],
    active: [
        { rank: 1, name: "Amity Noida", score: "12.5k", trend: "up", color: "text-green-500" },
        { rank: 2, name: "North Campus", score: "10.2k", trend: "up", color: "text-green-400" },
        { rank: 3, name: "IP University", score: "8.1k", trend: "down", color: "text-zinc-400" },
        { rank: 4, name: "Jamia", score: "6.5k", trend: "same", color: "text-zinc-500" },
        { rank: 5, name: "NSUT", score: "5.2k", trend: "up", color: "text-zinc-600" },
    ]
};

export function CampusWars() {
    const [activeTab, setActiveTab] = useState<WarTab>("toxic");

    const getTabIcon = (tab: WarTab) => {
        switch (tab) {
            case "toxic": return <Skull size={18} />;
            case "wholesome": return <Heart size={18} />;
            case "active": return <Activity size={18} />;
        }
    };

    const getTabColor = (tab: WarTab) => {
        switch (activeTab) {
            case "toxic": return "bg-red-600 shadow-red-600/20";
            case "wholesome": return "bg-pink-600 shadow-pink-600/20";
            case "active": return "bg-green-600 shadow-green-600/20";
        }
        return "bg-zinc-800";
    };

    return (
        <Card className="p-0 overflow-hidden border-white/5 bg-[#0c0c0c]">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-900/10 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-600/20 rounded-lg text-red-500">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <h2 className="font-display text-xl font-bold text-white leading-none">Campus Wars</h2>
                        <p className="text-xs text-red-400/80 font-mono mt-1 tracking-wider uppercase">Live Battleground</p>
                    </div>
                </div>
                <div className="animate-pulse flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live Updates</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-2 overflow-x-auto scrollbar-none border-b border-white/5 bg-black/20">
                {(["toxic", "wholesome", "active"] as WarTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300
                            ${activeTab === tab
                                ? `${getTabColor(tab)} text-white shadow-lg scale-[1.02]`
                                : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'
                            }
                        `}
                    >
                        {getTabIcon(tab)}
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="divide-y divide-white/5">
                {MOCK_LEADERBOARD[activeTab].map((campus, i) => (
                    <div
                        key={campus.name}
                        className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-black font-mono border border-white/5
                                ${i === 0 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]' :
                                    i === 1 ? 'bg-zinc-400/20 text-zinc-400' :
                                        i === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-white/5 text-zinc-600'}
                            `}>
                                {campus.rank}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{campus.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                                        {/* eslint-disable-next-line react-hooks/purity */}
                                        <div
                                            className={`h-full rounded-full ${activeTab === 'toxic' ? 'bg-red-500' : activeTab === 'wholesome' ? 'bg-pink-500' : 'bg-green-500'}`}
                                            style={{ width: `${typeof campus.score === 'number' ? campus.score : Math.random() * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={`text-lg font-black font-display ${campus.color}`}>
                                {campus.score}
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-end gap-1 ${campus.trend === 'up' ? 'text-green-500' : campus.trend === 'down' ? 'text-red-500' : 'text-zinc-600'}`}>
                                {campus.trend === 'up' ? '▲ Trending' : campus.trend === 'down' ? '▼ Falling' : '• Stable'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 text-center border-t border-white/5 bg-white/[0.02]">
                <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
                    View Global Rankings →
                </button>
            </div>
        </Card>
    );
}
