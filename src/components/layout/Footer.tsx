import { Container } from "@/components/ui/Container";

export function Footer() {
    return (
        <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-sm py-12">
            <Container className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="text-lg">🧠</span>
                    <span className="font-medium">Mind-Flayer © 2026</span>
                </div>
                <p className="text-sm text-zinc-500">
                    Built for NCR campuses. All secrets stay in the bubble.
                </p>
            </Container>
        </footer>
    );
}
