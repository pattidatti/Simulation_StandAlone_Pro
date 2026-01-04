import { MUSIC_PLAYLIST } from '../data/musicData';

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

    private audioContext: AudioContext | null = null;
    private filterNode: BiquadFilterNode | null = null;
    private isMuffledState: boolean = false;
    private activeFades: Map<HTMLAudioElement, number> = new Map();

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

        // Shuffle initially
        this.shufflePlaylist();
    }

    private shufflePlaylist() {
        this.playlist = this.playlist.sort(() => Math.random() - 0.5);
    }

    private initAudioContext() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.filterNode = this.audioContext.createBiquadFilter();
                this.filterNode.type = 'lowpass';
                this.filterNode.frequency.setValueAtTime(this.isMuffledState ? 12000 : 20000, this.audioContext.currentTime);
                this.filterNode.connect(this.audioContext.destination);
            } catch (e) {
                console.error("Failed to initialize AudioContext", e);
            }
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public setSfxVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('sim_sfx_volume', this.sfxVolume.toString());
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

        if (this.filterNode && this.audioContext) {
            this.filterNode.frequency.setTargetAtTime(
                muffled ? 15000 : 20000,
                this.audioContext.currentTime,
                0.1
            );
        }
    }

    public toggleIgnoreTrack(trackId: string) {
        if (this.ignoredTracks.has(trackId)) {
            this.ignoredTracks.delete(trackId);
        } else {
            this.ignoredTracks.add(trackId);
        }
        localStorage.setItem('sim_music_ignored', JSON.stringify(Array.from(this.ignoredTracks)));

        // If we just ignored the current track, skip to next
        if (this.ignoredTracks.has(trackId) && this.currentMusicKey === trackId && this.isPlaylistActive) {
            this.playNextInPlaylist();
        }
    }

    public isIgnored(trackId: string): boolean {
        return this.ignoredTracks.has(trackId);
    }

    public getSfxVolume() { return this.sfxVolume; }
    public getMusicVolume() { return this.musicVolume; }
    public isMuffled() { return this.isMuffledState; }
    public getCurrentTrackId() { return this.currentMusicKey; }

    public playSfx(key: string) {
        if (this.sfxVolume === 0) return;

        const filename = key.includes('.') ? key : `${key}.mp3`;
        const path = `/sounds/sfx/${filename}`;

        const audio = new Audio(path);
        audio.volume = this.sfxVolume;

        audio.play().catch(() => {
            // Expected
        });
    }

    public startPlaylist() {
        if (this.isPlaylistActive && this.currentMusic) return; // Already playing
        this.isPlaylistActive = true;

        // Use logic to find valid start track if current is null or invalid
        if (!this.currentMusic) {
            this.playNextInPlaylist();
        }
    }

    public playNextInPlaylist() {
        if (!this.isPlaylistActive) return;

        let attempts = 0;
        let found = false;

        // Prevent infinite loop if all tracks ignored
        while (attempts < this.playlist.length) {
            this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
            const trackId = this.playlist[this.playlistIndex];

            if (!this.ignoredTracks.has(trackId)) {
                this.playMusic(trackId, 2000, false);
                found = true;
                break;
            }
            attempts++;
        }

        if (!found) {
            console.warn("All tracks are ignored! Playing fallback.");
            this.playMusic(this.playlist[0], 2000, false);
        }
    }

    public playPreviousInPlaylist() {
        if (!this.isPlaylistActive) return;

        let attempts = 0;
        let found = false;

        // Prevent infinite loop if all tracks ignored
        while (attempts < this.playlist.length) {
            // JS modulo handles negative numbers weirdly, so we fix it
            this.playlistIndex = (this.playlistIndex - 1 + this.playlist.length) % this.playlist.length;
            const trackId = this.playlist[this.playlistIndex];

            if (!this.ignoredTracks.has(trackId)) {
                this.playMusic(trackId, 2000, false);
                found = true;
                break;
            }
            attempts++;
        }

        if (!found) {
            this.playMusic(this.playlist[0], 2000, false);
        }
    }

    public async resume() {
        if (!this.audioContext) {
            this.initAudioContext();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    public playMusic(key: string, fadeDuration: number = 1000, interruptPlaylist: boolean = true) {
        if (interruptPlaylist) {
            this.isPlaylistActive = false;
        }

        // If trying to play the same track that is currently playing, just ensure volume is up
        if (this.currentMusicKey === key && this.currentMusic && !this.currentMusic.paused) {
            this.fadeIn(this.currentMusic, this.musicVolume, 500); // Ensure volume is correct
            return;
        }

        const filename = key.includes('.') ? key : `${key}.mp3`;
        const path = `/sounds/music/${filename}`;

        const newMusic = new Audio(path);
        // ULTRATHINK: Removing anonymous crossOrigin for local public files to avoid potential CORS issues on dev servers
        // newMusic.crossOrigin = "anonymous";
        newMusic.loop = !this.isPlaylistActive; // Loop if it's a specific track request (not playlist)
        newMusic.volume = 0;

        this.initAudioContext();
        if (this.audioContext && this.filterNode) {
            try {
                // Check if already connected (though it's a new Audio instance)
                const source = this.audioContext.createMediaElementSource(newMusic);
                source.connect(this.filterNode);
            } catch (e) {
                console.warn("Could not route through Web Audio API", e);
            }
        }

        if (this.isPlaylistActive) {
            newMusic.onended = () => {
                this.playNextInPlaylist();
            };
        }

        // Clean up current
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic, fadeDuration);
        }

        this.currentMusic = newMusic;
        this.currentMusicKey = key;

        newMusic.play().then(() => {
            this.fadeIn(newMusic, this.musicVolume, fadeDuration);
            // Ensure context is resumed if playback succeeded
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }).catch(e => {
            console.warn(`Failed to play music: ${key}`, e);
            if (this.currentMusic === newMusic) {
                this.currentMusic = null;
                this.currentMusicKey = null;
            }
            if (this.isPlaylistActive) {
                // Try next one if this fails
                setTimeout(() => this.playNextInPlaylist(), 2000);
            }
        });
    }

    public stopMusic(fadeDuration: number = 1000) {
        this.isPlaylistActive = false;
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic, fadeDuration);
            this.currentMusic = null;
            this.currentMusicKey = null;
        }
    }

    private fadeOut(audio: HTMLAudioElement, duration: number) {
        // Stop any existing fade on this element
        if (this.activeFades.has(audio)) {
            clearInterval(this.activeFades.get(audio));
        }

        const startVolume = audio.volume;
        const steps = 20;
        const stepTime = duration / steps;
        const volStep = startVolume / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const newVol = Math.max(0, startVolume - (volStep * currentStep));
            audio.volume = newVol;

            if (newVol <= 0) {
                audio.pause();
                audio.src = ""; // Force cleanup
                clearInterval(interval);
                this.activeFades.delete(audio);
            }
        }, stepTime);

        this.activeFades.set(audio, interval as any);
    }

    private fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number) {
        // Stop any existing fade on this element (e.g. if we were fading it out)
        if (this.activeFades.has(audio)) {
            clearInterval(this.activeFades.get(audio));
            this.activeFades.delete(audio);
        }

        const steps = 20;
        const stepTime = duration / steps;
        const volStep = targetVolume / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const newVol = Math.min(targetVolume, volStep * currentStep);
            audio.volume = newVol;

            if (newVol >= targetVolume || audio.paused) {
                clearInterval(interval);
            }
        }, stepTime);
    }

}
export const audioManager = AudioManager.getInstance();
