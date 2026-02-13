"use client";



export function LiquidBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-black pointer-events-none">
            {/* Ambient Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-900/40 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
            <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-rose-900/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
            <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-orange-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />

            {/* Grain Overlay - removed as body has global noise */}
            {/* <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" /> */}

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        </div>
    );
}
