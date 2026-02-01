import React from 'react';
import type { SimulationPlayer, ActiveSiege } from '../../../simulationTypes';
import { motion } from 'framer-motion';
import { Crown, Shield } from 'lucide-react';

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

    // Sort buy progress
    const sorted = [...occupiers].sort((a, b) => b.progress - a.progress);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 gap-8"
        >
            <div className="text-center">
                <h1 className="text-5xl font-black text-amber-500 font-display drop-shadow-xl mb-2">TRONSALEN</h1>
                <p className="text-slate-400 text-lg">Førstemann til 100% vinner kongeriket.</p>
            </div>

            {/* RACE TRACK */}
            <div className="w-full max-w-4xl grid grid-cols-1 gap-4">
                {sorted.length === 0 && (
                    <div className="text-center py-10 bg-black/40 border-2 border-dashed border-white/10 rounded-xl text-slate-500">
                        Tronen står tom...
                    </div>
                )}

                {sorted.map((occ, idx) => (
                    <div
                        key={occ.id}
                        className={`
                            relative h-20 bg-slate-900 rounded-xl border border-white/10 overflow-hidden flex items-center px-4
                            ${occ.id === player.id ? 'ring-2 ring-amber-500' : ''}
                        `}
                    >
                        {/* Progress Bar BG */}
                        <div
                            className="absolute inset-0 bg-indigo-900/50 transition-all duration-1000 ease-linear"
                            style={{ width: `${occ.progress}%` }}
                        />

                        {/* Avatar / Name */}
                        <div className="relative z-10 flex items-center gap-4 w-full">
                            <div className="font-mono text-2xl font-bold text-slate-500 w-8">#{idx + 1}</div>
                            <div>
                                <div className="font-bold text-white text-lg">{occ.name}</div>
                                <div className="text-xs text-indigo-300 font-mono flex items-center gap-2">
                                    <Shield size={12} /> {occ.armor.toFixed(1)} Armor
                                </div>
                            </div>

                            <div className="ml-auto font-black text-3xl text-white">
                                {Math.floor(occ.progress)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* CONTROLS */}
            {!myOccupier ? (
                <button
                    onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'CLAIM_THRONE' })}
                    className="mt-8 px-12 py-6 bg-amber-600 hover:bg-amber-500 text-black font-black text-2xl uppercase rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-transform hover:scale-105 flex items-center gap-4"
                >
                    <Crown size={32} />
                    KREV TRONEN
                </button>
            ) : (
                <div className="bg-black/60 px-8 py-4 rounded-xl border border-amber-500/30 text-center animate-pulse">
                    <div className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-1">Status</div>
                    <div className="text-white font-black text-xl">DU OKKUPERER TRONEN</div>
                    <div className="text-slate-400 text-xs mt-2">Rustningen din forfaller. Hold ut!</div>
                </div>
            )}

        </motion.div>
    );
};
