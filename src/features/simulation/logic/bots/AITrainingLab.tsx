import React, { useState, useEffect, useRef } from 'react';
import { BotInstance } from './BotInstance';
import { BotEvolution } from './botEvolution';
import { ref, update } from 'firebase/database';
import { simulationDb as db } from '../../simulationFirebase';
import { INITIAL_RESOURCES, INITIAL_SKILLS } from '../../constants';
import type { SimulationRoom } from '../../simulationTypes';
import { Brain, TrendingUp, AlertTriangle, Play, Pause, Activity, Users } from 'lucide-react';

interface AITrainingLabProps {
    roomData: SimulationRoom;
    pin: string;
}

export const AITrainingLab: React.FC<AITrainingLabProps> = ({ roomData, pin }) => {
    const [bots, setBots] = useState<BotInstance[]>([]);
    const [generation, setGeneration] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [fitnessHistory, setFitnessHistory] = useState<number[]>([]);
    const [decisionStats, setDecisionStats] = useState<Record<string, number>>({});
    const [botTelemetry, setBotTelemetry] = useState<Record<string, any>>({});
    const [lastError, setLastError] = useState<any>(null);
    const roomRef = useRef<SimulationRoom>(roomData);

    useEffect(() => {
        roomRef.current = roomData;
    }, [roomData]);

    const timerRef = useRef<number | null>(null);

    const spawnTestBots = async () => {
        const updates: any = {};
        for (let i = 1; i <= 5; i++) {
            const charId = `bot_${Date.now()}_${i}`;
            const character = {
                id: charId,
                name: `BOT Alpha ${i}`,
                role: 'PEASANT',
                regionId: Math.random() > 0.5 ? 'region_ost' : 'region_vest',
                resources: { ...INITIAL_RESOURCES.PEASANT },
                status: { hp: 100, stamina: 100, morale: 100, legitimacy: 100, authority: 50, loyalty: 100, isJailed: false, isFrozen: false },
                stats: { level: 1, xp: 0, reputation: 10, contribution: 0 },
                skills: { ...INITIAL_SKILLS.PEASANT },
                lastActive: Date.now(),
                online: true
            };
            updates[`simulation_rooms/${pin}/players/${charId}`] = character;
            updates[`simulation_rooms/${pin}/public_profiles/${charId}`] = {
                id: charId,
                name: character.name,
                role: character.role,
                regionId: character.regionId,
                stats: { level: 1 },
                status: character.status,
                online: true,
                lastActive: Date.now()
            };
        }
        try {
            await update(ref(db), updates);
        } catch (e) {
            console.error("Failed to spawn bots", e);
        }
    };

    const startTraining = () => {
        if (!roomData.players) return;

        // Pick all players or some specific bots? 
        // For now, let's assume we spawn a bot if none exist, or convert existing players?
        // Actually, let's just listen to roomData.players and if they are marked as 'BOT', we run them.
        // But the user wants us to implement the system, so let's allow spawning bots.

        setIsRunning(true);
    };

    const stopTraining = () => {
        setIsRunning(false);
        if (timerRef.current) cancelIdleCallback(timerRef.current);
    };

    useEffect(() => {
        if (isRunning) {
            const runTick = async () => {
                const currentRoom = roomRef.current;
                // Find bot players in roomData
                const botPlayers = Object.values(currentRoom.players || {}).filter(p => p.name.includes('BOT'));

                const promises = botPlayers.map(async (p) => {
                    // Find or create bot instance
                    let instance = bots.find(b => b.player.id === p.id);
                    if (!instance) {
                        const genome = BotEvolution.getNextGenerationGenome();
                        instance = new BotInstance(p, genome);
                        setBots(prev => [...prev, instance!]);
                        setGeneration(genome.generation);
                    } else {
                        instance.player = p; // Update with latest room state
                    }

                    await instance.tick(currentRoom, pin);

                    // Update stats
                    if (instance.history.length > 0) {
                        const lastDecision = instance.history[instance.history.length - 1];
                        let actionKey = lastDecision.action.type || 'IDLE';

                        // Add detail for SELL/BUY
                        if (actionKey === 'SELL' && lastDecision.action.itemId) {
                            actionKey = `SELL (${lastDecision.action.itemId})`;
                        } else if (actionKey === 'BUY' && lastDecision.action.itemId) {
                            actionKey = `BUY (${lastDecision.action.itemId})`;
                        }

                        setDecisionStats(prev => ({ ...prev, [actionKey]: (prev[actionKey] || 0) + 1 }));

                        // Update Telemetry
                        setBotTelemetry(prev => ({
                            ...prev,
                            [instance.player.id]: {
                                name: instance.player.name,
                                action: actionKey,
                                reason: lastDecision.reason,
                                score: lastDecision.score.toFixed(2),
                                fitness: instance.getFitness().toFixed(1),
                                resources: { ...instance.player.resources },
                                stamina: instance.player.status.stamina
                            }
                        }));
                    }

                    if (instance.status === 'STUCK' || instance.status === 'DEAD') {
                        setLastError((window as any).lastAILog);
                    }

                    if (instance.status === 'SUCCESS' || instance.status === 'DEAD' || instance.status === 'STUCK') {
                        // Evolution step
                        const fitness = instance.getFitness();
                        instance.genome.fitness = fitness;
                        BotEvolution.saveTopGenomes([instance.genome]);
                        setFitnessHistory(prev => [...prev.slice(-19), fitness]);
                    }
                });

                // Schedule next tick with a small delay to avoid CPU hogging
                timerRef.current = window.setTimeout(() => runTick(), 1000);
            };

            runTick();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isRunning, pin]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-white/10">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="text-indigo-400" /> AI Training Lab
                    </h2>
                    <p className="text-slate-400 text-sm">Genetisk Algoritme-optimalisering av spillbalanse</p>
                </div>
                <div className="flex gap-3">
                    {!isRunning ? (
                        <button onClick={startTraining} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all">
                            <Play size={18} /> Start Trening
                        </button>
                    ) : (
                        <button onClick={stopTraining} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all">
                            <Pause size={18} /> Stopp Trening
                        </button>
                    )}
                </div>
            </div>

            {isRunning && Object.values(roomData.players || {}).filter(p => p.name.includes('BOT') || p.id.startsWith('bot_')).length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-500/20 p-3 rounded-full text-amber-500">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-amber-500 font-black uppercase text-sm">Ingen bot-subjekter funnet</h3>
                            <p className="text-amber-200/60 text-xs">AI-en trenger kropper å kontrollere (navn med 'BOT' eller ID 'bot_').</p>
                        </div>
                    </div>
                    <button
                        onClick={spawnTestBots}
                        className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg hover:scale-105"
                    >
                        🤖 Spawn Alpha Squad (5 stk)
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-black mb-2">
                        <Activity size={14} /> Generasjon
                    </div>
                    <div className="text-4xl font-black">{generation}</div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-black mb-2">
                            <TrendingUp size={14} /> Fitness Trend
                        </div>
                        <div className="text-4xl font-black mb-4">
                            {fitnessHistory.length > 0 ? (fitnessHistory.reduce((a, b) => a + b, 0) / fitnessHistory.length).toFixed(1) : '0.0'}
                        </div>
                    </div>
                    {/* Sparkline Graph */}
                    <div className="h-12 flex items-end gap-1 px-1">
                        {fitnessHistory.map((f, i) => {
                            const max = Math.max(...fitnessHistory, 1);
                            const height = (f / max) * 100;
                            return (
                                <div
                                    key={i}
                                    className="flex-1 bg-indigo-500/50 rounded-t-sm transition-all duration-500 hover:bg-indigo-400"
                                    style={{ height: `${height}%` }}
                                    title={`Fitness: ${f.toFixed(1)}`}
                                />
                            );
                        })}
                        {fitnessHistory.length === 0 && <div className="w-full h-[1px] bg-white/10" />}
                    </div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 text-amber-500">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-black mb-2">
                        <AlertTriangle size={14} /> Bottlenecks
                    </div>
                    <div className="text-4xl font-black text-amber-500">
                        {bots.filter(b => b.status === 'STUCK').length}
                    </div>
                </div>
            </div>

            {/* Decision Heatmap */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Decision Heatmap</h3>
                <div className="flex flex-wrap gap-4">
                    {Object.entries(decisionStats).sort((a, b) => b[1] - a[1]).map(([action, count]) => (
                        <div key={action} className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col items-center min-w-[80px]">
                            <span className="text-xs text-slate-500 uppercase">{action}</span>
                            <span className="text-lg font-bold">{count}</span>
                        </div>
                    ))}
                    {Object.keys(decisionStats).length === 0 && <p className="text-slate-600 italic">Ingen data ennå...</p>}
                </div>
            </div>

            {/* LIVE NEURAL FEED */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-indigo-400" /> Live Neural Feed
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs uppercase text-slate-500 border-b border-white/10">
                                <th className="p-3">Subject</th>
                                <th className="p-3">Last Decision</th>
                                <th className="p-3">Reasoning</th>
                                <th className="p-3">Score</th>
                                <th className="p-3">Fitness</th>
                                <th className="p-3">Gold</th>
                                <th className="p-3">Stamina</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {Object.entries(botTelemetry).map(([id, data]: [string, any]) => (
                                <tr key={id} className="border-b border-white/5 hover:bg-white/5 transition-colors font-mono">
                                    <td className="p-3 font-bold text-indigo-300">{data.name}</td>
                                    <td className="p-3">
                                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs font-bold border border-indigo-500/30">
                                            {data.action}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-400 italic text-xs">"{data.reason}"</td>
                                    <td className="p-3 text-slate-300">{data.score}</td>
                                    <td className="p-3 font-bold text-white">{data.fitness}</td>
                                    <td className="p-3 text-amber-400">{data.resources.gold}</td>
                                    <td className="p-3">
                                        <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${data.stamina}%` }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {Object.keys(botTelemetry).length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-600 italic">Venter på telemetri...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Error Log */}
            {lastError && (
                <div className="bg-red-950/30 border border-red-500/30 p-6 rounded-2xl">
                    <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4">
                        <AlertTriangle size={18} /> Game Balance Issue Detected
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-black/40 p-4 rounded-lg">
                            <p className="text-slate-400 text-xs uppercase mb-2">Grunn</p>
                            <p className="font-mono">{lastError.reason}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-lg">
                            <p className="text-slate-400 text-xs uppercase mb-2">Siste Handling</p>
                            <p className="font-mono">{lastError.history[lastError.history.length - 1]?.action.type || 'None'}</p>
                        </div>
                    </div>
                    <pre className="mt-4 p-4 bg-black/40 rounded-lg overflow-x-auto text-[10px] text-slate-300 custom-scrollbar">
                        {JSON.stringify(lastError, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
