import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { audioManager } from './logic/AudioManager';
import { MUSIC_PLAYLIST, type MusicTrack } from './data/musicData';

interface AudioContextType {
    playSfx: (key: string) => void;
    playMusic: (key: string) => void;
    startPlaylist: () => void;
    stopMusic: () => void;

    // Playlist Controls
    playNext: () => void;
    playPrevious: () => void;
    toggleIgnoreTrack: (id: string) => void;
    isIgnored: (id: string) => boolean;
    currentTrackId: string | null;
    playlist: MusicTrack[];

    sfxVolume: number;
    setSfxVolume: (vol: number) => void;
    musicVolume: number;
    setMusicVolume: (vol: number) => void;
    isMuffled: boolean;
    setMuffled: (muffled: boolean) => void;
    resume: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const SimulationAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sfxVolume, setSfxVolumeState] = useState(audioManager.getSfxVolume());
    const [musicVolume, setMusicVolumeState] = useState(audioManager.getMusicVolume());
    const [isMuffled, setIsMuffledState] = useState(audioManager.isMuffled());
    const [currentTrackId, setCurrentTrackId] = useState<string | null>(audioManager.getCurrentTrackId());
    const [ignoredTrigger, setIgnoredTrigger] = useState(0); // Force re-render on ignore change

    // Poll for track changes since Audio isn't reactive
    useEffect(() => {
        const interval = setInterval(() => {
            const track = audioManager.getCurrentTrackId();
            if (track !== currentTrackId) {
                setCurrentTrackId(track);
            }
        }, 1000); // Check every second
        return () => clearInterval(interval);
    }, [currentTrackId]);

    const setSfxVolume = useCallback((vol: number) => {
        audioManager.setSfxVolume(vol);
        setSfxVolumeState(vol);
    }, []);

    const setMusicVolume = useCallback((vol: number) => {
        audioManager.setMusicVolume(vol);
        setMusicVolumeState(vol);
    }, []);

    const setMuffled = useCallback((muffled: boolean) => {
        audioManager.setMuffled(muffled);
        setIsMuffledState(muffled);
    }, []);

    const playSfx = useCallback((key: string) => {
        audioManager.playSfx(key);
    }, []);

    const playMusic = useCallback((key: string) => {
        audioManager.playMusic(key);
        setCurrentTrackId(key);
    }, []);

    const stopMusic = useCallback(() => {
        audioManager.stopMusic();
        setCurrentTrackId(null);
    }, []);

    const startPlaylist = useCallback(() => {
        audioManager.startPlaylist();
        setCurrentTrackId(audioManager.getCurrentTrackId());
    }, []);

    const playNext = useCallback(() => {
        audioManager.playNextInPlaylist();
        setCurrentTrackId(audioManager.getCurrentTrackId());
    }, []);

    const playPrevious = useCallback(() => {
        audioManager.playPreviousInPlaylist();
        setCurrentTrackId(audioManager.getCurrentTrackId());
    }, []);

    const toggleIgnoreTrack = useCallback((id: string) => {
        audioManager.toggleIgnoreTrack(id);
        setIgnoredTrigger(prev => prev + 1);
    }, []);

    const isIgnored = useCallback((id: string) => {
        return audioManager.isIgnored(id);
    }, [ignoredTrigger]);

    const resume = useCallback(() => {
        audioManager.resume();
    }, []);

    return (
        <AudioContext.Provider value={{
            playSfx,
            playMusic,
            startPlaylist,
            stopMusic,
            playNext,
            playPrevious,
            toggleIgnoreTrack,
            isIgnored,
            currentTrackId,
            playlist: MUSIC_PLAYLIST,
            sfxVolume,
            setSfxVolume,
            musicVolume,
            setMusicVolume,
            isMuffled,
            setMuffled,
            resume
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within a SimulationAudioProvider');
    }
    return context;
};
