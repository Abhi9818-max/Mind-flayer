import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <Navbar />

      <main>
        <Hero />
        <Features />

        {/* CTA Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-violet-900/20 to-transparent pointer-events-none" />
          <div className="container mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-8">
              See what you're missing.
            </h2>
            <div className="inline-block p-[2px] rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500">
              <a
                href="/signup"
                className="block px-8 py-4 rounded-2xl bg-black hover:bg-zinc-900 text-white font-bold transition-colors duration-300"
              >
                Join Mind-Flayer Now
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
