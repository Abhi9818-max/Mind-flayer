"use client";

import { useEffect, useRef } from 'react';
import { Mood, getMoodColors } from '@/lib/utils/sentiment';

type MoodBackgroundProps = {
    mood: Mood;
    intensity: number;
};

/**
 * Dynamic background that adapts to content sentiment
 */
export function MoodBackground({ mood, intensity }: MoodBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = getMoodColors(mood);
        let animationId: number;

        // Particle system
        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            opacity: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.vx = (Math.random() - 0.5) * getMoodSpeed();
                this.vy = (Math.random() - 0.5) * getMoodSpeed();
                this.size = Math.random() * 4 + 2; // Larger particles
                this.opacity = Math.random() * Math.max(0.8, intensity); // Higher base opacity
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Wrap around edges
                if (this.x < 0) this.x = canvas!.width;
                if (this.x > canvas!.width) this.x = 0;
                if (this.y < 0) this.y = canvas!.height;
                if (this.y > canvas!.height) this.y = 0;
            }

            draw() {
                ctx!.fillStyle = `${colors.accent}${Math.floor(this.opacity * 255).toString(16).padStart(2, '0')}`;
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fill();
            }
        }

        function getMoodSpeed() {
            switch (mood) {
                case 'energetic':
                    return 3 + intensity * 2; // Much faster
                case 'melancholic':
                    return 0.5 + intensity * 0.5; // Slower but visible
                case 'mysterious':
                    return 0.8 + intensity * 0.6;
                default:
                    return 0.8;
            }
        }

        // Balanced particle count for performance
        const particleCount = Math.max(40, Math.floor(80 * Math.max(0.5, intensity)));
        const particles: Particle[] = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Animation loop
        function animate() {
            ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            animationId = requestAnimationFrame(animate);
        }

        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [mood, intensity]);

    const colors = getMoodColors(mood);

    // BOOST: Stronger intensity multiplier
    const boostedIntensity = Math.max(0.4, intensity * 1.5);

    return (
        <div className="fixed inset-0 pointer-events-none z-0">
            {/* Gradient overlay - MUCH STRONGER */}
            <div
                className="absolute inset-0 transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${colors.primary}${Math.floor(boostedIntensity * 80).toString(16).padStart(2, '0')}, transparent 60%)`,
                }}
            />

            {/* Particle canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 transition-opacity duration-1000"
                style={{ opacity: Math.max(0.7, boostedIntensity) }}
            />

            {/* Mood-specific effects - Subtle overlays */}
            {mood === 'melancholic' && boostedIntensity > 0.2 && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/15 to-blue-950/30 transition-opacity duration-2000" />
            )}

            {mood === 'energetic' && boostedIntensity > 0.3 && (
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-red-600/15 via-orange-500/15 to-yellow-400/15 transition-opacity duration-2000" />
                </div>
            )}

            {mood === 'mysterious' && boostedIntensity > 0.2 && (
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-violet-900/10 to-transparent transition-opacity duration-2000" />
            )}
        </div>
    );
}
