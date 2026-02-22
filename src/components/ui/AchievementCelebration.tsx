"use client";

import { useState, useEffect, useCallback } from "react";
import { AchievementDef, EarnedAchievement, achievementService } from "@/lib/services/achievements";

interface AchievementCelebrationProps {
    achievements: (EarnedAchievement & AchievementDef)[];
    onComplete: () => void;
}

export function AchievementCelebration({ achievements, onComplete }: AchievementCelebrationProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<'enter' | 'reveal' | 'idle' | 'exit'>('enter');

    const current = achievements[currentIndex];

    useEffect(() => {
        // Entrance animation timeline
        const t1 = setTimeout(() => setPhase('reveal'), 400);
        const t2 = setTimeout(() => setPhase('idle'), 1600);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [currentIndex]);

    const handleClaim = useCallback(async () => {
        if (!current) return;
        setPhase('exit');

        // Mark as seen
        await achievementService.markSeen(current.id);

        setTimeout(() => {
            if (currentIndex < achievements.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setPhase('enter');
            } else {
                onComplete();
            }
        }, 500);
    }, [current, currentIndex, achievements.length, onComplete]);

    if (!current) return null;

    const rarityLabel = {
        common: 'COMMON',
        rare: 'RARE',
        epic: 'EPIC',
        legendary: 'LEGENDARY',
    };

    const rarityBorder = {
        common: 'border-blue-500/30',
        rare: 'border-purple-500/30',
        epic: 'border-amber-500/30',
        legendary: 'border-red-500/40',
    };

    const rarityGradient = {
        common: 'from-blue-600/20 to-cyan-600/20',
        rare: 'from-purple-600/20 to-pink-600/20',
        epic: 'from-amber-600/20 to-orange-600/20',
        legendary: 'from-red-600/30 to-amber-600/30',
    };

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500
            ${phase === 'exit' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}
        `}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

            {/* Particle effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 rounded-full animate-achievement-particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            backgroundColor: current.glowColor,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Radial glow */}
            <div
                className={`absolute w-[600px] h-[600px] rounded-full transition-all duration-1000 blur-3xl
                    ${phase === 'enter' ? 'scale-0 opacity-0' : 'scale-100 opacity-30'}
                `}
                style={{ backgroundColor: current.glowColor }}
            />

            {/* Main content */}
            <div className={`relative z-10 flex flex-col items-center text-center px-8 max-w-md transition-all duration-700
                ${phase === 'enter' ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'}
            `}>
                {/* Rarity label */}
                <div className={`mb-6 transition-all duration-500 delay-300
                    ${phase === 'enter' ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}
                `}>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase border ${rarityBorder[current.rarity]} bg-gradient-to-r ${rarityGradient[current.rarity]} ${current.color}`}>
                        {rarityLabel[current.rarity]}
                    </span>
                </div>

                {/* Badge icon */}
                <div className={`relative mb-8 transition-all duration-700 delay-200
                    ${phase === 'enter' ? 'opacity-0 scale-50' : phase === 'reveal' ? 'opacity-100 scale-125' : 'opacity-100 scale-100'}
                `}>
                    {/* Outer ring */}
                    <div
                        className="absolute -inset-6 rounded-full border-2 animate-spin-slow"
                        style={{ borderColor: current.glowColor, opacity: 0.3 }}
                    />
                    {/* Inner glow */}
                    <div
                        className="absolute -inset-4 rounded-full animate-pulse"
                        style={{ backgroundColor: current.glowColor, opacity: 0.15 }}
                    />
                    {/* Icon */}
                    <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${rarityGradient[current.rarity]} border ${rarityBorder[current.rarity]} flex items-center justify-center text-6xl shadow-2xl backdrop-blur-sm`}
                        style={{ boxShadow: `0 0 60px ${current.glowColor}` }}
                    >
                        {current.icon}
                    </div>
                </div>

                {/* Title */}
                <h1 className={`text-4xl font-black tracking-tight mb-3 transition-all duration-500 delay-500
                    ${phase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
                    ${current.color}
                `}>
                    {current.title}
                </h1>

                {/* Description */}
                <p className={`text-zinc-400 text-sm leading-relaxed mb-2 transition-all duration-500 delay-700
                    ${phase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
                `}>
                    {current.description}
                </p>

                {/* "Achievement Unlocked" label */}
                <p className={`text-[10px] font-bold tracking-[0.4em] uppercase text-zinc-600 mb-10 transition-all duration-500 delay-700
                    ${phase === 'enter' ? 'opacity-0' : 'opacity-100'}
                `}>
                    ✦ ARTIFACT UNLOCKED ✦
                </p>

                {/* Claim button */}
                <button
                    onClick={handleClaim}
                    className={`group relative px-10 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-500 delay-1000
                        ${phase === 'enter' || phase === 'reveal' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
                        bg-gradient-to-r ${rarityGradient[current.rarity]} border ${rarityBorder[current.rarity]}
                        hover:scale-105 active:scale-95 ${current.color}
                    `}
                    style={{ boxShadow: `0 0 30px ${current.glowColor}` }}
                >
                    <span className="relative z-10">
                        {currentIndex < achievements.length - 1 ? 'Claim & Continue' : 'Claim Artifact'}
                    </span>
                </button>

                {/* Progress indicator */}
                {achievements.length > 1 && (
                    <div className="flex gap-2 mt-6">
                        {achievements.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${i <= currentIndex ? 'w-6' : 'w-2'
                                    }`}
                                style={{
                                    backgroundColor: i <= currentIndex ? current.glowColor : 'rgba(255,255,255,0.1)',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
