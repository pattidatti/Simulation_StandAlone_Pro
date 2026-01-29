import React from 'react';
import type { SimulationPlayer, ActiveSiege } from '../../../simulationTypes';
import { motion } from 'framer-motion';
import { Sword, Hammer, ArrowUpCircle } from 'lucide-react';

interface Props {
    player: SimulationPlayer;
    siege: ActiveSiege;
    onAction: (action: any) => void;
}

export const SiegeBreach: React.FC<Props> = ({ player, siege, onAction }) => {
    const s = siege.breachState;
    if (!s) return <div className="text-white">Loading Breach State...</div>;

    const isParticipant = (siege.attackers || {})[player.id] || (siege.defenders || {})[player.id];
    const hpPct = (s.gateHp / s.maxGateHp) * 100;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center gap-8"
        >
            {/* GATE VISUAL */}
            <div className="relative w-96 h-80 group cursor-pointer" onClick={() => isParticipant && onAction({ type: 'SIEGE_ACTION', subType: 'ATTACK_GATE' })}>
                {/* HP Bar */}
                <div className="absolute -top-12 left-0 right-0 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-red-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${hpPct}%` }}
                    />
                </div>
                <div className="absolute -top-8 w-full text-center text-red-500 font-mono text-xs font-bold">
                    {s.gateHp} / {s.maxGateHp} HP
                </div>

                {/* The "Gate" (CSS Art / SVG Placeholder) */}
                <div className={`w-full h-full border-8 border-stone-800 bg-stone-900 rounded-t-full shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-100 ${s.gateCondition === 'SHATTERED' ? 'brightness-50' : ''}`}>
                    <div className="absolute inset-0 grid grid-cols-6 gap-2 p-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-stone-800 h-full rounded shadow-inner" />
                        ))}
                    </div>
                    {/* Cracks Overlay */}
                    {s.gateCondition !== 'PRISTINE' && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
                            <span className="text-9xl text-black rotate-12 select-none">⚡</span>
                        </div>
                    )}
                </div>

                {/* Hover Hint */}
                {isParticipant && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-t-full">
                        <span className="text-white font-black uppercase text-2xl tracking-widest">KNUS!</span>
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            {!isParticipant ? (
                <div className="flex gap-4">
                    <button
                        onClick={() => onAction({ type: 'JOIN_SIEGE', payload: { side: 'ATTACKER' } })}
                        className="px-8 py-4 bg-red-700/80 hover:bg-red-600 text-white font-black uppercase rounded-xl border border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105"
                    >
                        <span className="flex items-center gap-2"><Sword /> Angrip</span>
                    </button>
                    <button
                        onClick={() => onAction({ type: 'JOIN_SIEGE', payload: { side: 'DEFENDER' } })}
                        className="px-8 py-4 bg-indigo-700/80 hover:bg-indigo-600 text-white font-black uppercase rounded-xl border border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105"
                    >
                        Takler Forsvar
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                    <button
                        onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'ATTACK_GATE', payload: { weaponType: 'MELEE' } })}
                        className="p-4 bg-slate-800 border border-white/10 rounded-xl hover:bg-slate-700 flex flex-col items-center gap-2"
                    >
                        <Sword className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-300">MELEE ATTACK</span>
                    </button>
                    <button
                        disabled
                        className="p-4 bg-slate-900 border border-white/5 rounded-xl opacity-50 cursor-not-allowed flex flex-col items-center gap-2"
                    >
                        <Hammer className="text-slate-600" />
                        <span className="text-xs font-bold text-slate-500">RAM (Låst)</span>
                    </button>
                    <button
                        disabled
                        className="p-4 bg-slate-900 border border-white/5 rounded-xl opacity-50 cursor-not-allowed flex flex-col items-center gap-2"
                    >
                        <ArrowUpCircle className="text-slate-600" />
                        <span className="text-xs font-bold text-slate-500">LADDER (Låst)</span>
                    </button>
                </div>
            )}
        </motion.div>
    );
};
