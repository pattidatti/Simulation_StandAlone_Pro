import React, { useState, useEffect } from 'react';
import type { ActiveSiege, SiegePhase } from '../../simulationTypes';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
    siege: ActiveSiege;
}

const MAX_SIEGE_DURATION = 10 * 60 * 1000; // 10 minutes

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
    const [, setTick] = useState(0);

    // Re-render every second for countdown
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const elapsed = Date.now() - siege.startedAt;
    const remaining = Math.max(0, MAX_SIEGE_DURATION - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const isUrgent = remaining < 120000; // Under 2 min
    const isCritical = remaining < 30000; // Under 30s

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

            {/* Countdown Timer */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`flex items-center gap-2 px-5 py-2 rounded-full border font-mono text-xs font-bold transition-all duration-500 ${isCritical
                    ? 'bg-red-900/80 border-red-500/50 text-red-300 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                    : isUrgent
                        ? 'bg-red-950/60 border-red-500/30 text-red-400'
                        : 'bg-black/40 border-white/5 text-slate-400'
                    }`}
            >
                {isUrgent ? <AlertTriangle size={12} className="text-red-400" /> : <Clock size={12} />}
                <span className="tracking-wider">
                    {remaining <= 0
                        ? 'TID UTE!'
                        : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    }
                </span>
            </motion.div>
        </div>
    );
};
