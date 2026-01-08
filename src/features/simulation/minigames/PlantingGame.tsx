import React, { useState } from 'react';

import { animationManager } from '../logic/AnimationManager';

export const PlantingGame: React.FC<{ onComplete: (score: number) => void }> = ({ onComplete }) => {
    const [seeds, setSeeds] = useState<{ x: number, y: number, id: number }[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const quota = 10;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isFinished) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newSeed = { x, y, id: Date.now() };

        animationManager.spawnParticles(x, y, 'bg-emerald-400');

        setSeeds(prev => {
            const next = [...prev, newSeed];
            if (next.length >= quota) {
                setIsFinished(true);
                setTimeout(() => onComplete(1.0), 1500);
            }
            return next;
        });
    };

    return (
        <div
            onClick={handleClick}
            className="w-full h-[600px] relative overflow-hidden cursor-crosshair group active:scale-[0.99] transition-transform select-none"
            style={{
                backgroundImage: 'url("/images/minigames/agriculture_bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none z-20 text-center">
                {!isFinished ? (
                    <>
                        <h2 className="text-3xl font-black text-white drop-shadow-md mb-2">Så dine frø</h2>
                        <div className="bg-black/40 px-4 py-1 rounded-full text-emerald-400 font-bold uppercase tracking-widest text-sm inline-block">
                            {seeds.length} / {quota}
                        </div>
                    </>
                ) : (
                    <div className="animate-in zoom-in duration-300">
                        <h2 className="text-5xl font-black text-emerald-400 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] uppercase tracking-tighter animate-bounce">
                            Mestrerlig Sådd! 🌱
                        </h2>
                    </div>
                )}
            </div>

            {/* Seeds */}
            {seeds.map((s) => (
                <div
                    key={s.id}
                    className="absolute w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-in zoom-in duration-300"
                    style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-white/50" />
                </div>
            ))}

            {/* Cursor Hint */}
            <div className="absolute inset-0 pointer-events-none z-10 hidden group-hover:block">
                <div className="absolute w-8 h-8 border-2 border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
        </div>
    );
};
