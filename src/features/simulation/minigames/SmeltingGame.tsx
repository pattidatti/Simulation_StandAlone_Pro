import React, { useState, useEffect, useRef } from 'react';
import { animationManager } from '../logic/AnimationManager';

export const SmeltingGame: React.FC<{ onComplete: (score: number) => void, speedMultiplier?: number }> = ({ onComplete, speedMultiplier = 1.0 }) => {
    const [heat, setHeat] = useState(20); // 0-100
    const [targetRange] = useState({ min: 60, max: 85 });
    const [progress, setProgress] = useState(0); // 0-100
    const [isFinished, setIsFinished] = useState(false);

    const requestRef = useRef<number>(null);
    const lastTimeRef = useRef<number>(null);

    const animate = (time: number) => {
        if (isFinished) return;

        if (lastTimeRef.current === undefined || lastTimeRef.current === null) {
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        if (lastTimeRef.current !== undefined) {
            const deltaTime = time - lastTimeRef.current;

            // Heat decay
            setHeat(h => Math.max(0, h - (0.015 * deltaTime * speedMultiplier)));

            // Target movement (optional: make it move slightly over time)
            // For now keep it static for simplicity but could oscillate.

            // Check if in range
            setHeat(h => {
                if (h >= targetRange.min && h <= targetRange.max) {
                    setProgress(p => {
                        const next = p + (0.01 * deltaTime);
                        if (next >= 100 && !isFinished) {
                            setIsFinished(true);
                            animationManager.spawnFloatingText("PERFEKT TEMPERATUR! 🔥", window.innerWidth / 2, window.innerHeight / 2, 'text-orange-500 text-4xl font-black');
                            setTimeout(() => onComplete(1.0), 1000);
                        }
                        return next;
                    });
                }
                return h;
            });
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isFinished]);

    const handlePump = () => {
        if (isFinished) return;
        setHeat(h => Math.min(100, h + 12));
        animationManager.spawnParticles(window.innerWidth / 2, window.innerHeight / 2 + 100, 'bg-orange-500');
        animationManager.spawnFloatingText("PUST!", window.innerWidth / 2, window.innerHeight / 2 + 50, 'text-slate-400 font-bold text-xs uppercase');
    };

    return (
        <div
            onClick={handlePump}
            className="p-12 min-h-[600px] relative flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
            style={{ backgroundImage: 'url("/images/minigames/smeltery_bg.png")', backgroundSize: 'cover' }}
        >
            <div className="absolute inset-0 bg-black/80 z-0" />

            <div className="relative z-10 text-center mb-12">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-xl">Smelting</h2>
                <div className="text-orange-500 font-black uppercase tracking-widest text-xs mt-2 bg-black/40 px-4 py-1 rounded-full border border-orange-500/20">
                    Hold varmen i den oransje sonen
                </div>
            </div>

            <div className="relative z-10 flex gap-12 items-end h-80">
                {/* Heat Meter */}
                <div className="w-20 h-full bg-slate-900/80 rounded-full border-4 border-white/10 relative overflow-hidden shadow-2xl">
                    {/* Target Zone */}
                    <div
                        className="absolute w-full bg-orange-500/30 border-y-2 border-orange-500/50 flex items-center justify-center"
                        style={{
                            bottom: `${targetRange.min}%`,
                            height: `${targetRange.max - targetRange.min}%`
                        }}
                    >
                        <div className="w-full h-full bg-orange-500/10 animate-pulse" />
                    </div>

                    {/* Heat Level */}
                    <div
                        className={`absolute bottom-0 w-full transition-all duration-75 shadow-[0_0_30px_rgba(249,115,22,0.5)] ${heat > targetRange.max ? 'bg-white' : 'bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400'}`}
                        style={{ height: `${heat}%` }}
                    >
                        {/* Heat Glow */}
                        <div className="absolute top-0 inset-x-0 h-4 bg-white/50 blur-[2px]" />
                    </div>
                </div>

                {/* Progress Column */}
                <div className="flex flex-col gap-4">
                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">Fremgang</div>
                    <div className="w-12 h-64 bg-slate-900/80 rounded-2xl border-2 border-white/5 relative overflow-hidden">
                        <div
                            className="absolute bottom-0 w-full bg-indigo-500 transition-all duration-300"
                            style={{ height: `${progress}%` }}
                        />
                    </div>
                    <div className="text-xl font-black text-white text-center">{Math.round(progress)}%</div>
                </div>
            </div>

            <div className="mt-16 text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse relative z-10 text-center max-w-xs">
                Klikk for å pumpe blåsebelgen og øke varmen
            </div>

            {isFinished && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                    <div className="text-6xl font-black text-orange-500 animate-bounce drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]">FERDIG! 🔥</div>
                </div>
            )}
        </div>
    );
};
