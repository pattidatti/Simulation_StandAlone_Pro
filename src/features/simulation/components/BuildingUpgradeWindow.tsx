import React from 'react';
import { VILLAGE_BUILDINGS } from '../data/production';
import type { SimulationPlayer, SimulationRoom } from '../simulationTypes';
import { ArrowBigRight, Check, Hammer, Trophy, Lock } from 'lucide-react';

interface BuildingUpgradeWindowProps {
    buildingId: string;
    player: SimulationPlayer;
    room: SimulationRoom;
    onAction: (action: any) => void;
}

export const BuildingUpgradeWindow: React.FC<BuildingUpgradeWindowProps> = ({ buildingId, player, room, onAction }) => {
    const buildingDef = (VILLAGE_BUILDINGS as any)[buildingId];
    if (!buildingDef) return null;

    const isPrivate = buildingId === 'farm_house';
    const isCastle = ['manor_ost', 'manor_vest', 'throne_room'].includes(buildingId);
    const defaultLevel = isCastle ? 0 : 1;

    const buildingState = isPrivate
        ? ((player as any).buildings?.[buildingId] || { level: 1, progress: {} })
        : ((room.world as any)?.settlement?.buildings?.[buildingId] || { id: buildingId, level: defaultLevel, progress: {}, contributions: {} });

    const currentLevel = (buildingState.level as number) ?? 0;

    // Determine Max Level dynamically from keys
    const levels = Object.keys(buildingDef.levels).map(Number).sort((a, b) => a - b);
    const maxLevel = levels[levels.length - 1];

    const isMaxLevel = currentLevel >= maxLevel;
    const nextLevel = currentLevel + 1;
    const nextLevelDef = buildingDef.levels[nextLevel];
    const currentLevelDef = buildingDef.levels[currentLevel];

    // --- MAX LEVEL VIEW ---
    if (isMaxLevel) {
        return (
            <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-600/20 to-slate-900 border border-amber-500/30 shadow-2xl p-8 text-center group">
                <div className="absolute inset-0 bg-[url('/patterns/topographic.svg')] opacity-10" />
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy size={120} className="text-amber-400" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.4)] animate-pulse">
                        <Trophy size={40} className="text-white drop-shadow-md" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-amber-100 uppercase tracking-tighter mb-2">Mesterverk Fullført</h2>
                        <p className="text-amber-200/60 font-medium max-w-md mx-auto">
                            {buildingDef.name} har nådd sitt ypperste potensial (Nivå {maxLevel}).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full max-w-md mt-4">
                        <div className="bg-amber-950/40 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
                            <span className="text-2xl">✨</span>
                            <div className="text-left">
                                <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Aktiv Bonus</div>
                                <div className="font-bold text-amber-100">{currentLevelDef?.bonus || "Maksimal effekt"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- PROGRESSION VIEW ---
    return (
        <div className="space-y-8 w-full">

            {/* Header / Comparison */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                {/* Current */}
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-2 opacity-60">
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nåværende</div>
                    <div className="text-3xl font-black text-slate-300">Nivå {currentLevel}</div>
                    <div className="text-xs text-center text-slate-500 font-medium px-2">
                        {currentLevelDef?.bonus || "Ingen effekt"}
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center text-indigo-500">
                    <ArrowBigRight size={32} className="animate-pulse" />
                </div>

                {/* Next */}
                <div className="bg-indigo-600/10 rounded-2xl p-5 border border-indigo-500/30 flex flex-col items-center gap-2 relative overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                    <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Neste Oppgradering</div>
                    <div className="text-4xl font-black text-white">Nivå {nextLevel}</div>
                    <div className="text-xs text-center text-indigo-200 font-bold px-2 bg-indigo-500/20 py-1 rounded-full mt-1">
                        {nextLevelDef?.bonus || "???"}
                    </div>
                </div>
            </div>

            {/* Quote / Description */}
            <div className="bg-slate-950/30 rounded-xl p-4 text-center border border-white/5">
                <p className="text-slate-400 text-sm italic">"{buildingDef.description}"</p>
            </div>


            {/* Requirements Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ressurskrav</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isPrivate ? 'Privat Bygg' : 'Felles Dugnad'}</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {Object.entries(nextLevelDef.requirements || {}).map(([res, targetAmt]: [any, any]) => {
                        const currentAmt = Math.floor((buildingState.progress as any)?.[res] || 0);
                        const progress = Math.min(100, (currentAmt / targetAmt) * 100);
                        const playerHas = Math.floor((player.resources as any)?.[res] || 0);
                        const needed = targetAmt - currentAmt;
                        const canGive = playerHas > 0 && needed > 0;
                        const giveAmount = Math.min(playerHas, needed);
                        const isCompleted = currentAmt >= targetAmt;

                        return (
                            <div key={res} className="relative group overflow-hidden bg-slate-900 border border-white/10 rounded-2xl transition-all hover:border-white/20">
                                {/* Background Progress Bar */}
                                <div className="absolute inset-0 bg-slate-950">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out opacity-20 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="relative z-10 p-4 flex items-center justify-between gap-4">
                                    {/* Resource Info */}
                                    <div className="flex items-center gap-4 min-w-[120px]">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                            {isCompleted ? <Check size={20} /> : (res === 'gold' ? '💰' : (res === 'wood' ? '🪵' : (res === 'stone' ? '🪨' : (res === 'plank' ? '🪵' : '📦'))))}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{res}</div>
                                            <div className={`font-bold ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                                                {currentAmt} / <span className="text-slate-500">{targetAmt}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {!isCompleted && (
                                        <div className="flex items-center gap-3">
                                            {canGive ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Du har: {playerHas}</span>
                                                    <button
                                                        onClick={() => onAction({
                                                            type: isPrivate ? 'CONTRIBUTE_TO_PRIVATE_UPGRADE' : 'CONTRIBUTE_TO_UPGRADE',
                                                            buildingId: buildingId,
                                                            resource: res,
                                                            amount: giveAmount
                                                        })}
                                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                                                    >
                                                        <Hammer size={12} />
                                                        Gi {giveAmount}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Lock size={12} />
                                                    Mangler {res} ({needed})
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                            Fullført
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Complete Button */}
            {(() => {
                const isReady = Object.entries(nextLevelDef.requirements).every(([res, amt]) => ((buildingState.progress as any)?.[res] || 0) >= (amt as number));
                if (!isReady) return null;
                return (
                    <button
                        onClick={() => {
                            onAction({ type: isPrivate ? 'CONTRIBUTE_TO_PRIVATE_UPGRADE' : 'CONTRIBUTE_TO_UPGRADE', buildingId: buildingId, resource: 'dummy', amount: 0 }); // Trigger completion
                        }}
                        className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3 animate-bounce"
                    >
                        <Hammer size={24} />
                        Fullfør Oppgradering til Nivå {nextLevel}!
                    </button>
                );
            })()}

        </div>
    );
};
