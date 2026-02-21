"use client";

import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Eye, Ghost, Lock, MapPin, ShieldAlert, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function Features() {
    return (
        <section className="py-32 relative z-10 overflow-hidden">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center max-w-2xl mx-auto mb-20"
                >
                    <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
                        The <span className="text-red-600">Shadow Network</span>
                    </h2>
                    <p className="text-zinc-400 text-lg">
                        Built for silence. Engineered for reach. A completely new way to experience campus life without filters.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.15 }
                        }
                    }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]"
                >
                    {/* Large Item 1 */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }} className="md:col-span-2 h-full">
                        <Card className="h-full relative overflow-hidden group" hoverEffect={false}>
                            <div className="absolute inset-0 bg-violet-600/5 group-hover:bg-violet-600/10 transition-colors duration-500" />
                            <div className="relative z-10 h-full flex flex-col justify-end p-2">
                                <div className="mb-4 w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                                    <Ghost className="w-6 h-6 text-violet-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Ghost Protocol</h3>
                                <p className="text-zinc-400 max-w-sm">
                                    Your identity is cryptographically hashed. Even we don't know who you are. Speak your truth without consequences.
                                </p>
                            </div>
                            {/* Abstract Viz */}
                            <div className="absolute top-10 right-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-500/30 transition-all duration-500" />
                        </Card>
                    </motion.div>

                    {/* Item 2 */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }} className="md:col-span-1 h-full">
                        <Card className="h-full flex flex-col justify-center items-center text-center p-8">
                            <div className="mb-6 w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Geo-Fenced</h3>
                            <p className="text-zinc-500 text-sm">
                                Exclusive to your campus coordinates. Outsiders technically cannot enter.
                            </p>
                        </Card>
                    </motion.div>

                    {/* Item 3 */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }} className="md:col-span-1 h-full">
                        <Card className="h-full flex flex-col justify-between" glow>
                            <div className="w-full flex justify-end">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Real-time Pulse</h3>
                                <p className="text-zinc-500 text-sm">
                                    Live feed of what's happening right now.
                                </p>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Large Item 4 */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }} className="md:col-span-2 h-full">
                        <Card className="h-full relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-black to-zinc-900 z-0" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 h-full">
                                <div className="flex-1">
                                    <div className="mb-4 w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                        <ShieldAlert className="w-6 h-6 text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Karma System</h3>
                                    <p className="text-zinc-400">
                                        Self-moderating communities. Abusers get shadow-banned to the Void. Good vibes get amplified.
                                    </p>
                                </div>
                                {/* Visual Placeholder */}
                                <div className="w-full md:w-1/2 h-32 md:h-full bg-zinc-800/50 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                    <div className="text-xs font-mono text-zinc-600">SYSTEM_MODERATION_ACTIVE</div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </motion.div>
            </Container>
        </section>
    );
}
