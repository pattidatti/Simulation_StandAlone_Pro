import React, { useEffect } from 'react';
import { useAudio } from '../SimulationAudioContext';

export const SimulationMusicController: React.FC = () => {
    const { startPlaylist, resume } = useAudio();

    useEffect(() => {
        // Start the background music playlist when the simulation environment is loaded
        startPlaylist();

        // ULTRATHINK: Browser Autoplay policy requires a user gesture to start AudioContext/Playback
        // We attach a one-time global click listener to resume the audio manager
        const handleInteraction = () => {
            resume();
            // Also try to start playlist again just in case it failed
            startPlaylist();
            window.removeEventListener('mousedown', handleInteraction);
        };

        window.addEventListener('mousedown', handleInteraction);
        return () => window.removeEventListener('mousedown', handleInteraction);
    }, [startPlaylist, resume]);

    return null;
};
