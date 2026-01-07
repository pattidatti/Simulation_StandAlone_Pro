import React, { useState } from 'react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { VILLAGE_BUILDINGS } from '../data/production';
import { RESOURCE_DETAILS } from '../data/items';
import { GAME_BALANCE } from '../data/gameBalance';

interface SimulationContributionModalProps {
    player: any;
    room: any;
    onAction: (action: any) => void;
    onClose: () => void;
    viewingRegionId: string;
}

export const SimulationContributionModal: React.FC<SimulationContributionModalProps> = ({ player, room, onAction, onClose, viewingRegionId }) => {
    // Determine which project to show based on region and role
    // ULTRATHINK: Barons and Kings should always prioritize the Throne Room at the world capital
    const projectsInRegion = (viewingRegionId === 'capital' || player.role === 'BARON' || player.role === 'KING')
        ? ['throne_room', 'manor_ost', 'manor_vest']
        : viewingRegionId === 'region_ost'
            ? ['manor_ost']
            : ['manor_vest'];

    const [selectedProjectId, setSelectedProjectId] = useState(projectsInRegion[0]);

    // ULTRATHINK: Check if buildings exist in this room. If not, the room might be legacy or corrupted.
    const buildings = room.world?.settlement?.buildings || {};
    const availableProjects = projectsInRegion.filter(id => buildings[id]);

    // Fallback if the selected project isn't available in the room data
    const activeProjectId = availableProjects.includes(selectedProjectId)
        ? selectedProjectId
        : (availableProjects[0] || selectedProjectId);

    const project = buildings[activeProjectId];
    const projectDef = VILLAGE_BUILDINGS[activeProjectId];

    if (!project || !projectDef) {
        return (
            <SimulationMapWindow title="Gjenoppbygging" onClose={onClose}>
                <div className="flex flex-col items-center justify-center h-96 text-center p-12">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 text-2xl opacity-50">🏗️</div>
                    <h3 className="text-xl font-black text-white italic mb-2">Ingen aktive byggeprosjekter</h3>
                    <p className="text-slate-500 text-sm max-w-xs">
                        Det er ingen storslåtte prosjekter i dette området som krever din hjelp akkurat nå.
                        Prøv å dra til hovedstaden eller et av baroniene.
                    </p>
                    <button onClick={onClose} className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">Lukk vindu</button>
                </div>
            </SimulationMapWindow>
        );
    }

    const nextLevel = (project.level || 0) + 1;
    const requirements = projectDef.levels?.[nextLevel]?.requirements || {};
    const contributions = project.contributions || {};

    // Calculate overall progress across all requirements
    let totalReq = 0;
    let totalMet = 0;
    Object.entries(requirements).forEach(([res, amt]) => {
        totalReq += (amt as number);
        totalMet += (project.progress?.[res] || 0);
    });
    const overallProgress = totalReq > 0 ? (totalMet / totalReq) * 100 : 0;

    const handleContribute = (resource: string, amount: number) => {
        onAction({ type: 'CONTRIBUTE', buildingId: activeProjectId, resource, amount });
    };

    // Leaderboard
    const sortedContributors = Object.entries(contributions).map(([id, data]: [string, any]) => {
        // ULTRATHINK: Use weighted values from GAME_BALANCE to match backend logic
        const VALUES = GAME_BALANCE.CONTRIBUTION_VALUES;
        let total = 0;
        Object.entries(data.resources || {}).forEach(([res, amt]) => {
            total += (amt as number) * (VALUES[res] || VALUES.default);
        });
        return { id, name: data.name, total };
    }).sort((a, b) => (b.total as number) - (a.total as number));

    return (
        <SimulationMapWindow title="Gjenoppbygging & Lederskap" onClose={onClose}>
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-1">
                {/* Project Selection Tabs */}
                {availableProjects.length > 1 && (
                    <div className="flex gap-2 mb-6 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
                        {availableProjects.map(id => (
                            <button
                                key={id}
                                onClick={() => setSelectedProjectId(id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeProjectId === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {VILLAGE_BUILDINGS[id]?.name || id}
                            </button>
                        ))}
                    </div>
                )}

                {/* Header Feature */}
                <div className="relative h-48 rounded-3xl overflow-hidden mb-8 group border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10" />
                    <img
                        src="/images/simulation/castle_construction_epic.webp"
                        alt="Castle Construction"
                        className="w-full h-48 object-cover rounded-2xl mb-6 shadow-2xl border border-white/10"
                    />

                    <div className="absolute bottom-6 left-8 z-20">
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">{projectDef.name}</h3>
                        <p className="text-slate-300 font-medium text-xs max-w-md">{projectDef.description}</p>
                    </div>

                    <div className="absolute top-6 right-8 z-20 bg-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/30">
                        <span className="text-emerald-400 font-black text-xs tabular-nums">{overallProgress.toFixed(0)}% FULLFØRT</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Progress & Actions */}
                    <div className="space-y-6">
                        <section>
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Mangler for ferdigstillelse</h4>
                            <div className="space-y-4">
                                {Object.entries(requirements).map(([res, target]) => {
                                    const current = project.progress?.[res] || 0;
                                    const targetAmt = target as number;
                                    const perc = Math.min(100, (current / targetAmt) * 100);
                                    const isDone = current >= targetAmt;
                                    const playerHas = player.resources?.[res] || 0;

                                    return (
                                        <div key={res} className={`p-4 rounded-2xl border transition-all ${isDone ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/50 border-white/5'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{(RESOURCE_DETAILS as any)[res]?.icon || '📦'}</span>
                                                    <div>
                                                        <span className="text-sm font-bold text-white tracking-tight italic">{(RESOURCE_DETAILS as any)[res]?.label || res}</span>
                                                        <p className="text-[10px] text-slate-500 font-medium">Beholdning: <span className="text-slate-300">{playerHas}</span></p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xs font-black ${isDone ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                        {current} / {targetAmt}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mini Progress Bar */}
                                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mb-4">
                                                <div
                                                    style={{ width: `${perc}%` }}
                                                    className={`h-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                />
                                            </div>

                                            {!isDone && playerHas > 0 && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleContribute(res, Math.min(10, playerHas))}
                                                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white transition-all uppercase"
                                                    >
                                                        Gi 10
                                                    </button>
                                                    <button
                                                        onClick={() => handleContribute(res, Math.min(50, playerHas))}
                                                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black text-white transition-all uppercase"
                                                    >
                                                        Gi 50
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Leaderboard & Rewards */}
                    <div className="space-y-8">
                        <section className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 px-2">Toppbidragsytere</h4>
                            <div className="space-y-2">
                                {sortedContributors.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-xs italic">Ingen bidrag enda. Bli den første!</div>
                                ) : (
                                    sortedContributors.slice(0, 5).map((contributor, idx) => (
                                        <div key={contributor.id} className={`flex items-center justify-between p-3 rounded-xl ${idx === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-white/5 transition-colors'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                                    {idx + 1}
                                                </div>
                                                <span className={`text-sm font-bold ${idx === 0 ? 'text-white' : 'text-slate-300'}`}>{contributor.name}</span>
                                            </div>
                                            <span className="text-xs font-mono text-slate-500">{(contributor.total as number).toLocaleString()} poeng</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-6 relative overflow-hidden">
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Gevinst</h4>
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{selectedProjectId === 'throne_room' ? '👑' : '🏰'}</span>
                                <div>
                                    <p className="text-white font-black italic tracking-tight underline decoration-indigo-500/50">
                                        {selectedProjectId === 'throne_room' ? 'TITTEL: KONGE' : 'TITTEL: BARON'}
                                    </p>
                                    <p className="text-slate-400 text-xs mt-1">Spilleren med høyest poengsum ved ferdigstillelse overtar styringen.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </SimulationMapWindow>
    );
};
