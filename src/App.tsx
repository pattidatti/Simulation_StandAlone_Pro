
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutProvider } from './context/LayoutContext';
import { SimulationAuthProvider } from './features/simulation/SimulationAuthContext';
import { SimulationProvider } from './features/simulation/SimulationContext';
import { SimulationHost } from './features/simulation/SimulationHost';
import { SimulationPlayer } from './features/simulation/SimulationPlayer';
import { SimulationLanding } from './features/simulation/SimulationLanding';
import './index.css';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <LayoutProvider>
                <SimulationAuthProvider>
                    <div className="min-h-screen bg-slate-950 text-white">
                        <Routes>
                            <Route path="/" element={<SimulationLanding />} />

                            <Route path="/sim/host" element={<SimulationHost />} />

                            {/* Player Route needs SimulationProvider */}
                            <Route path="/sim/play/:pin/*" element={
                                <SimulationProvider>
                                    <SimulationPlayer />
                                </SimulationProvider>
                            } />

                            {/* Redirect legacy or unknown routes */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </SimulationAuthProvider>
            </LayoutProvider>
        </BrowserRouter>
    );
};

export default App;
