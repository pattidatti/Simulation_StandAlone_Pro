import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, History } from 'lucide-react';
import type { SimulationPlayer } from '../simulationTypes';

interface TavernResourceGameProps {
    player: SimulationPlayer;
    onClose: () => void;
    onPlay: (result: { resource: string; amount: number; multiplier: number; isWin: boolean }) => void;
}

const RESOURCES = [
    { id: 'gold', label: 'GULL', icon: '💰', color: 'from-yellow-400 to-amber-600', accent: 'amber' },
    { id: 'grain', label: 'KORN', icon: '🌾', color: 'from-amber-400 to-amber-600', accent: 'amber' },
    { id: 'wood', label: 'TREVIRKE', icon: '🪵', color: 'from-orange-500 to-amber-800', accent: 'orange' },
    { id: 'stone', label: 'STEIN', icon: '🪨', color: 'from-slate-500 to-slate-700', accent: 'slate' },
    { id: 'iron', label: 'JERN', icon: '⛓️', color: 'from-blue-500 to-indigo-900', accent: 'indigo' },
];

const MULTIPLIERS = [
    { value: 0, weight: 50, label: 'Tap', color: '#0f172a', multiplierText: '0x', angle: 180 },
    { value: 1.5, weight: 30, label: 'Gevinst', color: '#10b981', multiplierText: '1.5x', angle: 90 },
    { value: 2.5, weight: 15, label: 'Stor Gevinst', color: '#3b82f6', multiplierText: '2.5x', angle: 60 },
    { value: 5, weight: 5, label: 'JACKPOT!', color: '#f59e0b', multiplierText: '5x', angle: 30 },
];

export const TavernResourceGame: React.FC<TavernResourceGameProps> = ({ player, onClose, onPlay }) => {
    const [selectedResource, setSelectedResource] = useState<string>('gold');
    const [betAmount, setBetAmount] = useState<number>(100);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [lastResult, setLastResult] = useState<{ multiplier: number; isWin: boolean; label: string } | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Lock to prevent race conditions during double-clicks
    const spinInProgress = useRef(false);

    const playerResources = (player.resources || {}) as any;
    const currentAmount = playerResources[selectedResource] || 0;

    useEffect(() => {
        if (betAmount > currentAmount) {
            setBetAmount(Math.max(1, Math.floor(currentAmount)));
        }
    }, [selectedResource, currentAmount]);

    const handleSpin = () => {
        // Double safety: state + ref
        if (spinInProgress.current || isSpinning || betAmount <= 0 || betAmount > currentAmount) return;

        spinInProgress.current = true;
        setIsSpinning(true);
        setLastResult(null);

        // 1. Calculate weighted result
        const totalWeight = MULTIPLIERS.reduce((acc, m) => acc + m.weight, 0);
        const random = Math.random() * totalWeight;
        let resultIdx = 0;
        let cumulativeWeight = 0;

        for (let i = 0; i < MULTIPLIERS.length; i++) {
            cumulativeWeight += MULTIPLIERS[i].weight;
            if (random < cumulativeWeight) {
                resultIdx = i;
                break;
            }
        }

        const result = MULTIPLIERS[resultIdx];
        const extraRounds = 6 + Math.floor(Math.random() * 4); // Consistent full rounds

        // 2. Calculate target rotation
        // Find the absolute angle on the wheel for the selected segment's center
        let cumulativeAngle = 0;
        for (let i = 0; i < resultIdx; i++) {
            cumulativeAngle += MULTIPLIERS[i].angle;
        }
        const targetCenterOnWheel = cumulativeAngle + (MULTIPLIERS[resultIdx].angle / 2);

        // Pointer is at 12 o'clock (0 degrees).
        // If we rotate the wheel by R, a point P on the wheel moves to (P + R) mod 360.
        // We want (targetCenterOnWheel + finalRotation) % 360 = 0 (Top).
        // So finalRotation % 360 = (360 - targetCenterOnWheel) % 360.
        const targetRotationOffset = (360 - targetCenterOnWheel) % 360;
        const currentMod = rotation % 360;
        const additionalRotation = (targetRotationOffset - currentMod + 360) % 360;

        const nextRotation = rotation + (extraRounds * 360) + additionalRotation;
        setRotation(nextRotation);

        // 3. Resolve result after animation
        setTimeout(() => {
            const isWin = result.value > 0;
            const outcome = {
                multiplier: result.value,
                isWin,
                label: result.label
            };

            setLastResult(outcome);
            setIsSpinning(false);
            spinInProgress.current = false;

            const newHistoryEntry = {
                resource: selectedResource,
                amount: betAmount,
                multiplier: result.value,
                isWin,
                timestamp: Date.now()
            };
            setHistory(prev => [newHistoryEntry, ...prev].slice(0, 4));

            // Execute game logic
            onPlay({
                resource: selectedResource,
                amount: betAmount,
                multiplier: result.value,
                isWin
            });
        }, 3100); // 100ms buffer after 3s animation
    };

    const activeRes = RESOURCES.find(r => r.id === selectedResource) || RESOURCES[0];

    const wheelBackground = useMemo(() => {
        let currentDeg = 0;
        return MULTIPLIERS.map(m => {
            const start = currentDeg;
            currentDeg += m.angle;
            return `${m.color} ${start}deg ${currentDeg}deg`;
        }).join(', ');
    }, []);

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={!isSpinning ? onClose : undefined} className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl cursor-pointer" />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                className="relative w-full max-w-5xl bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[650px]"
            >
                <button onClick={onClose} disabled={isSpinning} className="absolute top-6 right-6 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all"><X size={24} /></button>

                <div className="flex-1 p-6 flex flex-col gap-4 z-10 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Sparkles size={10} /><span>Soga-hjulet</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">Sats Dine Ressurser</h2>

                    <div className="grid grid-cols-5 gap-2">
                        {RESOURCES.map(res => {
                            const isSelected = selectedResource === res.id;
                            const amount = playerResources[res.id] || 0;
                            return (
                                <button
                                    key={res.id}
                                    onClick={() => !isSpinning && setSelectedResource(res.id)}
                                    className={`relative p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-1.5
                                        ${isSelected ? `bg-white/5 border-${res.accent}-500 shadow-lg scale-105` : 'bg-black/20 border-white/5 hover:border-white/10 opacity-70'}`}
                                >
                                    <div className="text-2xl">{res.icon}</div>
                                    <div className="flex flex-col items-center">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{res.label}</div>
                                        <div className={`text-lg font-black font-mono ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                            {amount % 1 !== 0 ? amount.toFixed(1) : amount.toLocaleString()}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Innsats Beløp</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white font-mono">{betAmount.toLocaleString()}</span>
                                    <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">{activeRes.label}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {[25, 50, 100].map(pct => (
                                    <button
                                        key={pct}
                                        onClick={() => setBetAmount(Math.max(1, Math.floor(currentAmount * (pct / 100))))}
                                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 border border-white/5"
                                    >
                                        {pct === 100 ? 'MAX' : `${pct}%`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative h-8 flex items-center">
                            <input type="range" min={1} max={Math.max(1, Math.floor(currentAmount))} step={1} value={betAmount} onChange={(e) => setBetAmount(parseInt(e.target.value))} disabled={isSpinning} className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500 z-10" />
                            <div className="absolute left-0 h-1.5 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full pointer-events-none" style={{ width: `${(betAmount / Math.max(1, Math.floor(currentAmount))) * 100}%` }} />
                        </div>

                        <button
                            onClick={handleSpin}
                            disabled={isSpinning || currentAmount < betAmount || betAmount <= 0}
                            className={`w-full relative h-14 rounded-xl font-black uppercase tracking-[0.3em] text-base shadow-2xl transition-all duration-300 ${isSpinning ? 'bg-slate-800' : 'bg-amber-500 hover:brightness-110 active:scale-95 text-slate-950'}`}
                        >
                            {isSpinning ? 'Spinner...' : 'SPINN HJULET!'}
                        </button>
                    </div>

                    <div className="mt-auto border-t border-white/5 pt-3">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mb-2">
                            <History size={10} /><span>Siste Resultater</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {history.map((h, i) => {
                                const res = RESOURCES.find(r => r.id === h.resource);
                                return (
                                    <div key={i} className="flex flex-col p-2 rounded-xl bg-black/40 border border-white/5 items-center">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-xs">{res?.icon}</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-400">{h.amount.toLocaleString()}</span>
                                        </div>
                                        <div className={`text-xs font-black font-mono ${h.isWin ? 'text-emerald-500' : 'text-rose-900/40'}`}>
                                            {h.isWin ? `x${h.multiplier}` : 'TAP'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[480px] bg-black/50 border-l border-white/5 flex flex-col items-center justify-center p-12 relative">
                    <div className="relative w-80 h-80 mb-10">
                        <div className={`absolute -inset-12 rounded-full blur-[100px] opacity-20 transition-colors duration-1000 bg-${activeRes.accent}-500`} />
                        <motion.div animate={{ rotate: rotation }} transition={{ duration: 3, ease: [0.32, 0.72, 0, 1] }} className="w-full h-full rounded-full border-[18px] border-slate-900 shadow-2xl relative overflow-hidden bg-slate-950">
                            <div
                                className="absolute inset-0 transition-opacity duration-300"
                                style={{ background: `conic-gradient(${wheelBackground})`, opacity: isSpinning ? 0.4 : 0.8 }}
                            />

                            {MULTIPLIERS.map((m, i) => {
                                let startAngle = 0;
                                for (let j = 0; j < i; j++) startAngle += MULTIPLIERS[j].angle;
                                const centerAngle = startAngle + m.angle / 2;
                                return (
                                    <div
                                        key={i}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        style={{ transform: `rotate(${centerAngle}deg)` }}
                                    >
                                        <div className="absolute top-[16%] text-white font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] font-mono">
                                            {m.multiplierText}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="absolute inset-[80px] rounded-full border-2 border-white/5 bg-slate-950/80 backdrop-blur-md shadow-inner" />
                        </motion.div>

                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50">
                            <motion.div
                                animate={isSpinning ? { y: [0, -5, 0] } : {}}
                                transition={{ duration: 0.1, repeat: Infinity }}
                                className="w-10 h-16 bg-amber-500 rounded-b-full shadow-[0_15px_30px_rgba(245,158,11,0.6)] border-4 border-slate-950 flex flex-col items-center justify-end pb-2"
                            >
                                <div className="w-1.5 h-6 bg-slate-950/30 rounded-full" />
                            </motion.div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                            <AnimatePresence mode="wait">
                                {isSpinning ? (
                                    <motion.div key="spinning_icon" initial={{ scale: 0.8 }} animate={{ scale: 1.1 }} exit={{ scale: 1.2, opacity: 0 }} className="text-7xl drop-shadow-2xl">
                                        {activeRes.icon}
                                    </motion.div>
                                ) : (
                                    <motion.div key="result_icon" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-1 drop-shadow-2xl">
                                        <span className="text-6xl">{activeRes.icon}</span>
                                        {lastResult && (
                                            <motion.span
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className={`text-3xl font-black font-mono ${lastResult.isWin ? 'text-emerald-400' : 'text-slate-500'}`}
                                            >
                                                {lastResult.multiplier}x
                                            </motion.span>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="h-20 text-center">
                        <AnimatePresence mode="wait">
                            {lastResult && !isSpinning && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                                    <div className={`text-xs font-black uppercase tracking-[0.3em] ${lastResult.isWin ? 'text-emerald-400' : 'text-slate-500'}`}>{lastResult.label}</div>
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg">
                                        {lastResult.isWin ? `+${(betAmount * lastResult.multiplier).toLocaleString()} ${activeRes.label}` : "Fortellingen er over"}
                                    </h4>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
