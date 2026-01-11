import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationPlayer } from '../simulationTypes';
import { useSimulation } from '../SimulationContext';
import { FishResourceNode } from '../types/world';
import { ModularBoatSVG } from './ModularBoatSVG';
import { SeaBackground } from './SeaBackground';
import { Fish, Skull, Circle } from 'lucide-react';
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
    model?: 'standard' | 'sloop' | 'cog' | 'galleon';
    componentLevels?: { sails: number; hull: number; cannons: number; nets: number };
    customization?: { color?: string; flagId?: string; figurehead?: string; sailPattern?: 'none' | 'striped' | 'emblem' };
    x: number;
    y: number;
    rotation: number;
    isFishing: boolean;
}

interface FishingNet {
    active: boolean;
    x: number;
    y: number;
    radius: number;
    t: number; // 0 to 1 normalization for animation
    caught: boolean;
}

interface SailingMinigameProps {
    player: SimulationPlayer;
    roomPin: string;
    onExit: () => void;
    onActionResult?: (result: any) => void;
}

export const SailingMinigame: React.FC<SailingMinigameProps> = ({ player, roomPin, onExit, onActionResult }) => {
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
    const [optimisticAmmo, setOptimisticAmmo] = useState(player.boat?.cannonballs || 0);
    const [isDead, setIsDead] = useState(false);
    const [lastFireTime, setLastFireTime] = useState(0);
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);
    const [explosions, setExplosions] = useState<Explosion[]>([]);
    const [shakeIntensity, setShakeIntensity] = useState(0);
    const [net, setNet] = useState<FishingNet | null>(null);

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
        explosions: [] as Explosion[],
        net: null as FishingNet | null,
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

    // Sync Optimistic Ammo (Reconciliation)
    useEffect(() => {
        setOptimisticAmmo(player.boat?.cannonballs || 0);
    }, [player.boat?.cannonballs]);

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

        // Ammo Check
        if (optimisticAmmo <= 0) {
            // TODO: Play "Click" sound
            return;
        }

        // Optimistic Consumption
        const newAmmo = optimisticAmmo - 1;
        setOptimisticAmmo(newAmmo);
        update(ref(simulationDb, `simulation_rooms/${roomPin}/players/${player.id}/boat`), {
            cannonballs: newAmmo
        });

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

            const p = physics.current;
            const rad = (p.rotation * Math.PI) / 180;
            const dist = 60; // Distance to throw

            p.net = {
                active: true,
                x: p.x + Math.cos(rad) * dist,
                y: p.y + Math.sin(rad) * dist,
                radius: 0,
                t: 0,
                caught: false
            };
            setIsFishing(true);
            setNet({ ...p.net });
            setShakeIntensity(2);
            setTimeout(() => setShakeIntensity(0), 100);
        }
    };

    // --- EASING FUNCTIONS ---
    const easeOutBack = (x: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    const easeInBack = (x: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * x * x * x - c1 * x * x;
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

        // 4. Fishing Net Logic
        if (p.net && p.net.active) {
            p.net.t += dt * 0.8; // Duration approx 1.25s

            if (p.net.t < 0.5) {
                // Expanding
                const progress = p.net.t * 2;
                p.net.radius = easeOutBack(progress) * 120;
            } else if (p.net.t < 0.6) {
                // Peek / Collision Frame
                if (!p.net.caught) {
                    const checkX = p.net.x;
                    const checkY = p.net.y;
                    const nearbyFish = fishNodes.find(f => {
                        const dx = f.x - checkX;
                        const dy = f.y - checkY;
                        return Math.sqrt(dx * dx + dy * dy) < 120;
                    });

                    if (nearbyFish) {
                        p.net.caught = true;
                        // Execute Capture
                        const nodeRef = ref(simulationDb, `simulation_rooms/${roomPin}/world/sea_resources/${nearbyFish.id}`);
                        runTransaction(nodeRef, (currentData) => {
                            if (currentData === null) return;
                            return null; // Claim
                        }).then(() => {
                            const newAmount = (player.resources['fish_raw'] || 0) + nearbyFish.amount;
                            update(ref(simulationDb, `simulation_rooms/${roomPin}/players/${player.id}/resources`), {
                                'fish_raw': newAmount
                            });
                            playSFX('SPLASH');
                        }).catch(() => {
                            p.net!.caught = false; // Reset if transaction failed
                        });

                        // Trigger visual feedback (toast/tooltip)
                        if (onActionResult) {
                            onActionResult({
                                success: true,
                                timestamp: Date.now(),
                                message: `Du fanget ${nearbyFish.amount} stk ${nearbyFish.type}!`,
                                utbytte: [{
                                    resource: 'fish_raw',
                                    amount: nearbyFish.amount,
                                    name: nearbyFish.type,
                                    icon: '🐟'
                                }],
                                xp: [{
                                    skill: 'SAILING',
                                    amount: 15
                                }],
                                durability: []
                            });
                        }
                    }
                }
                p.net.radius = 120;
            } else {
                // Retracting
                const progress = (p.net.t - 0.6) / 0.4;
                p.net.radius = (1 - easeInBack(progress)) * 120;
            }

            if (p.net.t >= 1.0) {
                p.net.active = false;
                setIsFishing(false);
                p.net = null;
            }
            setNet(p.net ? { ...p.net } : null);
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
                    model: player.boat?.model || 'standard',
                    componentLevels: player.boat?.componentLevels || { sails: 0, hull: 0, cannons: 0, nets: 0 },
                    customization: player.boat?.customization || { color: '#4b2c20', flagId: 'none', figurehead: 'none', unlocked: [] }, // TODO: Hash this for prod
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
            <SeaBackground pos={pos} />


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

            {/* FISHING NET */}
            {net && net.active && (
                <div className="absolute pointer-events-none" style={{ transform: `translate3d(${net.x - pos.x + window.innerWidth / 2}px, ${net.y - pos.y + window.innerHeight / 2}px, 0)` }}>
                    {/* Splash Effect when at max radius */}
                    {net.t >= 0.5 && net.t < 0.7 && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0.8 }}
                            animate={{ scale: 1.2, opacity: 0 }}
                            className="absolute inset-0 rounded-full border-4 border-white/40 blur-sm"
                            style={{ width: 240, height: 240, transform: 'translate(-50%, -50%)' }}
                        />
                    )}

                    {/* The Net (Brown Ring) */}
                    <svg width={net.radius * 2.5} height={net.radius * 2.5} viewBox="0 0 100 100" className="absolute" style={{ transform: 'translate(-50%, -50%)' }}>
                        <circle
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke="hsl(28, 55%, 35%)"
                            strokeWidth="3"
                            strokeDasharray="4 2"
                            className="opacity-80"
                        />
                        <circle
                            cx="50" cy="50" r="38"
                            fill="hsl(28, 55%, 20%)"
                            fillOpacity="0.1"
                            stroke="hsl(28, 55%, 45%)"
                            strokeWidth="1"
                        />
                        {/* Inner Webbing */}
                        <path
                            d="M 50 10 L 50 90 M 10 50 L 90 50 M 22 22 L 78 78 M 22 78 L 78 22"
                            stroke="hsl(28, 55%, 35%)"
                            strokeWidth="1"
                            strokeOpacity="0.3"
                        />
                    </svg>

                    {/* Catch Indicator */}
                    {net.caught && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.5, 1] }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 text-cyan-400 font-black text-xs uppercase tracking-widest bg-black/60 px-2 py-1 rounded backdrop-blur-md border border-cyan-500/30"
                        >
                            Fangst!
                        </motion.div>
                    )}
                </div>
            )}

            {/* OTHER PLAYERS */}
            {
                Object.values(others).map(other => {
                    const isOffline = (other as any).isOffline;
                    if (isOffline) return null;
                    return (
                        <div key={other.id} className="absolute w-32 h-32" style={{ transform: `translate3d(${other.x - pos.x + window.innerWidth / 2}px, ${other.y - pos.y + window.innerHeight / 2}px, 0) translate(-50%, -50%)` }}>
                            <motion.div style={{ rotate: other.rotation }} className="w-full h-full">
                                <ModularBoatSVG
                                    stage={other.stage}
                                    model={other.model}
                                    componentLevels={other.componentLevels}
                                    customization={other.customization || { color: "#64748b" }}
                                    rotation={0}
                                />
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
                animate={{
                    scale: lastFireTime > Date.now() - 200 ? [1, 0.92, 1] : (net?.active ? [1, 1.05, 1] : 1),
                    opacity: isFishing ? 0.9 : 1
                }}
                transition={{ duration: 0.2 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 z-10 pointer-events-none"
            >
                <ModularBoatSVG
                    stage={player.boat?.stage || 1}
                    model={player.boat?.model}
                    componentLevels={player.boat?.componentLevels}
                    customization={player.boat?.customization}
                    rotation={rotation}
                />
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
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{Math.round(hp)} / {maxHp} HP</div>
                </motion.div>
            </AnimatePresence>

            {/* AMMO HUD - BOTTOM RIGHT */}
            <AnimatePresence>
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute bottom-12 right-12 flex flex-col items-end gap-2 pointer-events-none"
                >
                    <div className="px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black uppercase text-amber-500 tracking-[0.2em]">
                        AMMUNISJON
                    </div>
                    <div className={`p-6 rounded-[2rem] border backdrop-blur-2xl flex flex-col items-center justify-center min-w-[120px] transition-colors duration-500
                        ${optimisticAmmo > 10 ? 'bg-slate-950/40 border-white/10' :
                            (optimisticAmmo > 0 ? 'bg-amber-950/40 border-amber-500/30' : 'bg-red-950/60 border-red-500/50 animate-pulse')}
                    `}>
                        <div className="flex items-end gap-1 mb-1">
                            <span className={`text-5xl font-black italic tracking-tighter leading-none
                                ${optimisticAmmo > 10 ? 'text-white' : (optimisticAmmo > 0 ? 'text-amber-400' : 'text-red-500')}
                            `}>
                                {optimisticAmmo}
                            </span>
                            <span className="text-white/20 text-sm font-bold uppercase mb-1">stk</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                            <Circle size={12} className={optimisticAmmo > 0 ? 'fill-current text-white' : 'text-red-500'} />
                            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${optimisticAmmo > 0 ? 'bg-white' : 'bg-red-500'}`}
                                    animate={{ width: `${Math.min(100, (optimisticAmmo / 50) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
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
