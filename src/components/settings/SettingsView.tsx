"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Moon, Volume2, VolumeX, Smartphone, Monitor, HardDrive,
    Download, Zap, Shield, Activity
} from 'lucide-react';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { sfx } from '@/lib/sfx';

export function SettingsView() {
    const { isInstallable, promptInstall } = useInstallPrompt();
    const [theme, setTheme] = useState('default');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [notifications, setNotifications] = useState(false);

    const applyTheme = (newTheme: string) => {
        document.body.classList.remove('theme-midnight', 'theme-obsidian');
        if (newTheme !== 'default') {
            document.body.classList.add(`theme-${newTheme}`);
        }
    };

    useEffect(() => {
        // Load preferences
        const savedTheme = localStorage.getItem('theme') || 'default';
        setTheme(savedTheme);
        setSoundEnabled(sfx.isEnabled());

        // Apply initial theme
        applyTheme(savedTheme);
    }, []);

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
        sfx.playClick();
    };

    const toggleSound = () => {
        const newState = sfx.toggle();
        setSoundEnabled(newState);
        if (newState) sfx.playSuccess();
    };

    const toggleNotifications = () => {
        setNotifications(!notifications);
        sfx.playClick();
        // In a real app, this would request permission
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 p-6">

            {/* Neural Link / PWA Banner */}
            {isInstallable && (
                <div className="relative group overflow-hidden rounded-3xl border border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 via-purple-900/40 to-black/40 opacity-50 transition-opacity" />
                    <div className="relative p-6 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white text-black">
                                <Download className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Initialize Neural Link</h3>
                                <p className="text-xs text-zinc-400">Install Mind-Flayer for direct cortical connection.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { sfx.playClick(); promptInstall(); }}
                            className="px-6 py-2.5 bg-white text-black font-bold text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            INSTALL APP
                        </button>
                    </div>
                </div>
            )}

            {/* Visual Cortex (Theme) */}
            <section className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Visual Cortex
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <ThemeCard
                        name="Default"
                        id="default"
                        active={theme === 'default'}
                        onClick={() => handleThemeChange('default')}
                        preview="bg-black border-zinc-800"
                    />
                    <ThemeCard
                        name="Midnight"
                        id="midnight"
                        active={theme === 'midnight'}
                        onClick={() => handleThemeChange('midnight')}
                        preview="bg-slate-950 border-slate-800"
                    />
                    <ThemeCard
                        name="Obsidian"
                        id="obsidian"
                        active={theme === 'obsidian'}
                        onClick={() => handleThemeChange('obsidian')}
                        preview="bg-black border-white/20"
                    />
                </div>
            </section>

            {/* Auditory Cortex (Sound) */}
            <section className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Auditory Feedback
                </h3>
                <div
                    onClick={toggleSound}
                    className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl transition-colors ${soundEnabled ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="font-bold text-white">Interface Sounds</p>
                            <p className="text-xs text-zinc-500">Haptic audio feedback for interactions</p>
                        </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 shrink-0 ${soundEnabled ? 'bg-red-600' : 'bg-zinc-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
            </section>

            {/* Synaptic Relays (Push Notifications) */}
            <section className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Synaptic Relays
                </h3>
                <div
                    onClick={toggleNotifications}
                    className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl transition-colors ${notifications ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-white">Push Notifications</p>
                            <p className="text-xs text-zinc-500">Receive mental projections when away</p>
                        </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 shrink-0 ${notifications ? 'bg-red-600' : 'bg-zinc-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
            </section>

            {/* Protocols & Directives */}
            <section className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Protocols & Directives
                </h3>
                <Link href="/privacy" className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-zinc-800 text-zinc-500">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-white">Privacy Policy</p>
                            <p className="text-xs text-zinc-500">How we handle your data in the void</p>
                        </div>
                    </div>
                </Link>
            </section>

            <div className="text-center text-[10px] font-mono text-zinc-700 pt-8 opacity-50">
                <p>MIND-FLAYER CORE v2.0.0</p>
                <p className="mt-1 tracking-[0.3em]">CONNECTED</p>
            </div>
        </div>
    );
}

function ThemeCard({ name, id, active, onClick, preview }: { name: string, id: string, active: boolean, onClick: () => void, preview: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 overflow-hidden
                ${active ? 'border-red-500 bg-white/5 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'border-white/5 bg-black/40 hover:border-white/10'}
            `}
        >
            <div className={`w-full aspect-video rounded-lg ${preview} shadow-inner bg-gradient-to-br from-transparent to-black/50`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-zinc-500'}`}>
                {name}
            </span>
            {active && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(220,38,38,1)]" />
            )}
        </button>
    );
}
