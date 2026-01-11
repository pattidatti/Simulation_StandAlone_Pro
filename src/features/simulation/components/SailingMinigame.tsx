import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SimulationPlayer } from '../simulationTypes';
import { FishResourceNode } from '../types/world';
import { ModularBoatSVG } from './ModularBoatSVG';
import { Fish, Skull } from 'lucide-react';
import { ref, update, onValue, runTransaction } from 'firebase/database';
import { simulationDb } from '../simulationFirebase';

// --- WORLD CONSTANTS ---
const WORLD_SIZE = 5000;
const ISLANDS = [
    { id: 1, x: 1200, y: 800, r: 180, color: '#064e3b', name: 'Pine Rock' },
    { id: 2, x: 3500, y: 1200, r: 250, color: '#14532d', name: 'Jungle Atoll' },
    { id: 3, x: 800, y: 3800, r: 120, color: '#451a03', name: 'Smuggler Cove' },
    { id: 4, x: 4200, y: 4000, r: 200, color: '#0f172a', name: 'Iron Fortress' },
    { id: 5, x: 2500, y: 2500, r: 150, color: '#1e3a8a', name: 'Central Outpost' },
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

    const [trail, setTrail] = useState<{ x: number, y: number, id: number }[]>([]);
    const trailIdCounter = useRef(0);
    const projectileIdCounter = useRef(0);
    const lastTrailPos = useRef({ x: 0, y: 0 });

    // --- REFS FOR PHYSICS ---
    const physics = useRef({
        x: 1000,
        y: 1000,
        rotation: 0,
        speed: 0,
        targetSpeed: 0,
        targetRotation: 0,
        turnSpeed: 0.1,
        velocity: { x: 0, y: 0 },
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

        return () => {
            unsub();
            unsubFish();
            unsubHp();
        };
    }, [roomPin, player.id]);

    // Update HP in sea_state loop (Initial Sync)
    useEffect(() => {
        update(ref(simulationDb, `simulation_rooms/${roomPin}/sea_state/${player.id}`), {
            hp: hp,
            maxHp: maxHp
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
        setLastFireTime(now);
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

        // 1. Boat Movement
        p.speed = p.speed * 0.98 + p.targetSpeed * 0.02;
        p.rotation = p.rotation * (1 - p.turnSpeed) + p.targetRotation * p.turnSpeed;

        const moveRad = (p.rotation * Math.PI) / 180;
        const dx = Math.cos(moveRad) * p.speed;
        const dy = Math.sin(moveRad) * p.speed;

        // Collision Logic
        let nextX = p.x + dx;
        let nextY = p.y + dy;
        let collision = false;

        for (const island of ISLANDS) {
            const dist = Math.hypot(nextX - island.x, nextY - island.y);
            if (dist < island.r + 30) {
                collision = true;
                break;
            }
        }
        if (nextX < 0 || nextX > WORLD_SIZE || nextY < 0 || nextY > WORLD_SIZE) collision = true;

        if (!collision) { p.x = nextX; p.y = nextY; }
        else { p.speed *= 0.5; p.targetSpeed *= 0.5; }

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

                    const victimRef = ref(simulationDb, `simulation_sea_state/${roomPin}/${otherId}/hp`);
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

    // --- GAME LOOP & INPUT ---
    const handleInput = () => {
        const p = physics.current;
        if (inputState.current.left) p.targetRotation -= 5;
        if (inputState.current.right) p.targetRotation += 5;
        if (inputState.current.up) p.targetSpeed = Math.min(p.targetSpeed + 0.5, 5);
        if (inputState.current.down) p.targetSpeed = Math.max(p.targetSpeed - 0.5, 0);
    };

    useEffect(() => {
        let animationFrameId: number;
        const loop = () => {
            handleInput();
            // sync is handled inside updatePhysics or here?
            // Original code had updatePhysics inside loop? No, requestRef for updatePhysics.
            // Let's consolidate: updatePhysics handles movement. handleInput updates targets.
            // We need to call sync here.

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
                    // hp is synced separately/reactively, but good to ensure presence
                });
                lastSync.current = now;
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();

        // Start physics loop separate or same? 
        // Original used recursive requestAnimationFrame in updatePhysics.
        // Let's stick to that for physics consistency.
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
        <div className="fixed inset-0 z-[200] bg-sky-900 overflow-hidden cursor-crosshair"
            onMouseDown={() => handleAction('FIRE')}
        >
            {/* SEA LAYERS */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-[-10%] inset-y-[-10%] bg-[#020a14]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='f1'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='3'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23f1)'/%3E%3C/svg%3E")`,
                        backgroundPosition: `${-pos.x * 0.05}px ${-pos.y * 0.05}px`
                    }}
                />
                <div className="absolute inset-0 opacity-25 mix-blend-screen"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='f2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='2'/%3E%3CfeDiffuseLighting lighting-color='%2338bdf8' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23f2)'/%3E%3C/svg%3E")`,
                        backgroundPosition: `${-pos.x * 0.15}px ${-pos.y * 0.15}px`
                    }}
                />
                <div className="absolute inset-0 opacity-30 mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='f3'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.1' numOctaves='1'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 1 0 1 0 0 1 0 0 1 0 1 0 0 0 0.3 0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23f3)'/%3E%3C/svg%3E")`,
                        backgroundPosition: `${-pos.x * 0.4}px ${-pos.y * 0.4}px`
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
                        <line key={pt.id} x1={prev.x - pos.x + window.innerWidth / 2} y1={prev.y - pos.y + window.innerHeight / 2} x2={pt.x - pos.x + window.innerWidth / 2} y2={pt.y - pos.y + window.innerHeight / 2} stroke="#fff" strokeWidth={25 * opacity} strokeOpacity={0.1 * opacity} strokeLinecap="round" />
                    );
                })}
            </svg>

            {/* ISLANDS */}
            {ISLANDS.map(island => (
                <div key={island.id} className="absolute pointer-events-none" style={{ left: island.x - pos.x + window.innerWidth / 2, top: island.y - pos.y + window.innerHeight / 2 }}>
                    <div className="absolute inset-0 bg-white/20 blur-3xl opacity-50 rounded-full animate-pulse" style={{ width: island.r * 2.5, height: island.r * 2.5, transform: 'translate(-50%, -50%)' }} />
                    <div className="absolute rounded-full shadow-2xl" style={{ width: island.r * 2, height: island.r * 2, backgroundColor: island.color, transform: 'translate(-50%, -50%)', border: '10px solid rgba(0,0,0,0.1)' }}></div>
                    <div className="absolute top-[120%] left-1/2 -translate-x-1/2 text-white/40 text-sm font-bold tracking-widest uppercase whitespace-nowrap">{island.name}</div>
                </div>
            ))}

            {/* FISH NODES */}
            {fishNodes.map(fish => (
                <div key={fish.id} className="absolute pointer-events-none" style={{ left: fish.x - pos.x + window.innerWidth / 2, top: fish.y - pos.y + window.innerHeight / 2 }}>
                    <div className="absolute inset-0 bg-white/30 blur-md rounded-full animate-ping" style={{ width: 40, height: 40, transform: 'translate(-50%, -50%)', animationDuration: '3s' }} />
                    <div className="absolute flex flex-col items-center" style={{ transform: 'translate(-50%, -50%)' }}>
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                            <Fish size={24} className="text-sky-200 drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]" />
                        </motion.div>
                        <div className="text-[10px] font-black text-sky-200/80 uppercase tracking-widest mt-1 bg-black/40 px-1 rounded backdrop-blur-sm">{fish.amount} {fish.type}</div>
                    </div>
                </div>
            ))}

            {/* PROJECTILES */}
            <div className="absolute inset-0 pointer-events-none">
                {projectiles.map(p => (
                    <div key={p.id} className="absolute w-2 h-2 bg-black rounded-full shadow-lg" style={{ left: p.x - pos.x + window.innerWidth / 2, top: p.y - pos.y + window.innerHeight / 2 }} />
                ))}
                {explosions.map(e => (
                    <div key={e.id} className="absolute w-12 h-12 bg-orange-500 rounded-full animate-ping opacity-75" style={{ left: e.x - pos.x + window.innerWidth / 2, top: e.y - pos.y + window.innerHeight / 2, transform: 'translate(-50%, -50%)' }} />
                ))}
            </div>

            {/* OTHER PLAYERS */}
            {Object.values(others).map(other => (
                <div key={other.id} className="absolute w-32 h-32" style={{ left: other.x - pos.x + window.innerWidth / 2, top: other.y - pos.y + window.innerHeight / 2, transform: 'translate(-50%, -50%)' }}>
                    <motion.div style={{ rotate: other.rotation }} className="w-full h-full">
                        <ModularBoatSVG stage={other.stage} rotation={0} customization={{ color: "#64748b" }} />
                    </motion.div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-center w-48">
                        <div className="text-xs font-bold text-white shadow-black drop-shadow-md">{other.name}</div>
                    </div>
                </div>
            ))}

            {/* PLAYER BOAT */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 z-10 pointer-events-none">
                <ModularBoatSVG stage={player.boat?.stage || 1} rotation={rotation} customization={{ color: player.boat?.customization?.color || '#8b5cf6' }} />
            </div>

            {/* HP HUD */}
            <div className="absolute bottom-8 left-8 flex flex-col gap-1 pointer-events-none">
                <div className="text-[10px] font-black uppercase text-red-500 tracking-wider">Skrog</div>
                <div className="w-64 h-4 bg-black/50 border border-white/10 rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-orange-600 transition-all duration-300" style={{ width: `${(hp / maxHp) * 100}%` }} />
                </div>
                <div className="text-xs text-white/50">{hp} / {maxHp} HP</div>
            </div>

            {/* CONTROLS HUD */}
            <div className="absolute bottom-4 right-4 flex gap-4 text-white/50 text-xs font-mono">
                <div className="flex items-center gap-1"><span className="bg-white/10 px-1 rounded">WASD</span> STYR</div>
                <div className="flex items-center gap-1"><span className="bg-white/10 px-1 rounded">SPACE</span> FISK</div>
                <div className="flex items-center gap-1"><span className="bg-white/10 px-1 rounded">F</span> ILD</div>
            </div>

            {/* MINIMAP */}
            <div className="absolute top-24 right-4 w-48 h-48 bg-black/50 rounded-full border-2 border-white/10 backdrop-blur-sm overflow-hidden z-50">
                <div className="relative w-full h-full">
                    {ISLANDS.map(island => (
                        <div key={island.id} className="absolute rounded-full bg-emerald-500/50" style={{
                            width: (island.r / WORLD_SIZE) * 100 + '%',
                            height: (island.r / WORLD_SIZE) * 100 + '%',
                            left: (island.x / WORLD_SIZE) * 100 + '%',
                            top: (island.y / WORLD_SIZE) * 100 + '%',
                            transform: 'translate(-50%, -50%)'
                        }} />
                    ))}
                    <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" style={{
                        left: (pos.x / WORLD_SIZE) * 100 + '%',
                        top: (pos.y / WORLD_SIZE) * 100 + '%',
                        transform: 'translate(-50%, -50%)'
                    }} />
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/50 uppercase tracking-widest">Kart</div>
            </div>

            {/* EXIT BUTTON */}
            <button
                onClick={handleSafeExit}
                className="absolute top-4 right-4 z-[100] px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 rounded text-xs text-red-200 font-bold uppercase tracking-widest transition-all"
            >
                Forlat Havet
            </button>

        </div>
    );
};
