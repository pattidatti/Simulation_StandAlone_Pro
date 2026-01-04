
import React from 'react';
import {
    RESOURCE_DETAILS,
    VILLAGE_BUILDINGS,
    REFINERY_RECIPES,
    CRAFTING_RECIPES,
    GAME_BALANCE,
    ACTION_COSTS
} from '../constants';

export const SimulationEconomyBlueprint: React.FC = () => {
    return (
        <div className="w-full max-w-7xl mx-auto space-y-12 pb-20 p-8">
            <header className="flex flex-col gap-2">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Økonomisk Blueprint</h2>
                <p className="text-slate-400 font-medium">Visualisering av produksjonslinjer, kostnader og ressursflyt i riket.</p>
            </header>

            {/* 0. Resource Flow Journey (Flowchart) */}
            <section className="space-y-8 bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold animate-pulse">!</div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Ressurs-reise & Flyt</h3>
                    </div>
                    <div className="px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        Eksperimentell Visualisering
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-12 relative z-10">
                    <ResourceJourneyFlow />
                </div>
                <div className="absolute top-[-10%] right-[-5%] text-[20rem] text-indigo-500 opacity-[0.02] pointer-events-none group-hover:rotate-6 transition-transform duration-[5000ms]">🗺️</div>
            </section>

            {/* 1. Primary Production (Gathering) */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">1</div>
                    <h3 className="text-xl font-bold text-slate-200">Primærproduksjon (Råvarer)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <GatheringNode label="Korn" icon="🌾" baseYield={GAME_BALANCE.YIELD.WORK_GRAIN} stamina={ACTION_COSTS.WORK.stamina || 0} skill="FARMING" />
                    <GatheringNode label="Ved" icon="🪵" baseYield={GAME_BALANCE.YIELD.CHOP_WOOD} stamina={ACTION_COSTS.CHOP.stamina || 0} skill="WOODCUTTING" />
                    <GatheringNode label="Stein" icon="🏔️" baseYield={GAME_BALANCE.YIELD.QUARRY_STONE} stamina={ACTION_COSTS.QUARRY.stamina || 0} skill="MINING" />
                    <GatheringNode label="Malm" icon="🪨" baseYield={GAME_BALANCE.YIELD.MINE_ORE} stamina={ACTION_COSTS.MINE.stamina || 0} skill="MINING" />
                </div>
            </section>

            {/* 2. Refinement Chains */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">2</div>
                    <h3 className="text-xl font-bold text-slate-200">Foredlingskjeder</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Object.entries(REFINERY_RECIPES).map(([id, recipe]) => (
                        <RecipeNode key={id} id={id} recipe={recipe} />
                    ))}
                </div>
            </section>

            {/* 3. Crafting & Tools */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">3</div>
                    <h3 className="text-xl font-bold text-slate-200">Håndverk & Utstyr</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Object.entries(CRAFTING_RECIPES).map(([id, recipe]) => (
                        <CraftNode key={id} id={id} recipe={recipe} />
                    ))}
                </div>
            </section>

            {/* 4. Infrastructure Sinks */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold">4</div>
                    <h3 className="text-xl font-bold text-slate-200">Infrastruktur & Sinks</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(VILLAGE_BUILDINGS).map(([id, building]) => (
                        <BuildingNode key={id} building={building} />
                    ))}
                </div>
            </section>
        </div>
    );
};

const GatheringNode: React.FC<{ label: string, icon: string, baseYield: number, stamina: number, skill: string }> = ({ label, icon, baseYield, stamina, skill }) => (
    <div className="blueprint-node group">
        <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform">{icon}</span>
            <div>
                <h4 className="font-black text-white">{label}</h4>
                <div className="blueprint-res-tag">{skill}</div>
            </div>
        </div>
        <div className="space-y-2 text-xs font-medium text-slate-400">
            <div className="flex justify-between">
                <span>Base Yield:</span>
                <span className="text-emerald-400 font-bold">+{baseYield}</span>
            </div>
            <div className="flex justify-between">
                <span>Stamina Kost:</span>
                <span className="text-rose-400 font-bold">-{stamina}⚡</span>
            </div>
            <div className="pt-2 border-t border-white/5">
                Efficiency: <span className="text-slate-200">{(baseYield / stamina).toFixed(2)} res/stamina</span>
            </div>
        </div>
    </div>
);

const RecipeNode: React.FC<{ id: string, recipe: any }> = ({ recipe }) => (
    <div className="blueprint-node border-amber-500/20">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{recipe.icon}</span>
                <h4 className="font-black text-white text-sm uppercase tracking-tight">{recipe.label}</h4>
            </div>
            <div className="px-2 py-1 bg-amber-500/10 rounded text-[10px] font-bold text-amber-500 border border-amber-500/20">
                {recipe.buildingId}
            </div>
        </div>

        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                {Object.entries(recipe.input).map(([res, amt]) => (
                    <div key={res} className="flex items-center gap-1.5 px-2 py-1 bg-black/30 rounded-lg border border-white/5 text-[10px]">
                        <span>{(RESOURCE_DETAILS as any)[res]?.icon || '📦'}</span>
                        <span className="text-slate-300">{(amt as number)}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center py-1 opacity-40">↓</div>
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{(RESOURCE_DETAILS as any)[recipe.outputResource]?.icon || recipe.icon}</span>
                    <span className="text-emerald-400 font-black">+{recipe.outputAmount}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                    Kost: <span className="text-rose-400 font-bold">{recipe.stamina}⚡</span>
                </div>
            </div>
        </div>
    </div>
);

const CraftNode: React.FC<{ id: string, recipe: any }> = ({ recipe }) => (
    <div className="blueprint-node border-indigo-500/20">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{recipe.icon}</span>
                <h4 className="font-black text-white text-sm uppercase tracking-tight">{recipe.label}</h4>
            </div>
            <div className="px-2 py-1 bg-indigo-500/10 rounded text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                Lvl {recipe.level}
            </div>
        </div>

        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {Object.entries(recipe.input).map(([res, amt]) => (
                    <div key={res} className="flex items-center gap-1.5 px-2 py-1 bg-black/30 rounded-lg border border-white/5 text-[10px]">
                        <span>{(RESOURCE_DETAILS as any)[res]?.icon || '📦'}</span>
                        <span className="text-slate-300">{(amt as number)}</span>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed italic line-clamp-2">{recipe.description}</p>
        </div>
    </div>
);

const ResourceJourneyFlow: React.FC = () => {
    const RAW_RESOURCES = ['grain', 'wood', 'stone', 'iron_ore', 'wool', 'water', 'meat', 'honey'];

    // Find all recipes where a resource is an input
    const getNextSteps = (resId: string) => {
        const refineryPaths = Object.entries(REFINERY_RECIPES)
            .filter(([_, r]) => r.input[resId])
            .map(([id, r]) => ({ type: 'REFINE', id, output: r.outputResource, label: r.label, icon: r.icon }));

        const craftingPaths = Object.entries(CRAFTING_RECIPES)
            .filter(([_, r]) => r.input[resId])
            .map(([id, r]) => ({ type: 'CRAFT', id, output: r.outputItemId, label: r.label, icon: r.icon }));

        return [...refineryPaths, ...craftingPaths];
    };

    return (
        <div className="space-y-16">
            {RAW_RESOURCES.map(resId => {
                const details = (RESOURCE_DETAILS as any)[resId] || { label: resId, icon: '📦' };
                const nextSteps = getNextSteps(resId);

                if (nextSteps.length === 0) return null; // Skip if no journey

                return (
                    <div key={resId} className="relative group/journey">
                        {/* The Root Node */}
                        <div className="flex items-start gap-12">
                            <div className="shrink-0 w-48 blueprint-node border-emerald-500/30 bg-emerald-500/5">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{details.icon}</span>
                                    <h5 className="font-black text-white uppercase text-xs tracking-tighter">{details.label}</h5>
                                </div>
                                <div className="mt-2 text-[9px] text-emerald-500/60 font-black uppercase">Råvare</div>
                            </div>

                            {/* Journey Steps */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {nextSteps.map(step => (
                                    <div key={step.id} className="relative pl-8 border-l border-white/10 py-2">
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-white/10" />
                                        <div className="blueprint-node group-hover/journey:border-indigo-500/20 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{step.icon}</span>
                                                    <h6 className="font-bold text-slate-200 text-xs">{step.label}</h6>
                                                </div>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${step.type === 'REFINE' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                                    {step.type}
                                                </span>
                                            </div>

                                            {/* Nested Next Step (Recursive simplified) */}
                                            {step.output && (
                                                <div className="mt-3 pt-3 border-t border-white/5">
                                                    <div className="text-[8px] text-slate-500 uppercase font-black mb-1">Neste Ledd:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {getNextSteps(step.output).length > 0 ? (
                                                            getNextSteps(step.output).map(ns => (
                                                                <div key={ns.id} className="flex items-center gap-1.5 px-1.5 py-0.5 bg-black/40 rounded border border-white/5 text-[9px] text-slate-400">
                                                                    <span>{ns.icon}</span>
                                                                    <span>{ns.label}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-[9px] text-emerald-500/50 font-black flex items-center gap-1">
                                                                <span>🎯</span> SLUTTPRODUKT
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Gap Analysis Summary */}
            <div className="mt-12 p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                <h4 className="text-sm font-black text-rose-400 uppercase mb-4 flex items-center gap-2">
                    <span>🔍</span> Gap-Analyse & Døde Ender
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(REFINERY_RECIPES).map(([id, r]) => {
                        const hasUsage = Object.values(REFINERY_RECIPES).some(other => other.input[r.outputResource]) ||
                            Object.values(CRAFTING_RECIPES).some(other => other.input[r.outputResource]);

                        if (hasUsage || r.outputResource === 'stamina') return null;

                        return (
                            <div key={id} className="p-3 bg-black/40 rounded-xl border border-rose-500/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{r.icon}</span>
                                    <span className="text-[10px] font-bold text-slate-300">{r.label}</span>
                                </div>
                                <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">IKKE BRUKT VIDERE</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const BuildingNode: React.FC<{ building: any }> = ({ building }) => {
    const maxLevel = Math.max(...Object.keys(building.levels).map(Number));
    const totalGold = Object.values(building.levels).reduce((sum: number, lvl: any) => sum + (lvl.requirements.gold || 0), 0);

    return (
        <div className="blueprint-node border-rose-500/20 overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-2xl border border-rose-500/20">
                    {building.icon}
                </div>
                <div>
                    <h4 className="font-black text-white text-sm">{building.name}</h4>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">{building.locationId}</div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                    <div className="text-slate-500 mb-1">Max Level</div>
                    <div className="text-white font-black">{maxLevel}</div>
                </div>
                <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                    <div className="text-slate-500 mb-1">Totalkost (Gull)</div>
                    <div className="text-amber-400 font-black">{totalGold}💰</div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider">Låser opp:</div>
                <div className="flex flex-wrap gap-1.5">
                    {Object.values(building.levels).flatMap((l: any) => l.unlocks).slice(0, 4).map((u: any) => (
                        <span key={u} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-bold border border-indigo-500/10">
                            {u}
                        </span>
                    ))}
                    {Object.values(building.levels).flatMap((l: any) => l.unlocks).length > 4 && (
                        <span className="text-[9px] text-slate-600 font-bold self-center">+ mer</span>
                    )}
                </div>
            </div>
        </div>
    );
};
