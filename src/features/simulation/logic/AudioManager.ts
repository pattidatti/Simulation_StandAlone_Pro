import * as Tone from 'tone';
import { MUSIC_PLAYLIST } from '../data/musicData';
import { proceduralSound } from './ProceduralSoundGenerator';

class AudioManager {
    private static instance: AudioManager;
    private sfxVolume: number = 0.5;
    private musicVolume: number = 0.3;
    private currentMusic: HTMLAudioElement | null = null;
    private currentMusicKey: string | null = null;

    private playlist: string[] = [];
    private playlistIndex: number = 0;
    private isPlaylistActive: boolean = false;
    private ignoredTracks: Set<string> = new Set();

    private isMuffledState: boolean = false;
    private activeFades: Map<HTMLAudioElement, number> = new Map();
    private audioContextResumed: boolean = false;

    private constructor() {
        const savedSfx = localStorage.getItem('sim_sfx_volume');
        const savedMusic = localStorage.getItem('sim_music_volume');
        const savedMuffled = localStorage.getItem('sim_music_muffled');
        const savedIgnored = localStorage.getItem('sim_music_ignored');

        if (savedSfx) this.sfxVolume = parseFloat(savedSfx);
        if (savedMusic) this.musicVolume = parseFloat(savedMusic);
        if (savedMuffled) this.isMuffledState = savedMuffled === 'true';
        if (savedIgnored) {
            try {
                this.ignoredTracks = new Set(JSON.parse(savedIgnored));
            } catch (e) {
                console.error("Failed to parse ignored tracks", e);
            }
        }

        // Initialize playlist from data
        this.playlist = MUSIC_PLAYLIST.map(t => t.id);
        this.shufflePlaylist();

        // 3. Visibility API Integration (Anti-Pollution)
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    Tone.Destination.mute = true;
                    if (this.currentMusic) this.currentMusic.muted = true;
                } else {
                    Tone.Destination.mute = false;
                    if (this.currentMusic) this.currentMusic.muted = false;
                }
            });
        }
    }

    private shufflePlaylist() {
        this.playlist = this.playlist.sort(() => Math.random() - 0.5);
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * Centralized Resume Handler
     * Ensures AudioContext is running and procedural engine is ready.
     * Must be called on user interaction.
     */
    public async resume() {
        if (this.audioContextResumed && Tone.context.state === 'running') return;

        try {
            await Tone.start();
            await proceduralSound.init();

            // Sync initial volume
            proceduralSound.setVolume(this.sfxVolume);

            this.audioContextResumed = true;
            console.log("🔊 Audio Engine Resumed");
        } catch (e) {
            console.warn("Audio Resume Failed (Autoplay blocked?)", e);
        }
    }

    public setSfxVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('sim_sfx_volume', this.sfxVolume.toString());

        // Reactive Gain Binding
        if (this.audioContextResumed) {
            proceduralSound.setVolume(this.sfxVolume);
        }
    }

    public setMusicVolume(volume: number) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('sim_music_volume', this.musicVolume.toString());
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
    }

    public setMuffled(muffled: boolean) {
        this.isMuffledState = muffled;
        localStorage.setItem('sim_music_muffled', muffled.toString());
        // Logic for muffling Tone.js master output could be added here if desired
        // e.g. proceduralSound.setMuffled(muffled)
    }

    public playSfx(key: string) {
        // Auto-Resume / Self-Healing
        if (Tone.context.state !== 'running') {
            Tone.context.resume().catch(() => { });
            // If strictly suspended, we might rely on the GameButton explicit resume,
            // but let's try.
        }

        if (!this.audioContextResumed) {
            // Try to boot if not booted
            this.resume().catch(e => console.warn("Auto-resume failed", e));
            // Don't return yet, let it try to play if Tone is somehow ready
        }

        // Legacy Map & Delegation
        const normalizedKey = key.toLowerCase();

        if (normalizedKey.includes('click')) {
            proceduralSound.playClick();
        } else if (normalizedKey.includes('hover') || normalizedKey.includes('toggle')) {
            proceduralSound.playHover();
        } else if (normalizedKey.includes('success') || normalizedKey.includes('level')) {
            proceduralSound.playSuccess();
        } else if (normalizedKey.includes('error') || normalizedKey.includes('fail')) {
            proceduralSound.playError();
        } else if (normalizedKey.includes('coin') || normalizedKey.includes('cash') || normalizedKey.includes('money')) {
            proceduralSound.playCoin();
        } else if (normalizedKey.includes('confirm')) {
            proceduralSound.playConfirm();
        } else if (normalizedKey.includes('eat') || normalizedKey.includes('consume')) {
            proceduralSound.playCrunch();
        } else if (normalizedKey.includes('jump')) {
            proceduralSound.playJump();
        } else if (normalizedKey.includes('heartbeat')) {
            proceduralSound.playHeartbeat();
        } else {
            // Fallback: If unknown key, default to click? 
            // Or try to parse intent? 
            // For now, let's just log and play click as fallback for safety.
            // console.warn(`Unknown SFX key: ${key}, playing default click.`);
            proceduralSound.playClick();
        }
    }

    // --- MUSIC CONTROLS (Keep existing logic mostly, but simplified) ---

    public startPlaylist() {
        if (this.isPlaylistActive && this.currentMusic) return;
        this.isPlaylistActive = true;
        if (!this.currentMusic) {
            this.playNextInPlaylist();
        }
    }

    public playNextInPlaylist() {
        if (!this.isPlaylistActive) return;
        let attempts = 0;
        while (attempts < this.playlist.length) {
            this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
            const trackId = this.playlist[this.playlistIndex];
            if (!this.ignoredTracks.has(trackId)) {
                this.playMusic(trackId, 2000, false);
                return;
            }
            attempts++;
        }
        // Fallback if all ignored
        this.playMusic(this.playlist[0], 2000, false);
    }

    public playPreviousInPlaylist() {
        if (!this.isPlaylistActive) return;
        let attempts = 0;
        while (attempts < this.playlist.length) {
            this.playlistIndex = (this.playlistIndex - 1 + this.playlist.length) % this.playlist.length;
            const trackId = this.playlist[this.playlistIndex];
            if (!this.ignoredTracks.has(trackId)) {
                this.playMusic(trackId, 2000, false);
                return;
            }
            attempts++;
        }
        this.playMusic(this.playlist[0], 2000, false);
    }

    public playMusic(key: string, fadeDuration: number = 1000, interruptPlaylist: boolean = true) {
        if (interruptPlaylist) this.isPlaylistActive = false;

        const filename = key.includes('.') ? key : `${key}.mp3`;
        const baseUrl = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL;
        const path = `${baseUrl}/sounds/music/${filename}`.replace('//', '/');

        const newMusic = new Audio(path);
        // Clean up connection logic to WebAudio for now, focusing on basic playback for music
        // to avoid CrossOrigin issues with Tone.js unless setup perfectly.
        newMusic.loop = !this.isPlaylistActive;
        newMusic.volume = 0;

        // Fade handling
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic, fadeDuration);
        }

        this.currentMusic = newMusic;
        this.currentMusicKey = key;

        newMusic.play().then(() => {
            this.fadeIn(newMusic, this.musicVolume, fadeDuration);
        }).catch(e => {
            console.warn(`Failed to play music: ${key}`, e);
            if (this.isPlaylistActive) setTimeout(() => this.playNextInPlaylist(), 2000);
        });

        if (this.isPlaylistActive) {
            newMusic.onended = () => this.playNextInPlaylist();
        }
    }

    public stopMusic(fadeDuration: number = 1000) {
        this.isPlaylistActive = false;
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic, fadeDuration);
            this.currentMusic = null;
            this.currentMusicKey = null;
        }
    }

    // Helper Fades
    private fadeOut(audio: HTMLAudioElement, duration: number) {
        // Clear existing fade
        if (this.activeFades.has(audio)) {
            clearInterval(this.activeFades.get(audio));
            this.activeFades.delete(audio);
        }

        const startVolume = audio.volume;
        const steps = 20;
        const interval = setInterval(() => {
            if (audio.volume > 0.01) {
                audio.volume = Math.max(0, audio.volume - (startVolume / steps));
            } else {
                audio.pause();
                clearInterval(interval);
                this.activeFades.delete(audio);
            }
        }, duration / steps);

        this.activeFades.set(audio, interval as any);
    }

    private fadeIn(audio: HTMLAudioElement, target: number, duration: number) {
        // Clear existing fade
        if (this.activeFades.has(audio)) {
            clearInterval(this.activeFades.get(audio));
            this.activeFades.delete(audio);
        }

        const steps = 20;
        const interval = setInterval(() => {
            if (audio.volume < target) {
                audio.volume = Math.min(target, audio.volume + (target / steps));
            } else {
                clearInterval(interval);
                this.activeFades.delete(audio);
            }
        }, duration / steps);

        this.activeFades.set(audio, interval as any);
    }

    // Getters
    public getSfxVolume() { return this.sfxVolume; }
    public getMusicVolume() { return this.musicVolume; }
    public isMuffled() { return this.isMuffledState; }
    public getCurrentTrackId() { return this.currentMusicKey; }

    // Ignored Tracks Pass-through
    public toggleIgnoreTrack(id: string) {
        if (this.ignoredTracks.has(id)) this.ignoredTracks.delete(id);
        else this.ignoredTracks.add(id);
        localStorage.setItem('sim_music_ignored', JSON.stringify(Array.from(this.ignoredTracks)));
    }
    public isIgnored(id: string) { return this.ignoredTracks.has(id); }
}

export const audioManager = AudioManager.getInstance();
