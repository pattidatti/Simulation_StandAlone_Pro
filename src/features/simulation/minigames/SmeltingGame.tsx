
import React, { useEffect, useRef } from 'react';
import { animationManager } from '../logic/AnimationManager';
import { useSmeltingTick } from './hooks/useSmeltingTick';
import { ThermometerGauge } from './components/ThermometerGauge';
import { BellowsButton } from './components/BellowsButton';

export const SmeltingGame: React.FC<{ onComplete: (score: number) => void, speedMultiplier?: number }> = ({ onComplete, speedMultiplier = 1.0 }) => {
    const {
        heatRef,
        progressRef,
        targetRange,
        shakeIntensity,
        gameState,
        pump
    } = useSmeltingTick({ onComplete, speedMultiplier });

    const containerRef = useRef<HTMLDivElement>(null);
    const progressOrbRef = useRef<HTMLDivElement>(null);

    // Visual Loop for Container Shake and Progress Update
    useEffect(() => {
        let rafId: number;
        const update = () => {
            // 1. Apply Shake to Container
            if (containerRef.current) {
                if (shakeIntensity > 0) {
                    const x = (Math.random() - 0.5) * shakeIntensity * 4;
                    const y = (Math.random() - 0.5) * shakeIntensity * 4;
                    containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
                } else {
                    containerRef.current.style.transform = 'none';
                }
            }

            // 2. Update Progress Display
            if (progressOrbRef.current) {
                const p = progressRef.current;
                progressOrbRef.current.style.background = `conic-gradient(#f97316 ${p}%, transparent 0)`;
                // Text content update efficiently?
                // Using innerText is fast enough for 60fps
                const textEl = progressOrbRef.current.querySelector('[data-role="progress-text"]') as HTMLElement;
                if (textEl) {
                    textEl.innerText = `${Math.floor(p)}%`;
                }
            }

            rafId = requestAnimationFrame(update);
        };
        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, [shakeIntensity, progressRef]);

    const handlePump = () => {
        pump();
        // Particle FX
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            animationManager.spawnParticles(
                rect.left + rect.width / 2,
                rect.bottom - 100,
                'bg-orange-200'
            );
        }
    };

    return (
        <div
            ref={containerRef}
            className="p-8 min-h-[600px] w-full relative flex flex-col items-center justify-center overflow-hidden select-none"
            style={{
                backgroundImage: 'url("/images/minigames/smeltery_bg.png")',
                backgroundSize: 'cover',
                backgroundColor: '#1a0f0a'
            }}
        >
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/70 z-0 backdrop-blur-[2px]" />

            {/* Header */}
            <div className="relative z-10 text-center mb-8">
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600 uppercase tracking-tighter drop-shadow-2xl filter contrast-125">
                    Smelting
                </h2>
                <div className="text-orange-200/80 font-bold uppercase tracking-[0.2em] text-xs mt-2">
                    Hold varmen i sonen
                </div>
            </div>

            {/* Main Game Area */}
            <div className="relative z-10 flex gap-12 items-end">
                {/* Left: Thermometer */}
                <div className="flex flex-col items-center gap-2">
                    <ThermometerGauge heatRef={heatRef} targetRange={targetRange} />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Heat</span>
                </div>

                {/* Right: Progress Orb */}
                <div className="flex flex-col items-center gap-4 mb-4">
                    <div
                        role="progressbar"
                        aria-valuenow={Math.round(progressRef.current)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="relative w-32 h-32 rounded-full bg-slate-900 border-4 border-slate-700 shadow-xl flex items-center justify-center"
                    >
                        {/* Conic Gradient for Progress */}
                        <div
                            ref={progressOrbRef}
                            className="absolute inset-0 rounded-full opacity-80"
                            style={{ background: `conic-gradient(#f97316 0%, transparent 0)` }}
                        />
                        {/* Inner Mask for Ring Effect */}
                        <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                            <span data-role="progress-text" className="text-3xl font-black text-white">0%</span>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fremgang</span>
                </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 mt-12">
                <BellowsButton onPump={handlePump} />
            </div>

            {/* Win Overlay */}
            {gameState === 'won' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-4 animate-in zoom-in-50 duration-500">
                        <div className="text-7xl">🔥</div>
                        <div className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(249,115,22,0.8)]">
                            PERFEKT!
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
