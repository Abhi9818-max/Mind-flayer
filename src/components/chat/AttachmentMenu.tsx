import { Image, FileText, MapPin, Mic, BarChart2 } from "lucide-react";
import { useState } from "react";

export type AttachmentType = 'image' | 'document' | 'audio' | 'location' | 'poll';

interface AttachmentMenuProps {
    onSelect: (type: AttachmentType) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function AttachmentMenu({ onSelect, isOpen, onClose }: AttachmentMenuProps) {
    if (!isOpen) return null;

    const options = [
        { id: 'image', icon: <Image size={24} />, label: 'Gallery', bg: 'bg-indigo-500' },
        { id: 'document', icon: <FileText size={24} />, label: 'Document', bg: 'bg-blue-500' },
        { id: 'audio', icon: <Mic size={24} />, label: 'Audio', bg: 'bg-orange-500' },
        { id: 'location', icon: <MapPin size={24} />, label: 'Location', bg: 'bg-emerald-500' },
        { id: 'poll', icon: <BarChart2 size={24} />, label: 'Poll', bg: 'bg-teal-500' },
    ];

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute bottom-20 left-4 z-50 bg-zinc-800/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10 animate-fade-in-up">
                <div className="grid grid-cols-3 gap-4">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => onSelect(opt.id as AttachmentType)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${opt.bg} transition-transform group-hover:scale-110 active:scale-95 shadow-lg`}>
                                {opt.icon}
                            </div>
                            <span className="text-[11px] text-zinc-300 font-medium tracking-wide">
                                {opt.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
