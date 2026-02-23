import React, { useState, useEffect } from 'react';
import type { SimulationPlayer, ActiveSiege } from '../../../simulationTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Hammer, Shield, Flame } from 'lucide-react';

interface Props {
    player: SimulationPlayer;
    siege: ActiveSiege;
    onAction: (action: any) => void;
}

const RAM_PLANKS_REQUIRED = 200;
const RAM_IRON_REQUIRED = 50;

interface FloatingText {
    id: number;
    text: string;
    x: number;
    y: number;
}

interface Splinter {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    vr: number;
    size: number;
}

export const SiegeBreach: React.FC<Props> = ({ player, siege, onAction }) => {
    const s = siege.breachState;
    if (!s) return <div className="text-white">Loading Breach State...</div>;

    // F2: Gate destroyed — show transition button
    if (s.gateHp <= 0 || siege.phase !== 'BREACH') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="text-6xl animate-bounce">⚔️</div>
                <h2 className="text-3xl font-black text-amber-500 uppercase tracking-wider">PORTEN ER KNUST!</h2>
                <p className="text-slate-400 text-sm">Forsvarerne trekker seg tilbake. Borggården venter.</p>
                <button
                    onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'INIT_COURTYARD' })}
                    className="px-10 py-4 bg-amber-600 hover:bg-amber-500 text-black font-black text-lg rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                    Gå videre til Borggården →
                </button>
            </div>
        );
    }

    const isParticipant = !!(siege.attackers || {})[player.id] || !!(siege.defenders || {})[player.id];
    const isDefender = !!(siege.defenders || {})[player.id];
    const hpPct = (s.gateHp / s.maxGateHp) * 100;

    // RAM state
    const ramReady = s.ramPool?.ready || false;
    const ramCooldownActive = Date.now() < (s.ramPool?.cooldownUntil || 0);
    const ramCooldownRemaining = ramCooldownActive ? Math.ceil(((s.ramPool?.cooldownUntil || 0) - Date.now()) / 1000) : 0;
    const ramPlanksPct = Math.min(100, ((s.ramPool?.planks || 0) / RAM_PLANKS_REQUIRED) * 100);
    const ramIronPct = Math.min(100, ((s.ramPool?.iron || 0) / RAM_IRON_REQUIRED) * 100);

    // Oil state
    const oilRemaining = s.oilState?.usesRemaining ?? 3;
    const oilPlayerCooldown = (s.oilState?.playerCooldowns?.[player.id] || 0);
    const oilOnCooldown = Date.now() < oilPlayerCooldown;
    const oilCooldownRemaining = oilOnCooldown ? Math.ceil((oilPlayerCooldown - Date.now()) / 1000) : 0;

    // Force re-render for cooldown timers
    const [, setTick] = useState(0);
    const [impactFlash, setImpactFlash] = useState(false);
    const [cardFlash, setCardFlash] = useState(false);
    const [gateKick, setGateKick] = useState(0);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [splinters, setSplinters] = useState<Splinter[]>([]);
    const [prevHp, setPrevHp] = useState(s.gateHp);

    useEffect(() => {
        if (ramCooldownActive || oilOnCooldown) {
            const interval = setInterval(() => setTick(t => t + 1), 1000);
            return () => clearInterval(interval);
        }
    }, [ramCooldownActive, oilOnCooldown]);

    // Track HP changes for juice
    useEffect(() => {
        if (s.gateHp < prevHp) {
            triggerJuice(prevHp - s.gateHp);
            setPrevHp(s.gateHp);
        }
    }, [s.gateHp, prevHp]);

    const triggerJuice = (dmg: number) => {
        setImpactFlash(true);
        setCardFlash(true);
        setGateKick(prev => prev + 1);
        setTimeout(() => {
            setImpactFlash(false);
            setCardFlash(false);
        }, 100);

        // Spawn floating text
        const id = Date.now();
        const texts = ["CRUNCH!", "BOOM!", "SKRÆLL!", "BRAK!", "KERR-RACK!"];
        const randomText = dmg > 20 ? texts[Math.floor(Math.random() * texts.length)] : `-${dmg}`;

        const newText: FloatingText = {
            id,
            text: randomText,
            x: 50, // Centered X
            y: 40 + Math.random() * 10  // Spawning around the center-upper part
        };
        setFloatingTexts(prev => [...prev, newText]);
        setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 1000);

        // Spawn Splinters
        const newSplinters: Splinter[] = [...Array(8)].map((_, i) => ({
            id: id + i,
            x: 50,
            y: 50,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.7) * 40,
            rotation: Math.random() * 360,
            vr: (Math.random() - 0.5) * 30,
            size: Math.random() * 10 + 5
        }));
        setSplinters(prev => [...prev, ...newSplinters]);
        setTimeout(() => setSplinters(prev => prev.filter(s => !newSplinters.find(ns => ns.id === s.id))), 1200);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center gap-6 p-4 relative overflow-hidden"
        >
            {/* Full Background War Embers */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {[...Array(25)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-amber-600 rounded-full blur-[1.5px] animate-war-ember"
                        style={{
                            width: Math.random() * 5 + 2,
                            height: Math.random() * 5 + 2,
                            left: `${Math.random() * 100}%`,
                            bottom: '-20px',
                            animationDelay: `${Math.random() * 8}s`,
                            animationDuration: `${Math.random() * 4 + 6}s`,
                            opacity: Math.random() * 0.4 + 0.1
                        }}
                    />
                ))}
            </div>
            {/* GATE VISUAL */}
            <div
                className="relative w-[500px] h-[400px] group cursor-pointer"
                onClick={() => isParticipant && !isDefender && onAction({ type: 'SIEGE_ACTION', subType: 'ATTACK_GATE' })}
            >
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                    <AnimatePresence>
                        {floatingTexts.map(t => (
                            <motion.div
                                key={t.id}
                                initial={{ y: 0, opacity: 1, scale: 0.5 }}
                                animate={{ y: -100, opacity: 0, scale: 2 }}
                                exit={{ opacity: 0 }}
                                className="font-black text-amber-500 text-5xl italic drop-shadow-[0_4px_12px_rgba(0,0,0,1)] whitespace-nowrap"
                            >
                                {t.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* HP Bar - Moved inside and centered */}
                <motion.div
                    animate={impactFlash ? { scale: [1, 1.05, 1], x: [0, -2, 2, 0] } : {}}
                    className="absolute top-8 left-1/2 -translate-x-1/2 w-[80%] h-10 bg-black/80 rounded-xl overflow-hidden border-2 border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-20"
                >
                    <motion.div
                        className={`h-full transition-colors duration-500 rounded-r-lg ${hpPct < 25 ? 'bg-gradient-to-r from-red-600 to-red-400' : hpPct < 50 ? 'bg-gradient-to-r from-orange-600 to-orange-400' : 'bg-gradient-to-r from-red-700 to-red-500'}`}
                        animate={{ width: `${hpPct}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                    {/* Centered Status Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
                        <span className="text-white font-black text-lg tracking-tight uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,1)] whitespace-nowrap">
                            PORTEN: {s.gateHp} / {s.maxGateHp} HP — <span className={
                                s.gateCondition === 'SHATTERED' ? 'text-red-300' :
                                    s.gateCondition === 'BROKEN' ? 'text-orange-300' :
                                        s.gateCondition === 'CRACKED' ? 'text-yellow-300' :
                                            'text-green-300'
                            }>{s.gateCondition}</span>
                        </span>
                    </div>
                </motion.div>

                {/* The Gate Container for scale/kick */}
                <motion.div
                    key={gateKick}
                    animate={gateKick > 0 ? { scale: [1, 1.05, 1], rotate: [0, -1, 1, 0] } : {}}
                    transition={{ duration: 0.1 }}
                    className={`w-full h-full border-8 border-stone-800 bg-stone-900 rounded-t-[40px] shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-200 ${s.gateCondition === 'SHATTERED' ? 'brightness-50 border-red-900/50' :
                        s.gateCondition === 'BROKEN' ? 'brightness-75' : ''
                        }`}
                >
                    <div className="absolute inset-0 grid grid-cols-6 gap-1.5 p-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-stone-800/80 h-full rounded shadow-inner border border-stone-700/30" />
                        ))}
                    </div>

                    {/* Impact Flash Overlay */}
                    <AnimatePresence>
                        {impactFlash && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white z-40 pointer-events-none"
                            />
                        )}
                    </AnimatePresence>

                    {/* Cracks */}
                    <AnimatePresence>
                        {s.gateCondition !== 'PRISTINE' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                            >
                                <svg viewBox="0 0 200 200" className="w-64 h-64 opacity-80">
                                    <path d="M100,20 L95,80 L70,90 L85,120 L60,180" stroke="hsl(0,0%,15%)" strokeWidth="4" fill="none" />
                                    {s.gateCondition !== 'CRACKED' && (
                                        <path d="M120,30 L130,100 L150,110 L140,160" stroke="hsl(0,0%,15%)" strokeWidth="3" fill="none" />
                                    )}
                                    {s.gateCondition === 'SHATTERED' && (
                                        <path d="M50,50 L80,60 L90,100 L100,140 L80,180" stroke="hsl(0,0%,10%)" strokeWidth="5" fill="none" />
                                    )}
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Hover Hint */}
                {isParticipant && !isDefender && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-t-[40px]">
                        <span className="text-white font-black uppercase text-3xl tracking-[0.2em] drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">KNUS!</span>
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            {!isParticipant ? (
                /* JOIN BUTTONS */
                <div className="flex gap-4">
                    <button
                        onClick={() => onAction({ type: 'JOIN_SIEGE', payload: { side: 'ATTACKER' } })}
                        className="px-8 py-4 bg-red-700/80 hover:bg-red-600 text-white font-black uppercase rounded-xl border border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105"
                    >
                        <span className="flex items-center gap-2"><Sword size={20} /> Angrip</span>
                    </button>
                    <button
                        onClick={() => onAction({ type: 'JOIN_SIEGE', payload: { side: 'DEFENDER' } })}
                        className="px-8 py-4 bg-indigo-700/80 hover:bg-indigo-600 text-white font-black uppercase rounded-xl border border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105"
                    >
                        <span className="flex items-center gap-2"><Shield size={20} /> Forsvar</span>
                    </button>
                </div>
            ) : (
                /* PARTICIPANT ACTION PANEL */
                <div className="w-full max-w-2xl space-y-4">
                    {/* Row 1: Sword Attack + RAM */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* SWORD ATTACK */}
                        {!isDefender && (
                            <motion.button
                                animate={cardFlash ? { scale: [1, 0.95, 1] } : {}}
                                onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'ATTACK_GATE' })}
                                className="p-8 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center gap-4 relative overflow-hidden
                                    bg-gradient-to-b from-red-950/70 to-red-950/40 border-red-500/40 hover:border-red-500/80 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] group/sword"
                            >
                                {/* INTENSE FLASH OVERLAY */}
                                <AnimatePresence>
                                    {cardFlash && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-white/80 z-10"
                                        />
                                    )}
                                </AnimatePresence>

                                <Sword className="text-red-400 w-16 h-16 group-hover/sword:scale-110 transition-transform duration-300" />
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-2xl font-black text-red-300 uppercase tracking-widest">Sverdangrep</span>
                                    <span className="text-sm text-red-400/90 font-mono font-bold">25 dmg/sverd | 2 dmg neve</span>
                                </div>
                                <div className="mt-2 px-4 py-2 bg-red-900/40 rounded-full border border-red-500/20 flex items-center gap-2">
                                    <span className="text-xs font-black text-red-200 uppercase">Beleiringsvåpen:</span>
                                    <span className="text-lg font-black text-red-400">{player.resources?.siege_sword || 0}</span>
                                </div>
                            </motion.button>
                        )}

                        {/* RAM PANEL */}
                        {!isDefender && (
                            <div className="p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-950/40 to-amber-950/20 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <Hammer className="text-amber-400 w-6 h-6" />
                                    <span className="text-lg font-black text-amber-300 uppercase tracking-wider">Murbrekker</span>
                                </div>

                                {/* Progress Bars */}
                                <div className="space-y-4 py-2">
                                    <div>
                                        <div className="flex justify-between text-xs font-black mb-1.5 px-1">
                                            <span className="text-amber-300/80 uppercase tracking-wider">PLANKER</span>
                                            <span className="text-amber-200 font-mono text-sm">{s.ramPool?.planks || 0}/{RAM_PLANKS_REQUIRED}</span>
                                        </div>
                                        <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-amber-500/20 shadow-inner">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                                animate={{ width: `${ramPlanksPct}%` }}
                                                transition={{ type: 'spring', stiffness: 100 }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-black mb-1.5 px-1">
                                            <span className="text-amber-300/80 uppercase tracking-wider">JERNBARRER</span>
                                            <span className="text-amber-200 font-mono text-sm">{s.ramPool?.iron || 0}/{RAM_IRON_REQUIRED}</span>
                                        </div>
                                        <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-amber-500/20 shadow-inner">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                                                animate={{ width: `${ramIronPct}%` }}
                                                transition={{ type: 'spring', stiffness: 100 }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contribute Buttons */}
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <button
                                        onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'CONTRIBUTE_RAM', payload: { planks: 10, iron: 0 } })}
                                        disabled={(player.resources?.plank || 0) < 10}
                                        className="px-4 py-4 text-sm font-black uppercase rounded-xl transition-all
                                            bg-amber-900/50 border border-amber-500/30 text-amber-200
                                            hover:bg-amber-800/70 hover:border-amber-500/60 hover:scale-[1.02] active:scale-[0.98]
                                            disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale"
                                    >
                                        +10 Planker
                                    </button>
                                    <button
                                        onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'CONTRIBUTE_RAM', payload: { planks: 0, iron: 5 } })}
                                        disabled={(player.resources?.iron_ingot || 0) < 5}
                                        className="px-4 py-4 text-sm font-black uppercase rounded-xl transition-all
                                            bg-amber-900/50 border border-amber-500/30 text-amber-200
                                            hover:bg-amber-800/70 hover:border-amber-500/60 hover:scale-[1.02] active:scale-[0.98]
                                            disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale"
                                    >
                                        +5 Jernbarrer
                                    </button>
                                </div>

                                {/* Activate RAM */}
                                <motion.button
                                    animate={cardFlash && ramReady && !ramCooldownActive ? { scale: [1, 0.95, 1] } : {}}
                                    onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'ACTIVATE_RAM' })}
                                    disabled={!ramReady || ramCooldownActive}
                                    className={`w-full py-3 rounded-xl font-black uppercase text-sm tracking-wider transition-all duration-300 relative overflow-hidden ${ramReady && !ramCooldownActive
                                        ? 'bg-amber-500 text-black border border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse hover:bg-amber-400'
                                        : ramCooldownActive
                                            ? 'bg-slate-800 text-slate-500 border border-slate-700'
                                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                                        }`}
                                >
                                    {/* INTENSE FLASH OVERLAY */}
                                    <AnimatePresence>
                                        {cardFlash && ramReady && !ramCooldownActive && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-white/80 z-10"
                                            />
                                        )}
                                    </AnimatePresence>

                                    {ramCooldownActive
                                        ? `⏳ Cooldown: ${ramCooldownRemaining}s`
                                        : ramReady
                                            ? '🔥 AKTIVER MURBREKKER! (500 dmg)'
                                            : 'Murbrekker — samler ressurser...'
                                    }
                                </motion.button>
                            </div>
                        )}

                        {/* DEFENDER: Full width sword attack placeholder + Oil */}
                        {isDefender && (
                            <div className="col-span-2 p-5 rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/40 to-indigo-950/20 flex flex-col items-center gap-3">
                                <Shield className="text-indigo-400 w-8 h-8" />
                                <span className="text-sm font-black text-indigo-300 uppercase tracking-wider">Forsvarerens Post</span>
                                <span className="text-[10px] text-indigo-400/60">Du forsvarer murene. Bruk kokende olje nedenfor.</span>
                            </div>
                        )}
                    </div>

                    {/* Row 2: BOILING OIL (Defenders only) */}
                    {isDefender && (
                        <div className="p-4 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-950/30 to-orange-950/10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Flame className="text-orange-400 w-5 h-5" />
                                    <span className="text-sm font-black text-orange-300 uppercase tracking-wider">Kokende Olje</span>
                                </div>
                                <span className="text-[10px] font-bold text-orange-400/60 font-mono">
                                    {oilRemaining}/3 gjenstår
                                </span>
                            </div>
                            <p className="text-[10px] text-orange-200/50 mb-3">
                                Kost: 20 ved → Ødelegger 5 beleiringsrustning hos tilfeldig angriper.
                            </p>
                            <button
                                onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'BOILING_OIL' })}
                                disabled={oilRemaining <= 0 || oilOnCooldown || (player.resources?.wood || 0) < 20}
                                className={`w-full py-3 rounded-xl font-bold uppercase text-sm tracking-wider transition-all ${oilOnCooldown
                                    ? 'bg-slate-800 text-slate-500 border border-slate-700'
                                    : oilRemaining > 0 && (player.resources?.wood || 0) >= 20
                                        ? 'bg-orange-700/80 text-orange-100 border border-orange-500/40 hover:bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.2)]'
                                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                                    }`}
                            >
                                {oilOnCooldown
                                    ? `⏳ Cooldown: ${oilCooldownRemaining}s`
                                    : oilRemaining <= 0
                                        ? 'Ingen olje gjenstår'
                                        : `🫗 Kokende Olje (${player.resources?.wood || 0} ved)`
                                }
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Ambient War Embers and Screenshake keyframes */}
            <style>{`
                @keyframes war-ember {
                    0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0; }
                    20% { opacity: 0.8; }
                    80% { opacity: 0.4; }
                    100% { transform: translateY(-500px) rotate(360deg) scale(0); opacity: 0; }
                }
                .animate-war-ember {
                    animation: war-ember linear infinite;
                }
            `}</style>

            {/* TOP LAYER EXPLOSION (Splinters) */}
            <div className="absolute inset-0 z-[100] pointer-events-none">
                <AnimatePresence>
                    {splinters.map(sp => (
                        <motion.div
                            key={sp.id}
                            initial={{ x: `${sp.x}%`, y: `${sp.y}%`, rotate: sp.rotation, opacity: 1, scale: 1 }}
                            animate={{
                                x: `${sp.x + sp.vx}%`,
                                y: `${sp.y + sp.vy + 40}%`, // stronger gravity for top layer
                                rotate: sp.rotation + sp.vr * 15,
                                opacity: 0,
                                scale: 0.3
                            }}
                            transition={{ duration: 1.2, ease: "circOut" }}
                            className="absolute bg-[#4e342e] border border-[#261611] shadow-2xl"
                            style={{
                                width: sp.size,
                                height: sp.size * 0.3,
                                borderRadius: '1px'
                            }}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
