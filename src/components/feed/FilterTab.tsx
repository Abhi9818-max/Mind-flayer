import { PostType } from "@/types";

const typeStyles: Record<PostType, string> = {
    confession: 'bg-red-600 text-white shadow-red-600/40',
    rumor: 'bg-amber-600 text-white shadow-amber-600/40',
    crush: 'bg-rose-600 text-white shadow-rose-600/40',
    rant: 'bg-orange-600 text-white shadow-orange-600/40',
    question: 'bg-zinc-600 text-white shadow-zinc-600/40',
};

export function FilterTab({
    active,
    onClick,
    icon,
    label,
    type
}: {
    active: boolean;
    onClick: () => void;
    icon: string;
    label: string;
    type?: PostType;
}) {
    // Active: Full color but cleaner shadow.
    // Inactive: Transparent with subtle border.
    const activeStyle = type ? typeStyles[type] : 'bg-white text-black shadow-white/10';

    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-1.5 px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all duration-300 border
                ${active
                    ? `${activeStyle} shadow-md border-transparent scale-105`
                    : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                }
            `}
        >
            <span className="text-sm opacity-80">{icon}</span>
            <span>{label}</span>
        </button>
    );
}
