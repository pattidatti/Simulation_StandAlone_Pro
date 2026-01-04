import React from 'react';
import { Outlet } from 'react-router-dom';
import { SimulationAuthProvider } from './SimulationAuthContext';
import { SimulationProvider } from './SimulationContext';
import { SimulationAudioProvider } from './SimulationAudioContext';
import { SimulationMusicController } from './components/SimulationMusicController';

export const SimulationLayout: React.FC = () => {
    return (
        <SimulationAuthProvider>
            <SimulationProvider>
                <SimulationAudioProvider>
                    <SimulationMusicController />
                    <Outlet />
                </SimulationAudioProvider>
            </SimulationProvider>
        </SimulationAuthProvider>
    );
};
