import React, { useState } from 'react';
import { List, GitGraph } from 'lucide-react';
import type { SimulationPlayer } from '../simulationTypes';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { useSimulation } from '../SimulationContext';
import { PlayerProfileModal } from './PlayerProfileModal';
import { Folkeregister } from './Folkeregister';
import { PoliticalHubContent } from './ui/PoliticalHub';


interface SimulationHierarchyProps {
    players: Record<string, SimulationPlayer>;
    currentPlayer: SimulationPlayer;
    regions: Record<string, any>;
    onAction: (action: any) => void;
    pin: string;
}

export const SimulationHierarchy: React.FC<SimulationHierarchyProps> = React.memo(({ players, currentPlayer, regions, onAction, pin }) => {
    const { setActiveTab, setViewingRegionId } = useSimulation();
    const [selectedPlayer, setSelectedPlayer] = useState<SimulationPlayer | null>(null);
    const [viewMode, setViewMode] = useState<'TREE' | 'LIST' | 'POLITICS'>('TREE');

    const handlePlayerClick = (p: SimulationPlayer) => {
        setSelectedPlayer(p);
    };

    return (
        <SimulationMapWindow
            title="Samfunnsstruktur"
            icon={<span className="text-2xl">👑</span>}
            onClose={() => setActiveTab('MAP')}
        >
            <div className="flex flex-col h-full overflow-hidden relative">

                {/* View Switcher */}
                <div className="absolute top-0 right-16 z-20 bg-slate-900/80 backdrop-blur rounded-lg p-1 border border-slate-700 flex gap-1">
                    <button
                        onClick={() => setViewMode('TREE')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'TREE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Hierarki Visning"
                    >
                        <GitGraph size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'LIST' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Register Visning"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('POLITICS')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'POLITICS' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Politisk Senter"
                    >
                        <span className="font-bold text-xs uppercase tracking-wider px-2">Politikk</span>
                    </button>
                </div>

                {viewMode === 'POLITICS' ? (
                    <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                        <div className="max-w-2xl mx-auto py-8">
                            <PoliticalHubContent player={currentPlayer} room={{ regions }} pin={pin} />
                        </div>
                    </div>
                ) : viewMode === 'LIST' ? (
                    <div className="p-4 h-full">
                        <Folkeregister players={players} myId={currentPlayer.id} onOpenProfile={setSelectedPlayer} />
                    </div>
                ) : (
                    <div className="space-y-12 pb-20 pt-4 overflow-y-auto px-4 custom-scrollbar">
                        {/* 1. THE KING */}
                        <div className="flex justify-center">
                            {Object.values(players || {}).filter(p => p.role === 'KING').map(king => (
                                <div key={king.id} className="relative group cursor-pointer" onClick={() => handlePlayerClick(king)}>
                                    <div className="bg-gradient-to-br from-amber-600 to-yellow-600 p-1 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.4)] hover:scale-105 transition-transform">
                                        <div className="bg-slate-900/90 p-8 rounded-[1.3rem] flex flex-col items-center min-w-[300px] border border-white/10">
                                            <div className="text-6xl mb-4 drop-shadow-xl">👑</div>
                                            <h3 className="text-2xl font-black text-white mb-1">{king.name}</h3>
                                            <div className="text-xs font-black uppercase text-amber-500 tracking-widest mb-4">Hans Majestet Kongen</div>

                                            {/* Legitimacy Bar */}
                                            <div className="w-full space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                                    <span>Legitimitet</span>
                                                    <span>{(king.status as any)?.legitimacy ?? 100}%</span>
                                                </div>
                                                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-1000"
                                                        style={{ width: `${(king.status as any)?.legitimacy || 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Royal Siege Action */}
                                            {currentPlayer.role === 'BARON' && (
                                                <div className="mt-8 w-full space-y-2 pt-4 border-t border-white/5">
                                                    {regions?.['capital']?.activeSiege ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setViewingRegionId('capital');
                                                                setActiveTab('SIEGE');
                                                            }}
                                                            className="w-full py-2 bg-red-600 hover:bg-red-500 border border-red-400 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 animate-pulse"
                                                        >
                                                            <span>🔥</span> Slutt deg til beleiringen!
                                                        </button>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const swords = currentPlayer.resources?.siege_sword || 0;
                                                                    if (swords < 500) {
                                                                        alert(`Du trenger 500 beleiringssverd for å utfordre kongen. Du har ${swords}.`);
                                                                        return;
                                                                    }
                                                                    onAction({ type: 'START_SIEGE', payload: { targetRegionId: 'capital' } });
                                                                }}
                                                                className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/50 rounded-lg text-rose-200 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                <span>⚔️</span> Beleir Tronen
                                                            </button>
                                                            <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest">Krever 500 beleiringssverd</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 h-12 w-1 bg-gradient-to-b from-amber-600 to-slate-700 opacity-50"></div>
                                </div>
                            ))}
                        </div>

                        {/* 2. THE NOBILITY & SUBJECTS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative pt-8">
                            <div className="absolute top-0 left-10 right-10 h-1 bg-slate-700 opacity-30 rounded-full"></div>
                            {/* Fixed Regions: Vest and Øst */}
                            {['region_vest', 'region_ost'].map(rId => {
                                const baron = Object.values(players || {}).find(p => p.role === 'BARON' && p.regionId === rId);
                                const displayName = regions?.[rId]?.name || (rId === 'region_vest' ? 'Baroniet Vest' : 'Baroniet Øst');

                                return (
                                    <div key={rId} className="flex flex-col gap-4 relative">
                                        <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 h-8 w-1 bg-slate-700 opacity-30"></div>
                                        <div className={`bg-slate-800/80 p-6 rounded-3xl border border-white/5 shadow-xl relative z-10 ${!baron ? 'opacity-75' : ''}`}>
                                            <div
                                                className={`flex flex-col gap-4 mb-4 border-b border-white/5 pb-4 ${baron ? 'cursor-pointer hover:bg-white/5 rounded-xl p-2 -m-2 transition-colors' : ''}`}
                                                onClick={() => baron && handlePlayerClick(baron)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="text-4xl">{baron ? '🏰' : '🏚️'}</div>
                                                    <div>
                                                        <h4 className={`text-lg font-black ${baron ? 'text-white' : 'text-slate-500'}`}>{baron ? baron.name : 'Ingen Baron'}</h4>
                                                        <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest uppercase">{displayName}</div>
                                                    </div>
                                                </div>

                                                {/* Legitimacy Bar for Baron */}
                                                {baron && (
                                                    <div className="w-full space-y-1 px-1">
                                                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                                            <span>Legitimitet</span>
                                                            <span className={`${(baron.status as any)?.legitimacy < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {(baron.status as any)?.legitimacy ?? 100}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-1000"
                                                                style={{ width: `${(baron.status as any)?.legitimacy ?? 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Baron Action: War Room OR Siege Defense */}
                                            {baron && currentPlayer.id === baron.id && (
                                                <div className="px-4 pb-4 space-y-2">
                                                    {/* War Room Access */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveTab('WAR_ROOM');
                                                        }}
                                                        className="w-full py-2 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 rounded-lg text-rose-200 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <span>🏰</span> Krigsrommet
                                                    </button>

                                                    {regions?.[rId]?.activeSiege && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setViewingRegionId(rId);
                                                                setActiveTab('SIEGE');
                                                            }}
                                                            className="w-full py-2 bg-red-600 hover:bg-red-500 border border-red-400 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 animate-pulse"
                                                        >
                                                            <span>🛡️</span> Forsvar Slottet!
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 border-b border-white/5 pb-1">Underståtte</div>
                                                {Object.values(players || {}).filter(p => (p.role === 'PEASANT' || p.role === 'SOLDIER') && p.regionId === rId).map(subject => (
                                                    <div
                                                        key={subject.id}
                                                        onClick={() => handlePlayerClick(subject)}
                                                        className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all"
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-lg text-lg shadow-inner">
                                                            {subject.role === 'SOLDIER' ? '⚔️' : '🌾'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-slate-200">{subject.name}</div>
                                                            <div className="text-[10px] uppercase text-slate-500 font-bold">{subject.role === 'SOLDIER' ? 'Soldat' : 'Bonde'}</div>
                                                        </div>
                                                        <div className={`w-2 h-2 rounded-full ${subject.lastActive > Date.now() - 60000 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-slate-600'}`}></div>
                                                    </div>
                                                ))}
                                                {Object.values(players || {}).filter(p => (p.role === 'PEASANT' || p.role === 'SOLDIER') && p.regionId === rId).length === 0 && (
                                                    <div className="text-xs text-slate-600 italic text-center py-4">Ingen undersåtter ennå...</div>
                                                )}
                                            </div>

                                            {/* Siege Actions Logic for OTHERS */}
                                            {rId === currentPlayer.regionId && currentPlayer.id !== (baron?.id) && (
                                                <div className="px-4 pb-4 mt-4 border-t border-white/5 pt-4">
                                                    {regions?.[rId]?.activeSiege ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setViewingRegionId(rId);
                                                                setActiveTab('SIEGE');
                                                            }}
                                                            className="w-full py-2 bg-red-600 hover:bg-red-500 border border-red-400 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 animate-pulse"
                                                        >
                                                            <span>🔥</span> Gå til Slagmarken
                                                        </button>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <button
                                                                disabled={Object.values(currentPlayer.resources || {}).reduce((sum, val) => (sum as number) + (val as number), 0) < 500} // This is a rough check, handleStartSiege does the strict check
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const swords = currentPlayer.resources?.siege_sword || 0;
                                                                    if (swords < 500) {
                                                                        alert(`Du mangler beleiringssverd! Du har ${swords}, men trenger 500 for å starte en beleiring.`);
                                                                        return;
                                                                    }
                                                                    onAction({ type: 'START_SIEGE', payload: { targetRegionId: rId } });
                                                                }}
                                                                className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${(currentPlayer.resources?.siege_sword || 0) >= 500 ? 'bg-stone-700/50 hover:bg-stone-600/50 border border-stone-500/30 text-stone-300' : 'bg-slate-900/50 border border-white/5 text-slate-600 cursor-not-allowed'}`}
                                                            >
                                                                <span>⚔️</span> Start Beleiring
                                                            </button>
                                                            <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-tight">Krav: 500 Beleiringssverd</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                );
                            })}

                            {/* Free Men / Unassigned */}
                            <div className="flex flex-col gap-4 relative">
                                <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 h-8 w-1 bg-slate-700 opacity-30"></div>
                                <div className="bg-slate-800/40 p-6 rounded-3xl border-2 border-dashed border-white/5 relative z-10">
                                    <div className="flex items-center gap-4 mb-4 border-b border-white/5 pb-4 opacity-70">
                                        <div className="text-4xl">⚖️</div>
                                        <div>
                                            <h4 className="text-lg font-black text-white">Frie Menn</h4>
                                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Markedet & Byen</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {Object.values(players || {}).filter(p => !['KING', 'BARON'].includes(p.role) && (!p.regionId || p.regionId === 'capital' || p.regionId === 'unassigned')).map(free => (
                                            <div
                                                key={free.id}
                                                onClick={() => handlePlayerClick(free)}
                                                className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5 opacity-80 cursor-pointer hover:opacity-100 hover:bg-indigo-500/20 transition-all"
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-lg">
                                                    {free.role === 'MERCHANT' ? '💰' : free.role === 'SOLDIER' ? '⚔️' : '👤'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-300">{free.name}</div>
                                                    <div className="text-[10px] uppercase text-slate-500 font-bold">{free.role}</div>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full ${free.lastActive > Date.now() - 60000 ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {selectedPlayer && (
                <PlayerProfileModal
                    isOpen={true}
                    onClose={() => setSelectedPlayer(null)}
                    targetPlayer={selectedPlayer}
                    myPlayer={currentPlayer}
                    pin={pin}
                />
            )}
        </SimulationMapWindow>
    );
});

SimulationHierarchy.displayName = 'SimulationHierarchy';
