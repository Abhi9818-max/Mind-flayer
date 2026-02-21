import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
    href?: string;
    children: ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export function Button({
    variant = 'primary',
    href,
    children,
    className = '',
    size = 'md',
    isLoading = false,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base",
    };

    const variants = {
        primary: "bg-white text-black hover:bg-zinc-200 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]",
        secondary: "bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700",
        ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
        danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
        glass: "glass-panel text-white hover:bg-white/10"
    };

    const combinedClassName = `${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`;

    const content = (
        <>
            <span className={`relative z-10 flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {children}
            </span>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                </div>
            )}

            {/* Shimmer Effect */}
            {variant === 'primary' && (
                <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
                    <div className="absolute top-0 left-0 h-full w-[200%] animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full" />
                </div>
            )}
        </>
    );

    if (href && !disabled && !isLoading) {
        return (
            <Link href={href} className={combinedClassName}>
                {content}
            </Link>
        );
    }

    return (
        <button className={combinedClassName} disabled={disabled || isLoading} {...props}>
            {content}
        </button>
    );
}
