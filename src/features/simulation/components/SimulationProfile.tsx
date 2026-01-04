import React from 'react';
import type { SimulationPlayer, Role } from '../simulationTypes';
import { ROLE_TITLES, LEVEL_XP, RANK_BENEFITS } from '../constants';
import { Badge } from '../ui/Badge';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { useSimulation } from '../SimulationContext';

interface SimulationProfileProps {
    player: SimulationPlayer;
    regions: Record<string, any>;
    allPlayers: Record<string, SimulationPlayer>;
}

export const SimulationProfile: React.FC<SimulationProfileProps> = React.memo(({ player, regions, allPlayers }) => {
    const { setActiveTab } = useSimulation();

    // Helper: Calculate accumulated benefits
    const accumulatedBenefits = React.useMemo(() => {
        const benefits: { category: 'ECO' | 'POL' | 'MIL', text: string, source: string }[] = [];
        const roleTitles = (ROLE_TITLES as any)[player.role] || [];
        const roleBenefits = RANK_BENEFITS[player.role] || [];

        roleTitles.forEach((title: string, index: number) => {
            if (player.stats.level >= index + 1) { // Unlocked
                const benefitList = roleBenefits[index] || [];
                benefitList.forEach((b: string) => {
                    let category: 'ECO' | 'POL' | 'MIL' = 'ECO';
                    if (b.toLowerCase().includes('skatt') || b.toLowerCase().includes('stemme') || b.toLowerCase().includes('frihet')) category = 'POL';
                    if (b.toLowerCase().includes('hær') || b.toLowerCase().includes('soldat') || b.toLowerCase().includes('våpen')) category = 'MIL';

                    benefits.push({ category, text: b, source: title });
                });
            }
        });
        return benefits;
    }, [player.role, player.stats.level]);

    const nextRank = (ROLE_TITLES as any)[player.role][player.stats.level];
    const nextRankXp = LEVEL_XP[player.stats.level];
    const currentRankTitle = (ROLE_TITLES as any)[player.role][player.stats.level - 1];


    return (
        <SimulationMapWindow
            title="Spillerprofil"
            icon={<span className="text-2xl">👤</span>}
            onClose={() => setActiveTab('MAP')}
        >
            <div className="flex flex-col h-full gap-6 pb-20 pt-4 max-w-6xl mx-auto">

                {/* 1. IDENTITY STRIP */}
                <div className="flex items-center gap-6 bg-slate-900/80 p-6 rounded-3xl border border-white/10 shadow-xl backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    {/* Avatar */}
                    <div className="w-24 h-24 bg-slate-950 rounded-2xl flex-none border-2 border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.2)] overflow-hidden relative z-10">
                        {player.avatar ? (
                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                                {player.role === 'KING' ? '👑' : player.role === 'BARON' ? '🏰' : '👤'}
                            </div>
                        )}
                    </div>

                    {/* Vitals */}
                    <div className="flex-1 z-10">
                        <div className="flex items-baseline gap-4 mb-0.5">
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{player.name}</h2>
                            <Badge variant="role" className="px-3 py-1 text-xs tracking-widest">{currentRankTitle}</Badge>
                        </div>

                        {/* Narrative Hierarchy Info - Integrated */}
                        <div className="text-[11px] font-medium text-slate-400 mb-3 flex items-center gap-2">
                            <span>
                                Innbygger i <span className="text-indigo-400 font-bold">
                                    {Object.values(allPlayers || {}).find(p => p.role === 'BARON' && p.regionId === player.regionId)?.name
                                        ? `${Object.values(allPlayers || {}).find(p => p.role === 'BARON' && p.regionId === player.regionId)?.name}s`
                                        : (regions?.[player.regionId]?.name || 'Kongeriket')}
                                </span> baroni
                            </span>
                            <span className="text-slate-600 font-bold">✦</span>
                            <span>
                                Underlagt kong <span className="text-amber-500 font-bold">{Object.values(allPlayers || {}).find(p => p.role === 'KING')?.name || 'Ingen'}</span>
                            </span>
                        </div>

                        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Lojalitet: {(player.status as any).loyalty || 100}%</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Bidrag: {player.stats.contribution || 0}%</span>
                        </div>
                    </div>

                    {/* XP / Level Compact */}
                    <div className="text-right z-10 min-w-[200px]">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Nivå {player.stats.level}</div>
                        <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                style={{ width: `${Math.min(100, (player.stats.xp / (nextRankXp || player.stats.xp || 1)) * 100)}%` }}
                            />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1">{player.stats.xp} / {nextRankXp || 'MAX'} XP</div>
                    </div>
                </div>

                {/* 2. RANK TIMELINE */}
                <div className="bg-black/20 p-6 rounded-3xl border border-white/5 flex items-center justify-between relative">
                    <div className="absolute left-6 right-6 top-1/2 h-1 bg-slate-800 -translate-y-1/2 rounded-full" />
                    {(ROLE_TITLES as any)[player.role].map((title: string, index: number) => {
                        const lvlReq = index + 1;
                        const isUnlocked = player.stats.level >= lvlReq;
                        const isCurrent = player.stats.level === lvlReq;

                        return (
                            <div key={title} className="relative z-10 flex flex-col items-center gap-2 group cursor-help">
                                <div className={`
                                     w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-4 transition-all duration-300
                                     ${isCurrent ? 'bg-indigo-600 border-indigo-900 scale-125 shadow-[0_0_20px_rgba(99,102,241,0.6)] text-white' :
                                        isUnlocked ? 'bg-indigo-900 border-slate-900 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-700'}
                                 `}>
                                    {lvlReq}
                                </div>
                                <div className={`
                                     text-[10px] font-black uppercase tracking-widest transition-colors duration-300 absolute top-12 whitespace-nowrap
                                     ${isCurrent ? 'text-white' : isUnlocked ? 'text-indigo-400/60' : 'text-slate-700'}
                                 `}>
                                    {title}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 2.5 CAREER PROGRESS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['PEASANT', 'SOLDIER', 'MERCHANT'] as Role[]).map(r => {
                        const stats = player.roleStats?.[r];
                        const level = stats?.level || (player.role === r ? player.stats.level : 1);
                        const xp = stats?.xp || (player.role === r ? player.stats.xp : 0);
                        const isCurrent = player.role === r;

                        const roleIcon = r === 'PEASANT' ? '🌾' : r === 'SOLDIER' ? '🗡️' : '⚖️';
                        const roleName = r === 'PEASANT' ? 'Bonde' : r === 'SOLDIER' ? 'Soldat' : 'Kjøpmann';

                        return (
                            <div key={r} className={`
                                p-5 rounded-3xl border transition-all duration-500 group/role
                                ${isCurrent
                                    ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_10px_30px_rgba(99,102,241,0.1)]'
                                    : 'bg-slate-900/40 border-white/5 opacity-50 hover:opacity-80'}
                            `}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xl">{roleIcon}</span>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`}>{roleName}</span>
                                        {isCurrent && <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Aktiv Karriere</span>}
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div className="text-2xl font-black text-white tracking-tighter">Nivå {level}</div>
                                    <div className="text-[10px] font-bold text-slate-500 mb-1">{xp} XP</div>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${isCurrent ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                        style={{ width: `${Math.min(100, (xp / (LEVEL_XP[level] || xp || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 3. POWER LEDGER (The Bento Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                    {/* Economy Column */}
                    <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 flex flex-col gap-4">
                        <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="text-lg">🌾</span> Økonomi & Ressurser
                        </h3>
                        <div className="space-y-2">
                            {accumulatedBenefits.filter(b => b.category === 'ECO').map((b, i) => (
                                <div key={i} className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-500/20 text-sm font-medium text-emerald-100/90 flex justify-between items-center group shadow-sm hover:bg-emerald-900/40 transition-colors">
                                    <span>{b.text}</span>
                                    <span className="text-[9px] uppercase tracking-widest text-emerald-500/50 group-hover:text-emerald-400 transition-colors">{b.source}</span>
                                </div>
                            ))}
                            {accumulatedBenefits.filter(b => b.category === 'ECO').length === 0 && <span className="text-sm text-slate-500 italic p-2">Ingen fordeler ennå.</span>}
                        </div>
                    </div>

                    {/* Political Column */}
                    <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 flex flex-col gap-4">
                        <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="text-lg">⚖️</span> Politikk & Rettigheter
                        </h3>
                        <div className="space-y-2">
                            {accumulatedBenefits.filter(b => b.category === 'POL').map((b, i) => (
                                <div key={i} className="bg-amber-950/30 p-4 rounded-xl border border-amber-500/20 text-sm font-medium text-amber-100/90 flex justify-between items-center group shadow-sm hover:bg-amber-900/40 transition-colors">
                                    <span>{b.text}</span>
                                    <span className="text-[9px] uppercase tracking-widest text-amber-500/50 group-hover:text-amber-400 transition-colors">{b.source}</span>
                                </div>
                            ))}
                            {accumulatedBenefits.filter(b => b.category === 'POL').length === 0 && <span className="text-sm text-slate-500 italic p-2">Ingen fordeler ennå.</span>}
                        </div>
                    </div>

                    {/* Military Column */}
                    <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 flex flex-col gap-4">
                        <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="text-lg">⚔️</span> Militærmakt
                        </h3>
                        <div className="space-y-2">
                            {accumulatedBenefits.filter(b => b.category === 'MIL').map((b, i) => (
                                <div key={i} className="bg-rose-950/30 p-4 rounded-xl border border-rose-500/20 text-sm font-medium text-rose-100/90 flex justify-between items-center group shadow-sm hover:bg-rose-900/40 transition-colors">
                                    <span>{b.text}</span>
                                    <span className="text-[9px] uppercase tracking-widest text-rose-500/50 group-hover:text-rose-400 transition-colors">{b.source}</span>
                                </div>
                            ))}
                            {accumulatedBenefits.filter(b => b.category === 'MIL').length === 0 && <span className="text-sm text-slate-500 italic p-2">Ingen fordeler ennå.</span>}
                        </div>
                    </div>
                </div>

                {/* 4. NEXT GOAL FOOTER */}
                {nextRank && (
                    <div className="mt-auto bg-gradient-to-r from-indigo-900/80 to-slate-900/80 p-6 rounded-3xl border border-indigo-500/30 shadow-lg flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-1">Neste Mål</div>
                            <div className="flex items-center gap-4">
                                <span className="text-3xl font-black text-white">{nextRank}</span>
                                <div className="h-8 w-[1px] bg-white/20" />
                                <div className="text-sm text-indigo-200 font-medium">
                                    <span className="block text-[9px] uppercase tracking-widest opacity-60">Låser opp</span>
                                    {(RANK_BENEFITS[player.role][player.stats.level] || ['Nye muligheter'])[0]}
                                    {(RANK_BENEFITS[player.role][player.stats.level] || []).length > 1 && ' +'}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-1">Krever</div>
                            <div className="text-xl font-bold text-white">{nextRankXp - player.stats.xp} <span className="text-sm text-indigo-300">mer XP</span></div>
                        </div>
                    </div>
                )}

            </div>
        </SimulationMapWindow>
    );
});

SimulationProfile.displayName = 'SimulationProfile';
