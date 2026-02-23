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

export const SiegeBreach: React.FC<Props> = ({ player, siege, onAction }) => {
    const s = siege.breachState;
    if (!s) return <div className="text-white">Loading Breach State...</div>;

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
    useEffect(() => {
        if (ramCooldownActive || oilOnCooldown) {
            const interval = setInterval(() => setTick(t => t + 1), 1000);
            return () => clearInterval(interval);
        }
    }, [ramCooldownActive, oilOnCooldown]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center gap-6 p-4"
        >
            {/* GATE VISUAL */}
            <div
                className="relative w-96 h-72 group cursor-pointer"
                onClick={() => isParticipant && !isDefender && onAction({ type: 'SIEGE_ACTION', subType: 'ATTACK_GATE' })}
            >
                {/* HP Bar */}
                <div className="absolute -top-10 left-0 right-0 h-3 bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        className={`h-full transition-colors duration-500 ${hpPct < 25 ? 'bg-red-500' : hpPct < 50 ? 'bg-orange-500' : 'bg-red-600'}`}
                        animate={{ width: `${hpPct}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                </div>
                <div className="absolute -top-6 w-full text-center text-red-400 font-mono text-[11px] font-bold tracking-wider">
                    PORTEN: {s.gateHp} / {s.maxGateHp} HP — <span className={
                        s.gateCondition === 'SHATTERED' ? 'text-red-300' :
                            s.gateCondition === 'BROKEN' ? 'text-orange-400' :
                                s.gateCondition === 'CRACKED' ? 'text-yellow-400' :
                                    'text-green-400'
                    }>{s.gateCondition}</span>
                </div>

                {/* The Gate */}
                <div className={`w-full h-full border-8 border-stone-700 bg-stone-900 rounded-t-[50%] shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-200 ${s.gateCondition === 'SHATTERED' ? 'brightness-50 border-red-900/50' :
                    s.gateCondition === 'BROKEN' ? 'brightness-75' : ''
                    }`}>
                    <div className="absolute inset-0 grid grid-cols-6 gap-1.5 p-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-stone-800/80 h-full rounded shadow-inner border border-stone-700/30" />
                        ))}
                    </div>

                    {/* Cracks */}
                    <AnimatePresence>
                        {s.gateCondition !== 'PRISTINE' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 0.7, scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <svg viewBox="0 0 200 200" className="w-48 h-48 opacity-60">
                                    <path d="M100,20 L95,80 L70,90 L85,120 L60,180" stroke="hsl(0,0%,20%)" strokeWidth="3" fill="none" />
                                    {s.gateCondition !== 'CRACKED' && (
                                        <path d="M120,30 L130,100 L150,110 L140,160" stroke="hsl(0,0%,20%)" strokeWidth="2.5" fill="none" />
                                    )}
                                    {s.gateCondition === 'SHATTERED' && (
                                        <path d="M50,50 L80,60 L90,100 L100,140 L80,180" stroke="hsl(0,0%,15%)" strokeWidth="4" fill="none" />
                                    )}
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Hover Hint */}
                {isParticipant && !isDefender && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-t-[50%]">
                        <span className="text-white font-black uppercase text-2xl tracking-widest">KNUS!</span>
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
                            <button
                                onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'ATTACK_GATE' })}
                                className="p-5 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-3
                                    bg-gradient-to-b from-red-950/60 to-red-950/30 border-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                            >
                                <Sword className="text-red-400 w-8 h-8" />
                                <span className="text-sm font-black text-red-300 uppercase tracking-wider">Sverdangrep</span>
                                <span className="text-[10px] text-red-400/60 font-mono">25 dmg / 1 sverd | 2 dmg neve</span>
                            </button>
                        )}

                        {/* RAM PANEL */}
                        {!isDefender && (
                            <div className="p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-950/40 to-amber-950/20 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Hammer className="text-amber-400 w-5 h-5" />
                                    <span className="text-sm font-black text-amber-300 uppercase tracking-wider">Murbrekker</span>
                                </div>

                                {/* Progress Bars */}
                                <div className="space-y-2">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold mb-1">
                                            <span className="text-amber-300/60">PLANKER</span>
                                            <span className="text-amber-200 font-mono">{s.ramPool?.planks || 0}/{RAM_PLANKS_REQUIRED}</span>
                                        </div>
                                        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-amber-500/10">
                                            <motion.div
                                                className="h-full bg-amber-600 rounded-full"
                                                animate={{ width: `${ramPlanksPct}%` }}
                                                transition={{ type: 'spring', stiffness: 100 }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold mb-1">
                                            <span className="text-amber-300/60">JERNBARRER</span>
                                            <span className="text-amber-200 font-mono">{s.ramPool?.iron || 0}/{RAM_IRON_REQUIRED}</span>
                                        </div>
                                        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-amber-500/10">
                                            <motion.div
                                                className="h-full bg-amber-500 rounded-full"
                                                animate={{ width: `${ramIronPct}%` }}
                                                transition={{ type: 'spring', stiffness: 100 }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contribute Buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'CONTRIBUTE_RAM', payload: { planks: 10, iron: 0 } })}
                                        disabled={(player.resources?.plank || 0) < 10}
                                        className="px-3 py-2 text-[10px] font-bold uppercase rounded-lg transition-all
                                            bg-amber-900/40 border border-amber-500/20 text-amber-300
                                            hover:bg-amber-800/50 hover:border-amber-500/40
                                            disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        +10 Planker
                                    </button>
                                    <button
                                        onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'CONTRIBUTE_RAM', payload: { planks: 0, iron: 5 } })}
                                        disabled={(player.resources?.iron_ingot || 0) < 5}
                                        className="px-3 py-2 text-[10px] font-bold uppercase rounded-lg transition-all
                                            bg-amber-900/40 border border-amber-500/20 text-amber-300
                                            hover:bg-amber-800/50 hover:border-amber-500/40
                                            disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        +5 Jernbarrer
                                    </button>
                                </div>

                                {/* Activate RAM */}
                                <button
                                    onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'ACTIVATE_RAM' })}
                                    disabled={!ramReady || ramCooldownActive}
                                    className={`w-full py-3 rounded-xl font-black uppercase text-sm tracking-wider transition-all duration-300 ${ramReady && !ramCooldownActive
                                        ? 'bg-amber-500 text-black border border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse hover:bg-amber-400'
                                        : ramCooldownActive
                                            ? 'bg-slate-800 text-slate-500 border border-slate-700'
                                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                                        }`}
                                >
                                    {ramCooldownActive
                                        ? `⏳ Cooldown: ${ramCooldownRemaining}s`
                                        : ramReady
                                            ? '🔥 AKTIVER MURBREKKER! (500 dmg)'
                                            : 'Murbrekker — samler ressurser...'
                                    }
                                </button>
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
        </motion.div>
    );
};
