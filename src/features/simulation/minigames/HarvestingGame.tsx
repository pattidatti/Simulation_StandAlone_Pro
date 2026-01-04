import React, { useState, useEffect, useRef } from 'react';
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

export const HarvestingGame: React.FC<{
    onComplete: (score: number) => void,
    equipment?: EquipmentItem[],
    isMining?: boolean,
    isQuarrying?: boolean,
    isForaging?: boolean,
    speedMultiplier?: number,
    possibleYield?: number,
    resourceName?: string
}> = ({ onComplete, equipment = [], isMining, isQuarrying, isForaging, speedMultiplier = 1.0, possibleYield = 10, resourceName = 'Ressurs' }) => {
    const [pointerPos, setPointerPos] = useState(0);
    const [strikes, setStrikes] = useState<number[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [shake, setShake] = useState(false);
    const [isHitStopping, setIsHitStopping] = useState(false); // New State
    const dirRef = useRef(1);

    // Drifting Target Logic
    const [targetPos, setTargetPos] = useState(50);
    const targetDirRef = useRef(1);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleStrike();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [strikes, isFinished, pointerPos, targetPos, equipment, speedMultiplier, isHitStopping]); // Added isHitStopping dependency

    useEffect(() => {
        if (strikes.length >= 5 || isFinished || isHitStopping) return; // Pause game loop during hit stop
        const interval = setInterval(() => {
            // Move pointer
            setPointerPos(prev => {
                let speed = 2 / speedMultiplier;
                let next = prev + (speed * dirRef.current);
                if (next > 100) { dirRef.current = -1; return 100; }
                if (next < 0) { dirRef.current = 1; return 0; }
                return next;
            });

            // Move Target (Drift)
            setTargetPos(prev => {
                const driftSpeed = 0.3; // Slower drift
                let next = prev + (driftSpeed * targetDirRef.current);

                // Randomly change direction sometimes to make it unpredictable
                if (Math.random() < 0.02) targetDirRef.current *= -1;

                if (next > 80) { targetDirRef.current = -1; return 80; }
                if (next < 20) { targetDirRef.current = 1; return 20; }
                return next;
            });

        }, 16);
        return () => clearInterval(interval);
    }, [strikes.length, isFinished, speedMultiplier, isHitStopping]); // Added isHitStopping

    const handleStrike = () => {
        if (strikes.length >= 5 || isFinished || isHitStopping) return; // Block input

        // Calculate distance from dynamic target position instead of static 50
        const distance = Math.abs(pointerPos - targetPos);

        let score = distance < 5 ? 1.0 : distance < 15 ? 0.7 : distance < 25 ? 0.4 : 0.1;

        // Calculate yield for this hit
        const actionType = isMining ? 'MINE' : isQuarrying ? 'QUARRY' : isForaging ? 'FORAGE' : 'WORK';
        const bestTool = getBestToolForAction(actionType, equipment);
        const toolYieldBonus = bestTool?.stats?.yieldBonus || 0;

        const baseHitYield = Math.ceil((possibleYield / 5) * (0.5 + score));
        const toolHitBonus = Math.ceil((toolYieldBonus / 5) * (0.5 + score));

        if (distance < 15) { // Any good hit triggers punch
            setShake(true);
            setIsHitStopping(true); // Freeze

            animationManager.spawnParticles(50, 40, distance < 5 ? 'bg-amber-400' : 'bg-white');

            if (distance < 5) {
                animationManager.spawnFloatingText(`PERFEKT! + ${baseHitYield} ${toolHitBonus > 0 ? `(+${toolHitBonus})` : ''} `, 50, 40, 'text-amber-400 font-black text-2xl');
            } else {
                animationManager.spawnFloatingText(`Bra! +${baseHitYield}`, 50, 40, 'text-white font-bold');
            }

            setTimeout(() => {
                setShake(false);
                setIsHitStopping(false); // Release
            }, 100);
        } else {
            animationManager.spawnFloatingText(`Svakt...`, 50, 40, 'text-slate-500 font-bold');
        }

        const newStrikes = [...strikes, score];
        setStrikes(newStrikes);
        if (newStrikes.length === 5) {
            setIsFinished(true);
            setTimeout(() => onComplete(newStrikes.reduce((a, b) => a + b, 0) / 5), 800);
        }
    };

    const bg = isMining || isQuarrying ? 'url("/images/minigames/mining_bg.png")' : isForaging ? 'url("/images/minigames/foraging_bg.png")' : 'url("/images/minigames/agriculture_bg.png")';

    return (
        <div className={`p-8 text-center min-h-[600px] relative flex flex-col items-center justify-center overflow-hidden ${shake ? 'animate-shake' : ''} `} style={{ backgroundImage: bg, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className={`absolute inset-0 bg-black/70 z-0 transition-all duration-75 ${isHitStopping ? 'bg-indigo-900/50 mix-blend-hard-light' : ''}`} />
            <div className={`relative z-10 w-full flex flex-col items-center transition-all duration-75 ${isHitStopping ? 'scale-105 brightness-150 contrast-125' : ''}`}>
                <h2 className="text-4xl font-black text-white mb-8 drop-shadow-lg tracking-tighter uppercase">{isMining ? 'Gruvedrift' : isQuarrying ? 'Steinhugger' : isForaging ? 'Sanking' : 'Kornhøsting'}</h2>
                {!isFinished ? (
                    <>
                        <div className="mb-4 text-xs font-black text-amber-500 uppercase tracking-widest">{resourceName}</div>
                        <div className="w-full h-8 bg-white/5 rounded-full mb-12 relative border border-white/10 overflow-hidden shadow-inner">
                            {/* Drifting Target Zone Visual */}
                            <div
                                className="absolute inset-y-0 bg-amber-500/30 border-x border-amber-500/50 transition-all duration-75 linear"
                                style={{
                                    left: `${targetPos - 8}%`, // Visual width approx 16%
                                    right: `${100 - (targetPos + 8)}%`
                                }}
                            />
                            {/* Center Marker of Target */}
                            <div
                                className="absolute inset-y-0 w-0.5 bg-amber-400/80 z-0"
                                style={{ left: `${targetPos}%` }}
                            />

                            {/* Player Cursor */}
                            <div className="absolute inset-y-0 w-1 bg-white shadow-[0_0_20px_white] z-10" style={{ left: `${pointerPos}% ` }} />
                        </div>
                        <button onClick={handleStrike} className={`w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-7 rounded-[2rem] font-black text-2xl shadow-2xl transition-all uppercase tracking-widest border-b-4 border-amber-700 ${isHitStopping ? 'scale-95 brightness-125' : 'active:scale-95'}`}>
                            KLIKK NÅ! ⚡
                        </button>
                    </>
                ) : (
                    <div className="py-12 animate-bounce text-5xl font-black text-amber-500 uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">FERDIG! ✨</div>
                )}
            </div>
        </div>
    );
};
