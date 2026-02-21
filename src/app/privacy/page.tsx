import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-zinc-300 pb-24">
            <Navbar />
            <main className="max-w-3xl mx-auto px-6 pt-24 space-y-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <Shield className="w-8 h-8 text-rose-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
                        <p className="text-sm text-zinc-500">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="space-y-6 text-sm leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-white">1. The Void Collects Minimally</h2>
                        <p>Mind-Flayer is built on the foundation of pseudonymity. We do not require your real name, phone number, or government ID. We only collect the minimal data necessary to verify your campus affiliation and maintain the integrity of the platform (e.g., your university email address during sign-up).</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-white">2. Your Thoughts, Your Secrets</h2>
                        <p>All confessions, posts, and interactions are stored securely. While they are broadcasted to your campus bubble, your underlying identity remains obscured from other users unless you explicitly choose to reveal it. Our database administrators cannot trivially link your public pseudonymous profile to your real-world identity.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-white">3. Cookies and Telemetry</h2>
                        <p>We use essential cookies for authentication and session management. We also use Vercel Web Analytics to collect anonymized usage data (like page views) to help us improve the platform. We do not sell your data to third-party advertisers.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-white">4. Moderation & Law Enforcement</h2>
                        <p>While we value anonymity, Mind-Flayer is not a sanctuary for illegal activities, harassment, or severe bullying. Content that violates our community guidelines will be purged. In the event of a valid legal subpoena or a credible threat of violence, we will comply with law enforcement and provide any data we have.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-white">5. Deleting Your Existence</h2>
                        <p>You can request the permanent deletion of your account and all associated data at any time through the Settings menu. Once the deletion protocol is initiated, your data will be irrevocably scrubbed from the void.</p>
                    </section>
                </div>

                <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                    <Link href="/" className="text-rose-500 hover:text-rose-400 font-medium text-sm transition-colors">
                        &larr; Return to the Void
                    </Link>
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
