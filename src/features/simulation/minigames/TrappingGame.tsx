import React, { useState, useEffect } from 'react';
import { animationManager } from '../logic/AnimationManager';

export const TrappingGame: React.FC<{ onComplete: (score: number) => void, speedMultiplier?: number }> = ({ onComplete, speedMultiplier = 1.0 }) => {
    const [pos, setPos] = useState(0);
    const [captured, setCaptured] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [targetPos, setTargetPos] = useState(50);
    const [dir, setDir] = useState(1);

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
            setCaptured(c => {
                animationManager.spawnFloatingText("FANT DEN! ✨", 50, 40, "text-sky-400");
                if (c + 1 >= 3) { setIsFinished(true); setTimeout(() => onComplete(1.0), 800); }
                return c + 1;
            });
            setTargetPos(20 + Math.random() * 60);
        }
    };

    return (
        <div className="p-12 text-center min-h-[600px] relative flex flex-col items-center justify-center overflow-hidden" style={{ backgroundImage: 'url("/images/minigames/foraging_bg.png")', backgroundSize: 'cover' }}>
            <div className="absolute inset-0 bg-black/70 z-0" />
            <h2 className="relative z-10 text-4xl font-black text-white mb-12 tracking-tighter uppercase italic">Snarefiske 🎣</h2>

            <div className="relative z-10 w-full max-w-sm h-12 bg-white/5 rounded-full border border-white/10 mb-12 shadow-inner">
                <div className="absolute inset-y-0 w-20 bg-amber-500/40 border-x-2 border-amber-500/50 rounded-lg blur-[2px]" style={{ left: `${targetPos}% `, transform: 'translateX(-50%)' }} />
                <div className="absolute inset-y-0 w-2 bg-white shadow-[0_0_15px_white]" style={{ left: `${pos}% ` }} />
            </div>

            <div className="relative z-10 flex gap-4 mb-12">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${captured > i ? 'bg-amber-500 border-amber-300 scale-110' : 'bg-white/5 border-white/10 opacity-30 shadow-inner'} `}>
                        🐟
                    </div>
                ))}
            </div>

            <button onClick={handleCatch} className="relative z-10 w-full max-w-md bg-sky-500 hover:bg-sky-400 text-white py-7 rounded-[2rem] font-black text-2xl shadow-2xl active:scale-95 transition-all uppercase tracking-widest border-b-4 border-sky-700">HAL INN! ⚓</button>
        </div>
    );
};
