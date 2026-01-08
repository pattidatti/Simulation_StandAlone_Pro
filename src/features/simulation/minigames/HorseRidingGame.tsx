import React, { useState, useEffect, useRef } from 'react';
import { animationManager } from '../logic/AnimationManager';
import { audioManager } from '../logic/AudioManager';

interface Obstacle {
    id: number;
    lane: number;
    z: number; // 0 (far) to 1 (near)
    type: 'log' | 'rock' | 'branch';
}

interface HorseLevelConfig {
    speed: number;
    spawnRate: number;
    targetDistance: number;
    label: string;
    colors: { sky: string, path: string };
    xpMult: number;
}

const LEVEL_CONFIGS: Record<string, HorseLevelConfig> = {
    ride_easy: {
        speed: 0.012,
        spawnRate: 80,
        targetDistance: 8,
        label: 'Engelskogen',
        colors: { sky: '#1e293b', path: '#451a03' },
        xpMult: 1.0
    },
    ride_medium: {
        speed: 0.018,
        spawnRate: 60,
        targetDistance: 12,
        label: 'Fjellpasset',
        colors: { sky: '#0f172a', path: '#262626' },
        xpMult: 1.5
    },
    ride_hard: {
        speed: 0.025,
        spawnRate: 45,
        targetDistance: 15,
        label: 'Ulvestien',
        colors: { sky: '#020617', path: '#171717' },
        xpMult: 2.2
    }
};

export const HorseRidingGame: React.FC<{
    onComplete: (performance: number) => void;
    speedMultiplier?: number;
    levelId?: string;
    level?: number;
}> = ({ onComplete, speedMultiplier = 1.0, levelId = 'ride_easy', level = 1 }) => {
    const config = LEVEL_CONFIGS[levelId] || LEVEL_CONFIGS.ride_easy;

    // Difficulty Scaling based on level 1-5
    const levelScale = 1 + (level - 1) * 0.15; // 15% increase per level
    const spawnScale = 1 - (level - 1) * 0.1;  // 10% faster spawn per level
    const distScale = 1 + (level - 1) * 0.2;   // 20% longer per level

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [shake, setShake] = useState(0);

    const gameState = useRef({
        lane: 1,
        targetLane: 1,
        isJumping: false,
        jumpTime: 0,
        obstacles: [] as Obstacle[],
        lastSpawn: 0,
        distance: 0,
        speed: config.speed * speedMultiplier * levelScale,
        gameOver: false,
        bobAmt: 0,
        ticks: 0,
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState.current.gameOver) return;

            if (e.key === 'a' || e.key === 'ArrowLeft') {
                gameState.current.targetLane = Math.max(0, gameState.current.targetLane - 1);
            } else if (e.key === 'd' || e.key === 'ArrowRight') {
                gameState.current.targetLane = Math.min(2, gameState.current.targetLane + 1);
            } else if (e.code === 'Space' && !gameState.current.isJumping) {
                gameState.current.isJumping = true;
                gameState.current.jumpTime = 0;
                audioManager.playSfx('jump'); // Fixed method name
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;

        const update = () => {
            if (gameState.current.gameOver) return;

            gameState.current.ticks++;
            gameState.current.distance += gameState.current.speed;

            // Lane interpolation
            if (gameState.current.lane !== gameState.current.targetLane) {
                const diff = gameState.current.targetLane - gameState.current.lane;
                gameState.current.lane += diff * 0.2;
                if (Math.abs(gameState.current.targetLane - gameState.current.lane) < 0.01) {
                    gameState.current.lane = gameState.current.targetLane;
                }
            }

            // Jump logic
            if (gameState.current.isJumping) {
                gameState.current.jumpTime += 0.05;
                if (gameState.current.jumpTime >= Math.PI) {
                    gameState.current.isJumping = false;
                    gameState.current.jumpTime = 0;
                }
            }

            // Bobbing (Gallop feel)
            gameState.current.bobAmt = Math.sin(gameState.current.ticks * 0.2) * 5;

            // Spawn obstacles
            if (gameState.current.ticks - gameState.current.lastSpawn > (config.spawnRate * spawnScale) / speedMultiplier) {
                if (Math.random() > 0.4) {
                    gameState.current.obstacles.push({
                        id: Date.now(),
                        lane: Math.floor(Math.random() * 3),
                        z: 0,
                        type: Math.random() > 0.5 ? 'log' : 'rock',
                    });
                }
                gameState.current.lastSpawn = gameState.current.ticks;
            }

            // Move obstacles
            gameState.current.obstacles.forEach(obs => {
                obs.z += gameState.current.speed;

                // Collision check
                // Adjusted collision window to match the visual quadratic speedup
                if (obs.z > 0.88 && obs.z < 0.96) {
                    const playerLane = Math.round(gameState.current.lane);
                    if (obs.lane === playerLane) {
                        const canJump = obs.type === 'log';
                        const isHighEnough = gameState.current.isJumping && Math.sin(gameState.current.jumpTime) > 0.6;

                        if (!(canJump && isHighEnough)) {
                            handleCollision();
                        }
                    }
                }
            });

            // Clean up old obstacles (Faster cleanup)
            gameState.current.obstacles = gameState.current.obstacles.filter(obs => obs.z < 1.05);

            // Increase score
            const currentDist = gameState.current.distance;
            setScore(Math.floor(currentDist * 100));

            if (currentDist >= config.targetDistance * distScale) {
                finishGame(1.0);
            }
        };

        const handleCollision = () => {
            setShake(15);
            gameState.current.speed *= 0.6;
            animationManager.spawnFloatingText("OUCH!", 50, 40, "text-rose-500 font-black text-3xl");
            // Remove the obstacle or push it away
            gameState.current.obstacles = gameState.current.obstacles.filter(o => o.z < 0.85);
            setTimeout(() => setShake(0), 300);
        };

        const finishGame = (finalPerformance: number) => {
            if (gameState.current.gameOver) return;
            gameState.current.gameOver = true;
            setIsFinished(true);
            setTimeout(() => onComplete(finalPerformance), 2000);
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Background (Sky/Forest)
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, config.colors.sky);
            gradient.addColorStop(0.5, '#334155'); // Transition
            gradient.addColorStop(0.5, '#064e3b'); // Emerald 900 (Ground)
            gradient.addColorStop(1, '#065f46'); // Emerald 800
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Path Perspective (WIDER SPREAD)
            ctx.beginPath();
            ctx.moveTo(canvas.width * 0.45, canvas.height * 0.5);
            ctx.lineTo(canvas.width * 0.55, canvas.height * 0.5);
            ctx.lineTo(canvas.width * 1.3, canvas.height);
            ctx.lineTo(canvas.width * -0.3, canvas.height);
            ctx.closePath();
            ctx.fillStyle = config.colors.path;
            ctx.fill();

            // Lane Dividers
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.setLineDash([20, 10]);
            ctx.lineWidth = 4;
            [0.33, 0.66].forEach(p => {
                ctx.beginPath();
                ctx.moveTo(canvas.width * (0.45 + p * 0.1), canvas.height * 0.5);
                ctx.lineTo(canvas.width * (-0.3 + p * 1.6), canvas.height);
                ctx.stroke();
            });
            ctx.setLineDash([]);

            // Draw Obstacles
            gameState.current.obstacles.forEach(obs => {
                // QUADRATIC DEPTH for realistic speed-up
                const renderZ = obs.z * obs.z;
                const horizonY = canvas.height * 0.5;
                const y = horizonY + (canvas.height - horizonY) * renderZ;

                const pathWidthAtZ = (canvas.width * 0.1) + (canvas.width * 1.6) * renderZ;
                const laneX = (canvas.width * 0.5) + (obs.lane - 1) * (pathWidthAtZ / 3);

                const size = 30 + 150 * renderZ;

                // Fade out as they get very close to player to avoid "lingering"
                const opacity = obs.z > 0.95 ? Math.max(0, 1 - (obs.z - 0.95) * 10) : 1;

                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.translate(laneX, y);
                if (obs.type === 'log') {
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(-size / 2, -size / 6, size, size / 3);
                    ctx.strokeStyle = '#451a03';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-size / 2, -size / 6, size, size / 3);
                } else {
                    ctx.fillStyle = '#475569';
                    ctx.beginPath();
                    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#1e293b';
                    ctx.stroke();
                }
                ctx.restore();
            });

            // Lane Indicator (Shadow)
            const pLane = gameState.current.lane;
            const horseX = (canvas.width * 0.5) + (pLane - 1) * (canvas.width * 0.45); // MUCH WIDER MOVEMENT

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(horseX, canvas.height - 40, 60, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw Horse Head (First Person)
            const bob = gameState.current.bobAmt;
            const jumpY = gameState.current.isJumping ? -Math.sin(gameState.current.jumpTime) * 120 : 0;

            ctx.save();
            ctx.translate(horseX + (shake > 0 ? (Math.random() - 0.5) * shake : 0), canvas.height - 110 + bob + jumpY);

            // Horse Neck
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(0, 150, 80, 200, 0, 0, Math.PI * 2);
            ctx.fill();

            // Horse Head
            ctx.beginPath();
            ctx.ellipse(0, 0, 40, 70, 0, 0, Math.PI * 2);
            ctx.fill();

            // Muzzle
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.ellipse(0, 40, 30, 40, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ears
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.moveTo(-30, -50); ctx.lineTo(-40, -90); ctx.lineTo(-10, -60); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(30, -50); ctx.lineTo(40, -90); ctx.lineTo(10, -60); ctx.fill();

            // Mane
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(-10, -60, 20, 100);

            ctx.restore();

            // HUD
            ctx.fillStyle = 'white';
            ctx.font = 'black 24px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`AVSTAND: ${Math.floor(gameState.current.distance * 100)}m`, 20, 40);

            update();
            animationFrame = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, [speedMultiplier]);

    return (
        <div className="relative w-full h-[600px] bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-12">
                <div className="text-center">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">Galopp!</h2>
                    <p className="text-amber-400 font-bold uppercase tracking-widest text-sm">Bruk A/D for å bytte bane, SPACE for å hoppe</p>
                </div>

                {isFinished && (
                    <div className="bg-slate-950/80 backdrop-blur-xl p-12 rounded-[3rem] border-2 border-amber-500 animate-in zoom-in duration-300">
                        <div className="text-6xl mb-4">✨</div>
                        <h3 className="text-5xl font-black text-white italic mb-2">RITT FULLFØRT!</h3>
                        <p className="text-xl text-slate-400 font-bold uppercase">Du red {score} meter</p>
                    </div>
                )}
            </div>

            {/* Visual speed lines overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.1)_100%)]" />
            </div>
        </div>
    );
};
