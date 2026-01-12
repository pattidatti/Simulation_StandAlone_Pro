import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAudio } from '../SimulationAudioContext';
import { useSimulation } from '../SimulationContext';
import { Volume2, User, Server, LogOut, Music } from 'lucide-react';
import { GlobalProfileModal } from './GlobalProfileModal';


interface SimulationSettingsProps {
    onClose: () => void;
}

export const SimulationSettings: React.FC<SimulationSettingsProps> = ({ onClose }) => {
    const { pin } = useParams<{ pin: string }>();
    const { setMusicWindowOpen } = useSimulation();
    const {
        sfxVolume, setSfxVolume,
        musicVolume, setMusicVolume,
        isMuffled, setMuffled,
        playSfx
    } = useAudio();
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="max-w-4xl w-full bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header / Close button */}
                <div className="flex justify-end p-6 pb-0">
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-full transition-colors">
                        ✕
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Core Settings */}
                    <div className="space-y-6">
                        <section className="space-y-4">
                            {/* Monitor/Fullscreen Section */}
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                <span className="text-white font-bold text-sm">Fullskjerm</span>
                                <button
                                    onClick={toggleFullscreen}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${isFullscreen ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isFullscreen ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <Volume2 className="w-4 h-4" /> Lyd & Musikk
                            </h3>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">

                                {/* Advanced Music Player Button */}
                                <button
                                    onClick={() => {
                                        setMusicWindowOpen(true);
                                        onClose();
                                    }}
                                    className="w-full relative group overflow-hidden bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-400 p-6 rounded-xl transition-all duration-300 active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                                <Music size={24} className="text-indigo-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-black text-white uppercase tracking-tight">Åpne Musikkspiller</h4>
                                                <p className="text-[10px] text-indigo-300 group-hover:text-white/80 font-bold uppercase tracking-widest">
                                                    Administrer Spilleliste
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            →
                                        </div>
                                    </div>
                                </button>

                                <div className="h-px bg-white/5" />

                                {/* Volume Controls */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Music Volume */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-slate-300 uppercase">
                                            <span>Musikk Volum</span>
                                            <span>{Math.round(musicVolume * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={musicVolume}
                                            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>

                                    {/* SFX Volume */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-slate-300 uppercase">
                                            <span>Lydeffekter</span>
                                            <span>{Math.round(sfxVolume * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={sfxVolume}
                                            onChange={(e) => {
                                                const newVol = parseFloat(e.target.value);
                                                setSfxVolume(newVol);
                                            }}
                                            onMouseUp={() => playSfx('ui_click')}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Muffled Music Toggle */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div className="space-y-0.5">
                                        <span className="text-white font-bold text-xs block">Dempet musikk</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Low-pass filter (15kHz)</span>
                                    </div>
                                    <button
                                        onClick={() => setMuffled(!isMuffled)}
                                        className={`w-10 h-5 rounded-full p-1 transition-colors ${isMuffled ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isMuffled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Profile & Servers */}
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <User className="w-4 h-4" /> Konto & Profil
                            </h3>
                            <button
                                onClick={() => setIsProfileOpen(true)}
                                className="w-full bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/5 flex items-center gap-4 transition-all duration-300 group hover:border-indigo-500/30 text-left"
                            >
                                <div className="w-12 h-12 bg-slate-800 group-hover:bg-indigo-500/20 rounded-xl flex items-center justify-center text-xl border border-white/10 group-hover:border-indigo-500/50 transition-colors">
                                    👤
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-bold text-sm group-hover:text-indigo-200 transition-colors">Global Profil</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black group-hover:text-indigo-400">
                                        Administrer Vessels
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                    →
                                </div>
                            </button>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <Server className="w-4 h-4" /> Servervalg
                            </h3>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                                <div className="flex items-center justify-between p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-xs font-bold text-white">Europe-West-1 (Aktiv)</span>
                                    </div>
                                    <span className="text-[10px] text-indigo-400 font-black">12ms</span>
                                </div>
                                <div className="flex items-center justify-between p-2 opacity-40 grayscale">
                                    <span className="text-xs font-bold text-slate-400">US-East-1</span>
                                    <span className="text-[10px] text-slate-500 font-black">115ms</span>
                                </div>
                            </div>
                        </section>

                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full mt-4 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500/40 text-rose-500 hover:text-white px-6 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm group"
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            Avslutt Spill
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-black/20 border-t border-white/5 text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
                        Version 1.2.0 • Eiriksbok Simulation Engine
                    </p>
                </div>

                {/* IN-GAME GLOBAL PROFILE MODAL */}
                <GlobalProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    currentRoomPin={pin}
                />
            </div>
        </div>
    );
};
