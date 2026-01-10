import React, { useState, useEffect } from 'react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import type { SimulationPlayer, ActiveProcess } from '../simulationTypes';
import { ResourceIcon } from '../ui/ResourceIcon';
import { motion } from 'framer-motion';

interface ChickenCoopWindowProps {
    player: SimulationPlayer;
    activeProcesses: ActiveProcess[];
    onAction: (action: any) => void;
    onClose: () => void;
}

export const ChickenCoopWindow: React.FC<ChickenCoopWindowProps> = ({ player, activeProcesses, onAction, onClose }) => {

    // Filter for COOP processes at 'chicken_coop' location
    const coopProcesses = activeProcesses.filter(p => p.type === 'COOP' && p.locationId === 'chicken_coop');
    const isFeeding = coopProcesses.length > 0;
    const currentProcess = coopProcesses[0];

    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!currentProcess) {
            setTimeLeft(0);
            return;
        }

        const tick = () => {
            const left = Math.max(0, currentProcess.readyAt - Date.now());
            setTimeLeft(left);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [currentProcess]);

    const isReady = isFeeding && timeLeft <= 0;
    const grainAmount = player.resources.grain || 0;

    const handleFeed = () => {
        onAction({ type: 'FEED_CHICKENS', locationId: 'chicken_coop' });
    };

    const handleCollect = () => {
        onAction({ type: 'COLLECT_EGGS', locationId: 'chicken_coop' });
    };

    // Calculate progress for bar
    const totalTime = currentProcess ? currentProcess.readyAt - currentProcess.startedAt : 1;
    const progress = currentProcess ? 1 - (timeLeft / totalTime) : 0;

    const farmLevel = player.buildings?.farm_house?.level || 1;
    const bgBaseName = farmLevel > 1 ? `map_peasant_farm_lvl${farmLevel}` : 'map_peasant_farm';

    return (
        <SimulationMapWindow
            title="Hønsehuset"
            icon={<span className="text-2xl">🐔</span>}
            onClose={onClose}
        >
            <div className="p-6 flex flex-col items-center gap-8 min-h-[400px]">

                {/* Scene */}
                <div className="relative w-full h-48 bg-slate-900/50 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
                    <img
                        src={`${import.meta.env.BASE_URL}${bgBaseName}.png`}
                        className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
                        alt="Coop Background"
                    />

                    {/* Chickens Visualization */}
                    <div className="relative z-10 flex gap-4">
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-6xl"
                        >
                            🐓
                        </motion.div>
                        {isFeeding && !isReady && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-6xl"
                            >
                                🐣
                            </motion.div>
                        )}
                        {isReady && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="text-6xl drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                            >
                                🥚
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Status Text & Controls */}
                <div className="text-center space-y-4 max-w-sm">
                    {!isFeeding && (
                        <>
                            <h3 className="text-xl font-bold text-white">Sultne Høner</h3>
                            <p className="text-slate-400 text-sm">Hønene kakler utålmodig. Gi dem korn for å starte eggproduksjonen.</p>

                            <div className="flex items-center justify-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                <ResourceIcon resource="grain" amount={grainAmount} size="lg" />
                                <button
                                    onClick={handleFeed}
                                    disabled={grainAmount < 5}
                                    className={`
                                        px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all
                                        ${grainAmount >= 5
                                            ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-amber-500/20 shadow-lg'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                                    `}
                                >
                                    Fôr Høner (5 Korn)
                                </button>
                            </div>
                        </>
                    )}

                    {isFeeding && !isReady && (
                        <>
                            <h3 className="text-xl font-bold text-white">Hønene Spiser</h3>
                            <p className="text-slate-400 text-sm">Det tar tid å lage gode egg...</p>

                            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                                <motion.div
                                    className="h-full bg-amber-500"
                                    initial={{ width: `${progress * 100}%` }}
                                    animate={{ width: `${progress * 100}%` }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                            </div>
                            <p className="font-mono text-amber-400 font-bold">{Math.ceil(timeLeft / 60000)} minutter igjen</p>
                        </>
                    )}

                    {isReady && (
                        <>
                            <h3 className="text-xl font-bold text-white">Eggene er klare!</h3>
                            <p className="text-slate-400 text-sm">Redet er fullt av ferske egg.</p>

                            <button
                                onClick={handleCollect}
                                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black uppercase tracking-widest text-lg shadow-emerald-500/30 shadow-2xl animate-pulse"
                            >
                                Samle Egg
                            </button>
                        </>
                    )}
                </div>

            </div>
        </SimulationMapWindow>
    );
};
