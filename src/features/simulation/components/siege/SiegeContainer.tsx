import React, { useMemo } from 'react';
import type { SimulationPlayer, ActiveSiege } from '../../simulationTypes'; // Ensure path is correct
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import { SiegeBreach } from './phases/SiegeBreach';
import { SiegeCourtyard } from './phases/SiegeCourtyard';
import { SiegeThrone } from './phases/SiegeThrone';

interface SiegeContainerProps {
    player: SimulationPlayer;
    siege: ActiveSiege;
    regionId: string;
    onAction: (action: any) => void;
    messages?: any[];
}

export const SiegeContainer: React.FC<SiegeContainerProps> = ({ player, siege, regionId, onAction, messages = [] }) => {

    // Background Logic
    const bgUrl = useMemo(() => {
        switch (siege.phase) {
            case 'BREACH': return "url('/siege/castle_gate.png')";
            case 'COURTYARD': return "url('/siege/courtyard.png')"; // Provide fallback or generate prompt?
            case 'THRONE_ROOM': return "url('/siege/throne_room.png')";
            default: return 'none';
        }
    }, [siege.phase]);

    return (
        <div className="relative w-full h-[850px] mt-8 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-black">
            {/* Dynamic Background */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 grayscale-[0.3]"
                style={{ backgroundImage: bgUrl }}
            />

            {/* Dark Overlay (Atmosphere) */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-slate-950/90 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col p-6">

                {/* HUD (Placeholder for now, separate component later if needed) */}
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-4">
                        <span className="text-amber-500 font-black tracking-widest text-xs uppercase">
                            {siege.phase === 'BREACH' ? 'FASE 1: PORTEN' :
                                siege.phase === 'COURTYARD' ? 'FASE 2: BORGGÅRDEN' : 'FASE 3: TRONEN'}
                        </span>
                    </div>
                </div>

                {/* PHASE RENDERER */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode='wait'>
                        {siege.phase === 'BREACH' && (
                            <SiegeBreach key="breach" player={player} siege={siege} onAction={(a) => onAction({ ...a, targetRegionId: regionId })} />
                        )}
                        {siege.phase === 'COURTYARD' && (
                            <SiegeCourtyard key="courtyard" player={player} siege={siege} onAction={(a) => onAction({ ...a, targetRegionId: regionId })} />
                        )}
                        {siege.phase === 'THRONE_ROOM' && (
                            <SiegeThrone key="throne" player={player} siege={siege} onAction={(a) => onAction({ ...a, targetRegionId: regionId })} />
                        )}
                    </AnimatePresence>
                </div>

                {/* WAR LOG (Placeholder) */}
                <div className="mt-auto h-32 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/5 p-4 overflow-hidden">
                    <h4 className="text-[10px] items-center flex gap-2 text-slate-500 font-bold uppercase mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Feed
                    </h4>
                    <div className="flex flex-col-reverse gap-1 overflow-auto max-h-full">
                        {messages.slice(0, 5).map((m, i) => (
                            <div key={i} className="text-xs text-slate-300 font-mono">
                                <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> {m.content || m}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
