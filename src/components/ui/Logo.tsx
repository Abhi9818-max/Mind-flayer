export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-3 ${className} group`}>
            {/* Tech Construct Icon - "The Node" */}
            <div className="relative flex items-center justify-center w-8 h-8">
                {/* Rotating Ring */}
                <svg viewBox="0 0 24 24" className="w-full h-full absolute text-zinc-800 animate-[spin_10s_linear_infinite]">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" fill="none" />
                </svg>

                {/* Core Hexagon */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600 relative z-10 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                    <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>

            {/* Typography - Technical/Mono */}
            <div className="flex flex-col">
                <span className="font-mono text-base tracking-[-0.05em] text-zinc-100 font-bold group-hover:text-red-500 transition-colors duration-300">
                    MIND_FLAYER
                </span>
                <span className="font-mono text-[9px] text-zinc-600 tracking-widest uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    SYSTEM_ONLINE
                </span>
            </div>
        </div>
    );
}
