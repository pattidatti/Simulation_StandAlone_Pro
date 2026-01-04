import React, { useState, useEffect, useCallback } from 'react';
import { animationManager } from '../logic/AnimationManager';

export const SawingGame: React.FC<{
    onComplete: (score: number) => void,
    speedMultiplier?: number
}> = ({ onComplete, speedMultiplier = 1.0 }) => {
    const [progress, setProgress] = useState(0);
    const [strokeCount, setStrokeCount] = useState(0);
    const [isPulling, setIsPulling] = useState(true); // Pull vs Push
    const [indicatorPos, setIndicatorPos] = useState(0); // 0-100
    const [isFinished, setIsFinished] = useState(false);
    const [direction, setDirection] = useState(1); // 1 = right, -1 = left

    // Move the rhythmic indicator
    useEffect(() => {
        if (isFinished) return;

        const interval = setInterval(() => {
            setIndicatorPos((prev) => {
                let next = prev + (direction * 3 * speedMultiplier);
                if (next >= 100) {
                    setDirection(-1);
                    return 100;
                }
                if (next <= 0) {
                    setDirection(1);
                    return 0;
                }
                return next;
            });
        }, 16);

        return () => clearInterval(interval);
    }, [direction, isFinished, speedMultiplier]);

    const handleAction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (isFinished) return;

        // Sweet spot is in the center (40-60)
        const distance = Math.abs(indicatorPos - 50);
        const isSweetSpot = distance < 15;
        const isMiss = distance > 35;

        // Determine quality
        let quality = 0;
        let text = "";
        let color = "";

        if (isSweetSpot) {
            quality = 1.0;
            text = "PERFEKT!";
            color = "text-amber-400";
        } else if (!isMiss) {
            quality = 0.5;
            text = "BRA!";
            color = "text-emerald-400";
        } else {
            quality = 0.1;
            text = "BOM!";
            color = "text-rose-400";
        }

        // Tactile/Visual Feedback
        const clientX = 'clientX' in e ? e.clientX : (e as any).touches[0].clientX;
        const clientY = 'clientY' in e ? e.clientY : (e as any).touches[0].clientY;

        animationManager.spawnFloatingText(text, clientX, clientY - 40, color);
        if (quality > 0.1) {
            animationManager.spawnParticles(clientX, clientY, quality === 1.0 ? 'bg-amber-400' : 'bg-emerald-400');
        }

        // Update Progress
        setStrokeCount((s) => s + 1);
        setIsPulling(!isPulling);

        const progressInc = quality * 10;
        setProgress((p) => {
            const next = p + progressInc;
            if (next >= 100) {
                setIsFinished(true);
                animationManager.spawnFloatingText("PLANKER FERDIG! 🪵", clientX, clientY - 100, 'text-emerald-400 text-2xl font-black');
                setTimeout(() => onComplete(1.0), 1000);
                return 100;
            }
            return next;
        });
    }, [indicatorPos, isFinished, isPulling, onComplete]);

    return (
        <div className="p-12 text-center min-h-[600px] relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-slate-950 z-0">
                <div className="absolute inset-0 opacity-20 bg-[url('/images/textures/wood_pattern.png')] bg-repeat" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-indigo-500/10 to-transparent" />
            </div>

            <div className="relative z-10 w-full mb-12">
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2 italic drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">Saging</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">Pull og Push i takt for perfekte planker</p>
            </div>

            {/* Sawing Visualization Area */}
            <div className="relative z-10 w-full max-w-2xl h-64 bg-slate-900/50 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden flex items-center justify-center group cursor-pointer"
                onClick={handleAction}>

                {/* Progress Filling Up */}
                <div className="absolute inset-y-0 left-0 bg-indigo-500/20 transition-all duration-500 z-0" style={{ width: `${progress}%` }} />

                {/* The "Log" */}
                <div className="relative w-4/5 h-16 bg-[#3d2b1f] rounded-lg border-2 border-[#2a1d15] shadow-2xl flex items-center">
                    <div className="absolute inset-0 opacity-30 bg-[url('/images/textures/bark.png')] bg-cover mix-blend-overlay" />

                    {/* The Saw (Visual representation of pull/push) */}
                    <div className={`absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform duration-300 ${isPulling ? '-rotate-12 translate-x-4' : 'rotate-12 -translate-x-4'}`}>
                        <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">🪚</div>
                    </div>

                    {/* Sawdust particles (simulated via CSS for simplicity, logic spawns real ones) */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1 opacity-40">
                        <div className="w-1 h-1 bg-amber-200 rounded-full animate-ping" />
                        <div className="w-1 h-1 bg-amber-400 rounded-full animate-ping delay-75" />
                        <div className="w-1 h-1 bg-amber-100 rounded-full animate-ping delay-150" />
                    </div>
                </div>
            </div>

            {/* Rhythm Slider */}
            <div className="relative z-10 mt-12 w-full max-w-md h-12 bg-black/40 rounded-full border border-white/10 p-1 flex items-center shadow-inner">
                {/* Target Zone */}
                <div className="absolute left-1/2 -translate-x-1/2 w-1/4 h-3/4 bg-amber-500/20 blur-sm rounded-full" />
                <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-full bg-amber-500/50" />

                {/* The Moving Slider */}
                <div
                    className="absolute w-8 h-8 bg-white rounded-full shadow-[0_0_20px_white] flex items-center justify-center transition-all duration-16 ease-linear"
                    style={{ left: `${indicatorPos}%`, transform: 'translateX(-50%)' }}
                >
                    <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse" />
                </div>
            </div>

            <div className="relative z-10 mt-8">
                <div className="text-3xl font-black text-indigo-400 italic">
                    {progress.toFixed(0)}%
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
                    Stroke: {strokeCount}
                </div>
            </div>

            {/* Interactive Overlay for whole component */}
            <div className="absolute inset-0 z-20 cursor-pointer" onClick={handleAction} />
        </div>
    );
};
