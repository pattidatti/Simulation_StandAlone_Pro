import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationPlayer } from '../simulationTypes';
import { ModularBoatSVG } from './ModularBoatSVG';
import { Anchor, LifeBuoy, Compass, Wind } from 'lucide-react';
import { ref, update, onValue, off } from 'firebase/database';
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

interface OtherPlayerBoat {
    id: string;
    name: string;
    stage: number;
    x: number;
    y: number;
    rotation: number;
    isFishing: boolean;
}

export const SailingMinigame: React.FC<SailingMinigameProps> = ({ player, roomPin, onExit }) => {
    // --- STATE ---
    const [pos, setPos] = useState({ x: 1000, y: 1000 });
    const [rotation, setRotation] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [isFishing, setIsFishing] = useState(false);
    const [others, setOthers] = useState<Record<string, OtherPlayerBoat>>({});
    const [trail, setTrail] = useState<{ x: number, y: number, id: number }[]>([]);
    const trailIdCounter = useRef(0);
    const lastTrailPos = useRef({ x: 0, y: 0 });

    // --- REFS FOR PHYSICS (Decoupled from render cycle) ---
    const physics = useRef({
        x: 1000,
        y: 1000,
        rotation: 0,
        speed: 0,
        targetSpeed: 0,
        targetRotation: 0,
        turnSpeed: 0.1,
        velocity: { x: 0, y: 0 }
    });
    const requestRef = useRef<number>(0);
    const lastUpdate = useRef<number>(Date.now());

    // --- MULTIPLAYER SYNC (Firebase) ---
    useEffect(() => {
        const seaStateRef = ref(simulationDb, `simulation_rooms/${roomPin}/sea_state`);
        const unsubscribe = onValue(seaStateRef, (snapshot) => {
            const data = snapshot.val() || {};
            const otherPlayers: Record<string, OtherPlayerBoat> = {};
            Object.entries(data).forEach(([id, val]: [string, any]) => {
                if (id !== player.id) {
                    otherPlayers[id] = { id, ...val };
                }
            });
            setOthers(otherPlayers);
        });

        return () => off(seaStateRef, 'value', unsubscribe);
    }, [roomPin, player.id]);

    // Update own state to Firebase (Throttled)
    useEffect(() => {
        const interval = setInterval(() => {
            if (speed > 0 || isFishing) {
                const mySeaRef = ref(simulationDb, `simulation_rooms/${roomPin}/sea_state/${player.id}`);
                update(mySeaRef, {
                    name: player.name,
                    stage: player.boat?.stage || 1,
                    x: pos.x,
                    y: pos.y,
                    rotation: rotation,
                    isFishing: isFishing,
                    timestamp: Date.now()
                });
            }
        }, 200); // 5Hz sync

        return () => clearInterval(interval);
    }, [pos, rotation, isFishing, speed, roomPin, player.id, player.name, player.boat?.stage]);

    // --- PHYSICS ENGINE (Poseidon Engine V1) ---
    const updatePhysics = () => {
        const now = Date.now();
        const dt = (now - lastUpdate.current) / 1000;
        lastUpdate.current = now;

        const p = physics.current;

        // 1. Smooth Speed (Acceleration/Deceleration)
        // 2. Update Boat State
        p.speed = p.speed * 0.98 + p.targetSpeed * 0.02;
        p.rotation = p.rotation * (1 - p.turnSpeed) + p.targetRotation * p.turnSpeed;

        const moveRad = (p.rotation * Math.PI) / 180;
        const dx = Math.cos(moveRad) * p.speed;
        const dy = Math.sin(moveRad) * p.speed;

        // --- COLLISION LOGIC ---
        let nextX = p.x + dx;
        let nextY = p.y + dy;
        let collision = false;

        // Island Collision
        for (const island of ISLANDS) {
            const dist = Math.hypot(nextX - island.x, nextY - island.y);
            if (dist < island.r + 30) { // 30 is boat radius
                collision = true;
                break;
            }
        }

        // Boundary Collision
        if (nextX < 0 || nextX > WORLD_SIZE || nextY < 0 || nextY > WORLD_SIZE) {
            collision = true;
        }

        if (!collision) {
            p.x = nextX;
            p.y = nextY;
        } else {
            p.speed *= 0.5; // Bounce back / slow down
            p.targetSpeed *= 0.5;
        }

        // 3. Sync to state for rendering
        setPos({ x: p.x, y: p.y });
        setRotation(p.rotation);

        // 4. Trail Logic (Persistent Stern Wake)
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

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [speed, rotation]);

    // --- INPUT HANDLING ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const p = physics.current;
            if (e.key === 'a' || e.key === 'ArrowLeft') {
                p.targetRotation -= 5; // Turn left
                setRotation(p.targetRotation);
            }
            if (e.key === 'd' || e.key === 'ArrowRight') {
                p.targetRotation += 5; // Turn right
                setRotation(p.targetRotation);
            }
            if (e.key === 'w' || e.key === 'ArrowUp') p.targetSpeed = Math.min(p.targetSpeed + 0.5, 5);
            if (e.key === 's' || e.key === 'ArrowDown') p.targetSpeed = Math.max(p.targetSpeed - 0.5, 0);
            if (e.key === ' ') setIsFishing(f => !f);

            // Sync speed state for HUD elements (throttled locally via effect)
            setSpeed(p.targetSpeed);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="fixed inset-0 z-[200] bg-sky-900 overflow-hidden cursor-crosshair">
            {/* THE LIVING SEA (Poseidon Engine V6 - The Deep Resonance) */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Layer 1: The Abyss (Stable Foundation) */}
                <div
                    className="absolute inset-x-[-10%] inset-y-[-10%] bg-[#020a14]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='f1'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='3'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23f1)'/%3E%3C/svg%3E")`,
                        backgroundPosition: `${-pos.x * 0.05}px ${-pos.y * 0.05}px`
                    }}
                />

                {/* Layer 2: The Caustic Shelf (Luminous Mid-Depth) */}
                <div
                    className="absolute inset-0 opacity-25 mix-blend-screen"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='f2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='2'/%3E%3CfeDiffuseLighting lighting-color='%2338bdf8' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23f2)'/%3E%3C/svg%3E")`,
                        backgroundPosition: `${-pos.x * 0.15}px ${-pos.y * 0.15}px`
                    }}
                />

                {/* Layer 3: Surface Specularity (Active Texture) */}
                <div
                    className="absolute inset-0 opacity-30 mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='f3'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.1' numOctaves='1'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 1 0 1 0 0 1 0 0 1 0 1 0 0 0 0.3 0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23f3)'/%3E%3C/svg%3E")`,
                        backgroundPosition: `${-pos.x * 0.4}px ${-pos.y * 0.4}px`
                    }}
                />

                {/* Layer 3: Atmospheric Clouds (High Parallax) */}
                <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                            key={`cloud-${i}`}
                            className="absolute text-white/10 blur-2xl select-none text-[8rem]"
                            style={{
                                left: `${(i * 25 + 10) % 100}%`,
                                top: `${(i * 35 + 5) % 100}%`,
                                transform: `translate(${-pos.x * (0.4 + i * 0.05)}px, ${-pos.y * (0.4 + i * 0.05)}px)`
                            }}
                        >
                            ☁️
                        </motion.div>
                    ))}
                </div>

                {/* Atmospheric Vignette (Soft Depth) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />
                {/* WORLD OBJECTS (Islands, Wrecks - Placeholder) */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* WAKE TRAIL (Persistent Path) */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible blur-md">
                        {trail.length > 1 && trail.map((pt, i) => {
                            if (i === 0) return null;
                            const prev = trail[i - 1];
                            const opacity = i / trail.length;
                            return (
                                <line
                                    key={pt.id}
                                    x1={prev.x - pos.x + window.innerWidth / 2}
                                    y1={prev.y - pos.y + window.innerHeight / 2}
                                    x2={pt.x - pos.x + window.innerWidth / 2}
                                    y2={pt.y - pos.y + window.innerHeight / 2}
                                    stroke="#fff"
                                    strokeWidth={25 * opacity}
                                    strokeOpacity={0.1 * opacity}
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    </svg>

                    {/* ARCHIPELAGO (Islands) */}
                    {ISLANDS.map(island => (
                        <div key={island.id} className="absolute pointer-events-none" style={{ left: island.x - pos.x + window.innerWidth / 2, top: island.y - pos.y + window.innerHeight / 2 }}>
                            {/* Coastal Foam */}
                            <div className="absolute inset-0 bg-white/20 blur-3xl opacity-50 rounded-full animate-pulse" style={{ width: island.r * 2.5, height: island.r * 2.5, transform: 'translate(-50%, -50%)' }} />

                            {/* The Landmass */}
                            <div
                                className="absolute rounded-full shadow-2xl"
                                style={{
                                    width: island.r * 2,
                                    height: island.r * 2,
                                    backgroundColor: island.color,
                                    transform: 'translate(-50%, -50%)',
                                    border: '10px solid rgba(0,0,0,0.1)'
                                }}
                            >
                                {/* Jungle/Trees texture (Mock) */}
                                <div className="absolute inset-4 rounded-full bg-black/10 blur-md" />
                            </div>

                            {/* Island Label */}
                            <div className="absolute top-[120%] left-1/2 -translate-x-1/2 text-white/40 text-sm font-bold tracking-widest uppercase whitespace-nowrap">
                                {island.name}
                            </div>
                        </div>
                    ))}
                </div>

                {/* OTHER PLAYERS */}
                {
                    Object.values(others).map(other => (
                        <motion.div
                            key={other.id}
                            className="absolute w-32 h-32"
                            animate={{
                                left: other.x - pos.x + window.innerWidth / 2,
                                top: other.y - pos.y + window.innerHeight / 2,
                                rotate: other.rotation
                            }}
                            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                        >
                            <ModularBoatSVG stage={other.stage} scale={0.4} />
                            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 bg-black/50 px-2 py-0.5 rounded text-[11px] text-white font-bold whitespace-nowrap">
                                {other.name}
                            </div>
                        </motion.div>
                    ))
                }

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        {/* THE HULL ANCHOR (Shadow and Displacement) */}
                        <div
                            className="absolute w-48 h-20 bg-black/40 blur-2xl rounded-full"
                            style={{
                                transform: `rotate(${rotation - 90}deg) translate(5px, 15px)`,
                                opacity: 0.6 + Math.sin(Date.now() / 400) * 0.1
                            }}
                        />

                        {/* REACTIVE WATERLINE (The "Wet" look) */}
                        <div
                            className="absolute w-64 h-24 bg-sky-400/10 blur-3xl rounded-full"
                            style={{
                                scale: 1 + (speed * 0.1),
                                transform: `rotate(${rotation - 90}deg)`
                            }}
                        />

                        {/* V-Wake (Poseidon Engine V6 - Under-Hull Hydrodynamics) */}
                        {speed > 0.4 && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    transform: `rotate(${rotation - 90}deg)`,
                                    zIndex: -1
                                }}
                            >
                                {/* Left Bow Wave (Prow Cut) */}
                                <motion.div
                                    animate={{
                                        opacity: [0.3, 0.6, 0.3],
                                        scale: [0.8, 1.1, 0.8],
                                        x: [70, 40],
                                        skewY: [0, -10]
                                    }}
                                    transition={{ repeat: Infinity, duration: 0.6 }}
                                    className="absolute top-1/2 left-1/2 w-16 h-8 bg-white/20 blur-lg rounded-full origin-right"
                                    style={{ transform: 'translate(40px, -30px) rotate(25deg)' }}
                                />
                                {/* Right Bow Wave (Prow Cut) */}
                                <motion.div
                                    animate={{
                                        opacity: [0.3, 0.6, 0.3],
                                        scale: [0.8, 1.1, 0.8],
                                        x: [70, 40],
                                        skewY: [0, 10]
                                    }}
                                    transition={{ repeat: Infinity, duration: 0.6 }}
                                    className="absolute top-1/2 left-1/2 w-16 h-8 bg-white/20 blur-lg rounded-full origin-right"
                                    style={{ transform: 'translate(40px, 15px) rotate(-25deg)' }}
                                />

                                {/* Stern Churn (Engine/Rudder displacement) */}
                                <motion.div
                                    animate={{
                                        opacity: [0.2, 0.5, 0.2],
                                        scale: [1, 1.5, 1],
                                        x: [-20, -60]
                                    }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="absolute top-1/2 left-1/2 w-24 h-12 bg-white/10 blur-xl rounded-full -translate-y-1/2"
                                />
                            </div>
                        )}

                        <ModularBoatSVG
                            stage={player.boat?.stage || 1}
                            rotation={rotation - 90}
                            scale={0.7}
                            className="animate-hull-bob relative z-10"
                        />
                    </div>
                </div>

                {/* HUD Overlay (Poseidon UI) */}
                <div className="absolute top-28 left-8 flex flex-col gap-4 pointer-events-none">
                    <div className="flex gap-4">
                        <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4"
                        >
                            <Compass
                                className="text-amber-400"
                                style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.5s ease-out' }}
                            />
                            <div>
                                <div className="text-[11px] font-black uppercase text-slate-500">Kurs</div>
                                <div className="text-xl font-black text-white italic">{Math.round(((rotation % 360) + 360) % 360)}°</div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 3.5 }}
                            className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4"
                        >
                            <Wind className="text-sky-400" />
                            <div>
                                <div className="text-[11px] font-black uppercase text-slate-500">Vindstyrke</div>
                                <div className="text-xl font-black text-white italic">{speed.toFixed(1)} Knop</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* COORDINATE HUD (Restored) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-950/60 backdrop-blur-sm p-3 rounded-xl border border-white/5 w-fit"
                    >
                        <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Posisjon</div>
                        <div className="text-xs font-mono text-slate-300">X: {Math.round(pos.x)} Y: {Math.round(pos.y)}</div>
                    </motion.div>
                </div>

                <div className="absolute bottom-8 right-8 pointer-events-auto">
                    <button
                        onClick={onExit}
                        className="px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase italic shadow-2xl shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-3"
                    >
                        <Anchor /> Gå i Land
                    </button>
                </div>

                {/* MINIMAP HUD */}
                <div className="fixed top-6 right-6 w-48 h-48 bg-black/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md p-1 shadow-2xl z-50">
                    <div className="relative w-full h-full bg-[#081829] rounded-lg overflow-hidden border border-white/5">
                        {/* Map Grid */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                        {/* Islands on Minimap */}
                        {ISLANDS.map(island => (
                            <div
                                key={`mini-${island.id}`}
                                className="absolute rounded-full opacity-60"
                                style={{
                                    left: `${(island.x / WORLD_SIZE) * 100}%`,
                                    top: `${(island.y / WORLD_SIZE) * 100}%`,
                                    width: `${(island.r / WORLD_SIZE) * 200}%`,
                                    height: `${(island.r / WORLD_SIZE) * 200}%`,
                                    backgroundColor: island.color,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        ))}

                        {/* Player Position */}
                        <motion.div
                            className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_#ef4444]"
                            style={{
                                left: `${(pos.x / WORLD_SIZE) * 100}%`,
                                top: `${(pos.y / WORLD_SIZE) * 100}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {/* Radar Sweep */}
                            <div className="absolute inset-[-100%] border border-red-500/50 rounded-full animate-ping" />
                        </motion.div>

                        {/* Coordinates Label */}
                        <div className="absolute bottom-1 right-2 text-[10px] text-white/40 font-mono">
                            {Math.round(pos.x)} : {Math.round(pos.y)}
                        </div>
                    </div>
                </div>

                {/* FISHING OVERLAY */}
                <AnimatePresence>
                    {isFishing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/40 p-12 rounded-full animate-pulse">
                                <LifeBuoy size={64} className="text-emerald-400" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
