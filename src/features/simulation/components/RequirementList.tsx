import React from 'react';
import { Package } from 'lucide-react';
import { ResourceIcon } from '../ui/ResourceIcon';
import { RESOURCE_DETAILS, SEASONS, WEATHER } from '../constants';
import { calculateStaminaCost } from '../utils/simulationUtils';

interface RequirementListProps {
    recipe: any;
    player: any;
    room: any;
}

export const RequirementList: React.FC<RequirementListProps> = ({ recipe, player, room }) => {
    const currentSeason = (room.world?.season || 'Spring') as keyof typeof SEASONS;
    const currentWeather = (room.world?.weather || 'Clear') as keyof typeof WEATHER;
    const totalTicks = room.world?.totalTicks || 0;

    const modifiedStamina = calculateStaminaCost(
        recipe.stamina || 0,
        currentSeason,
        currentWeather,
        player.status?.buffs || [],
        totalTicks
    );
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <Package className="w-3.5 h-3.5 text-indigo-400" /> Ressurskrav
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(recipe.input).map(([resId, amt]) => {
                    const rawPlayerHas = (player.resources as any)?.[resId] || 0;
                    const playerHas = resId === 'gold' ? Math.floor(rawPlayerHas) : rawPlayerHas;
                    const targets = amt as number;
                    const isMet = playerHas >= targets;

                    return (
                        <div key={resId} className={`relative p-3 rounded-xl border transition-all ${isMet ? 'bg-white/[0.03] border-white/5' : 'bg-rose-500/5 border-rose-500/10'}`}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <ResourceIcon resource={resId} size="sm" />
                                    <span className={`text-[11px] font-bold uppercase tracking-tight truncate ${isMet ? 'text-slate-400' : 'text-rose-400/80'}`}>{(RESOURCE_DETAILS as any)[resId]?.label || resId}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-base font-black leading-none ${isMet ? 'text-white' : 'text-rose-400'}`}>{playerHas.toLocaleString()}</span>
                                    <span className="text-sm font-bold text-slate-600 leading-none">/ {targets}</span>
                                </div>
                            </div>
                            <div className="w-full h-0.5 bg-black/40 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${isMet ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-rose-500'}`}
                                    style={{ width: `${Math.min(100, (playerHas / targets) * 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
                {/* Stamina */}
                <div className="relative p-3 rounded-xl border bg-indigo-500/5 border-indigo-500/10">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs">⚡</span>
                            <span className="text-[11px] font-bold uppercase tracking-tight text-indigo-300/60">Stamina</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-base font-black text-indigo-400 leading-none">-{modifiedStamina}</span>
                            <span className="text-sm font-bold text-indigo-500/30 leading-none">av {Math.floor(player.status?.stamina || 0)}</span>
                        </div>
                    </div>
                    <div className="w-full h-0.5 bg-black/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${Math.min(100, ((player.status?.stamina || 0) / 100) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
