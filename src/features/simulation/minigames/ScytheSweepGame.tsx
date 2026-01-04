import React, { useState } from 'react';
import type { EquipmentItem } from '../simulationTypes';
import { ITEM_TEMPLATES } from '../constants';

import { animationManager } from '../logic/AnimationManager';

const getBestToolForAction = (type: string, equipment: (EquipmentItem | undefined | null)[]) => {
    if (!equipment) return undefined;
    return equipment.find(item => {
        if (!item) return false;
        const tid = Object.keys(ITEM_TEMPLATES).find(k => item.id === k || item.id.startsWith(k + '_'));
        const template = tid ? ITEM_TEMPLATES[tid] : null;
        return (template as any)?.relevantActions?.includes(type);
    });
};

export const ScytheSweepGame: React.FC<{
    onComplete: (score: number) => void,
    equipment?: EquipmentItem[],
    speedMultiplier?: number,
    possibleYield?: number,
    resourceName?: string
}> = ({ onComplete, equipment = [], speedMultiplier = 1.0, possibleYield = 10, resourceName = 'Korn' }) => {
    const [progress, setProgress] = useState(0);
    const [swings, setSwings] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [shake, setShake] = useState(false);
    const [isHitStopping, setIsHitStopping] = useState(false); // New State

    const handleMove = () => {
        if (isFinished || isHitStopping) return; // Block input
        setProgress(p => {
            const next = p + (2 * speedMultiplier); // Faster progress per pixel moved
            if (next >= 100) {
                // SWING COMPLETE
                const bestTool = getBestToolForAction('WORK', equipment);
                const toolYieldBonus = bestTool?.stats?.yieldBonus || 0;

                const baseHitYield = Math.ceil((possibleYield / 5) * 1.25);
                const toolHitBonus = Math.ceil((toolYieldBonus / 5) * 1.25);

                // HIT STOP EFFECT
                setShake(true);
                setIsHitStopping(true);

                animationManager.spawnFloatingText(`+ ${baseHitYield} ${resourceName} ${toolHitBonus > 0 ? `(+${toolHitBonus})` : ''} `, 50, 40, 'text-amber-400 font-black text-xl');
                animationManager.spawnParticles(50, 50, 'bg-emerald-400'); // Green for grass/grain

                setTimeout(() => {
                    setShake(false);
                    setIsHitStopping(false);
                }, 100);

                setSwings(s => {
                    if (s + 1 >= 5) { setIsFinished(true); setTimeout(() => onComplete(1.0), 800); }
                    return s + 1;
                });
                return 0;
            }
            return next;
        });
    };

    return (
        <div onMouseMove={handleMove} className={`p-8 text-center min-h-[600px] relative flex flex-col items-center justify-center overflow-hidden ${shake ? 'animate-shake' : ''} `} style={{ backgroundImage: 'url("/images/minigames/agriculture_bg.png")', backgroundSize: 'cover' }}>
            <div className={`absolute inset-0 bg-black/50 z-0 transition-all duration-75 ${isHitStopping ? 'bg-emerald-900/40 mix-blend-hard-light' : ''}`} />
            <div className={`relative z-10 w-full flex flex-col items-center transition-all duration-75 ${isHitStopping ? 'scale-105 brightness-150 contrast-125' : ''}`}>
                <h2 className="text-3xl font-black text-white mb-4">Scythe Sweep</h2>
                <div className="w-full h-4 bg-white/10 rounded-full mb-8 border border-white/20 overflow-hidden">
                    <div className="h-full bg-amber-400 transition-all duration-75" style={{ width: `${progress}% ` }} />
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, i) => <div key={i} className={`w-8 h-8 rounded-lg border-2 ${swings > i ? 'bg-amber-500 border-amber-300' : 'border-white/20'} `} />)}
                </div>
                <div className="mt-8 text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">
                    Beveg musen raskt frem og tilbake!
                </div>
            </div>
        </div>
    );
};
