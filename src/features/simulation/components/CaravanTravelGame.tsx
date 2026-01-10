import React, { useEffect, useRef, useState } from 'react';
import { CaravanSVG } from './CaravanSVG';
import { motion } from 'framer-motion';

interface CaravanTravelGameProps {
    onComplete: (success: boolean) => void;
    targetRegionId: string;
    caravanLevel: number;
    upgrades: string[];
}

/**
 * CaravanTravelGame - An atmospheric side-scrolling experience representing the journey between regions.
 * Features high-contrast silhouettes and "Central Europe" aesthetics.
 */
export const CaravanTravelGame: React.FC<CaravanTravelGameProps> = ({ onComplete, targetRegionId, caravanLevel, upgrades = [] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [progress, setProgress] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Game State Refs (avoid re-renders for game loop)
    const gameState = useRef({
        distance: 0,
        speed: 0,
        isJumping: false,
        jumpHeight: 0,
        obstacles: [] as { x: number, typ: 'ROCK' | 'BANDIT' | 'MUD' }[],
        lastObstacleTime: 0,
        shake: 0,
        penaltyTimer: 0
    });

    // Parallax Layer configuration
    const layers = useRef([
        { speed: 0.15, height: 280, color: '#0f172a', amplitude: 60, freq: 0.002 }, // Distant mountains
        { speed: 0.4, height: 200, color: '#1e293b', amplitude: 40, freq: 0.005 },  // Middle hills
        { speed: 0.9, height: 120, color: '#334155', amplitude: 30, freq: 0.012 },   // Closer trees/shrubs silhouette
    ]);

    // Handle Input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !gameState.current.isJumping && !isFinished) {
                gameState.current.isJumping = true;
                gameState.current.jumpHeight = 10; // Initial velocity
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFinished]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;
        let lastTime = 0;
        const totalDistance = 10000;

        // UPGRADES LOGIC
        const hasHeavyAxles = upgrades.includes('heavy_axles');
        const hasGuardPost = upgrades.includes('guard_post');
        const hasSilkChests = upgrades.includes('silk_chests'); // Maybe reduces penalty?

        const baseSpeed = 1.2 + (caravanLevel * 0.2) + (hasHeavyAxles ? 0.3 : 0);

        const render = (time: number) => {
            if (!lastTime) lastTime = time;
            const deltaTime = time - lastTime;
            lastTime = time;

            const state = gameState.current;

            if (!isFinished) {
                // Determine current speed (penalty logic)
                let currentSpeed = baseSpeed;
                if (state.penaltyTimer > 0) {
                    // Silk chests absorb shock, reducing the slowdown impact
                    const penaltyMod = hasSilkChests ? 0.6 : 0.3;
                    currentSpeed *= penaltyMod;
                    state.penaltyTimer -= deltaTime;
                }

                state.speed = currentSpeed;
                state.distance += deltaTime * state.speed;

                const newProgress = Math.min(1, state.distance / totalDistance);
                setProgress(newProgress);

                if (newProgress >= 1) {
                    setIsFinished(true);
                    setTimeout(() => onComplete(true), 3000);
                }

                // JUMP PHYSICS
                if (state.isJumping) {
                    state.jumpHeight -= 0.6; // Gravity
                    if (state.jumpHeight < 0 && state.jumpHeight > -10) {
                        // Falling
                    } else if (state.jumpHeight <= -10) {
                        // Landed
                        state.isJumping = false;
                        state.jumpHeight = 0;
                    }
                }

                // SCREEN SHAKE DECAY
                if (state.shake > 0) state.shake *= 0.9;

                // SPAWN OBSTACLES
                // Chance to spawn increases with distance?
                if (time - state.lastObstacleTime > 2000 + Math.random() * 3000) {
                    const typeRoll = Math.random();
                    let type: 'ROCK' | 'BANDIT' | 'MUD' = 'ROCK';

                    if (typeRoll > 0.8 && !hasGuardPost) type = 'BANDIT'; // Guard post prevents bandits
                    else if (typeRoll > 0.5) type = 'MUD';

                    // Only spawn if not finished
                    if (type !== 'BANDIT' || !hasGuardPost) {
                        state.obstacles.push({ x: canvas.width + 100, typ: type });
                        state.lastObstacleTime = time;
                    }
                }

                // UPDATE OBSTACLES & COLLISION
                for (let i = state.obstacles.length - 1; i >= 0; i--) {
                    const obs = state.obstacles[i];
                    obs.x -= deltaTime * state.speed * 0.8; // Move relative to camera speed

                    // Collision Check
                    // Caravan is approx at left: 15% (canvas.width * 0.15) to w=200
                    const carX = canvas.width * 0.15;
                    const carW = 200;

                    if (obs.x < carX + carW - 50 && obs.x > carX + 50) {
                        // Hit box overlap
                        if (obs.typ === 'BANDIT') {
                            // Always hit unless... well bandits aren't jumpable usually.
                            state.penaltyTimer = 1000;
                            state.shake = 20;
                            state.obstacles.splice(i, 1); // Remove
                        } else if ((obs.typ === 'ROCK' || obs.typ === 'MUD') && !state.isJumping) {
                            // Hit!
                            state.penaltyTimer = 800;
                            state.shake = 10;
                            state.obstacles.splice(i, 1);
                        }
                    }

                    // Remove if off screen
                    if (obs.x < -200) state.obstacles.splice(i, 1);
                }
            }

            // --- RENDERING ---
            const shakeX = (Math.random() - 0.5) * state.shake;
            const shakeY = (Math.random() - 0.5) * state.shake;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(shakeX, shakeY);

            // Sky Gradient
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, '#020617'); // Slate 950
            skyGradient.addColorStop(1, '#1e293b'); // Slate 800
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Stars (Atmospheric)
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            for (let i = 0; i < 50; i++) {
                const sX = (i * 137) % canvas.width;
                const sY = (i * 79) % (canvas.height * 0.6);
                ctx.fillRect(sX, sY, 1, 1);
            }

            // Draw Each Parallax Layer
            layers.current.forEach((layer) => {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(0, canvas.height);

                for (let x = 0; x <= canvas.width + 10; x += 10) {
                    // Generate silhouette wave using trig
                    const waveX = x + (state.distance * layer.speed);
                    const y = canvas.height - layer.height +
                        Math.sin(waveX * layer.freq) * layer.amplitude +
                        Math.cos(waveX * layer.freq * 0.5) * (layer.amplitude * 0.5);
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(canvas.width, canvas.height);
                ctx.fill();
            });

            // The Road (Flat silhouette at bottom)
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

            // Draw Obstacles
            state.obstacles.forEach(obs => {
                // Floor Y = canvas.height - 60
                const floorY = canvas.height - 60;
                if (obs.typ === 'ROCK') {
                    ctx.fillStyle = '#64748b'; // Slate 500
                    ctx.beginPath();
                    ctx.arc(obs.x, floorY - 15, 20, 0, Math.PI * 2);
                    ctx.fill();
                } else if (obs.typ === 'BANDIT') {
                    ctx.fillStyle = '#e11d48'; // Rose 600
                    ctx.fillRect(obs.x, floorY - 60, 30, 60); // Simple rect
                    // Eyes
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(obs.x + 5, floorY - 50, 5, 5);
                    ctx.fillRect(obs.x + 15, floorY - 50, 5, 5);
                } else if (obs.typ === 'MUD') {
                    ctx.fillStyle = '#78350f'; // Amber 900
                    ctx.beginPath();
                    ctx.ellipse(obs.x, floorY - 5, 40, 10, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Speed lines (Motion feel)
            if (!isFinished) {
                ctx.strokeStyle = `rgba(255,255,255,${state.speed > baseSpeed * 0.5 ? 0.05 : 0.01})`; // Fade lines if slow
                ctx.lineWidth = 1;
                for (let i = 0; i < 10; i++) {
                    const lX = (state.distance * 2 + i * 150) % canvas.width;
                    const lY = canvas.height - 30 + (i * 5) % 20;
                    ctx.beginPath();
                    ctx.moveTo(lX, lY);
                    ctx.lineTo(lX + 40, lY);
                    ctx.stroke();
                }
            }

            ctx.restore(); // Undo shake

            animationFrame = requestAnimationFrame(render);
        };

        animationFrame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrame);
    }, [isFinished, onComplete, caravanLevel, upgrades]);

    const regionName = targetRegionId === 'capital' ? 'Hovedstaden' : (targetRegionId === 'region_vest' ? 'Vestfjella' : 'Østlandet');

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
            <div className="relative w-full max-w-5xl h-[500px] border border-slate-800 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={500}
                    className="w-full h-full object-cover"
                />

                {/* The Caravan Logic Positioning */}
                {/* Visual Jump Offset */}
                <div
                    className="absolute left-[15%] bottom-[70px] w-48 transition-transform duration-100 ease-out"
                    style={{
                        transform: `translateY(${-Math.max(0, (gameState.current?.jumpHeight || 0) * 12)}px) rotate(${gameState.current?.isJumping ? -5 : 0}deg)`
                    }}
                >
                    <CaravanSVG
                        level={caravanLevel}
                        upgrades={upgrades}
                        isMoving={!isFinished}
                        className="w-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
                    />

                    {/* The Lantern Glow (Additional CSS layer for intensity) */}
                    {!isFinished && (
                        <div className="absolute top-1/2 right-0 w-8 h-8 bg-amber-400/20 blur-xl animate-pulse rounded-full" />
                    )}
                </div>

                {/* Interaction Hint */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 font-bold uppercase text-xs tracking-widest animate-pulse opacity-50">
                    Trykk [MELLOMROM] for å hoppe
                </div>

                {/* Regional Progress Indicator */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-md px-12">
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-left">
                            <h2 className="text-white font-black uppercase italic tracking-tighter text-3xl">Mitt-Europa</h2>
                            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest leading-none">Vegen mot {regionName}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-amber-400 font-black italic text-xl">{Math.floor(progress * 100)}%</span>
                        </div>
                    </div>
                    <div className="h-0.5 w-full bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-md">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress * 100}%` }}
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                        />
                    </div>
                </div>

                {/* Atmospheric Edge Shadows */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
            </div>

            {/* Success Overlay */}
            {isFinished && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl"
                >
                    <div className="text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0.5, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="text-8xl"
                        >
                            🏰
                        </motion.div>
                        <div className="space-y-2">
                            <h3 className="text-6xl font-black text-white italic uppercase tracking-tighter">Ankomst</h3>
                            <p className="text-amber-400 font-black uppercase tracking-[0.5em] text-sm">{regionName}</p>
                        </div>
                        <div className="h-px w-24 bg-slate-800 mx-auto" />
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Handelsruten er etablert</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
