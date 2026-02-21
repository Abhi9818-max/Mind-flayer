"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, MessageCircle, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
    const [textIndex, setTextIndex] = useState(0);
    const words = ["Anonymous.", "Unfiltered.", "Verified.", "Yours."];

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % words.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32">
            {/* Ambient Background */}
            {/* Ambient Background - Removed Mist for Clean Grid */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/80 pointer-events-none" />

            <Container className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center lg:text-left space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-widest">System_Active :: Delhi_NCR</span>
                    </div>

                    <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-medium tracking-tight text-white leading-[0.9]">
                        Your Campus.<br />
                        <span className="text-zinc-500 block h-[1.2em]">
                            {words[textIndex]}
                        </span>
                    </h1>

                    <p className="text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                        The anonymous social network for college students.
                        Share confessions, spill tea, and connect with your campus bubble.
                        <span className="text-zinc-200 font-medium"> Zero tracking. 100% encrypted.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <Button href="/signup" size="lg" className="min-w-[160px] group">
                            Enter the Void
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button href="/login" variant="ghost" size="lg">
                            Login
                        </Button>
                    </div>

                    <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-xs font-bold ring-2 ring-black/50">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-zinc-500 font-mono">
                            <span className="text-white font-bold">4,021</span> users active
                        </div>
                    </div>
                </motion.div>

                {/* Right Visuals - Floating Cards */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="relative hidden lg:block h-[600px] w-full perspective-1000"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
                        {/* Card 1 - Back */}
                        <Card className="absolute top-[-60px] right-[-40px] w-72 rotate-6 opacity-60 scale-90 blur-[2px] z-0">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><Zap size={16} /></div>
                                <span className="text-xs font-bold text-red-400">RUMOR</span>
                            </div>
                            <p className="text-sm text-zinc-300">Heard the Dean is resigning next week... 👀</p>
                        </Card>

                        {/* Card 2 - Main */}
                        <Card glow className="relative z-10 w-80 shadow-2xl shadow-red-900/20 animate-float">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 font-bold">?</div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Anonymous</div>
                                        <div className="text-xs text-zinc-500">IIT Delhi • 2m ago</div>
                                    </div>
                                </div>
                                <Shield className="w-4 h-4 text-zinc-600" />
                            </div>
                            <p className="text-base text-zinc-200 leading-relaxed mb-4">
                                I've had a crush on the girl who sits in the front row of CS101 for the entire semester. She has a sticker of a cat on her laptop.
                            </p>
                            <div className="flex items-center gap-4 text-zinc-500 text-xs font-medium">
                                <span className="flex items-center gap-1 text-red-400"><MessageCircle size={14} /> 12 Comments</span>
                                <span>🚀 48 Upvotes</span>
                            </div>
                        </Card>

                        {/* Card 3 - Front */}
                        <Card className="absolute bottom-[-80px] left-[-20px] w-72 -rotate-3 opacity-80 z-20 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-white/10 text-white"><Lock size={16} /></div>
                                <span className="text-xs font-bold text-white">SECRET</span>
                            </div>
                            <p className="text-sm text-zinc-300">I actually love the hostel food but I can't say it out loud.</p>
                        </Card>
                    </div>
                </motion.div>
            </Container>
        </section>
    );
}
