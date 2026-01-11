import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationPlayer } from '../simulationTypes';
import { ModularBoatSVG } from './ModularBoatSVG';
import { Anchor, LifeBuoy, Compass, Wind } from 'lucide-react';
import { ref, update, onValue, off } from 'firebase/database';
import { simulationDb } from '../simulationFirebase';

interface SailingMinigameProps {
    player: SimulationPlayer;
    roomPin: string;
    onExit: () => void;
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
        const accel = p.targetSpeed > p.speed ? 1.5 : 2.5; // Decel is faster than accel
        p.speed += (p.targetSpeed - p.speed) * Math.min(dt * accel, 1);

        // 2. Rudder Inertia & Turning (Nautical Correction)
        // Nautical: 0 deg is North (-Y), 90 deg is East (+X).
        // Standard math: 0 is East, 90 is South.
        // Conversion: AngleInMath = rotation - 90
        const moveRad = (p.rotation - 90) * (Math.PI / 180);

        // Update Position
        p.x += Math.cos(moveRad) * p.speed;
        p.y += Math.sin(moveRad) * p.speed;

        // 3. Sync to state for rendering
        setPos({ x: p.x, y: p.y });
        setRotation(p.rotation);

        // 4. Trail Logic (Persistent Stern Wake)
        // Calculate stern position in world space for realistic trailing
        const sternLength = 40; // Approx distance from center to stern
        const sx = p.x - Math.cos(moveRad) * sternLength;
        const sy = p.y - Math.sin(moveRad) * sternLength;

        const dist = Math.hypot(sx - lastTrailPos.current.x, sy - lastTrailPos.current.y);
        if (dist > 25) {
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
                p.rotation -= 3; // Turn left
                setRotation(p.rotation);
            }
            if (e.key === 'd' || e.key === 'ArrowRight') {
                p.rotation += 3; // Turn right
                setRotation(p.rotation);
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

                    {/* Example Island */}
                    <div
                        className="absolute w-64 h-64 bg-emerald-800 rounded-full blur-xl opacity-40"
                        style={{ left: 1500 - pos.x, top: 1500 - pos.y }}
                    />
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
