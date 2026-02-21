"use client";

import { Suspense, useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import { User, Lock, Bell, LogOut, Trash2, ChevronRight } from "lucide-react";
import {
    enablePushNotifications,
    disablePushNotifications,
    isPushSubscribed,
    isPushSupported,
    getNotificationPermission,
} from "@/lib/services/pushNotifications";

interface SettingsSection {
    icon: React.ReactNode;
    title: string;
    description: string;
    content: React.ReactNode;
}

export default function SettingsPage() {
    const [anonymousByDefault, setAnonymousByDefault] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushSupported, setPushSupported] = useState(true);
    const [likeNotifications, setLikeNotifications] = useState(true);
    const [commentNotifications, setCommentNotifications] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Show toast notification
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // State for Edit Profile Modal
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null); // Replace 'any' with UserProfile type

    // Handle push notification toggle
    const handlePushToggle = async () => {
        if (pushLoading) return;

        if (!pushSupported) {
            showToast('Push notifications are not supported in this browser', 'error');
            return;
        }

        setPushLoading(true);
        try {
            if (pushNotifications) {
                // Disable push notifications
                const success = await disablePushNotifications();
                if (success) {
                    setPushNotifications(false);
                    showToast('Push notifications disabled', 'success');
                } else {
                    showToast('Failed to disable push notifications', 'error');
                }
            } else {
                // Enable push notifications
                const success = await enablePushNotifications();
                if (success) {
                    setPushNotifications(true);
                    showToast('🔔 Push notifications enabled! You\'ll receive notifications even when the app is closed.', 'success');
                } else {
                    const permission = getNotificationPermission();
                    if (permission === 'denied') {
                        showToast('Notification permission denied. Please enable it in your browser settings.', 'error');
                    } else {
                        showToast('Failed to enable push notifications. Please try again.', 'error');
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling push notifications:', error);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setPushLoading(false);
        }
    };

    useEffect(() => {
        // Fetch profile for editing
        async function fetchProfile() {
            const profile = await import('@/lib/services/user').then(m => m.getUserProfile());
            if (profile) setUserProfile(profile);
        }
        fetchProfile();
    }, []);

    const sections: SettingsSection[] = [
        {
            icon: <User size={20} />,
            title: "Profile Settings",
            description: "Manage your profile information",
            content: (
                <div className="space-y-4">
                    <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Edit Profile</h4>
                                <p className="text-sm text-zinc-400">Update your bio, avatar, and username</p>
                            </div>
                            <ChevronRight size={20} className="text-zinc-500" />
                        </div>
                    </button>
                </div>
            )
        },
        // ... (other sections unchanged)
        // ...
    ];

    // ... (rest of return unchanged until end)

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30">
            {/* ... (existing JSX) ... */}

            {/* ... Main Content ... */}
            <main className="relative z-10 pt-8 lg:pt-24 pb-24 px-4 max-w-3xl mx-auto">
                {/* ... (headers and sections loop) ... */}
                <div className="space-y-6">
                    {sections.map((section, i) => (
                        <div
                            key={i}
                            className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 animate-fade-in-up"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            {/* ... section content ... */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                    {section.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{section.title}</h2>
                                    <p className="text-sm text-zinc-400">{section.description}</p>
                                </div>
                            </div>
                            {section.content}
                        </div>
                    ))}
                </div>
            </main>

            {/* Edit Profile Modal */}
            {isEditProfileOpen && userProfile && (
                <div className="fixed inset-0 z-50">
                    {/* Dynamic Import to avoid SSR issues if any */}
                    {(() => {
                        const { EditProfileModal } = require('@/components/profile/EditProfileModal');
                        return <EditProfileModal
                            user={userProfile}
                            onClose={() => setIsEditProfileOpen(false)}
                            onUpdate={async () => {
                                const profile = await import('@/lib/services/user').then(m => m.getUserProfile());
                                if (profile) setUserProfile(profile);
                            }}
                        />;
                    })()}
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                // ... (toast JSX)
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
                    <div className={`px-6 py-3 rounded-xl backdrop-blur-xl border shadow-2xl max-w-md ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-100' :
                        toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-100' :
                            'bg-blue-500/20 border-blue-500/50 text-blue-100'
                        }`}>
                        <p className="text-sm font-medium text-center">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
