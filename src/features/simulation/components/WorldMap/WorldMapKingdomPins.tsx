import React from 'react';
import { motion } from 'framer-motion';
import type { SimulationPlayer } from '../../simulationTypes';

interface WorldMapKingdomPinsProps {
    players: Record<string, SimulationPlayer>;
    setViewingRegionId: (id: string) => void;
    setViewMode: (mode: string) => void;
}

export const WorldMapKingdomPins: React.FC<WorldMapKingdomPinsProps> = ({ players, setViewingRegionId, setViewMode }) => {
    const playersArr = Object.values(players || {});
    const baronVest = playersArr.find(p => p.role === 'BARON' && (p.regionId === 'region_vest' || p.regionId?.includes('vest')));
    const baronOst = playersArr.find(p => p.role === 'BARON' && (p.regionId === 'region_ost' || p.regionId?.includes('ost')));

    return (
        <>
            {/* CAPITAL PIN (Center) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 group pointer-events-auto"
            >
                <button
                    onClick={() => {
                        setViewingRegionId('capital');
                        setViewMode('global');
                    }}
                    className="flex flex-col items-center hover:scale-110 transition-transform"
                >
                    <div className="text-6xl drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] animate-pulse">🏰</div>
                    <div className="bg-black/80 text-amber-400 px-4 py-2 rounded-xl mt-2 font-black uppercase tracking-widest text-xs border border-amber-500/50 shadow-xl backdrop-blur-md">
                        Kongeriket
                    </div>
                </button>
            </motion.div>

            {/* BARONY VEST PIN */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute top-[65%] left-[15%] -translate-x-1/2 -translate-y-1/2 z-30 group pointer-events-auto"
            >
                <button
                    onClick={() => {
                        setViewingRegionId('region_vest');
                        setViewMode('global');
                    }}
                    className="flex flex-col items-center hover:scale-110 transition-transform"
                >
                    <div className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🏯</div>
                    <div className="bg-black/80 text-indigo-300 px-3 py-1 rounded-xl mt-2 font-bold text-[10px] uppercase tracking-wider border border-white/10 shadow-xl backdrop-blur-md whitespace-nowrap">
                        {baronVest?.name || 'Baroni Vest'}
                    </div>
                </button>
            </motion.div>

            {/* BARONY OST PIN */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute top-[65%] left-[85%] -translate-x-1/2 -translate-y-1/2 z-30 group pointer-events-auto"
            >
                <button
                    onClick={() => {
                        setViewingRegionId('region_ost');
                        setViewMode('global');
                    }}
                    className="flex flex-col items-center hover:scale-110 transition-transform"
                >
                    <div className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">⛩️</div>
                    <div className="bg-black/80 text-emerald-300 px-3 py-1 rounded-xl mt-2 font-bold text-[10px] uppercase tracking-wider border border-white/10 shadow-xl backdrop-blur-md whitespace-nowrap">
                        {baronOst?.name || 'Baroni Øst'}
                    </div>
                </button>
            </motion.div>
        </>
    );
};
