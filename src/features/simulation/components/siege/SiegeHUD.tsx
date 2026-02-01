import React from 'react';
import type { ActiveSiege, SiegePhase } from '../../../../simulationTypes';
import { motion } from 'framer-motion';

interface Props {
    siege: ActiveSiege;
}

const PHASE_NAMES: Record<SiegePhase, string> = {
    BREACH: 'FASE 1: PORTEN',
    COURTYARD: 'FASE 2: BORGGÅRDEN',
    THRONE_ROOM: 'FASE 3: TRONEN'
};

const PHASE_COLORS: Record<SiegePhase, string> = {
    BREACH: 'text-red-500',
    COURTYARD: 'text-amber-500',
    THRONE_ROOM: 'text-purple-500'
};

export const SiegeHUD: React.FC<Props> = ({ siege }) => {
    return (
        <div className="flex justify-between items-start mb-6 w-full">
            {/* Phase Indicator */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-4 shadow-lg"
            >
                <div className={`w-3 h-3 rounded-full animate-pulse ${PHASE_COLORS[siege.phase].replace('text-', 'bg-')}`} />
                <span className={`${PHASE_COLORS[siege.phase]} font-black tracking-widest text-xs uppercase`}>
                    {PHASE_NAMES[siege.phase]}
                </span>
            </motion.div>

            {/* Timer / Status (Future Expansion) */}
            <div className="bg-black/40 px-4 py-1 rounded-full border border-white/5 text-[10px] text-slate-500 font-mono">
                TID SIDEN START: {Math.floor((Date.now() - siege.startedAt) / 1000)}s
            </div>
        </div>
    );
};
