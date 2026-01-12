
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutProvider } from './context/LayoutContext';
import { SimulationAuthProvider } from './features/simulation/SimulationAuthContext';
import { SimulationAudioProvider } from './features/simulation/SimulationAudioContext';
import { SimulationProvider } from './features/simulation/SimulationContext';
import { SimulationHost } from './features/simulation/SimulationHost';
import { SimulationPlayer } from './features/simulation/SimulationPlayer';
import { SimulationLanding } from './features/simulation/SimulationLanding';
import './index.css';

const App: React.FC = () => {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <LayoutProvider>
                <SimulationAuthProvider>
                    <SimulationAudioProvider>
                        <div className="min-h-screen bg-slate-950 text-white">
                            <Routes>
                                <Route path="/" element={<SimulationLanding />} />

                                <Route path="/host" element={<SimulationHost />} />

                                {/* Player Route needs SimulationProvider */}
                                <Route path="/play/:pin/*" element={
                                    <SimulationProvider>
                                        <SimulationPlayer />
                                    </SimulationProvider>
                                } />

                                {/* Redirect legacy or unknown routes */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    </SimulationAudioProvider>
                </SimulationAuthProvider>
            </LayoutProvider>
        </BrowserRouter>
    );
};

export default App;
