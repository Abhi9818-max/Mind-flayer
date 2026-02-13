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

    // Check push subscription status on mount
    useEffect(() => {
        const checkPushStatus = async () => {
            const supported = isPushSupported();
            setPushSupported(supported);

            if (supported) {
                const isSubscribed = await isPushSubscribed();
                setPushNotifications(isSubscribed);
            }
        };
        checkPushStatus();
    }, []);

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

    const sections: SettingsSection[] = [
        {
            icon: <User size={20} />,
            title: "Profile Settings",
            description: "Manage your profile information",
            content: (
                <div className="space-y-4">
                    <button className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
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
        {
            icon: <Lock size={20} />,
            title: "Privacy & Safety",
            description: "Control who can see your content",
            content: (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Post Anonymously by Default</h4>
                                <p className="text-sm text-zinc-400">New posts will be anonymous unless changed</p>
                            </div>
                            <button
                                onClick={() => setAnonymousByDefault(!anonymousByDefault)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${anonymousByDefault ? 'bg-red-600' : 'bg-zinc-700'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${anonymousByDefault ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                    </div>
                    <button className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Blocked Users</h4>
                                <p className="text-sm text-zinc-400">Manage blocked accounts</p>
                            </div>
                            <ChevronRight size={20} className="text-zinc-500" />
                        </div>
                    </button>
                </div>
            )
        },
        {
            icon: <Bell size={20} />,
            title: "Notifications",
            description: "Choose what updates you receive",
            content: (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="font-medium">Email Notifications</h4>
                                <p className="text-sm text-zinc-400">Receive updates via email</p>
                            </div>
                            <button
                                onClick={() => setEmailNotifications(!emailNotifications)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${emailNotifications ? 'bg-red-600' : 'bg-zinc-700'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="font-medium">Push Notifications</h4>
                                <p className="text-sm text-zinc-400">Get notified on your device</p>
                            </div>
                            <button
                                onClick={handlePushToggle}
                                disabled={pushLoading}
                                className={`relative w-12 h-6 rounded-full transition-colors ${pushNotifications ? 'bg-red-600' : 'bg-zinc-700'
                                    } ${pushLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="font-medium">Like Notifications</h4>
                                <p className="text-sm text-zinc-400">When someone likes your post</p>
                            </div>
                            <button
                                onClick={() => setLikeNotifications(!likeNotifications)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${likeNotifications ? 'bg-red-600' : 'bg-zinc-700'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${likeNotifications ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Comment Notifications</h4>
                                <p className="text-sm text-zinc-400">When someone comments on your post</p>
                            </div>
                            <button
                                onClick={() => setCommentNotifications(!commentNotifications)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${commentNotifications ? 'bg-red-600' : 'bg-zinc-700'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${commentNotifications ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            icon: <LogOut size={20} />,
            title: "Account",
            description: "Manage your account settings",
            content: (
                <div className="space-y-4">
                    <button className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Change Password</h4>
                                <p className="text-sm text-zinc-400">Update your password</p>
                            </div>
                            <ChevronRight size={20} className="text-zinc-500" />
                        </div>
                    </button>
                    <button className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors border border-white/10 hover:border-red-500/50">
                        <div className="flex items-center gap-3">
                            <LogOut size={20} className="text-red-500" />
                            <div>
                                <h4 className="font-medium text-red-500">Log Out</h4>
                                <p className="text-sm text-zinc-400">Sign out of your account</p>
                            </div>
                        </div>
                    </button>
                    <button className="w-full text-left p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/50">
                        <div className="flex items-center gap-3">
                            <Trash2 size={20} className="text-red-500" />
                            <div>
                                <h4 className="font-medium text-red-500">Delete Account</h4>
                                <p className="text-sm text-red-400">Permanently delete your account and data</p>
                            </div>
                        </div>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen text-white relative selection:bg-red-600/30">
            <LiquidBackground />
            <Suspense fallback={<div className="h-20" />}>
                <Navbar />
            </Suspense>
            <MobileNav />

            <main className="relative z-10 pt-8 lg:pt-24 pb-24 px-4 max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-2">
                        Settings
                    </h1>
                    <p className="text-zinc-400">Manage your preferences and account</p>
                </div>

                <div className="space-y-6">
                    {sections.map((section, i) => (
                        <div
                            key={i}
                            className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 animate-fade-in-up"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
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

            {/* Toast Notification */}
            {toast && (
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
