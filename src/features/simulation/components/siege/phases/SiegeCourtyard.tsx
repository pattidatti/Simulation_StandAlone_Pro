import React from 'react';
import type { SimulationPlayer, ActiveSiege } from '../../../simulationTypes';
import { Skull, Zap, Shield, Sword, Flame, Coins, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    player: SimulationPlayer;
    siege: ActiveSiege;
    onAction: (action: any) => void;
}

export const SiegeCourtyard: React.FC<Props> = ({ player, siege, onAction }) => {
    const s = siege.courtyardState;

    // --- ERROR STATE ---
    if (!s) return (
        <div className="flex flex-col items-center justify-center h-full gap-6 bg-slate-950/50 backdrop-blur-md">
            <div className="text-xl font-black text-amber-500 uppercase tracking-tighter animate-pulse">Data Synkronisering Påkrevd</div>
            <button
                onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'INIT_COURTYARD' })}
                className="px-10 py-4 bg-amber-600 hover:bg-amber-500 text-black font-black text-lg rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95"
            >
                OPPDATER STRIDSDATA
            </button>
        </div>
    );

    // --- DATA PREP ---
    const participant = (siege.attackers || {})[player.id] || (siege.defenders || {})[player.id];
    const isTargeted = !!s?.bossTargetZone; // Global targeted state
    const stamina = participant?.deck?.stamina || 0;
    const maxStamina = participant?.deck?.maxStamina || 10;
    const lootPotential = Math.floor((participant?.stats?.damageDealt || 0) * 0.15); // Mock Algorithm

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col relative overflow-hidden font-sans select-none"
        >
            {/* --- LAYER 4: BOSS ATTACK VIGNETTE (Overlay) --- */}
            {s.bossTargetZone && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 z-0 bg-red-900 pointer-events-none mix-blend-overlay"
                />
            )}

            {/* --- LAYER 1: THE STAKES (Top Bar) --- */}
            <div className="relative z-20 w-full pt-4 px-8 flex justify-between items-start">

                {/* Left: Objective */}
                <div className="flex flex-col">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                        Gjeldende Oppdrag
                    </div>
                    <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Skull size={14} className="text-red-500" />
                        BEKJEMP GARNISONSSJEFEN
                    </div>
                </div>

                {/* Center: Boss HP */}
                <div className="flex-1 max-w-2xl mx-8 flex flex-col items-center">
                    <div className="w-full h-8 bg-slate-900/80 rounded-full border border-orange-900/50 overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <motion.div
                            className="h-full bg-gradient-to-r from-red-900 via-orange-600 to-amber-500"
                            initial={{ width: '100%' }}
                            animate={{ width: `${(s.bossHp / s.maxBossHp) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 50 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-white drop-shadow-md tracking-wider">
                            {s.bossHp.toLocaleString()} / {s.maxBossHp.toLocaleString()} HP
                        </div>
                    </div>
                    {/* Global Attack Indicator (Implicit via Boss SVG and Rage Bar, so we remove the text) */}
                </div>

                {/* Right Section: Loot & Resources */}
                <div className="flex items-center gap-6">
                    {/* Loot */}
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">
                            Din Andel (Est.)
                        </div>
                        <div className="text-sm font-bold text-amber-400 flex items-center gap-2">
                            {lootPotential.toLocaleString()} Gull
                            <Coins size={14} />
                        </div>
                    </div>

                    {/* Resources HUD + Sync */}
                    <div className="flex items-center gap-6 border-l border-white/10 pl-6 h-10">
                        <div className="flex flex-col items-end min-w-[100px]">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">
                                Beleiringsutstyr
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 group cursor-help" title="Sverd: Brukes til angrep">
                                    <Sword size={14} className="text-amber-500" />
                                    <span className="text-sm font-black text-slate-200">{player.resources?.siege_sword || 0}</span>
                                </div>
                                <div className="flex items-center gap-2 group cursor-help" title="Rustning: Brukes til forsvar">
                                    <Shield size={14} className="text-blue-500" />
                                    <span className="text-sm font-black text-slate-200">{player.resources?.siege_armor || 0}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'INIT_COURTYARD' })}
                            className="p-2 bg-slate-900/50 hover:bg-amber-500 hover:text-black text-slate-500 rounded-md border border-white/5 transition-all group shrink-0"
                            title="Synkroniser Taktikk & Dekk"
                        >
                            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- LAYER 2: THE BOSS (Absolute Duel Layer) --- */}
            <div className="absolute inset-x-0 bottom-64 top-20 z-10 flex items-center justify-center overflow-visible pointer-events-none">
                <div className="relative w-[600px] h-[600px] flex items-center justify-center overflow-visible">
                    {/* Boss Aura / Charge indicator */}
                    <AnimatePresence>
                        {isTargeted && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.6, opacity: 0.2 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                                className="absolute inset-0 bg-red-900 rounded-full blur-[150px] z-0"
                            />
                        )}
                    </AnimatePresence>

                    {/* THE GARGOYLE KNIGHT SVG */}
                    <motion.div
                        animate={{
                            y: isTargeted ? [0, -10, 0] : [0, 20, 0],
                        }}
                        transition={{
                            duration: isTargeted ? 1.0 : 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative z-10 w-full h-full drop-shadow-[0_100px_120px_rgba(0,0,0,1)]"
                    >
                        {/* We use a much wider viewBox and a negative Y start to never clip the sword */}
                        <svg viewBox="-150 -200 700 900" className="w-[120%] h-[120%] overflow-visible">
                            <defs>
                                <linearGradient id="armorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#1e293b' }} />
                                    <stop offset="100%" style={{ stopColor: '#020617' }} />
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="15" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* Cape (Back-most) */}
                            <path d="M100,220 Q0,450 40,700 L360,700 Q400,450 300,220" fill="#450a0a" opacity="0.8" />

                            {/* Greatsword - Now behind Pauldrons */}
                            <motion.path
                                d={isTargeted ? "M300,220 L480,-50 L520,0 L340,250 Z" : "M80,600 L-50,80 L0,40 L120,550 Z"}
                                fill="#2d3748"
                                stroke="#4a5568"
                                strokeWidth="6"
                                initial={false}
                                animate={{
                                    rotate: isTargeted ? [0, -1, 0] : 0,
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />

                            {/* Body / Torso */}
                            <path d="M130,700 L160,210 L240,210 L270,700 Z" fill="url(#armorGrad)" stroke="#334155" strokeWidth="6" />

                            {/* Shoulders / Pauldrons (Top Layer) */}
                            <path d="M80,260 Q110,160 170,190 L190,210 L80,260" fill="#0f172a" stroke="#475569" strokeWidth="6" />
                            <path d="M320,260 Q290,160 230,190 L210,210 L320,260" fill="#0f172a" stroke="#475569" strokeWidth="6" />

                            {/* Helmet */}
                            <path d="M175,195 Q200,75 225,195 Z" fill="#1e293b" stroke="#64748b" strokeWidth="6" />
                            {/* Visor Area */}
                            <rect x="188" y="155" width="24" height="6" rx="3" fill={isTargeted ? "#ff0000" : "#020617"} filter={isTargeted ? "url(#glow)" : ""} />
                        </svg>
                    </motion.div>

                    {/* Progress Bar (Placed on the Boss's Body) */}
                    <AnimatePresence>
                        {isTargeted && (
                            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-80 h-4 bg-black/90 border-2 border-red-500/50 rounded-full overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.5)] z-20 pointer-events-none">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 4, ease: "linear" }}
                                    className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-400"
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-[0.4em] drop-shadow-lg">
                                    Boss angriper nå!
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* SPACER FOR FLEX LAYOUT (To keep top/bottom aligned) */}
            <div className="flex-1 invisible" />

            {/* --- LAYER 3: COMMAND DASHBOARD (Bottom) --- */}
            <div className="relative z-30 h-64 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 flex items-stretch">

                {/* LEFT: Stamina Orb & Control */}
                <div className="w-52 border-r border-white/5 flex flex-col items-center justify-center p-4 bg-black/40 relative">
                    {/* The Orb */}
                    <div className="relative w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        {/* Fill Animation */}
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-amber-500 transition-all duration-700 ease-out opacity-20 rounded-b-full"
                            style={{ height: `${(stamina / maxStamina) * 100}%` }}
                        />
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-amber-400 transition-all duration-700 ease-out mix-blend-overlay rounded-b-full"
                            style={{ height: `${(stamina / maxStamina) * 100}%`, filter: 'blur(16px)' }}
                        />

                        <div className="relative z-10 flex flex-col items-center">
                            <Zap size={28} className={stamina > 0 ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" : "text-slate-800"} />
                            <span className="text-5xl font-black text-white leading-none tracking-tighter">{stamina}</span>
                            <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest mt-1">Energi</span>
                        </div>
                    </div>
                </div>

                {/* CENTER: Fixed Actions */}
                <div className="flex-1 relative flex items-center justify-center gap-8">
                    {/* Action 1: Sverdlyn (Light) */}
                    <motion.button
                        whileHover={{ y: -10, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => stamina >= 1 && onAction({ type: 'SIEGE_ACTION', subType: 'PLAY_CARD', payload: { templateId: 'basic_attack' } })}
                        className={`group relative w-40 h-52 rounded-2xl border-2 flex flex-col items-center justify-between p-4 transition-all ${stamina >= 1 ? 'bg-slate-900 border-amber-500/50 shadow-2xl' : 'opacity-40 grayscale cursor-not-allowed'}`}
                    >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-black px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Lett Angrep</div>
                        <Sword size={40} className="text-amber-500 mt-4 group-hover:rotate-12 transition-transform" />
                        <div className="text-center">
                            <div className="text-sm font-black text-white uppercase tracking-widest">SVERDLYN</div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase">1 Energi | 1 Sverd</div>
                        </div>
                        <div className="w-full h-1 bg-amber-500/20 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-full" />
                        </div>
                    </motion.button>

                    {/* Action 2: Tungt Slag (Heavy) */}
                    <motion.button
                        whileHover={{ y: -10, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => stamina >= 3 && onAction({ type: 'SIEGE_ACTION', subType: 'PLAY_CARD', payload: { templateId: 'strong_attack' } })}
                        className={`group relative w-44 h-56 rounded-2xl border-4 flex flex-col items-center justify-between p-5 transition-all ${stamina >= 3 ? 'bg-slate-900 border-red-500 shadow-[0_0_40px_rgba(220,38,38,0.2)]' : 'opacity-40 grayscale cursor-not-allowed'}`}
                    >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">Heavy Strike</div>
                        <Flame size={48} className="text-red-500 mt-2 animate-pulse" />
                        <div className="text-center">
                            <div className="text-lg font-black text-white uppercase tracking-tighter leading-tight">TUNGT SLAG</div>
                            <div className="text-[11px] text-slate-500 mt-1 uppercase">3 Energi | 2 Sverd</div>
                        </div>
                        <div className="w-full h-1.5 bg-red-900/40 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600 w-full" />
                        </div>
                    </motion.button>

                    {/* Action 3: Skjold (Defense) */}
                    <motion.button
                        whileHover={{ y: -10, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => stamina >= 1 && onAction({ type: 'SIEGE_ACTION', subType: 'PLAY_CARD', payload: { templateId: 'defend' } })}
                        className={`group relative w-40 h-52 rounded-2xl border-2 flex flex-col items-center justify-between p-4 transition-all ${stamina >= 1 ? 'bg-slate-900 border-blue-500/50 shadow-2xl' : 'opacity-40 grayscale cursor-not-allowed'}`}
                    >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Forsvar</div>
                        <Shield size={40} className="text-blue-400 mt-4 group-hover:scale-110 transition-transform" />
                        <div className="text-center">
                            <div className="text-sm font-black text-white uppercase tracking-widest">SKJOLDMUR</div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase">1 Energi | 1 Rustning</div>
                        </div>
                        <div className="w-full h-1 bg-blue-500/20 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 w-full" />
                        </div>
                    </motion.button>
                </div>

                {/* RIGHT: Tactical Summary & Rest Action */}
                <div className="w-72 border-l border-white/5 bg-black/40 flex flex-col justify-center">
                    <div className="p-6 border-white/5 bg-slate-950/50">
                        <div className="w-full flex flex-col items-center gap-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                KOMMANDØR: {player.name}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(245,158,11,0.1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'REST' })}
                                className="w-full py-4 bg-slate-900 border border-amber-500 text-amber-500 rounded-lg font-black uppercase tracking-widest text-[11px] shadow-lg flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} />
                                SPISE BRØD
                            </motion.button>
                            <label className="text-[9px] text-slate-600 uppercase tracking-widest opacity-60 text-center">Bruker 1 brød for energi</label>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div >
    );
};
