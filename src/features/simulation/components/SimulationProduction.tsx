import React, { useState, useMemo, useEffect } from 'react';
import { useSimulation } from '../SimulationContext';
import { REFINERY_RECIPES, CRAFTING_RECIPES, RESOURCE_DETAILS, ITEM_TEMPLATES, VILLAGE_BUILDINGS, REPAIR_CONFIG, SKILL_DETAILS, GAME_BALANCE } from '../constants';
import type { SimulationPlayer, SimulationRoom, EquipmentSlot } from '../simulationTypes';
import { GameButton } from '../ui/GameButton';
import { Info, Zap, TrendingUp, Package, Wrench } from 'lucide-react';
import { checkActionRequirements } from '../utils/actionUtils';

import { ResourceIcon } from '../ui/ResourceIcon';

// Sub-components
import { RecipeCard } from './RecipeCard';
import { RequirementList } from './RequirementList';
import { StatsComparison } from './StatsComparison';
import { RepairSlot } from './RepairSlot';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { ProductionTabSwitcher } from './ProductionTabSwitcher';

interface SimulationProductionProps {
    player: SimulationPlayer;
    room: SimulationRoom;
    onAction: (action: any) => void;
    pin: string;
}

import { handleCareerChange } from '../globalActions';

export const SimulationProduction: React.FC<SimulationProductionProps> = React.memo(({ player, room, onAction, pin }) => {

    const { productionContext, setActiveTab, actionLoading } = useSimulation();
    const [viewMode, setViewMode] = useState<'PRODUCE' | 'REPAIR'>(productionContext?.initialView || 'PRODUCE');

    // Sync viewMode when context changes (e.g. switching from produce to repair via map)
    useEffect(() => {
        if (productionContext?.initialView) {
            setViewMode(productionContext.initialView);
        }
    }, [productionContext?.initialView]);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [selectedRepairSlot, setSelectedRepairSlot] = useState<string | null>(null);

    // Derived values
    const selectedItemToRepair = viewMode === 'REPAIR' && selectedRepairSlot ? player.equipment[selectedRepairSlot as EquipmentSlot] : null;

    if (!productionContext) {
        return (
            <SimulationMapWindow
                title="Produksjon"
                onClose={() => setActiveTab('MAP')}
                icon="🔨"
            >
                <div className="flex flex-col items-center justify-center text-center space-y-6 py-20">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl">⚠️</div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Utilgjengelig</h3>
                        <p className="text-slate-500 italic max-w-xs">Vennligst velg en produksjonsstasjon på kartet for å starte.</p>
                    </div>
                    <GameButton variant="ghost" onClick={() => setActiveTab('MAP')} className="border border-white/10">Tilbake til Kartet</GameButton>
                </div>
            </SimulationMapWindow>
        );
    }

    const { buildingId, type } = productionContext;
    const building = VILLAGE_BUILDINGS[buildingId];
    const isStationWithRepair = useMemo(() => !!REPAIR_CONFIG[buildingId], [buildingId]);

    // Filter recipes - COMBINE BOTH TYPES
    const recipes = useMemo(() => {
        const refine = Object.entries(REFINERY_RECIPES).filter(([_, r]) => r.buildingId === buildingId).map(([id, r]) => [id, r, 'REFINE']);
        const craft = Object.entries(CRAFTING_RECIPES).filter(([_, r]) => r.buildingId === buildingId).map(([id, r]) => [id, r, 'CRAFT']);
        return [...refine, ...craft] as [string, any, 'REFINE' | 'CRAFT'][];
    }, [buildingId]);

    // Group recipes by level
    const recipesByLevel = useMemo(() => {
        const groups: Record<number, [string, any, 'REFINE' | 'CRAFT'][]> = {};
        recipes.forEach(([id, r, type]) => {
            const lvl = r.level || 1;
            if (!groups[lvl]) groups[lvl] = [];
            groups[lvl].push([id, r, type]);
        });
        return Object.entries(groups).sort(([a], [b]) => parseInt(a) - parseInt(b));
    }, [recipes]);

    const selectedRecipeData = useMemo(() => {
        if (!selectedRecipeId) return null;
        const found = recipes.find(r => r[0] === selectedRecipeId);
        return found ? { recipe: found[1], type: found[2] } : null;
    }, [selectedRecipeId, recipes]);

    const selectedRecipe = selectedRecipeData?.recipe || null;
    const selectedType = selectedRecipeData?.type || type; // Fallback to context type

    // Auto-select defaults
    useEffect(() => {
        if (isStationWithRepair && !selectedRepairSlot && viewMode === 'REPAIR') {
            // Optional: Auto-select first damaged item? Maybe better to let user choose.
        }

        if (!selectedRecipeId && recipesByLevel.length > 0) {
            const firstRecipe = recipesByLevel[0][1][0][0];
            setSelectedRecipeId(firstRecipe);
        }
    }, [isStationWithRepair, recipesByLevel, selectedRecipeId]);

    useEffect(() => {
        // Always default to PRODUCE unless explicitly entering a repair context (which we don't have a deep link for yet)
        setViewMode('PRODUCE');
    }, [isStationWithRepair]);

    // Derived info for selected recipe
    const getOutputInfo = (_id: string, r: any) => {
        // PREFER RECIPE LABEL IF SET
        if (r.label) {
            return {
                id: _id,
                name: r.label,
                icon: r.icon || '📦',
                description: r.description || `Produserer ${r.label}`
            };
        }

        if (r.outputResource) {
            return {
                id: r.outputResource,
                name: (RESOURCE_DETAILS as any)[r.outputResource]?.label || r.outputResource,
                icon: (RESOURCE_DETAILS as any)[r.outputResource]?.icon || '📦',
                description: `Produserer ${r.outputAmount || r.output?.amount || 1} enheter med ${r.outputResource}.`
            };
        } else {
            const template = ITEM_TEMPLATES[r.outputItemId];
            return {
                id: r.outputItemId,
                name: template?.name || r.outputItemId,
                icon: template?.icon || '⚔️',
                description: template?.description || 'Et solid håndverk.'
            };
        }
    };

    const settlement = (room?.world?.settlement || {}) as any;
    const currentBuildingLevel = (settlement.buildings?.[buildingId]?.level as number) || 1;

    // Timer for UI refresh
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const processesAtBuilding = useMemo(() => {
        return (player.activeProcesses || []).filter(p => p.locationId === buildingId);
    }, [player.activeProcesses, buildingId]);

    const readyProcess = useMemo(() => {
        return processesAtBuilding.find(p => p.readyAt <= now);
    }, [processesAtBuilding, now]);

    const handleProduce = () => {
        if (readyProcess) {
            onAction({ type: 'HARVEST', locationId: buildingId });
            return;
        }

        if (!selectedRecipeId || !selectedRecipe) return;

        // Locking check (rest of original handleProduce)
        if ((selectedRecipe.level || 1) > currentBuildingLevel) return;

        if (selectedType === 'REFINE') {
            onAction({ type: 'REFINE', recipeId: selectedRecipeId });
        } else {
            onAction({ type: 'CRAFT', subType: selectedRecipeId });
        }
    };

    const handleRepair = () => {
        if (!selectedRepairSlot || !buildingId) return;
        onAction({ type: 'REPAIR', targetSlot: selectedRepairSlot, buildingId });
    };

    // SPECIAL WATCHTOWER VIEW
    if (buildingId === 'watchtower' && viewMode === 'PRODUCE') {
        const isSoldier = player.role === 'SOLDIER';
        const canEnlist = player.role === 'PEASANT' && (player.stats.level || 1) >= GAME_BALANCE.CAREERS.SOLDIER.LEVEL_REQ;
        const enlistCost = GAME_BALANCE.CAREERS.SOLDIER.COST;

        return (
            <SimulationMapWindow
                title="Vaktårn & Garnison"
                icon="🏰"
                onClose={() => setActiveTab('MAP')}
                maxWidth="max-w-4xl"
            >
                <div className="py-8 space-y-8">
                    {/* Header Image / vibe */}
                    <div className="relative h-48 rounded-3xl overflow-hidden border border-white/10 group">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                        <div className="absolute inset-0 bg-[url('/garrison_header.png')] bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-700"></div>
                        <div className="absolute bottom-6 left-8 z-20">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter">FORSVAR LANDSBYEN</h2>
                            <p className="text-slate-300 font-medium">Bli en del av eliten. Beskytt dine brødre.</p>
                        </div>
                    </div>

                    {!isSoldier ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Requirement Card */}
                            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Krav for verving</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-center justify-between">
                                            <span className="text-slate-400 text-sm">Nivå</span>
                                            <span className={`font-bold ${player.stats.level >= GAME_BALANCE.CAREERS.SOLDIER.LEVEL_REQ ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {player.stats.level}/{GAME_BALANCE.CAREERS.SOLDIER.LEVEL_REQ}
                                            </span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                            <span className="text-slate-400 text-sm">Vervekostnad</span>
                                            <span className={`font-bold ${player.resources.gold >= enlistCost ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {enlistCost} Gull
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-8 p-4 bg-amber-900/20 border border-amber-500/20 rounded-xl">
                                    <p className="text-xs text-amber-200/80 italic text-center">
                                        "Holdbarhet og ære er alt vi krever. Og litt gull til utstyr."
                                    </p>
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 p-6 rounded-3xl border border-indigo-500/30 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-pulse">
                                    ⚔️
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">VERV DEG NÅ</h3>
                                    <p className="text-indigo-200 text-sm mt-1">Få tilgang til våpenkammer og patruljer.</p>
                                </div>

                                <GameButton
                                    variant="primary"
                                    size="lg"
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 border-indigo-400/50"
                                    onClick={() => {
                                        if (window.confirm('Verve deg som soldat? Du vil miste din bonde-status.')) {
                                            handleCareerChange(pin, player.id, 'SOLDIER');
                                        }
                                    }}
                                    disabled={!canEnlist || player.resources.gold < enlistCost || !!actionLoading}
                                >
                                    {player.resources.gold < enlistCost ? 'IKKE NOK GULL' : 'SIGNER KONTRAKT'}
                                </GameButton>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto text-4xl border border-emerald-500/30">
                                🛡️
                            </div>
                            <h3 className="text-2xl font-black text-white">Du er i tjeneste</h3>
                            <p className="text-slate-400 max-w-md mx-auto">
                                Takk for din tjeneste, soldat. Bruk produksjonsfanen til å lage utstyr, eller patruljer landsbyen via Handlinger.
                            </p>
                            <GameButton variant="ghost" className="border-white/10" onClick={() => setActiveTab('MAP')}>Tilbake til tjeneste</GameButton>
                        </div>
                    )}
                </div>
            </SimulationMapWindow>
        );
    }

    return (
        <SimulationMapWindow
            title={building?.name || 'Verksted'}
            subtitle={
                <div className="flex items-center gap-3">
                    <span className="opacity-60">{building?.description}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-indigo-400">Nivå {currentBuildingLevel}</span>
                </div>
            }
            icon={building?.icon || '🔨'}
            onClose={() => setActiveTab('MAP')}
            maxWidth="max-w-6xl"
            headerRight={
                <ProductionTabSwitcher
                    isStationWithRepair={isStationWithRepair}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />
            }
        >
            <div className="space-y-6 py-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* LEFT: CONTENT AREA */}
                    <div className="flex-1 space-y-6">

                        {viewMode === 'PRODUCE' ? (
                            <div className="space-y-10">
                                {recipesByLevel.map(([levelStr, levelRecipes]) => {
                                    const levelNum = parseInt(levelStr);
                                    const isLocked = levelNum > currentBuildingLevel;

                                    return (
                                        <div key={levelStr} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${isLocked ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white'}`}>
                                                    Tier {levelStr}
                                                </div>
                                                <div className="flex-1 h-px bg-white/5"></div>
                                                {isLocked && (
                                                    <span className="text-xs font-bold text-slate-600 italic flex items-center gap-1">
                                                        <Package className="w-3 h-3" /> Oppgrader {building?.name} til Nivå {levelStr}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {levelRecipes.map(([id, r, recipeType]: [string, any, 'REFINE' | 'CRAFT']) => {
                                                    const actionPayload = recipeType === 'REFINE' ? { type: 'REFINE', recipeId: id } : { type: 'CRAFT', subType: id };
                                                    const check = checkActionRequirements(player, actionPayload, room.world?.season, room.world?.weather, room.world?.gameTick || 0);
                                                    const isRecipeReady = processesAtBuilding.some(p => p.itemId === id && p.readyAt <= now);

                                                    return (
                                                        <RecipeCard
                                                            key={id}
                                                            id={id}
                                                            isSelected={selectedRecipeId === id}
                                                            isLocked={isLocked}
                                                            canAfford={check.success}
                                                            isReady={isRecipeReady}
                                                            info={getOutputInfo(id, r)}
                                                            onSelect={setSelectedRecipeId}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* REPAIR VIEW */
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {REPAIR_CONFIG[buildingId]?.slots.map((slot) => {
                                        const item = player.equipment[slot as EquipmentSlot];
                                        if (!item) return null;

                                        return (
                                            <RepairSlot
                                                key={slot}
                                                slot={slot}
                                                item={item}
                                                isSelected={selectedRepairSlot === slot}
                                                onSelect={setSelectedRepairSlot}
                                            />
                                        );
                                    })}

                                    {REPAIR_CONFIG[buildingId]?.slots.every(slot => !player.equipment[slot as EquipmentSlot]) && (
                                        <div className="col-span-full py-12 text-center bg-slate-900/40 rounded-[2rem] border border-dashed border-white/5">
                                            <p className="text-slate-500 italic">Ingen relevante gjenstander utstyrt for reparasjon her.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: DETAILS PANEL */}
                    <div className={`w-full lg:w-[400px] shrink-0 transition-all duration-500 ${viewMode === 'REPAIR' ? 'scale-95 opacity-80' : selectedRecipe ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
                        {viewMode === 'REPAIR' ? (
                            <div className="bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 rounded-[2.5rem] p-6">
                                {selectedItemToRepair ? (
                                    <>
                                        <div className="text-center mb-8">
                                            <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] flex items-center justify-center text-6xl mx-auto shadow-2xl border-4 border-white/10 mb-6">
                                                {selectedItemToRepair.icon}
                                            </div>
                                            <h3 className="text-2xl font-black text-white tracking-tighter mb-2">{selectedItemToRepair.name}</h3>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    Holdbarhet: <span className="text-amber-500">{selectedItemToRepair.durability} / {selectedItemToRepair.maxDurability}</span>
                                                </div>
                                                <div className="w-48 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500"
                                                        style={{ width: `${(selectedItemToRepair.durability / selectedItemToRepair.maxDurability) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-black/40 rounded-3xl p-6 border border-white/5 space-y-4">
                                            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Reparasjonskostnad</div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ResourceIcon resource="gold" size="sm" />
                                                        <span className="text-sm font-bold text-slate-300">Gull</span>
                                                    </div>
                                                    <span className="text-amber-400 font-black">-{REPAIR_CONFIG[buildingId]?.goldCost || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ResourceIcon resource={REPAIR_CONFIG[buildingId]?.material || 'iron_ingot'} size="sm" />
                                                        <span className="text-sm font-bold text-slate-300">{(RESOURCE_DETAILS as any)[REPAIR_CONFIG[buildingId]?.material || 'iron_ingot']?.label || 'Materiale'}</span>
                                                    </div>
                                                    <span className="text-amber-400 font-black">-1</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 mb-6 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                            <p className="text-sm text-indigo-200/90 font-medium text-center leading-relaxed">
                                                Reparasjon gjenoppretter 30 holdbarhetspoeng.
                                            </p>
                                        </div>

                                        <GameButton
                                            variant="primary"
                                            size="lg"
                                            className="h-20 text-xl w-full bg-amber-600 hover:bg-amber-500 border-amber-400/50"
                                            onClick={handleRepair}
                                            disabled={!!actionLoading || selectedItemToRepair.durability >= selectedItemToRepair.maxDurability || (player.resources?.gold || 0) < (REPAIR_CONFIG[buildingId]?.goldCost || 0) || ((player.resources as any)?.[REPAIR_CONFIG[buildingId]?.material] || 0) < 1}
                                        >
                                            {selectedItemToRepair.durability >= selectedItemToRepair.maxDurability ? 'FULL HOLDBARHET' : 'REPARER GJENSTAND'}
                                        </GameButton>
                                    </>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                            <Wrench className="w-10 h-10 text-slate-600" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-400">Velg utstyr</h4>
                                        <p className="text-sm text-slate-500 max-w-[200px] mt-2">Trykk på en gjenstand til venstre for å se reparasjonsdetaljer.</p>
                                    </div>
                                )}
                            </div>
                        ) : selectedRecipe ? (
                            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.8rem] flex items-center justify-center text-5xl mx-auto shadow-2xl border-[3px] border-white/10 mb-4 group-hover:rotate-6 transition-transform">
                                        {getOutputInfo(selectedRecipeId!, selectedRecipe).icon}
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter mb-2">{getOutputInfo(selectedRecipeId!, selectedRecipe).name}</h3>
                                    <p className="text-slate-400 text-sm font-medium px-6 leading-relaxed">{getOutputInfo(selectedRecipeId!, selectedRecipe).description}</p>
                                </div>

                                {/* Requirements */}
                                <div className="space-y-4">
                                    <RequirementList recipe={selectedRecipe} player={player} room={room} />

                                    {/* Production Stats / Bonuses */}
                                    <div className="bg-black/40 rounded-3xl p-5 border border-white/5 space-y-5">
                                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            <TrendingUp className="w-3 h-3" /> Utbytte & Sammenligning
                                        </div>

                                        <StatsComparison recipe={selectedRecipe} player={player} type={selectedType} />

                                        <div className="space-y-3">
                                            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2">
                                                Dette produseres
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Basis-antall</div>
                                                    <div className="text-xl font-black text-white leading-none">+{selectedRecipe.outputAmount || selectedRecipe.output?.amount || 1}</div>
                                                </div>
                                                <div className="h-8 w-[1px] bg-white/5"></div>
                                                <div className="space-y-1 text-right">
                                                    <div className="text-[10px] text-emerald-500 font-black uppercase tracking-wider">Bonus fra {SKILL_DETAILS[selectedRecipe.skill as keyof typeof SKILL_DETAILS]?.label || 'Evne'}</div>
                                                    <div className="text-xl font-black text-emerald-400 leading-none">+{Math.floor((selectedRecipe.outputAmount || 1) * (player.skills?.[selectedRecipe.skill as keyof typeof player.skills]?.level || 0) * (selectedType === 'REFINE' ? GAME_BALANCE.SKILLS.REFINING_BONUS : GAME_BALANCE.SKILLS.GATHERING_BONUS))}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <Zap className="w-3 h-3 text-amber-500" /> {SKILL_DETAILS[selectedRecipe.skill as keyof typeof SKILL_DETAILS]?.label || 'Produksjon'} XP
                                            </div>
                                            <span className="text-amber-500 font-black text-sm">+{selectedRecipe.xp || 10} XP</span>
                                        </div>
                                    </div>

                                    <GameButton
                                        variant="primary"
                                        size="lg"
                                        className={`h-20 text-xl w-full transition-all duration-300 ${readyProcess ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : ''}`}
                                        onClick={handleProduce}
                                        disabled={!!actionLoading || (!readyProcess && ((selectedRecipe.level || 1) > currentBuildingLevel || !checkActionRequirements(player, selectedType === 'REFINE' ? { type: 'REFINE', recipeId: selectedRecipeId } : { type: 'CRAFT', subType: selectedRecipeId }, room.world?.season, room.world?.weather, room.world?.gameTick || 0).success))}
                                    >
                                        {readyProcess
                                            ? `HENT ${readyProcess.itemId === (selectedRecipeId || '') ? (selectedRecipe?.label || 'PRODUKSJON').toUpperCase() : 'PRODUKSJON'}`
                                            : (selectedRecipe.level || 1) > currentBuildingLevel ? 'KREVER OPPGRADERING' : 'START PRODUKSJON'}
                                    </GameButton>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 border-2 border-dashed border-white/10 rounded-[3rem]">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Info className="w-10 h-10 text-slate-600" />
                                </div>
                                <h4 className="text-xl font-black text-slate-400 mb-2">Ingen oppskrift valgt</h4>
                                <p className="text-sm text-slate-500 font-medium">Velg en gjenstand fra listen til venstre for å se detaljer og starte produksjon.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SimulationMapWindow>
    );
});

SimulationProduction.displayName = 'SimulationProduction';
