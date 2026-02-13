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
        primary: "bg-accent-gradient text-white shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:-translate-y-0.5 border border-white/10",
        secondary: "bg-zinc-800 text-white border border-white/10 hover:bg-zinc-700 hover:border-white/20 hover:-translate-y-0.5 shadow-lg shadow-black/20",
        ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
        danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 shadow-lg shadow-red-500/10",
        glass: "bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-red-600/10"
    };

    const combinedClassName = `${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`;

    const content = (
        <>
            <span className={`relative z-10 flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {children}
            </span>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {variant === 'primary' && (
                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-out z-0" />
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
