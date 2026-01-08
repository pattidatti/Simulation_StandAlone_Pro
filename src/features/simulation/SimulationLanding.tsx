import React, { useState, useEffect } from 'react';
import { useSimulationAuth } from './SimulationAuthContext';
import { useAudio } from './SimulationAudioContext';
import { SimulationServerBrowser } from './SimulationServerBrowser';
import { SimulationAuthModal } from './SimulationAuthModal';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';

export const SimulationLanding: React.FC = () => {
    const { user, isAnonymous, logout } = useSimulationAuth();
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

    const navigate = useNavigate();

    const { startPlaylist, resume } = useAudio();
    const [hasInteracted, setHasInteracted] = useState(false);
    const [totalLive, setTotalLive] = useState(0);

    useEffect(() => {
        const metaRef = ref(db, 'simulation_server_metadata');
        const unsub = onValue(metaRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                const total = Object.values(data).reduce((acc: number, server: any) => acc + (server.playerCount || 0), 0);
                setTotalLive(total);
            }
        });
        return () => unsub();
    }, []);

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
                    <div className="w-full max-w-5xl bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-4 md:p-10 shadow-2xl relative overflow-hidden">
                        {/* Noise Filter logic could be CSS, but we use a subtle overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

                        <div className="relative z-10">
                            <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
                                <h3 className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    Aktive Verdener
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-1.5 items-center mr-1">
                                        {[...Array(Math.min(3, totalLive))].map((_, i) => (
                                            <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-900 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                        ))}
                                        {totalLive > 3 && (
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-black text-white/60">
                                                +{totalLive - 3}
                                            </div>
                                        )}
                                        {totalLive === 0 && (
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-800 bg-slate-900/50" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">{totalLive} Live Nå</span>
                                </div>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                <SimulationServerBrowser />
                            </div>
                        </div>
                    </div>

                </main>

                {/* Footer */}
                <footer className="w-full p-8 relative flex justify-center text-[10px] uppercase tracking-[0.2em] text-white/30">
                    <span>&copy; 2026 Eiriksbok &bull; Maktens Pris</span>

                    {/* Discrete Admin Link */}
                    <button
                        onClick={() => navigate('/host')}
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
