import React from 'react';
import { VILLAGE_BUILDINGS } from '../data/production';
import type { SimulationPlayer, SimulationRoom } from '../simulationTypes';

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
    const buildingState = isPrivate
        ? ((player as any).buildings?.[buildingId] || { level: 1, progress: {} })
        : ((room.world as any)?.settlement?.buildings?.[buildingId] || { id: buildingId, level: 1, progress: {}, contributions: {} });

    const currentLevel = (buildingState.level as number) || 1;
    const nextLevel = currentLevel + 1;
    const nextLevelDef = buildingDef.levels[nextLevel];

    return (
        <div className="space-y-8 py-4 relative">
            <div className="bg-slate-900/80 rounded-[2rem] p-8 w-full border border-white/5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                <p className="text-indigo-300 text-sm font-bold mb-4 uppercase tracking-widest flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    Bonus ved neste nivå: {nextLevelDef?.bonus || 'Maksimal effekt'}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed italic opacity-80">
                    "{buildingDef.description}"
                </p>
            </div>

            {nextLevelDef ? (
                <div className="w-full space-y-8">
                    <div className="text-left">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Byggeprogresjon (Nivå {nextLevel})</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(nextLevelDef.requirements || {}).map(([res, targetAmt]: [any, any]) => {
                                const currentAmt = Math.floor((buildingState.progress as any)?.[res] || 0);
                                const progress = Math.min(100, (currentAmt / targetAmt) * 100);
                                const playerHas = Math.floor((player.resources as any)?.[res] || 0);
                                const needed = targetAmt - currentAmt;
                                const canGive = playerHas > 0 && needed > 0;
                                const giveAmount = Math.min(playerHas, needed);

                                return (
                                    <div key={res} className="p-5 bg-slate-900/70 rounded-2xl border border-white/5 space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-black uppercase text-slate-300 tracking-widest">{res}</span>
                                            <span className="text-xs font-bold text-slate-500">{currentAmt} / {targetAmt}</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            {needed > 0 ? (
                                                canGive ? (
                                                    <button
                                                        onClick={() => onAction({
                                                            type: isPrivate ? 'CONTRIBUTE_TO_PRIVATE_UPGRADE' : 'CONTRIBUTE_TO_UPGRADE',
                                                            buildingId: buildingId,
                                                            resource: res,
                                                            amount: giveAmount
                                                        })}
                                                        className="w-full py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
                                                    >
                                                        Bidra {giveAmount} {res}
                                                    </button>
                                                ) : (
                                                    <div className="w-full py-2 bg-rose-900/10 border border-rose-500/10 text-rose-500/60 text-[9px] font-black rounded-xl text-center uppercase tracking-widest">
                                                        Mangler {res}
                                                    </div>
                                                )
                                            ) : (
                                                <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest text-center py-1">Krav møtt ✓</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {!isPrivate && (buildingState as any).contributions && Object.keys((buildingState as any).contributions).length > 0 && (
                        <div className="w-full bg-indigo-500/5 rounded-3xl p-6 border border-indigo-500/10">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                Siste bidrag fra riket
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries((buildingState as any).contributions).slice(0, 4).map(([pId, data]: [string, any]) => (
                                    <div key={pId} className="flex justify-between items-center bg-black/20 px-4 py-3 rounded-xl border border-white/5">
                                        <span className="text-xs font-bold text-slate-200">{data.name}</span>
                                        <div className="flex gap-2">
                                            {Object.entries(data.resources || {}).map(([r, a]: [any, any]) => (
                                                <span key={r} className="text-[10px] font-black text-emerald-400">+{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(() => {
                        const isReady = Object.entries(nextLevelDef.requirements).every(([res, amt]) => ((buildingState.progress as any)?.[res] || 0) >= (amt as number));
                        if (!isReady) return null;
                        return (
                            <button
                                onClick={() => {
                                    onAction({ type: isPrivate ? 'CONTRIBUTE_TO_PRIVATE_UPGRADE' : 'CONTRIBUTE_TO_UPGRADE', buildingId: buildingId, resource: 'dummy', amount: 0 }); // Trigger check
                                }}
                                className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-[1.5rem] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 animate-bounce mt-4 shadow-emerald-600/20"
                            >
                                Fullfør Oppgradering 🏗️
                            </button>
                        );
                    })()}
                </div>
            ) : (
                <div className="py-12 px-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] text-center w-full">
                    <div className="text-emerald-400 font-black uppercase tracking-widest text-lg mb-2">Mesterverk fullført! 🏆</div>
                    <div className="text-slate-400 text-sm font-medium">Denne bygningen har nådd sitt maksimale potensial.</div>
                </div>
            )}
        </div>
    );
};
