import React, { useState, useEffect } from 'react';
import { useSimulationAuth } from './SimulationAuthContext';
import { useAudio } from './SimulationAudioContext';
import { SimulationServerBrowser } from './SimulationServerBrowser';
import { SimulationAuthModal } from './SimulationAuthModal';
import { Crown, Play, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SimulationLanding: React.FC = () => {
    const { user, isAnonymous, logout } = useSimulationAuth();
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

    const navigate = useNavigate();

    const { startPlaylist, resume } = useAudio();
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        // Try to start immediately (works if navigating from within app)
        startPlaylist();
    }, [startPlaylist]);

    // Global click handler to resume audio context (autoplay policy)
    const handleInteraction = () => {
        if (!hasInteracted) {
            resume();
            startPlaylist();
            setHasInteracted(true);
        }
    };

    const openAuth = (mode: 'LOGIN' | 'REGISTER') => {
        handleInteraction(); // Ensure audio starts
        setAuthMode(mode);
        setAuthModalOpen(true);
    };

    return (
        <div onClick={handleInteraction} className="min-h-screen relative font-sans text-slate-200 overflow-x-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={`${import.meta.env.BASE_URL}makthjulet_landingpage_bakgrunn.png`}
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                {/* Overlay Gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col min-h-screen">

                {/* Navbar */}
                <header className="w-full px-8 py-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Crown className="text-white/90" size={24} strokeWidth={1.5} />
                        <span className="text-sm font-black tracking-[0.2em] text-white/90 uppercase">Simuleringshallen</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-bold tracking-widest uppercase">
                        {user && !isAnonymous ? (
                            <div className="flex items-center gap-6">
                                <span className="text-white/70">Velkommen, <span className="text-white">{user.displayName}</span></span>
                                <button
                                    onClick={() => logout()}
                                    className="hover:text-amber-400 transition-colors"
                                >
                                    Logg ut
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => openAuth('LOGIN')}
                                    className="hover:text-white transition-colors text-white/70"
                                >
                                    Logg Inn
                                </button>
                                <button
                                    onClick={() => openAuth('REGISTER')}
                                    className="px-5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full transition-all text-white"
                                >
                                    Bli Med
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Hero & Server List Layout */}
                <main className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-6 py-12">

                    <div className="text-center mb-16 space-y-6 max-w-3xl">
                        <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
                            MAKTHJULET
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 font-light tracking-wide max-w-xl mx-auto leading-relaxed">
                            Skjebnen er ikke skrevet. Den smis i ilden av ambisjoner.
                        </p>


                    </div>

                    {/* Server Browser (Minimalist Glass) */}
                    <div className="w-full max-w-4xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase flex items-center gap-2">
                                <Play size={12} className="text-emerald-500" />
                                Aktive Verdener
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Live Feed
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            <SimulationServerBrowser />
                        </div>
                    </div>

                </main>

                {/* Footer */}
                <footer className="w-full p-8 relative flex justify-center text-[10px] uppercase tracking-[0.2em] text-white/30">
                    <span>&copy; 2026 Eiriksbok &bull; Maktens Pris</span>
                    
                    {/* Discrete Admin Link */}
                    <button 
                        onClick={() => navigate('/sim/host')}
                        className="absolute right-8 bottom-8 text-white/10 hover:text-white/50 transition-colors duration-500 font-bold"
                    >
                        Admin
                    </button>
                </footer>
            </div>

            <SimulationAuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setAuthModalOpen(false)}
                initialMode={authMode}
            />
        </div>
    );
};
