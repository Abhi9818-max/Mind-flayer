import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    glow?: boolean;
    hoverEffect?: boolean;
}

export function Card({ children, className = '', glow = false, hoverEffect = true }: CardProps) {
    return (
        <div className={`
      relative bg-card-gradient border border-white/5 rounded-2xl p-6 backdrop-blur-xl
      ${hoverEffect ? 'transition-all duration-500 ease-out hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 group' : ''}
      ${className}
    `}>
            {glow && (
                <div className="absolute inset-0 bg-accent-gradient opacity-0 transition-opacity duration-700 group-hover:opacity-5 -z-10 rounded-2xl" />
            )}

            {/* Inner highlight for 3D feel */}
            <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none mix-blend-overlay" />

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
