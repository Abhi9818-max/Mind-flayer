class SoundEngine {
    private ctx: AudioContext | null = null;
    private enabled: boolean = true;
    private initialized: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem('sfx-enabled');
            this.enabled = savedState !== 'false';
        }
    }

    private init() {
        if (!this.initialized && typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.initialized = true;
            }
        }
    }

    public isEnabled() {
        return this.enabled;
    }

    public setEnabled(value: boolean) {
        this.enabled = value;
        if (typeof window !== 'undefined') {
            localStorage.setItem('sfx-enabled', String(value));
        }
    }

    public toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    public playPop() {
        // High-pitched "pop" for likes (bubble sound)
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Frequency sweep for "bloop" effect
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    public playSuccess() {
        // Nice major chord arpeggio
        if (!this.enabled) return;
        this.init(); // Ensure init is called
        if (!this.ctx) return;

        const now = 0;
        setTimeout(() => this.playTone(523.25, 'sine', 0.3, 0.1), 0);   // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.3, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.6, 0.1), 200); // G5
    }

    public playError() {
        // Low buzzing error
        this.playTone(150, 'sawtooth', 0.3, 0.1);
    }

    public playClick() {
        // Subtle UI click
        this.playTone(1200, 'sine', 0.05, 0.05);
    }
}

export const sfx = new SoundEngine();
