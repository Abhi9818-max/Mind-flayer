"use client";

import { useState } from "react";
import { X, Upload } from "lucide-react";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentData: {
        name: string;
        bio: string;
        avatar: string;
    };
    onSave: (data: { name: string; bio: string; avatar: string }) => void;
}

export function EditProfileModal({ isOpen, onClose, currentData, onSave }: EditProfileModalProps) {
    const [name, setName] = useState(currentData.name);
    const [bio, setBio] = useState(currentData.bio);
    const [avatar, setAvatar] = useState(currentData.avatar);
    const [previewUrl, setPreviewUrl] = useState(currentData.avatar);

    if (!isOpen) return null;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreviewUrl(result);
                setAvatar(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave({ name, bio, avatar });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-zinc-900 rounded-3xl border border-white/10 shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden border-2 border-white/10">
                                {previewUrl ? (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        {previewUrl}
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-zinc-500">
                                        👤
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload size={20} className="text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-xs text-zinc-400">Click to change avatar</p>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-red-500/50 transition-colors"
                            placeholder="Enter your name"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                            placeholder="Tell us about yourself..."
                            maxLength={150}
                        />
                        <p className="text-xs text-zinc-500 mt-1">{bio.length}/150</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors font-bold"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
