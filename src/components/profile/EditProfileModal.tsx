"use client";

import { useState, useRef } from 'react';
import { UserProfile, updateUserProfile, uploadAvatar } from '@/lib/services/user';
import { useToast } from '@/lib/context/ToastContext';
import { X, Camera, Upload, Loader2, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function EditProfileModal({
    user,
    onClose,
    onUpdate
}: {
    user: UserProfile;
    onClose: () => void;
    onUpdate: () => void;
}) {
    const [displayName, setDisplayName] = useState(user.display_name || "");
    const [voidName, setVoidName] = useState(user.void_name || "");
    const [bio, setBio] = useState(user.bio || "");
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    // File upload refs
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const voidAvatarInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUserProfile({
                display_name: displayName,
                void_name: voidName,
                bio: bio
            });
            showToast({ title: "Profile Updated", message: "Your digital persona has been recalibrated.", type: "success", rank: "secondary" });
            onUpdate();
            onClose();
        } catch (error) {
            showToast({ title: "Update Failed", message: "Could not sync with the Void.", type: "error", rank: "primary" });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'real' | 'void') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        // Optimistic preview could go here

        try {
            const path = `${user.id}/${type}_avatar_${Date.now()}`;
            const publicUrl = await uploadAvatar(file, path);

            await updateUserProfile({
                [type === 'real' ? 'avatar_url' : 'void_avatar']: publicUrl
            });

            showToast({ title: "Avatar Uploaded", message: "Image data assimilated.", type: "success", rank: "secondary" });
            onUpdate(); // Refresh parent to show new image
        } catch (error) {
            showToast({ title: "Upload Failed", message: "Transmission interrupted.", type: "error", rank: "primary" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <h2 className="text-xl font-bold text-white">Edit Persona</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Real Identity Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Real Identity</h3>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="Real Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl">👤</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                                >
                                    <Camera size={20} className="text-white" />
                                </button>
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleAvatarUpload(e, 'real')}
                                />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="text-xs text-zinc-400 block mb-1">Display Name</label>
                                    <input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-red-500/50 outline-none transition-colors"
                                        placeholder="Your Name"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Void Identity Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Void Identity</h3>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                                    {user.void_avatar ? (
                                        <img src={user.void_avatar} alt="Void Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl">🌑</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => voidAvatarInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                                >
                                    <Camera size={20} className="text-white" />
                                </button>
                                <input
                                    type="file"
                                    ref={voidAvatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleAvatarUpload(e, 'void')}
                                />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="text-xs text-zinc-400 block mb-1">Void Alias</label>
                                    <input
                                        value={voidName}
                                        onChange={(e) => setVoidName(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-purple-500/50 outline-none transition-colors font-mono"
                                        placeholder="Secret_Agent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Bio Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Public Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white/30 outline-none transition-colors min-h-[100px] resize-none"
                            placeholder="Share a glimpse of your mind..."
                            maxLength={160}
                        />
                        <div className="text-right text-xs text-zinc-600">
                            {bio.length}/160
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-full font-bold text-sm hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
