import React, { useMemo } from 'react';
import type { SimulationPlayer, ActiveSiege } from '../../simulationTypes'; // Ensure path is correct
import { AnimatePresence } from 'framer-motion';

// Sub-components
import { SiegeBreach } from './phases/SiegeBreach';
import { SiegeCourtyard } from './phases/SiegeCourtyard';
import { SiegeThrone } from './phases/SiegeThrone';
import { SiegeHUD } from './SiegeHUD';
import { SiegeWarLog } from './SiegeWarLog';

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

                {/* HUD */}
                <SiegeHUD siege={siege} />

                {/* PHASE RENDERER */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode='wait'>
                        {siege.phase === 'BREACH' && (
                            <SiegeBreach key="breach" player={player} siege={siege} onAction={(a) => onAction({ ...a, targetRegionId: regionId })} />
                        )}
                        {siege.phase === 'COURTYARD' && (
                            <SiegeCourtyard key="courtyard" player={player} siege={siege} messages={messages} onAction={(a) => onAction({ ...a, targetRegionId: regionId })} />
                        )}
                        {siege.phase === 'THRONE_ROOM' && (
                            <SiegeThrone key="throne" player={player} siege={siege} onAction={(a) => onAction({ ...a, targetRegionId: regionId })} />
                        )}
                    </AnimatePresence>
                </div>

                {/* WAR LOG (Global for non-dashboard phases) */}
                {siege.phase !== 'COURTYARD' && <SiegeWarLog messages={messages} />}

            </div>
        </div>
    );
};
