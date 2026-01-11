import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationPlayer } from '../simulationTypes';
import { useSimulation } from '../SimulationContext';
import { FishResourceNode } from '../types/world';
import { ModularBoatSVG } from './ModularBoatSVG';
import { Fish, Skull } from 'lucide-react';
import { ref, update, onValue, runTransaction } from 'firebase/database';
import { simulationDb } from '../simulationFirebase';

// --- WORLD CONSTANTS ---
const WORLD_SIZE = 5000;
const ISLANDS = [
    { id: 1, x: 1200, y: 800, r: 180, color: '#064e3b', name: 'Furuøy' },
    { id: 2, x: 3500, y: 1200, r: 250, color: '#14532d', name: 'Jungel-atollen' },
    { id: 3, x: 800, y: 3800, r: 120, color: '#451a03', name: 'Smuglerbukta' },
    { id: 4, x: 4200, y: 4000, r: 200, color: '#0f172a', name: 'Jernfestningen' },
    { id: 5, x: 2500, y: 2500, r: 150, color: '#1e3a8a', name: 'Hovedposten' },
];

interface Projectile {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    ownerId: string;
    createdAt: number;
}

interface Explosion {
    id: number;
    x: number;
    y: number;
    createdAt: number;
}

interface OtherPlayerBoat {
    id: string;
    name: string;
    stage: number;
    x: number;
    y: number;
    rotation: number;
    isFishing: boolean;
}

interface SailingMinigameProps {
    player: SimulationPlayer;
    roomPin: string;
    onExit: () => void;
}

export const SailingMinigame: React.FC<SailingMinigameProps> = ({ player, roomPin, onExit }) => {
    const { setActiveMinigame } = useSimulation();

    // --- STATE ---
    const [pos, setPos] = useState({ x: 1000, y: 1000 });
    const [rotation, setRotation] = useState(0);
    const [isFishing, setIsFishing] = useState(false);
    const [others, setOthers] = useState<Record<string, OtherPlayerBoat>>({});
    const [fishNodes, setFishNodes] = useState<FishResourceNode[]>([]);

    // Combat State
    const [hp, setHp] = useState(player.boat?.hp || 100);
    const [maxHp] = useState(player.boat?.maxHp || 100);
    const [isDead, setIsDead] = useState(false);
    const [lastFireTime, setLastFireTime] = useState(0);
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);
    const [explosions, setExplosions] = useState<Explosion[]>([]);
    const [shakeIntensity, setShakeIntensity] = useState(0);

    const [trail, setTrail] = useState<{ x: number, y: number, id: number }[]>([]);
    const trailIdCounter = useRef(0);
    const projectileIdCounter = useRef(0);
    const lastTrailPos = useRef({ x: 0, y: 0 });

    // --- REFS FOR PHYSICS ---
    const physics = useRef({
        x: 1000,
        y: 1000,
        rotation: 0,
        angularVelocity: 0,
        speed: 0,
        targetSpeed: 0,
        targetRotation: 0,
        velocityVector: { x: 0, y: 0 },
        projectiles: [] as Projectile[],
        explosions: [] as Explosion[]
    });

    const requestRef = useRef<number>(0);
    const lastUpdate = useRef<number>(Date.now());
    const lastSync = useRef<number>(Date.now());
    const inputState = useRef({
        left: false,
        right: false,
        up: false,
        down: false,
        action: false,
    });

    // --- V12 INFINITE HORIZON: ENTITY SYSTEM ---
    const [cloudEntities] = useState(() => Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 4000,
        y: Math.random() * 4000,
        scale: 0.8 + Math.random() * 1.5,
        opacityBase: 0.1 + Math.random() * 0.2, // Base opacity for cloud depth
        speedFactor: 0.005 + Math.random() * 0.015,
        blur: 20 + Math.random() * 40,
        hue: 190 + Math.random() * 20
    })));

    // --- DATA SUBSCRIPTIONS ---
    useEffect(() => {
        // Subscribe to other players
        const othersRef = ref(simulationDb, `simulation_rooms/${roomPin}/sea_state`);
        const unsub = onValue(othersRef, (snap) => {
            const data = snap.val();
            if (data) {
                const { [player.id]: myState, ...rest } = data;
                setOthers(rest);
            } else {
                setOthers({});
            }
        });

        // Subscribe to LIVE FISH NODES
        const fishRef = ref(simulationDb, `simulation_rooms/${roomPin}/world/sea_resources`);
        const unsubFish = onValue(fishRef, (snap) => {
            const data = snap.val();
            if (data) {
                setFishNodes(Object.values(data));
            } else {
                setFishNodes([]);
            }
        });

        // Subscribe to OWN HP
        const myHpRef = ref(simulationDb, `simulation_rooms/${roomPin}/sea_state/${player.id}/hp`);
        const unsubHp = onValue(myHpRef, (snap) => {
            const val = snap.val();
            if (val !== null && val !== undefined) {
                setHp(val);
                if (val <= 0) setIsDead(true);
            }
        });

        // Fetch Last Known Position (Persistence)
        const myStateRef = ref(simulationDb, `simulation_rooms/${roomPin}/sea_state/${player.id}`);
        onValue(myStateRef, (snap) => {
            const data = snap.val();
            if (data && data.x && data.y && physics.current.x === 1000 && physics.current.y === 1000) {
                physics.current.x = data.x;
                physics.current.y = data.y;
                physics.current.rotation = data.rotation || 0;
                setPos({ x: data.x, y: data.y });
                setRotation(data.rotation || 0);
            }
        }, { onlyOnce: true });

        return () => {
            unsub();
            unsubFish();
            unsubHp();
        };
    }, [roomPin, player.id]);

    // Set Active Minigame State
    useEffect(() => {
        setActiveMinigame('SAILING');
        return () => setActiveMinigame(null);
    }, []);

    // Tab-Close / Refresh Cleanup
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Quick sync remove to prevent ghost boats
            const seaStateRef = ref(simulationDb, `simulation_rooms/${roomPin}/sea_state/${player.id}`);
            update(seaStateRef, { isOffline: true, timestamp: Date.now() });
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [roomPin, player.id]);

    // Update HP in sea_state loop (Initial Sync)
    useEffect(() => {
        update(ref(simulationDb, `simulation_rooms/${roomPin}/sea_state/${player.id}`), {
            hp: hp,
            maxHp: maxHp,
            isOffline: false
        });
    }, []);

    // --- AUDIO SYSTEM ---
    const playSFX = (type: 'CANNON' | 'EXPLOSION' | 'SPLASH') => {
        // TODO: Add these files to public/sounds/sfx/ or provide URLs
        const sounds = {
            'CANNON': 'sounds/sfx/cannon_fire.mp3',
            'EXPLOSION': 'sounds/sfx/explosion.mp3',
            'SPLASH': 'sounds/sfx/splash.mp3'
        };
        const audio = new Audio(`${import.meta.env.BASE_URL}${sounds[type]}`);
        audio.volume = 0.5;
        audio.play().catch(() => { }); // Ignore errors if file missing
    };

    // --- EXIT LOGIC ---
    const handleSafeExit = async () => {
        // Save current HP state before leaving
        try {
            await update(ref(simulationDb, `simulation_rooms/${roomPin}/players/${player.id}/boat`), {
                hp: hp,
                isDamaged: hp <= 0 // Only true if actually dead (shouldn't happen here usually)
            });
            onExit();
        } catch (err) {
            console.error("Failed to save boat state:", err);
            onExit();
        }
    };

    // --- COMBAT ACTIONS ---
    const fireCannon = () => {
        const now = Date.now();
        if (now - lastFireTime < 1500) return; // 1.5s Cooldown
        if (isFishing || isDead) return;

        setLastFireTime(now);
        setShakeIntensity(5);
        setTimeout(() => setShakeIntensity(0), 200);
        playSFX('CANNON');

        const p = physics.current;
        const rad = (p.rotation * Math.PI) / 180;

        // Spawn Projectile from Bow
        const spawnDist = 40;
        const spawnX = p.x + Math.cos(rad) * spawnDist;
        const spawnY = p.y + Math.sin(rad) * spawnDist;

        // Projectile Velocity
        const shotSpeed = 600;
        const vx = Math.cos(rad) * shotSpeed;
        const vy = Math.sin(rad) * shotSpeed;

        const newProj: Projectile = {
            id: projectileIdCounter.current++,
            x: spawnX,
            y: spawnY,
            vx,
            vy,
            ownerId: player.id,
            createdAt: now
        };

        physics.current.projectiles.push(newProj);
    };

    const handleAction = async (action: 'FISH' | 'FIRE') => {
        if (action === 'FIRE') {
            fireCannon();
            return;
        }

        if (action === 'FISH') {
            if (isFishing) return;
            if (physics.current.speed > 1) return;

            setIsFishing(true);
            setTimeout(() => setIsFishing(false), 2000);

            // CHECK FOR NEARBY FISH
            const FISH_RANGE = 100;
            const nearbyFish = fishNodes.find(f => {
                const dx = f.x - physics.current.x;
                const dy = f.y - physics.current.y;
                return Math.sqrt(dx * dx + dy * dy) < FISH_RANGE;
            });

            if (nearbyFish) {
                try {
                    const nodeRef = ref(simulationDb, `simulation_rooms/${roomPin}/world/sea_resources/${nearbyFish.id}`);
                    await runTransaction(nodeRef, (currentData) => {
                        if (currentData === null) return;
                        return null; // Claim it
                    });

                    const newAmount = (player.resources['fish_raw'] || 0) + nearbyFish.amount;
                    await update(ref(simulationDb, `simulation_rooms/${roomPin}/players/${player.id}/resources`), {
                        'fish_raw': newAmount
                    });
                    console.log(`CAUGHT ${nearbyFish.amount} ${nearbyFish.type}!`);
                } catch (e) {
                    console.log("Fishing failed.");
                }
            }
        }
    };

    // --- PHYSICS ENGINE V2 ---
    const updatePhysics = () => {
        const now = Date.now();
        const dt = (now - lastUpdate.current) / 1000;
        lastUpdate.current = now;

        const p = physics.current;

        // 0. DEATH CHECK
        if (hp <= 0 && !isDead) {
            setIsDead(true);
            p.speed = 0;
            p.targetSpeed = 0;
            return;
        }
        if (isDead) return;

        // 1. Boat Movement (Elite Angular + Drift)
        const ANGULAR_DRAG = 0.92;
        const STEER_FORCE = 0.2;
        const DRIFT_COEFF = 0.15;
        const SPEED_DRAG = 0.985;
        const ACCEL = 0.05;

        // Apply Steering Torque
        if (inputState.current.left) p.angularVelocity -= STEER_FORCE;
        if (inputState.current.right) p.angularVelocity += STEER_FORCE;

        p.angularVelocity *= ANGULAR_DRAG;
        p.rotation += p.angularVelocity;

        // Linear Speed
        if (inputState.current.up) p.targetSpeed = Math.min(p.targetSpeed + ACCEL, 5);
        if (inputState.current.down) p.targetSpeed = Math.max(p.targetSpeed - ACCEL, 0);
        p.speed = p.speed * SPEED_DRAG + p.targetSpeed * (1 - SPEED_DRAG);

        // Lateral Drift Vector
        const moveRad = (p.rotation * Math.PI) / 180;
        const desiredVx = Math.cos(moveRad) * p.speed;
        const desiredVy = Math.sin(moveRad) * p.speed;

        p.velocityVector.x = p.velocityVector.x * (1 - DRIFT_COEFF) + desiredVx * DRIFT_COEFF;
        p.velocityVector.y = p.velocityVector.y * (1 - DRIFT_COEFF) + desiredVy * DRIFT_COEFF;

        // Collision Logic
        let nextX = p.x + p.velocityVector.x;
        let nextY = p.y + p.velocityVector.y;
        let collisionIsland: any = null;

        for (const island of ISLANDS) {
            const dist = Math.hypot(nextX - island.x, nextY - island.y);
            if (dist < island.r + 30) {
                collisionIsland = island;
                break;
            }
        }

        if (!collisionIsland && nextX > 0 && nextX < WORLD_SIZE && nextY > 0 && nextY < WORLD_SIZE) {
            p.x = nextX;
            p.y = nextY;
        } else {
            // Elastic Bounce
            if (collisionIsland) {
                const nx = (p.x - collisionIsland.x) / Math.hypot(p.x - collisionIsland.x, p.y - collisionIsland.y);
                const ny = (p.y - collisionIsland.y) / Math.hypot(p.x - collisionIsland.x, p.y - collisionIsland.y);

                // Reflect velocity vector
                const dot = p.velocityVector.x * nx + p.velocityVector.y * ny;
                p.velocityVector.x = (p.velocityVector.x - 2 * dot * nx) * 0.5;
                p.velocityVector.y = (p.velocityVector.y - 2 * dot * ny) * 0.5;
                p.speed *= 0.5;
                p.targetSpeed *= 0.3;
                setShakeIntensity(8);
                setTimeout(() => setShakeIntensity(0), 300);
            } else {
                p.velocityVector.x *= -0.5;
                p.velocityVector.y *= -0.5;
            }
        }

        setPos({ x: p.x, y: p.y });
        setRotation(p.rotation);

        // 2. Projectile Physics
        const activeProjectiles_Old = p.projectiles;
        const nextProjectiles: Projectile[] = [];

        for (const proj of activeProjectiles_Old) {
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;

            if (now - proj.createdAt > 2000) continue;

            let hit = false;
            // Vs Islands
            for (const island of ISLANDS) {
                if (Math.hypot(proj.x - island.x, proj.y - island.y) < island.r) {
                    hit = true;
                    physics.current.explosions.push({ id: Math.random(), x: proj.x, y: proj.y, createdAt: now });
                    playSFX('EXPLOSION');
                    break;
                }
            }
            if (hit) continue;

            // Vs Players
            for (const otherId in others) {
                const other = others[otherId];
                const dist = Math.hypot(proj.x - other.x, proj.y - other.y);
                if (dist < 40) {
                    hit = true;
                    physics.current.explosions.push({ id: Math.random(), x: proj.x, y: proj.y, createdAt: now });
                    playSFX('EXPLOSION');

                    const victimRef = ref(simulationDb, `simulation_rooms/${roomPin}/sea_state/${otherId}/hp`);
                    runTransaction(victimRef, (currentHp) => {
                        if (currentHp === null) return 100;
                        return Math.max(0, currentHp - 25);
                    });
                    break;
                }
            }

            if (!hit) nextProjectiles.push(proj);
        }
        p.projectiles = nextProjectiles;

        // Clean Explosions
        p.explosions = p.explosions.filter(e => now - e.createdAt < 500);

        setProjectiles([...p.projectiles]);
        setExplosions([...p.explosions]);

        // 3. Trail Logic
        const sternLength = 40;
        const sx = p.x - Math.cos(moveRad) * sternLength;
        const sy = p.y - Math.sin(moveRad) * sternLength;

        const distTravelled = Math.hypot(sx - lastTrailPos.current.x, sy - lastTrailPos.current.y);
        if (distTravelled > 25) {
            setTrail(prev => {
                const newTrail = [...prev, { x: sx, y: sy, id: trailIdCounter.current++ }];
                if (newTrail.length > 40) newTrail.shift();
                return newTrail;
            });
            lastTrailPos.current = { x: sx, y: sy };
        }

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    // --- GAME LOOP & SYNC ---
    useEffect(() => {
        let animationFrameId: number;
        const loop = () => {
            const now = Date.now();
            if (now - lastSync.current > 100) {
                update(ref(simulationDb, `simulation_rooms/${roomPin}/sea_state/${player.id}`), {
                    id: player.id,
                    name: player.name,
                    x: physics.current.x,
                    y: physics.current.y,
                    rotation: physics.current.rotation,
                    speed: physics.current.speed,
                    stage: player.boat?.stage || 1,
                    isFishing: isFishing,
                    timestamp: now,
                });
                lastSync.current = now;
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();

        requestRef.current = requestAnimationFrame(updatePhysics);

        return () => {
            cancelAnimationFrame(animationFrameId);
            cancelAnimationFrame(requestRef.current);
        };
    }, [roomPin, player.id, isFishing]);

    // Input Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Instant triggers
            if (e.key === 'a' || e.key === 'ArrowLeft') inputState.current.left = true;
            if (e.key === 'd' || e.key === 'ArrowRight') inputState.current.right = true;
            if (e.key === 'w' || e.key === 'ArrowUp') inputState.current.up = true;
            if (e.key === 's' || e.key === 'ArrowDown') inputState.current.down = true;

            if (e.key === ' ') handleAction('FISH');
            if (e.key === 'f') handleAction('FIRE');
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'a' || e.key === 'ArrowLeft') inputState.current.left = false;
            if (e.key === 'd' || e.key === 'ArrowRight') inputState.current.right = false;
            if (e.key === 'w' || e.key === 'ArrowUp') inputState.current.up = false;
            if (e.key === 's' || e.key === 'ArrowDown') inputState.current.down = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // --- RENDER ---
    if (isDead) {
        return (
            <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center text-red-600 font-black animate-in fade-in duration-1000">
                <Skull size={128} className="mb-4 animate-pulse" />
                <h1 className="text-6xl uppercase tracking-tighter">Skipbrudden</h1>
                <p className="text-white/50 mt-4 text-xl">Ditt skip er sunket til havets bunn.</p>
                <button
                    onClick={async () => {
                        // Wash Ashore Logic
                        // 1. Update MAIN DB with damaged state + minimal HP
                        try {
                            await update(ref(simulationDb, `simulation_rooms/${roomPin}/players/${player.id}/boat`), {
                                hp: 10,
                                isDamaged: true
                            });

                            // 2. Clear from sea_state (optional, but good for cleanup)
                            // remove(ref(simulationDb, `simulation_rooms/${roomPin}/sea_state/${player.id}`));

                            // 3. Exit
                            onExit();
                        } catch (err) {
                            console.error("Failed to wash ashore:", err);
                            onExit(); // Fallback
                        }
                    }}
                    className="mt-12 px-8 py-3 bg-red-900/20 border border-red-900 hover:bg-red-900/40 text-red-500 rounded transition-all uppercase tracking-widest"
                >
                    Skyll i land
                </button>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-0 bg-[#051a2e] overflow-hidden cursor-crosshair font-sans"
            onMouseDown={() => handleAction('FIRE')}
            style={{
                background: 'radial-gradient(circle at 50% 50%, #0a2e4d 0%, #051a2e 100%)',
                transform: shakeIntensity > 0 ? `translate(${(Math.random() - 0.5) * shakeIntensity}px, ${(Math.random() - 0.5) * shakeIntensity}px)` : 'none',
                transition: 'transform 0.05s linear',
                contain: 'strict'
            }}
        >
            {/* 🌊 PHASE 12: THE INFINITE HORIZON (V12) - ZERO-TILE EXECUTION */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true" style={{ contain: 'strict' }}>

                {/* 1. LAYER ONE: THE ABYSS (Single-Entity 5000px Sea) */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[5000px] h-[5000px] opacity-[0.08] mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2000' height='2000'%3E%3Cfilter id='seaAbyss'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.003' numOctaves='3' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='2000' height='2000' filter='url(%23seaAbyss)'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '5000px 5000px',
                        transform: `translate3d(${-pos.x * 0.2}px, ${-pos.y * 0.2}px, 0)`,
                        willChange: 'transform'
                    }}
                />

                {/* 2. LAYER TWO: HIGH-FREQUENCY SURFACE GRAIN */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4000px] h-[4000px] opacity-[0.12] mix-blend-soft-light"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000'%3E%3Cfilter id='seaGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='2' stitchTiles='noStitch'/%3E%3C/filter%3E%3Crect width='1000' height='1000' filter='url(%23seaGrain)'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '4000px 4000px',
                        transform: `translate3d(${-pos.x}px, ${-pos.y}px, 0)`,
                        willChange: 'transform'
                    }}
                />

                {/* 3. INFINITE CLOUD ENTITIES (Individual Objects with Fading) */}
                {cloudEntities.map(cloud => {
                    // Logic Area (The "Horizon Box")
                    const AREA_SIZE = 4000;
                    const HALF_AREA = AREA_SIZE / 2;
                    const SAFE_MARGIN = 500; // Clouds begin fading at this distance from boundary

                    let cx = (cloud.x - pos.x * cloud.speedFactor) % AREA_SIZE;
                    let cy = (cloud.y - pos.y * cloud.speedFactor) % AREA_SIZE;
                    if (cx < 0) cx += AREA_SIZE;
                    if (cy < 0) cy += AREA_SIZE;

                    // Calculate Opacity Dropoff near boundaries to prevent "pop"
                    const edgeDistX = Math.min(cx, AREA_SIZE - cx);
                    const edgeDistY = Math.min(cy, AREA_SIZE - cy);
                    const fadeX = Math.min(1, edgeDistX / SAFE_MARGIN);
                    const fadeY = Math.min(1, edgeDistY / SAFE_MARGIN);
                    const finalOpacity = cloud.opacityBase * fadeX * fadeY;

                    return (
                        <div
                            key={cloud.id}
                            className="absolute left-1/2 top-1/2 rounded-full mix-blend-screen"
                            style={{
                                width: 500 * cloud.scale,
                                height: 350 * cloud.scale,
                                background: `radial-gradient(circle, hsla(${cloud.hue}, 10%, 95%, 1) 0%, transparent 70%)`,
                                opacity: finalOpacity,
                                filter: `blur(${cloud.blur}px)`,
                                transform: `translate3d(${cx - HALF_AREA}px, ${cy - HALF_AREA}px, 0)`,
                                willChange: 'transform'
                            }}
                        />
                    );
                })}

                {/* 4. DEPTH OVERLAY (Horizon Fog) */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at 50% 50%, transparent 10%, rgba(5, 26, 46, 0.3) 50%, rgba(2, 8, 23, 0.95) 100%)'
                    }}
                />

                {/* 5. SEAFARER'S GLOW (Hull Base) */}
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-30 mix-blend-soft-light"
                    style={{
                        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)'
                    }}
                />
            </div>


            {/* TRAIL */}
            <svg className="absolute inset-0 w-full h-full overflow-visible blur-md pointer-events-none">
                {trail.map((pt, i) => {
                    if (i === 0) return null;
                    const prev = trail[i - 1];
                    const opacity = i / trail.length;
                    return (
                        <line key={pt.id} x1={prev.x - pos.x + window.innerWidth / 2} y1={prev.y - pos.y + window.innerHeight / 2} x2={pt.x - pos.x + window.innerWidth / 2} y2={pt.y - pos.y + window.innerHeight / 2} stroke="#fff" strokeWidth={25 * opacity} strokeOpacity={0.08 * opacity} strokeLinecap="round" />
                    );
                })}
            </svg>

            {/* ISLANDS */}
            {
                ISLANDS.map(island => (
                    <div key={island.id} className="absolute pointer-events-none" style={{ transform: `translate3d(${island.x - pos.x + window.innerWidth / 2}px, ${island.y - pos.y + window.innerHeight / 2}px, 0)` }}>
                        <div className="absolute inset-0 bg-white/5 blur-3xl opacity-30 rounded-full" style={{ width: island.r * 3, height: island.r * 3, transform: 'translate(-50%, -50%)' }} />
                        <div className="absolute rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ width: island.r * 2, height: island.r * 2, backgroundColor: island.color, transform: 'translate(-50%, -50%)', border: '8px solid rgba(255,255,255,0.05)' }}></div>
                        <div className="absolute top-[110%] left-1/2 -translate-x-1/2 text-white/20 text-[10px] uppercase tracking-[0.3em] font-black whitespace-nowrap">{island.name}</div>
                    </div>
                ))
            }

            {/* FISH NODES */}
            {
                fishNodes.map(fish => (
                    <div key={fish.id} className="absolute pointer-events-none" style={{ transform: `translate3d(${fish.x - pos.x + window.innerWidth / 2}px, ${fish.y - pos.y + window.innerHeight / 2}px, 0)` }}>
                        <div className="absolute inset-0 bg-white/30 blur-md rounded-full animate-ping" style={{ width: 40, height: 40, transform: 'translate(-50%, -50%)', animationDuration: '3s' }} />
                        <div className="absolute flex flex-col items-center" style={{ transform: 'translate(-50%, -50%)' }}>
                            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                                <Fish size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            </motion.div>
                            <div className="text-[9px] font-black text-cyan-200/60 uppercase tracking-widest mt-1 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/5">{fish.amount} {fish.type}</div>
                        </div>
                    </div>
                ))
            }

            {/* PROJECTILES & EXPLOSIONS */}
            <div className="absolute inset-0 pointer-events-none">
                {projectiles.map(p => (
                    <div key={p.id} className="absolute w-2 h-2 bg-black rounded-full shadow-lg" style={{ transform: `translate3d(${p.x - pos.x + window.innerWidth / 2}px, ${p.y - pos.y + window.innerHeight / 2}px, 0)` }} />
                ))}
                {explosions.map(e => (
                    <div key={e.id} className="absolute w-16 h-16 bg-orange-500 rounded-full animate-ping opacity-60" style={{ transform: `translate3d(${e.x - pos.x + window.innerWidth / 2}px, ${e.y - pos.y + window.innerHeight / 2}px, 0) translate(-50%, -50%)` }} />
                ))}
            </div>

            {/* OTHER PLAYERS */}
            {
                Object.values(others).map(other => {
                    const isOffline = (other as any).isOffline;
                    if (isOffline) return null;
                    return (
                        <div key={other.id} className="absolute w-32 h-32" style={{ transform: `translate3d(${other.x - pos.x + window.innerWidth / 2}px, ${other.y - pos.y + window.innerHeight / 2}px, 0) translate(-50%, -50%)` }}>
                            <motion.div style={{ rotate: other.rotation }} className="w-full h-full">
                                <ModularBoatSVG stage={other.stage} rotation={0} customization={{ color: "#64748b" }} />
                            </motion.div>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-center w-48">
                                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest shadow-black drop-shadow-md">{other.name}</div>
                            </div>
                        </div>
                    );
                })
            }

            {/* PLAYER BOAT */}
            <motion.div
                animate={{ scale: lastFireTime > Date.now() - 200 ? [1, 0.92, 1] : 1 }}
                transition={{ duration: 0.2 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 z-10 pointer-events-none"
            >
                <ModularBoatSVG stage={player.boat?.stage || 1} rotation={rotation} customization={{ color: player.boat?.customization?.color || '#8b5cf6' }} />
            </motion.div>

            {/* HP HUD - CENTER BOTTOM GLASSMORPHISM */}
            <AnimatePresence>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
                >
                    <div className="px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">Skrog</div>
                    <div className="w-80 h-3 bg-black/60 border border-white/5 rounded-full overflow-hidden shadow-2xl backdrop-blur-md"
                        role="progressbar"
                        aria-valuenow={hp}
                        aria-valuemin={0}
                        aria-valuemax={maxHp}
                        aria-label="Skipets holdbarhet"
                    >
                        <motion.div
                            className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                            animate={{ width: `${(hp / maxHp) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                        />
                    </div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{hp} / {maxHp} HP</div>
                </motion.div>
            </AnimatePresence>

            {/* EXIT BUTTON - TOP LEFT ANTIQUE GOLD */}
            <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(127, 29, 29, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSafeExit}
                aria-label="Tilbake til kai"
                className="absolute top-8 left-8 z-[110] px-6 py-2 bg-red-950/40 backdrop-blur-md border border-[#c29d0b]/40 rounded-sm text-[10px] text-[#e5e7eb] font-black uppercase tracking-[0.25em] transition-all hover:border-[#c29d0b] shadow-2xl"
            >
                Tilbake til kai
            </motion.button>

            {/* HUD LABELS */}
            <div className="absolute bottom-6 right-8 flex gap-8 text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2"><span className="text-white/40">WASD</span> Manøvrering</div>
                <div className="flex items-center gap-2"><span className="text-white/40">SPACE</span> Fisking</div>
                <div className="flex items-center gap-2"><span className="text-white/40">F</span> Avfyr Kanon</div>
            </div>

            {/* MINIMAP - REDUCED OPACITY */}
            <div className="absolute top-6 right-6 w-44 h-44 bg-black/30 rounded-full border border-white/5 backdrop-blur-md overflow-hidden z-50 pointer-events-none opacity-60">
                <div className="relative w-full h-full p-6">
                    {ISLANDS.map(island => (
                        <div key={island.id} className="absolute rounded-full bg-emerald-500/20" style={{
                            width: (island.r / WORLD_SIZE) * 100 + '%',
                            height: (island.r / WORLD_SIZE) * 100 + '%',
                            left: (island.x / WORLD_SIZE) * 100 + '%',
                            top: (island.y / WORLD_SIZE) * 100 + '%',
                            transform: 'translate(-50%, -50%)'
                        }} />
                    ))}
                    <div className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]" style={{
                        left: (pos.x / WORLD_SIZE) * 100 + '%',
                        top: (pos.y / WORLD_SIZE) * 100 + '%',
                        transform: 'translate(-50%, -50%)'
                    }} />
                </div>
            </div>

            {/* VIRTUAL CONTROLS (MOBILE) */}
            {
                window.matchMedia("(pointer: coarse)").matches && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* D-PAD Bottom Right */}
                        <div className="absolute bottom-12 right-12 flex flex-col items-center gap-2 pointer-events-auto scale-75 md:scale-100 origin-bottom-right">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onTouchStart={() => { inputState.current.up = true; }}
                                onTouchEnd={() => { inputState.current.up = false; }}
                                aria-label="Manøvrer opp"
                                className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/40 font-black"
                            >W</motion.button>
                            <div className="flex gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onTouchStart={() => { inputState.current.left = true; }}
                                    onTouchEnd={() => { inputState.current.left = false; }}
                                    aria-label="Snu til venstre"
                                    className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/40 font-black"
                                >A</motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onTouchStart={() => { inputState.current.down = true; }}
                                    onTouchEnd={() => { inputState.current.down = false; }}
                                    aria-label="Manøvrer ned"
                                    className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/40 font-black"
                                >S</motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onTouchStart={() => { inputState.current.right = true; }}
                                    onTouchEnd={() => { inputState.current.right = false; }}
                                    aria-label="Snu til høyre"
                                    className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/40 font-black"
                                >D</motion.button>
                            </div>
                        </div>
                        {/* Action Buttons Bottom Left */}
                        <div className="absolute bottom-12 left-12 flex gap-4 pointer-events-auto scale-75 md:scale-100 origin-bottom-left">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleAction('FIRE')}
                                aria-label="Avfyr kanon"
                                className="w-20 h-20 bg-red-900/20 backdrop-blur-md rounded-full border border-red-500/20 flex flex-col items-center justify-center text-red-500/60 font-black text-[10px] tracking-widest"
                            >
                                <span>F</span>
                                <span>ILD</span>
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleAction('FISH')}
                                aria-label="Fiske"
                                className="w-20 h-20 bg-blue-900/20 backdrop-blur-md rounded-full border border-blue-500/20 flex flex-col items-center justify-center text-blue-500/60 font-black text-[10px] tracking-widest"
                            >
                                <span>SPACE</span>
                                <span>FISK</span>
                            </motion.button>
                        </div>
                    </div>
                )
            }
        </div>
    );
};
