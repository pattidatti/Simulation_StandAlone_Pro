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

    const requestRef = useRef<number>(0);

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

    // --- PHYSICS ENGINE ---
    const updatePhysics = () => {
        setPos(prev => {
            // Calculate movement based on rotation and speed
            const rad = (rotation - 90) * (Math.PI / 180);
            const dx = Math.cos(rad) * speed;
            const dy = Math.sin(rad) * speed;

            return {
                x: prev.x + dx,
                y: prev.y + dy
            };
        });

        requestRef.current = requestAnimationFrame(updatePhysics);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [speed, rotation]);

    // --- INPUT HANDLING ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'a' || e.key === 'ArrowLeft') setRotation(r => r - 5);
            if (e.key === 'd' || e.key === 'ArrowRight') setRotation(r => r + 5);
            if (e.key === 'w' || e.key === 'ArrowUp') setSpeed(s => Math.min(s + 0.2, 5));
            if (e.key === 's' || e.key === 'ArrowDown') setSpeed(s => Math.max(s - 0.2, 0));
            if (e.key === ' ') setIsFishing(f => !f);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="fixed inset-0 z-[200] bg-sky-900 overflow-hidden cursor-crosshair">
            {/* SEA GRID / TEXTURE */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '100px 100px',
                    transform: `translate(${-pos.x % 100}px, ${-pos.y % 100}px)`
                }}
            />

            {/* WORLD OBJECTS (Islands, Wrecks - Placeholder) */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Example Island */}
                <div
                    className="absolute w-64 h-64 bg-emerald-800 rounded-full blur-xl opacity-40"
                    style={{ left: 1500 - pos.x, top: 1500 - pos.y }}
                />
            </div>

            {/* OTHER PLAYERS */}
            {Object.values(others).map(other => (
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
            ))}

            {/* LOCAL PLAYER BOAT */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-48">
                    <ModularBoatSVG
                        stage={player.boat?.stage || 1}
                        rotation={rotation}
                        scale={0.6}
                    />

                    {/* Wake Effect */}
                    {speed > 1 && (
                        <motion.div
                            animate={{ opacity: [0, 0.3, 0], scale: [1, 1.5] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-40 bg-white/20 blur-xl rounded-full -z-10"
                        />
                    )}
                </div>
            </div>

            {/* HUD Overlay */}
            <div className="absolute top-8 left-8 flex gap-4 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                    <Compass className="text-amber-400 animate-spin-slow" style={{ animationDuration: '10s' }} />
                    <div>
                        <div className="text-[11px] font-black uppercase text-slate-500">Koordinater</div>
                        <div className="text-xl font-black text-white italic">X: {Math.round(pos.x)} Y: {Math.round(pos.y)}</div>
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                    <Wind className="text-sky-400" />
                    <div>
                        <div className="text-[11px] font-black uppercase text-slate-500">Vindstyrke</div>
                        <div className="text-xl font-black text-white italic">{speed.toFixed(1)} Knop</div>
                    </div>
                </div>
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
    );
};
