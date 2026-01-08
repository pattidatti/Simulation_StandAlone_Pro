import React, { useState, useEffect } from 'react';
import { animationManager } from '../logic/AnimationManager';

interface TrappingGameProps {
    onComplete: (score: number) => void;
    speedMultiplier?: number;
    variant?: 'water' | 'land';
}

export const TrappingGame: React.FC<TrappingGameProps> = ({ onComplete, speedMultiplier = 1.0, variant = 'water' }) => {
    const [pos, setPos] = useState(0);
    const [captured, setCaptured] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [targetPos, setTargetPos] = useState(50);
    const [dir, setDir] = useState(1);
    const [shake, setShake] = useState(false); // UI Feedback state

    useEffect(() => {
        if (isFinished) return;
        const interval = setInterval(() => {
            setPos(p => {
                let speed = 3 / speedMultiplier; // Slower is easier
                let next = p + (speed * dir);
                if (next > 100) { setDir(-1); return 100; }
                if (next < 0) { setDir(1); return 0; }
                return next;
            });
        }, 16);
        return () => clearInterval(interval);
    }, [dir, isFinished, speedMultiplier]);

    const handleCatch = () => {
        const dist = Math.abs(pos - targetPos);
        if (dist < 10) {
            // HIT
            setShake(true);
            setTimeout(() => setShake(false), 200);

            setCaptured(c => {
                const text = variant === 'land' ? "FANGST! 🐰" : "NAPP! 🐟";
                animationManager.spawnFloatingText(text, 50, 40, "text-emerald-400 font-black text-3xl");
                animationManager.spawnParticles(50, 50, 'bg-emerald-400');

                if (c + 1 >= 3) {
                    setIsFinished(true);
                    setTimeout(() => onComplete(1.0), 1000);
                }
                return c + 1;
            });
            setTargetPos(20 + Math.random() * 60);
        } else {
            // MISS
            setShake(true);
            setTimeout(() => setShake(false), 200);

            const text = variant === 'land' ? "BOM... 🍃" : "INGENTING... 💧";
            animationManager.spawnFloatingText(text, 50, 40, "text-rose-400 font-bold text-xl");
            // Penalty? Maybe just visual feedback for now.
        }
    };

    return (
        <div className={`p-12 text-center min-h-[600px] relative flex flex-col items-center justify-center overflow-hidden transition-transform ${shake ? 'animate-shake' : ''}`}
            style={{
                backgroundImage: variant === 'land' ? 'url("/images/textures/bark.png")' : 'url("/images/minigames/foraging_bg.png")',
                backgroundColor: variant === 'land' ? '#2f3e28' : '#0c4a6e',
                backgroundSize: 'cover'
            }}>
            <div className="absolute inset-0 bg-black/70 z-0" />
            <h2 className="relative z-10 text-4xl font-black text-white mb-12 tracking-tighter uppercase italic drop-shadow-lg">
                {variant === 'land' ? 'Fellefangst 🕸️' : 'Snarefiske 🎣'}
            </h2>

            <div className="relative z-10 w-full max-w-sm h-12 bg-white/5 rounded-full border border-white/10 mb-12 shadow-inner overflow-hidden">
                <div className="absolute inset-y-0 w-20 bg-amber-500/40 border-x-2 border-amber-500/50 rounded-lg blur-[1px]" style={{ left: `${targetPos}%`, transform: 'translateX(-50%)' }} />
                <div className="absolute inset-y-0 w-1 bg-white shadow-[0_0_15px_white] z-20" style={{ left: `${pos}%` }} />
            </div>

            <div className="relative z-10 flex gap-4 mb-12">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all duration-300 ${captured > i ? 'bg-emerald-500 border-emerald-300 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white/5 border-white/10 opacity-30 shadow-inner'} `}>
                        {captured > i ? (variant === 'land' ? '🐰' : '🐟') : ''}
                    </div>
                ))}
            </div>

            <button
                onClick={handleCatch}
                className="relative z-10 w-full max-w-md bg-sky-600 hover:bg-sky-500 text-white py-8 rounded-[2rem] font-black text-3xl shadow-2xl active:scale-95 transition-all uppercase tracking-widest border-b-8 border-sky-800 active:border-b-0 active:translate-y-2 group"
            >
                <span className="drop-shadow-md group-hover:scale-105 inline-block transition-transform">
                    {variant === 'land' ? 'SJEKK FELLA! 🕸️' : 'HAL INN! ⚓'}
                </span>
            </button>
        </div>
    );
};
