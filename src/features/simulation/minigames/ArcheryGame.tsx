import React, { useState, useEffect, useRef } from 'react';
import { animationManager } from '../logic/AnimationManager';

interface ArcheryGameProps {
    onComplete: (score: number) => void;
    speedMultiplier?: number;
}

export const ArcheryGame: React.FC<ArcheryGameProps> = ({ onComplete, speedMultiplier = 1.0 }) => {
    const [score, setScore] = useState(0);
    const [shotsLeft, setShotsLeft] = useState(5);
    const [isFinished, setIsFinished] = useState(false);

    // Aiming State
    const [aimX, setAimX] = useState(50);
    const [aimY, setAimY] = useState(50);

    // Sway State
    const timeRef = useRef(0);
    const requestRef = useRef<number>(0);

    // Target positions (Randomize slightly per shot?)
    const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });

    useEffect(() => {
        if (isFinished) return;

        const animate = () => {
            timeRef.current += 0.02 * speedMultiplier;

            // Procedural Sway (Lissajous-ish curve)
            const swayX = Math.sin(timeRef.current) * 15 + Math.cos(timeRef.current * 2.3) * 10;
            const swayY = Math.cos(timeRef.current * 0.8) * 10 + Math.sin(timeRef.current * 1.5) * 5;

            // Mouse moves "Base" aim, sway is added on top
            // Ideally we'd capture mouse movement, but for a web-minigame without pointer lock, 
            // auto-sway around a moving center is tricky.
            // Let's invert it: The CROSSHAIR is fixed (or follows mouse), the SCREEN/TARGET sways?
            // Easier: Crosshair moves automatically in a pattern (Sway), user must click when aligned.

            setAimX(50 + swayX);
            setAimY(50 + swayY);

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [isFinished, speedMultiplier]);

    const handleShoot = () => {
        if (isFinished || shotsLeft <= 0) return;

        // Calculate Distance
        const dx = aimX - targetPos.x;
        const dy = aimY - targetPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let points = 0;
        let text = "BOM!";
        let color = "text-rose-500";

        if (dist < 3) {
            points = 50;
            text = "BULLSEYE! 🎯";
            color = "text-amber-400";
            animationManager.spawnParticles(50, 50, 'bg-amber-400');
        } else if (dist < 8) {
            points = 20;
            text = "TREFF!";
            color = "text-emerald-400";
            animationManager.spawnParticles(50, 50, 'bg-white');
        } else if (dist < 15) {
            points = 5;
            text = "KANTEN...";
            color = "text-slate-400";
        }

        animationManager.spawnFloatingText(text, 50, 40, color);
        setScore(s => s + points);
        setShotsLeft(s => {
            const next = s - 1;
            if (next <= 0) {
                setIsFinished(true);
                // Calculate final score: Max theoretical is 250. 
                // Let's say > 100 is Perfect (1.2), > 50 is Good (1.0), else 0.8
                let performance = 0.5;
                if ((score + points) >= 100) performance = 1.2;
                else if ((score + points) >= 50) performance = 1.0;
                else performance = 0.8;

                setTimeout(() => onComplete(performance), 2000);
            } else {
                // New target position slightly randomized
                setTargetPos({
                    x: 45 + Math.random() * 10,
                    y: 45 + Math.random() * 10
                });
            }
            return next;
        });
    };

    return (
        <div
            onClick={handleShoot}
            className="relative w-full h-[600px] overflow-hidden bg-slate-900 cursor-crosshair select-none group"
            style={{
                backgroundImage: 'url("/images/minigames/archery_bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center 30%' // Aim up slightly
            }}
        >
            {/* First Person Overlay (Vignette) */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />

            {/* Target */}
            <div
                className="absolute w-32 h-32 rounded-full bg-white border-4 border-slate-800 shadow-2xl flex items-center justify-center transition-all duration-500"
                style={{
                    left: `${targetPos.x}%`,
                    top: `${targetPos.y}%`,
                    transform: 'translate(-50%, -50%) scale(0.8)'
                }}
            >
                <div className="w-24 h-24 rounded-full bg-rose-600 border-4 border-white flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-rose-600 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-rose-600 shadow-inner" />
                    </div>
                </div>
            </div>

            {/* Crosshair (Sways) */}
            <div
                className="absolute pointer-events-none transition-transform duration-75 ease-out z-20"
                style={{
                    left: `${aimX}%`,
                    top: `${aimY}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                {/* Crosshair Graphic */}
                <div className="relative w-16 h-16 opacity-80">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white shadow-sm" />
                    <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white shadow-sm" />
                    <div className="absolute inset-0 border-2 border-white/50 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_10px_red]" />
                </div>
            </div>

            {/* Bow Graphic (Static bottom) */}
            <div className="absolute bottom-0 right-10 w-96 h-96 pointer-events-none z-10 translate-y-10 rotate-[-10deg]">
                {/* Abstract Bow Representation - SVG or CSS Art */}
                <div className="w-full h-full relative">
                    {/* Bow Riser */}
                    <div className="absolute bottom-0 right-20 w-8 h-80 bg-stone-800 rounded-full origin-bottom rotate-12" />
                    {/* String */}
                    <div className="absolute bottom-20 right-24 w-0.5 h-[400px] bg-white/20 rotate-12 origin-bottom border-l border-dashed border-white/30" />
                </div>
            </div>

            {/* HUD */}
            <div className="absolute top-8 left-8 text-white font-black text-2xl drop-shadow-md">
                SCORE: <span className="text-amber-400">{score}</span>
            </div>
            <div className="absolute top-8 right-8 flex gap-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`text-3xl transition-opacity ${i < shotsLeft ? 'opacity-100' : 'opacity-20 grayscale'}`}>
                        🏹
                    </div>
                ))}
            </div>

            {!isFinished && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70 text-sm font-bold uppercase tracking-widest animate-pulse">
                    Klikk for å skyte
                </div>
            )}

            {isFinished && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 animate-in fade-in run-in">
                    <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                        {score >= 100 ? "Mesterbueskytter!" : "Ferdig!"}
                    </h1>
                </div>
            )}

            {/* Fallback BG Color */}
            <div className="absolute inset-0 bg-stone-800 -z-10" />
        </div>
    );
};
