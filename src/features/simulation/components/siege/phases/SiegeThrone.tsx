import React, { useState, useEffect } from 'react';
import type { SimulationPlayer, ActiveSiege } from '../../../simulationTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Sword, Coins, Heart, Crosshair } from 'lucide-react';

interface Props {
    player: SimulationPlayer;
    siege: ActiveSiege;
    onAction: (action: any) => void;
}

export const SiegeThrone: React.FC<Props> = ({ player, siege, onAction }) => {
    const s = siege.throneState;
    if (!s) return <div className="text-white">Loading Throne Room...</div>;

    const occupiers = Object.values(s.occupiers || {});
    const myOccupier = s.occupiers[player.id];
    const isAttacker = !!(siege.attackers || {})[player.id];
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selectedOccupier = selectedId ? s.occupiers[selectedId] : null;

    // Sort by progress descending
    const sorted = [...occupiers].sort((a, b) => b.progress - a.progress);

    // Tick timer — send TICK every second while in throne room
    useEffect(() => {
        const interval = setInterval(() => {
            onAction({ type: 'SIEGE_ACTION', subType: 'TICK' });
        }, 1000);
        return () => clearInterval(interval);
    }, [onAction]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center p-6 gap-6 overflow-y-auto"
        >
            {/* HEADER */}
            <div className="text-center">
                <h1 className="text-4xl font-black text-amber-500 drop-shadow-xl mb-1 flex items-center justify-center gap-3">
                    <Crown className="text-amber-400" size={36} />
                    TRONSALEN
                </h1>
                <p className="text-slate-400 text-sm">Førstemann til 100% tar kronen. Rustningen din forfaller over tid.</p>
            </div>

            <div className="w-full max-w-5xl flex gap-6 flex-1 min-h-0">
                {/* LEFT: Actions Panel */}
                <div className="w-72 shrink-0 flex flex-col gap-4">
                    {/* CLAIM / STATUS */}
                    {!myOccupier ? (
                        <button
                            onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'CLAIM_THRONE' })}
                            className="p-5 bg-amber-600 hover:bg-amber-500 text-black font-black text-lg uppercase rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                        >
                            <Crown size={24} />
                            KREV TRONEN
                        </button>
                    ) : (
                        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/30 text-center">
                            <div className="text-amber-400 font-black uppercase tracking-widest text-[10px] mb-1">Status</div>
                            <div className="text-white font-black text-lg">DU OKKUPERER</div>
                            <div className="text-amber-300 font-mono text-sm mt-1">
                                <Shield size={12} className="inline mr-1" />
                                {myOccupier.armor.toFixed(1)} rustning | {Math.floor(myOccupier.progress)}%
                            </div>
                        </div>
                    )}

                    {/* YOUR RESOURCES */}
                    <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/60">
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">Dine Ressurser</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                                <Sword size={14} className="text-amber-500" />
                                <span className="text-sm font-black text-slate-200">{player.resources?.siege_sword || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-blue-500" />
                                <span className="text-sm font-black text-slate-200">{player.resources?.siege_armor || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Coins size={14} className="text-yellow-500" />
                                <span className="text-sm font-black text-slate-200">{player.resources?.gold || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* PLUNDER */}
                    {isAttacker && (
                        <button
                            onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'PLUNDER' })}
                            disabled={!!s.plundered}
                            className={`p-4 rounded-2xl font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 ${s.plundered
                                    ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-yellow-700 to-amber-600 text-black border border-amber-400 hover:from-yellow-600 hover:to-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                }`}
                        >
                            <Coins size={18} />
                            {s.plundered ? 'Allerede plyndret' : `💰 PLYNDRE (+500 Gull)`}
                        </button>
                    )}

                    {/* SELECTED OCCUPIER ACTIONS */}
                    <AnimatePresence>
                        {selectedOccupier && selectedId !== player.id && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="p-4 rounded-2xl border border-white/10 bg-slate-900/80 space-y-3"
                            >
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                    <Crosshair size={12} />
                                    Valgt: {selectedOccupier.name}
                                </div>

                                <div className="text-xs text-slate-500 font-mono">
                                    Rustning: {selectedOccupier.armor.toFixed(1)} | Progress: {Math.floor(selectedOccupier.progress)}%
                                </div>

                                {/* DONATE */}
                                <button
                                    onClick={() => onAction({
                                        type: 'SIEGE_ACTION',
                                        subType: 'DONATE_ARMOR',
                                        payload: { targetId: selectedId, amount: 1 }
                                    })}
                                    disabled={(player.resources?.siege_armor || 0) < 1}
                                    className="w-full py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2
                                        bg-blue-900/50 border border-blue-500/30 text-blue-300
                                        hover:bg-blue-800/50 hover:border-blue-400/50
                                        disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Heart size={14} />
                                    Doner 1 Rustning
                                </button>

                                {/* SUNDER */}
                                <button
                                    onClick={() => onAction({
                                        type: 'SIEGE_ACTION',
                                        subType: 'SUNDER_ARMOR',
                                        payload: { targetId: selectedId }
                                    })}
                                    disabled={(player.resources?.siege_sword || 0) < 1}
                                    className="w-full py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2
                                        bg-red-900/50 border border-red-500/30 text-red-300
                                        hover:bg-red-800/50 hover:border-red-400/50
                                        disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Sword size={14} />
                                    Angrip (−3 rustning, 1 sverd)
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* RIGHT: Race Track */}
                <div className="flex-1 flex flex-col gap-3">
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                        Kappeløp — Klikk for handlinger
                    </div>

                    {sorted.length === 0 && (
                        <div className="flex-1 flex items-center justify-center bg-black/30 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 text-lg font-bold">
                            Tronen står tom...
                        </div>
                    )}

                    {sorted.map((occ, idx) => {
                        const isMe = occ.id === player.id;
                        const isSelected = occ.id === selectedId;
                        const progressColor = occ.progress > 75
                            ? 'from-amber-700 to-amber-500'
                            : occ.progress > 50
                                ? 'from-indigo-700 to-indigo-500'
                                : 'from-indigo-900 to-indigo-700';

                        return (
                            <motion.div
                                key={occ.id}
                                layout
                                onClick={() => setSelectedId(isSelected ? null : occ.id)}
                                className={`relative h-20 rounded-xl border overflow-hidden flex items-center px-5 cursor-pointer transition-all duration-200 ${isMe
                                        ? 'bg-slate-900/80 ring-2 ring-amber-500 border-amber-500/30'
                                        : isSelected
                                            ? 'bg-slate-900/80 ring-2 ring-blue-400 border-blue-400/30'
                                            : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {/* Progress Bar BG */}
                                <motion.div
                                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${progressColor} opacity-40`}
                                    animate={{ width: `${occ.progress}%` }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />

                                {/* Content */}
                                <div className="relative z-10 flex items-center gap-4 w-full">
                                    <div className="font-mono text-2xl font-bold text-slate-600 w-8">
                                        {idx === 0 ? '👑' : `#${idx + 1}`}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-bold text-lg ${isMe ? 'text-amber-300' : 'text-white'}`}>
                                            {occ.name} {isMe && <span className="text-xs text-amber-400/60">(du)</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Shield size={11} /> {occ.armor.toFixed(1)}
                                            </span>
                                            {occ.legitimacySnapshot > 0 && (
                                                <span className="text-purple-400/60">
                                                    ✦ {occ.legitimacySnapshot} leg.
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-black text-3xl text-white leading-none">
                                            {Math.floor(occ.progress)}%
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
