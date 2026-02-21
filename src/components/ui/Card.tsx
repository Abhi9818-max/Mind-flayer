import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    glow?: boolean;
    hoverEffect?: boolean;
}

export function Card({ children, className = '', glow = false, hoverEffect = true }: CardProps) {
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            className={`
                spotlight-card rounded-2xl p-6 backdrop-blur-3xl
                ${hoverEffect ? 'transition-transform duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 group' : ''}
                ${className}
            `}
        >
            {glow && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-600/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100 z-0" />
            )}

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
