import React, { useState, useEffect, useRef } from 'react';
import { animationManager } from '../logic/AnimationManager';

export const CraftingGame: React.FC<{ onComplete: (score: number) => void, speedMultiplier?: number }> = ({ onComplete, speedMultiplier = 1.0 }) => {
    const [targetPos, setTargetPos] = useState(50);
    const [cursorPos, setCursorPos] = useState(50);
    const [hits, setHits] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [shake, setShake] = useState(false);
    const [isHitStopping, setIsHitStopping] = useState(false); // New State
    const targetDir = useRef(1);

    useEffect(() => {
        if (isFinished || isHitStopping) return; // Pause loop
        const interval = setInterval(() => {
            setTargetPos(p => {
                let next = p + (0.8 * targetDir.current * speedMultiplier);
                if (next > 90) { targetDir.current = -1; return 90; }
                if (next < 10) { targetDir.current = 1; return 10; }
                return next;
            });
        }, 16);
        return () => clearInterval(interval);
    }, [isFinished, speedMultiplier, isHitStopping]); // Add isHitStopping

    // Spacebar Support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                // Mock click event at center of screen for visual effects
                handleHit({
                    clientX: window.innerWidth / 2,
                    clientY: window.innerHeight / 2
                } as any);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFinished, cursorPos, targetPos, isHitStopping]); // Re-bind

    const handleHit = (e: React.MouseEvent) => {
        if (isFinished || isHitStopping) return;

        const dist = Math.abs(cursorPos - targetPos);
        const clickX = e.clientX;
        const clickY = e.clientY;

        if (dist < 12) {
            // GREAT HIT
            setShake(true);
            setIsHitStopping(true); // Freeze

            setHits(h => {
                const next = h + 1;
                if (next >= 5) {
                    setIsFinished(true);
                    animationManager.spawnFloatingText("MESTERVERK! ⚔️", clickX, clickY - 60, 'text-amber-400 text-3xl font-black');
                    setTimeout(() => onComplete(1.0), 1200);
                }
                return next;
            });
            animationManager.spawnParticles(clickX, clickY, 'bg-amber-400');
            animationManager.spawnFloatingText("KLANG!", clickX, clickY - 40, 'text-amber-500 font-black');

            setTimeout(() => {
                setShake(false);
                setIsHitStopping(false);
            }, 100);
        } else if (dist < 25) {
            // OK HIT
            animationManager.spawnFloatingText("Treff", clickX, clickY - 40, 'text-white font-bold');
            animationManager.spawnParticles(clickX, clickY, 'bg-white');
        } else {
            // MISS
            animationManager.spawnFloatingText("BOM!", clickX, clickY - 40, 'text-slate-500 font-bold');
        }
    };

    return (
        <div
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setCursorPos(((e.clientX - rect.left) / rect.width) * 100);
            }}
            onClick={handleHit}
            className={`p-12 min-h-[600px] relative flex flex-col items-center justify-center overflow-hidden cursor-crosshair ${shake ? 'animate-shake' : ''}`}
            style={{ backgroundImage: 'url("/images/minigames/smithing_bg.png")', backgroundSize: 'cover', backgroundColor: '#0f172a' }}
        >
            <div className={`absolute inset-0 bg-black/70 z-0 transition-all duration-75 ${isHitStopping ? 'bg-amber-900/40 mix-blend-hard-light' : ''}`} />

            <div className={`relative z-10 text-center mb-12 transition-all duration-75 ${isHitStopping ? 'scale-105 brightness-150 contrast-125' : ''}`}>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-xl">Smedarbeid</h2>
                <div className="text-amber-500 font-black uppercase tracking-widest text-xs mt-2 bg-black/40 px-4 py-1 rounded-full border border-amber-500/20">
                    Slag: {hits} / 5
                </div>
            </div>

            <div className={`relative z-10 w-full max-w-2xl space-y-4 transition-all duration-75 ${isHitStopping ? 'scale-105' : ''}`}>
                <div className="w-full h-24 bg-slate-900/50 rounded-2xl border-2 border-white/10 shadow-2xl flex items-center px-4 overflow-hidden">
                    {/* Progress back-glow */}
                    <div className="absolute inset-0 bg-amber-500/5 transition-all duration-1000" style={{ opacity: hits / 5 }} />

                    {/* Bar backdrop */}
                    <div className="relative w-full h-4 bg-white/5 rounded-full overflow-hidden">
                        {/* Target Zone */}
                        <div
                            className="absolute inset-y-0 w-24 bg-amber-500/40 blur-sm mix-blend-screen transition-all duration-75"
                            style={{ left: `${targetPos}%`, transform: 'translateX(-50%)' }}
                        />
                        <div
                            className="absolute inset-y-0 w-12 bg-white/40 blur-[2px]"
                            style={{ left: `${targetPos}%`, transform: 'translateX(-50%)' }}
                        />

                        {/* Cursor */}
                        <div
                            className="absolute inset-y-0 w-1 bg-white shadow-[0_0_15px_white] z-20"
                            style={{ left: `${cursorPos}%`, transform: 'translateX(-50%)' }}
                        />
                    </div>
                </div>

                {/* Progress Bar Footer */}
                <div className="flex items-center gap-4 px-2">
                    <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                            style={{ width: `${(hits / 5) * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{Math.round((hits / 5) * 100)}%</span>
                </div>
            </div>

            {isFinished && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                    <div className="text-6xl font-black text-amber-500 animate-bounce drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">FERDIG! ⚔️</div>
                </div>
            )}

            <div className={`mt-12 text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse relative z-10 transition-opacity ${isHitStopping ? 'opacity-0' : 'opacity-100'}`}>
                Klikk når markøren er over den glødende sonen
            </div>
        </div>
    );
};
