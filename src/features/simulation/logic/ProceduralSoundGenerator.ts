import * as Tone from 'tone';

/**
 * ProceduralSoundGenerator
 * 
 * A static Sound Engine that generates UI and Atmospheric audio in real-time.
 * Designed for "Avant-Garde" aesthetic: Organic, randomized, and rich.
 */
export class ProceduralSoundGenerator {
    private static instance: ProceduralSoundGenerator;

    // --- SYNTHS ---
    private clickSynth: Tone.MembraneSynth | null = null;
    private hoverSynth: Tone.NoiseSynth | null = null;
    private successSynth: Tone.PolySynth | null = null;
    private errorSynth: Tone.MonoSynth | null = null;
    private crunchSynth: Tone.NoiseSynth | null = null;
    private jumpSynth: Tone.Synth | null = null;

    // --- FX BUSES ---
    private reverb: Tone.Reverb | null = null;

    // --- AMBIENCE ---
    private windNodes: { noise: Tone.Noise, filter: Tone.Filter, lfo: Tone.LFO, vol: Tone.Volume } | null = null;
    private seaNodes: { noise: Tone.Noise, filter: Tone.Filter, lfo: Tone.LFO, vol: Tone.Volume } | null = null;

    // --- MASTER CHAIN ---
    private limiter: Tone.Limiter | null = null;
    private masterGain: Tone.Gain | null = null;

    private isInitialized = false;

    private constructor() { }

    public static getInstance(): ProceduralSoundGenerator {
        if (!ProceduralSoundGenerator.instance) {
            ProceduralSoundGenerator.instance = new ProceduralSoundGenerator();
        }
        return ProceduralSoundGenerator.instance;
    }

    public async init() {
        if (this.isInitialized) return;

        // 1. Create Master Chain
        this.limiter = new Tone.Limiter(-2).toDestination();
        this.masterGain = new Tone.Gain(1).connect(this.limiter);

        // 2. FX Bus (Reverb for "Epic" sounds)
        this.reverb = new Tone.Reverb({
            decay: 2.5,
            preDelay: 0.1,
            wet: 0.3
        }).connect(this.masterGain);
        // Reverb needs to generate its impulse response
        await this.reverb.generate();

        // 3. Click Synth (The "Thock")
        this.clickSynth = new Tone.MembraneSynth({
            pitchDecay: 0.008,
            octaves: 2,
            oscillator: { type: 'sine' },
            envelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0,
                release: 0.1,
            },
        }).connect(this.masterGain);

        // 4. Hover Synth (The "Pico-Breath")
        // Goal: Extremely subtle air texture, imperceptible if not listening for it.
        this.hoverSynth = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: {
                attack: 0.005, // 5ms (Instant) - Was 0.1
                decay: 0.02,   // 20ms (Snap) - Was 0.05
                sustain: 0,
            },
        });
        const hoverFilter = new Tone.Filter(6000, "highpass").connect(this.masterGain);
        this.hoverSynth.connect(hoverFilter);
        this.hoverSynth.volume.value = -12; // Drop volume significantly

        // 5. Success Synth (The "Chord") - Connected to REVERB
        this.successSynth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 3,
            modulationIndex: 3.5,
            oscillator: { type: "square" },
            envelope: {
                attack: 0.1,
                decay: 2,
                sustain: 0.1,
                release: 2
            },
            modulation: { type: "sine" },
            modulationEnvelope: {
                attack: 0.5,
                decay: 0,
                sustain: 1,
                release: 0.5
            }
        }).connect(this.reverb); // Connect to Reverb Bus
        this.successSynth.volume.value = -6;

        // 6. Error Synth (The "Buzz")
        this.errorSynth = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            filter: {
                Q: 5,
                type: "lowpass",
                rolloff: -24
            },
            envelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.4,
                release: 2
            },
            filterEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.8,
                release: 2,
                baseFrequency: 200,
                octaves: 4,
                exponent: 2
            }
        }).connect(this.masterGain);

        // 7. Crunch Synth (Eating) - Refined (Muffled Crunch)
        // Removed BitCrusher to eliminate digital harshness.
        // Using pure Brown Noise with strict LowPass for "Pillow Bite" texture.
        const crunchFilter = new Tone.Filter(800, "lowpass").connect(this.masterGain);
        this.crunchSynth = new Tone.NoiseSynth({
            noise: { type: 'brown' },
            envelope: {
                attack: 0.02,
                decay: 0.15,
                sustain: 0,
            },
        }).connect(crunchFilter);
        this.crunchSynth.volume.value = -2; // Compensate for low-end energy


        // 8. Jump Synth (Whoosh) - Connected to REVERB
        this.jumpSynth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.05,
                decay: 0.2,
                sustain: 0.1,
                release: 1,
            },
        }).connect(this.reverb); // Connect to Reverb Bus

        // --- AMBIENCE INITIALIZATION ---
        this.initAmbience();

        this.isInitialized = true;
        console.log("🔊 Procedural Sound Engine Initialized (v2 - Reverb Active)");
    }

    private initAmbience() {
        if (!this.masterGain) return;

        // Wind: Pink Noise -> Bandpass Filter (Modulated)
        const windNoise = new Tone.Noise("pink").start();
        const windAutoFilter = new Tone.AutoFilter({
            frequency: 0.1,
            baseFrequency: 200,
            octaves: 2.6,
            depth: 1,
            type: "sine"
        }).start();
        const windVol = new Tone.Volume(-20).connect(this.masterGain);

        // Connect chain: Noise -> Filter -> Volume -> Master
        windNoise.connect(windAutoFilter);
        windAutoFilter.connect(windVol);

        // Keep potential references for control updates (unused right now but kept for state)
        // We actually want manual control, so let's simplify for now to avoid unused LFO warning if we don't map it.
        // But the requirement was to fix unused windNodes.

        this.windNodes = {
            noise: windNoise,
            filter: (windAutoFilter as any), // Cast to fit the rough shape or update type if needed
            lfo: new Tone.LFO(0.1, 100, 400).start(), // Separate LFO if we were doing manual filter
            vol: windVol
        };
        // Note: The AutoFilter has its own LFO. The separate LFO above is just to fill the struct for now.
        // Let's actually use the nodes correctly.

        // RE-DO Wind for cleaner graph:
        windNoise.disconnect();
        windAutoFilter.disconnect();
        // Correct Graph: Noise -> Filter -> Volume -> Master
        // We will modulate the Filter Frequency with an LFO.

        const wFilter = new Tone.Filter(400, "bandpass");
        const wLfo = new Tone.LFO(0.1, 200, 600).start();
        wLfo.connect(wFilter.frequency);
        const wVol = new Tone.Volume(-999).connect(this.masterGain); // Start muted
        windNoise.connect(wFilter).connect(wVol);

        this.windNodes = {
            noise: windNoise,
            filter: wFilter,
            lfo: wLfo,
            vol: wVol
        };

        // Sea: Brown Noise -> Lowpass (Modulated Volume/Filter)
        const seaNoise = new Tone.Noise("brown").start();
        const seaFilter = new Tone.Filter(500, "lowpass");
        // Let's modulate filter freq for "waves coming in and out"
        const seaFilterLfo = new Tone.LFO(0.05, 300, 900).start();
        seaFilterLfo.connect(seaFilter.frequency);

        const seaVol = new Tone.Volume(-999).connect(this.masterGain);
        seaNoise.connect(seaFilter).connect(seaVol);

        this.seaNodes = {
            noise: seaNoise,
            filter: seaFilter,
            lfo: seaFilterLfo,
            vol: seaVol
        };
    }

    private playHumanized(synth: any, note?: any, duration?: any) {
        if (!this.isInitialized) return;

        // 5% Velocity Variation
        const vel = 0.9 + Math.random() * 0.2;

        // 5 Cent Detune Variation
        if ('detune' in synth && synth.detune instanceof Tone.Signal) {
            const detuneAmount = (Math.random() * 10) - 5;
            synth.detune.value = detuneAmount;
        }

        if (synth instanceof Tone.PolySynth) {
            synth.triggerAttackRelease(note, duration, undefined, vel);
        } else if (note) {
            (synth as Tone.Synth).triggerAttackRelease(note, duration, undefined, vel);
        } else {
            (synth as any).triggerAttackRelease(duration, undefined, vel);
        }
    }

    // --- PUBLIC TRIGGERS ---

    public playClick() {
        if (!this.isInitialized) return;
        this.playHumanized(this.clickSynth!, "C1", "16n");
    }

    public playHover() {
        if (!this.isInitialized) return;
        this.playHumanized(this.hoverSynth!, undefined, "64n");
    }

    public playSuccess() {
        if (!this.isInitialized) return;
        // Cmaj9 Chord: C, E, G, B, D
        const chord = ["C4", "E4", "G4", "B4", "D5"];
        this.playHumanized(this.successSynth!, chord, "1m");
    }

    public playError() {
        if (!this.isInitialized) return;
        this.playHumanized(this.errorSynth!, "A1", "8n");
    }

    public playCrunch() {
        if (!this.isInitialized) return;
        this.playHumanized(this.crunchSynth!, undefined, "16n");
    }

    public playJump() {
        if (!this.isInitialized) return;
        this.jumpSynth!.triggerAttack("C2");
        this.jumpSynth!.frequency.rampTo("G2", 0.1);
        this.jumpSynth!.triggerRelease("+0.2");
    }

    public playHeartbeat() {
        if (!this.isInitialized) return;
        this.playHumanized(this.clickSynth!, "A0", "8n");
    }

    public setAmbience(type: 'wind' | 'sea' | 'none') {
        if (!this.isInitialized || !this.windNodes || !this.seaNodes) return;

        // 2-second fade for ambience transitions
        const fadeTime = 2;

        if (type === 'wind') {
            this.windNodes.vol.volume.rampTo(-20, fadeTime);
            this.seaNodes.vol.volume.rampTo(-999, fadeTime);
        } else if (type === 'sea') {
            this.windNodes.vol.volume.rampTo(-999, fadeTime);
            this.seaNodes.vol.volume.rampTo(-20, fadeTime);
        } else {
            this.windNodes.vol.volume.rampTo(-999, fadeTime);
            this.seaNodes.vol.volume.rampTo(-999, fadeTime);
        }
    }

    public setVolume(volume: number) {
        if (this.masterGain) {
            // Linear 0-1 to Decibels? 
            // Tone.Gain usually takes 0-1 for gain factor, or we can use decibels.
            // Let's stick to gain factor for simplicity if volume is 0-1.
            this.masterGain.gain.rampTo(volume, 0.1);
        }
    }
}

export const proceduralSound = ProceduralSoundGenerator.getInstance();
