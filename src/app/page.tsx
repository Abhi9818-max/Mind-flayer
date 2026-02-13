import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-purple-500/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center pt-20">
        {/* Background Orbs */}
        <div className="orb bg-purple-600/20 w-[500px] h-[500px] top-[-100px] left-[-100px] animate-pulse-glow" />
        <div className="orb bg-pink-600/20 w-[400px] h-[400px] bottom-0 right-[-100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="orb bg-indigo-600/20 w-[300px] h-[300px] top-[40%] right-[20%]" />

        <Container className="relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-zinc-300">Now live in Delhi NCR</span>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in-up font-display text-5xl font-bold tracking-tight text-white mb-6 sm:text-7xl lg:text-8xl" style={{ animationDelay: '0.1s' }}>
              Your Campus.<br />
              <span className="text-gradient">Unfiltered.</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up mx-auto max-w-2xl text-lg text-zinc-400 mb-10 leading-relaxed" style={{ animationDelay: '0.2s' }}>
              The anonymous social platform for college students. Share confessions,
              spread rumors, reveal crushes — all within your verified campus bubble.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-4 mb-20" style={{ animationDelay: '0.3s' }}>
              <Button href="/signup" className="min-w-[160px]">
                Enter the Bubble
                <span className="text-xl leading-none">→</span>
              </Button>
              <Button href="#features" variant="secondary" className="min-w-[160px]">
                Learn More
              </Button>
            </div>

            {/* Floating Preview Cards */}
            <div className="animate-fade-in-up flex flex-wrap justify-center gap-4" style={{ animationDelay: '0.4s' }}>
              <PreviewCard
                type="Confession"
                emoji="💝"
                text="I've had a crush on my lab partner for 2 semesters..."
                delay={0}
                color="pink"
              />
              <PreviewCard
                type="Rumor"
                emoji="🗣️"
                text="Heard the canteen is getting a complete renovation this summer!"
                delay={1}
                color="purple"
              />
              <PreviewCard
                type="Rant"
                emoji="🔥"
                text="WiFi in the hostel is absolutely terrible right now 💀"
                delay={2}
                color="orange"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative z-10">
        <Container>
          <div className="mb-20 text-center">
            <h2 className="font-display text-4xl font-bold text-white mb-4 sm:text-5xl">
              Speak freely. Stay <span className="text-gradient">protected</span>.
            </h2>
            <p className="mx-auto max-w-xl text-zinc-400">
              A platform built for authentic campus conversations with zero compromise on safety.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="🎭"
              title="True Anonymity"
              description="Your identity is hidden from other students. Express yourself without fear."
            />
            <FeatureCard
              icon="🏫"
              title="Campus Verified"
              description="Only students with verified college emails can join. Your bubble, your people."
            />
            <FeatureCard
              icon="⚖️"
              title="The Visibility Law"
              description="Invisible moderators ensure safety. Bad actors face the 6-step punishment ladder."
            />
            <FeatureCard
              icon="💬"
              title="Anonymous Chat"
              description="Connect 1-on-1 with post authors. Reveal identities only if both agree."
            />
            <FeatureCard
              icon="🔒"
              title="No Screenshots"
              description="Protected content that stays within the bubble. What happens here, stays here."
            />
            <FeatureCard
              icon="⚡"
              title="Real-time Feed"
              description="See what's happening on campus right now. Never miss the latest tea."
            />
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-32 relative z-10 bg-white/[0.02]">
        <Container>
          <div className="mb-20 text-center">
            <h2 className="font-display text-4xl font-bold text-white mb-4 sm:text-5xl">
              Ready in <span className="text-gradient">3 steps</span>
            </h2>
          </div>

          <div className="mx-auto max-w-3xl space-y-8">
            <StepCard
              number={1}
              title="Verify Your College Email"
              description="Sign up with your official college email. We verify you're a real student."
            />
            <StepCard
              number={2}
              title="Choose Your Territory"
              description="Select your campus. You'll only see posts from your verified bubble."
            />
            <StepCard
              number={3}
              title="Start Posting"
              description="Share confessions, rumors, crushes, and rants. Stay anonymous or go public."
            />
          </div>

          <div className="mt-16 text-center">
            <Button href="/signup" className="min-w-[200px]">
              Get Started Free
            </Button>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}

function PreviewCard({ type, emoji, text, delay, color }: { type: string; emoji: string; text: string; delay: number; color: string }) {
  const getBadgeColor = (c: string) => {
    switch (c) {
      case 'pink': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'purple': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'orange': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  return (
    <div
      className="animate-float w-full max-w-[240px] rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium mb-3 ${getBadgeColor(color)}`}>
        <span>{emoji}</span>
        <span>{type}</span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">
        {text}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <Card glow className="h-full">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
        {icon}
      </div>
      <h3 className="font-display mb-2 text-xl font-bold text-white">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
    </Card>
  );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <Card className="flex items-start gap-6 p-8 transition-transform hover:scale-[1.02]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-gradient text-xl font-bold text-white shadow-lg shadow-purple-500/20">
        {number}
      </div>
      <div>
        <h3 className="font-display mb-2 text-xl font-bold text-white">
          {title}
        </h3>
        <p className="text-base leading-relaxed text-zinc-400">
          {description}
        </p>
      </div>
    </Card>
  );
}
