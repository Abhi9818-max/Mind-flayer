import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", label, error, containerClassName = "", ...props }, ref) => {
        return (
            <div className={`flex flex-col gap-2 ${containerClassName}`}>
                {label && (
                    <label className="text-sm font-medium text-zinc-400 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <input
                        ref={ref}
                        className={`
              w-full glass-panel rounded-xl px-4 py-3
              text-zinc-200 placeholder:text-zinc-600 outline-none
              transition-all duration-300
              focus:bg-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 focus:shadow-[0_0_20px_rgba(229,9,20,0.3)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""}
              ${className}
            `}
                        {...props}
                    />
                    {/* Glow effect on focus */}
                    <div className="absolute inset-0 rounded-xl bg-red-500/5 opacity-0 transition-opacity duration-300 pointer-events-none peer-focus:opacity-100" />
                </div>
                {error && (
                    <p className="text-xs text-red-400 ml-1 animate-slide-down">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
