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

export const WoodcuttingGame: React.FC<{
    onComplete: (score: number) => void,
    equipment?: EquipmentItem[],
    speedMultiplier?: number,
    possibleYield?: number,
    resourceName?: string
}> = ({ onComplete, equipment = [] }) => {
    const [combo, setCombo] = useState(0);
    const [shake, setShake] = useState(false);
    const [isHitStopping, setIsHitStopping] = useState(false);
    const [hits, setHits] = useState(0);
    const [target, setTarget] = useState({ x: 50, y: 50 });
    const [isFinished, setIsFinished] = useState(false);

    const spawn = () => setTarget({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 });

    const handleHit = (e: React.MouseEvent) => {
        if (isHitStopping) return;

        // Hit-Stop effect (tactile feedback)
        setIsHitStopping(true);
        setShake(true);

        const newCombo = combo + 1;
        setCombo(newCombo);

        // Visual feedback only - to avoid confusion with server yield
        const isGreat = newCombo > 5;
        const text = newCombo > 2 ? `${newCombo}x COMBO!` : isGreat ? 'FLAWLESS!' : 'TREFF!';
        const color = isGreat ? 'text-amber-400 font-display' : 'text-white';

        animationManager.spawnFloatingText(text, e.clientX, e.clientY - 40, color);
        animationManager.spawnParticles(e.clientX, e.clientY, isGreat ? 'bg-amber-400' : 'bg-white');

        setTimeout(() => {
            setIsHitStopping(false);
            setShake(false);
            setHits((h: number) => {
                if (h + 1 >= 10) {
                    setIsFinished(true);
                    animationManager.spawnFloatingText("FULLFØRT! 🪓", e.clientX, e.clientY - 100, 'text-emerald-400 text-2xl');
                    setTimeout(() => onComplete(1.0), 1200);
                }
                return h + 1;
            });
            spawn();
        }, 80); // Sharper hit-stop
    };

    const bestTool = getBestToolForAction('CHOP', equipment);

    return (
        <div className={`p-8 text-center min-h-[600px] relative flex flex-col items-center justify-center overflow-hidden ${shake ? 'animate-shake' : ''} `} style={{ backgroundImage: 'url("/images/minigames/forestry_bg.png")', backgroundSize: 'cover' }}>
            <div className="absolute inset-0 bg-black/60 z-0" />

            <div className="relative z-10 w-full mb-8">
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-4xl font-black text-white drop-shadow-lg tracking-tighter uppercase">Tømmerhogging</h2>
                    <div className="flex gap-4">
                        <div className="text-amber-400 font-black uppercase tracking-widest text-xs px-4 py-1 bg-black/40 rounded-full inline-block border border-amber-500/20">Framdrift: {hits}/10</div>
                        {combo > 0 && (
                            <div className="text-rose-500 font-black uppercase tracking-widest text-xs px-4 py-1 bg-rose-500/10 rounded-full inline-block border border-rose-500/30 animate-bounce">
                                COMBO: x{combo}
                            </div>
                        )}
                        {bestTool && (
                            <div className="text-indigo-400 font-black uppercase tracking-widest text-xs px-4 py-1 bg-indigo-500/10 rounded-full inline-block border border-indigo-500/30">
                                {bestTool.icon} {bestTool.name}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`relative z-10 w-full h-96 bg-white/5 rounded-[3rem] border border-white/10 shadow-inner overflow-hidden ${isHitStopping ? 'opacity-90 grayscale-[0.5]' : ''}`}>
                {/* Progress Bar in the background */}
                <div className="absolute bottom-0 left-0 h-2 bg-indigo-500/50 transition-all duration-300 z-0" style={{ width: `${(hits / 10) * 100}%` }} />

                {!isFinished ? (
                    <button
                        onClick={handleHit}
                        onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                        className={`absolute w-20 h-20 bg-rose-500 rounded-full border-4 border-white shadow-[0_0_30px_rose] transition-all active:scale-90 ${isHitStopping ? 'scale-110 brightness-150' : 'animate-pulse cursor-pointer'}`}
                        style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        🪓
                    </button>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="animate-bounce text-5xl font-black text-amber-500 uppercase tracking-tighter drop-shadow-2xl">VEDHOGST FERDIG! 🪵</div>
                        <div className="text-xl font-black text-white uppercase tracking-widest bg-indigo-600 px-8 py-2 rounded-full shadow-lg">Maks Combo: {combo}</div>
                    </div>
                )}
            </div>
        </div>
    );
};
