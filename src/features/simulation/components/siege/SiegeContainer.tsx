import React, { useMemo, useState, useCallback } from 'react';
import type { SimulationPlayer, ActiveSiege } from '../../simulationTypes';
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
    const [shakeClass, setShakeClass] = useState('');

    // Screenshake trigger — child components call this via enhanced onAction
    const triggerShake = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
        const cls = intensity === 'heavy'
            ? 'siege-shake-heavy'
            : intensity === 'light'
                ? 'siege-shake-light'
                : 'siege-shake';
        setShakeClass(cls);
        setTimeout(() => setShakeClass(''), intensity === 'heavy' ? 500 : 300);
    }, []);

    // Enhanced action handler — triggers shake on impactful actions
    const handleAction = useCallback((a: any) => {
        const action = { ...a, targetRegionId: regionId };

        // Determine shake intensity by action type
        if (a.subType === 'ACTIVATE_RAM') triggerShake('heavy');
        else if (a.subType === 'ATTACK_GATE') triggerShake('light');
        else if (a.subType === 'BOILING_OIL') triggerShake('medium');
        else if (a.subType === 'CLAIM_THRONE') triggerShake('medium');
        else if (a.subType === 'SUNDER_ARMOR') triggerShake('light');

        onAction(action);
    }, [onAction, regionId, triggerShake]);

    // Background Logic
    const bgUrl = useMemo(() => {
        switch (siege.phase) {
            case 'BREACH': return "url('/siege/castle_gate.png')";
            case 'COURTYARD': return "url('/siege/courtyard.png')";
            case 'THRONE_ROOM': return "url('/siege/throne_room.png')";
            default: return 'none';
        }
    }, [siege.phase]);

    return (
        <div className={`relative w-full h-[850px] mt-8 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-black ${shakeClass}`}>
            {/* Dynamic Background */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 grayscale-[0.3]"
                style={{ backgroundImage: bgUrl }}
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-slate-950/90 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col p-6">

                {/* HUD */}
                <SiegeHUD siege={siege} />

                {/* PHASE RENDERER */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode='wait'>
                        {siege.phase === 'BREACH' && (
                            <SiegeBreach key="breach" player={player} siege={siege} onAction={handleAction} />
                        )}
                        {siege.phase === 'COURTYARD' && (
                            <SiegeCourtyard key="courtyard" player={player} siege={siege} onAction={handleAction} />
                        )}
                        {siege.phase === 'THRONE_ROOM' && (
                            <SiegeThrone key="throne" player={player} siege={siege} onAction={handleAction} />
                        )}
                    </AnimatePresence>
                </div>

                {/* WAR LOG */}
                {siege.phase !== 'COURTYARD' && <SiegeWarLog messages={messages} />}

            </div>

            {/* Screenshake keyframes (injected as style tag) */}
            <style>{`
                @keyframes siege-shake-anim {
                    0%, 100% { transform: translate(0, 0); }
                    25% { transform: translate(-4px, 2px); }
                    50% { transform: translate(4px, -2px); }
                    75% { transform: translate(-2px, 4px); }
                }
                @keyframes siege-shake-heavy-anim {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-8px, 4px); }
                    30% { transform: translate(6px, -6px); }
                    50% { transform: translate(-6px, 4px); }
                    70% { transform: translate(4px, -4px); }
                    90% { transform: translate(-2px, 2px); }
                }
                @keyframes siege-shake-light-anim {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-2px, 1px); }
                }
                .siege-shake { animation: siege-shake-anim 0.3s ease-out; }
                .siege-shake-heavy { animation: siege-shake-heavy-anim 0.5s ease-out; }
                .siege-shake-light { animation: siege-shake-light-anim 0.15s ease-out; }
            `}</style>
        </div>
    );
};
