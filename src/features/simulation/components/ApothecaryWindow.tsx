import React, { useState, useMemo, useEffect } from 'react';
import { useSimulation } from '../SimulationContext';
import { REFINERY_RECIPES, RESOURCE_DETAILS } from '../constants';
import type { SimulationPlayer, SimulationRoom } from '../simulationTypes';
import { GameButton } from '../ui/GameButton';
import { Zap, FlaskConical, Beaker, Sparkles, Timer } from 'lucide-react';
import { checkActionRequirements } from '../utils/actionUtils';
import { ResourceIcon } from '../ui/ResourceIcon';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { RecipeCard } from './RecipeCard';

interface ApothecaryWindowProps {
    player: SimulationPlayer;
    room: SimulationRoom;
    onAction: (action: any) => void;
    pin: string;
}

export const ApothecaryWindow: React.FC<ApothecaryWindowProps> = ({ player, room, onAction }) => {
    const { setActiveTab, actionLoading } = useSimulation();
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const buildingId = 'apothecary';
    const settlement = (room?.world?.settlement || {}) as any;
    const currentBuildingLevel = (settlement.buildings?.[buildingId]?.level as number) || 1;

    // Filter recipes for Apothecary
    const recipes = useMemo(() => {
        return Object.entries(REFINERY_RECIPES)
            .filter(([_, r]) => r.buildingId === buildingId)
            .map(([id, r]) => [id, r]);
    }, []);

    // Group recipes by level
    const recipesByLevel = useMemo(() => {
        const groups: Record<number, any[]> = {};
        recipes.forEach(([id, r]) => {
            const lvl = r.requiredLevel || 1;
            if (!groups[lvl]) groups[lvl] = [];
            groups[lvl].push([id, r]);
        });
        return Object.entries(groups).sort(([a], [b]) => parseInt(a) - parseInt(b));
    }, [recipes]);

    const selectedRecipe = useMemo(() => {
        if (!selectedRecipeId) return null;
        const found = recipes.find(r => r[0] === selectedRecipeId);
        return found ? found[1] : null;
    }, [selectedRecipeId, recipes]);

    // Auto-select first recipe
    useEffect(() => {
        if (!selectedRecipeId && recipes.length > 0) {
            setSelectedRecipeId(recipes[0][0]);
        }
    }, [recipes, selectedRecipeId]);

    const processesAtBuilding = useMemo(() => {
        return (player.activeProcesses || []).filter(p => p.locationId === buildingId);
    }, [player.activeProcesses]);

    const readyProcess = useMemo(() => {
        return processesAtBuilding.find(p => p.readyAt <= now);
    }, [processesAtBuilding, now]);

    const inProgressProcess = useMemo(() => {
        if (!selectedRecipeId) return null;
        return processesAtBuilding.find(p => p.itemId === selectedRecipeId && p.readyAt > now);
    }, [processesAtBuilding, selectedRecipeId, now]);

    const handleProduce = () => {
        if (readyProcess) {
            onAction({ type: 'HARVEST', locationId: buildingId });
            return;
        }

        if (!selectedRecipeId || !selectedRecipe) return;

        // If level too high
        if ((selectedRecipe.requiredLevel || 1) > currentBuildingLevel) return;

        onAction({ type: 'REFINE', recipeId: selectedRecipeId });
    };

    const getOutputInfo = (id: string, r: any) => {
        return {
            id,
            name: r.label,
            icon: r.icon || '🧪',
            description: r.description || `Produserer ${r.label}`
        };
    };

    return (
        <SimulationMapWindow
            title="Apoteket"
            subtitle={
                <div className="flex items-center gap-3">
                    <span className="opacity-60">Urtemedisin, tinkturer og eliksirer.</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-emerald-400">Nivå {currentBuildingLevel} Mester-apoteker</span>
                </div>
            }
            icon="🧪"
            onClose={() => setActiveTab('MAP')}
            maxWidth="max-w-6xl"
        >
            <div className="flex flex-col lg:flex-row gap-6 h-full py-2">
                {/* LEFT: Lab Bench (Recipe List) */}
                <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
                    {recipesByLevel.map(([levelStr, levelRecipes]) => {
                        const levelNum = parseInt(levelStr);
                        const isLocked = levelNum > currentBuildingLevel;

                        return (
                            <div key={levelStr} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase ${isLocked ? 'bg-slate-800 text-slate-500' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'}`}>
                                        Tier {levelStr} {levelNum === 1 ? 'Medisin' : levelNum === 2 ? 'Tinkturer' : 'Eliksirer'}
                                    </div>
                                    <div className="flex-1 h-px bg-white/5"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {levelRecipes.map(([id, r]) => {
                                        const actionPayload = { type: 'REFINE', recipeId: id };
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

                {/* RIGHT: The Cauldron (Selected Recipe Details) */}
                <div className="w-full lg:w-[400px] shrink-0">
                    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 relative overflow-hidden h-full flex flex-col">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full -ml-16 -mb-16"></div>

                        {selectedRecipe ? (
                            <div className="relative z-10 flex flex-col h-full space-y-6">
                                {/* Potion Display */}
                                <div className="text-center space-y-4">
                                    <div className="relative inline-block">
                                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-inner border border-white/10 group-hover:scale-105 transition-transform duration-500">
                                            {selectedRecipe.icon}
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-2 shadow-lg shadow-emerald-500/20">
                                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white tracking-tighter">{selectedRecipe.label}</h3>
                                        <p className="text-slate-400 text-sm italic font-medium mt-1 leading-relaxed">
                                            {selectedRecipe.description || "En nøye sammensatt brygg som kan endre skjebnen din."}
                                        </p>
                                    </div>
                                </div>

                                {/* Ingredients List */}
                                <div className="bg-black/40 rounded-3xl p-6 border border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nødvendige Ingredienser</span>
                                        <Beaker className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <div className="space-y-3">
                                        {Object.entries(selectedRecipe.input).map(([res, amt]) => {
                                            const hasEnough = (player.resources as any)[res] >= (amt as number);
                                            return (
                                                <div key={res} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ResourceIcon resource={res} size="sm" />
                                                        <span className="text-sm font-bold text-slate-300">{(RESOURCE_DETAILS as any)[res]?.label || res}</span>
                                                    </div>
                                                    <span className={`text-sm font-black ${hasEnough ? 'text-white' : 'text-rose-500'}`}>
                                                        {(player.resources as any)[res] || 0} / {amt}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center text-xs">⚡</div>
                                                <span className="text-sm font-bold text-slate-300">Stamina</span>
                                            </div>
                                            <span className={`text-sm font-black ${player.status.stamina >= (selectedRecipe.stamina || 0) ? 'text-white' : 'text-rose-500'}`}>
                                                {selectedRecipe.stamina}⚡
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Effects & Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                                            <Timer className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-emerald-500/60">Produksjonstid</div>
                                            <div className="text-sm font-bold text-white">{Math.ceil((selectedRecipe.duration || 60000) / 60000)} minutter</div>
                                        </div>
                                    </div>

                                    <div className="bg-purple-500/5 rounded-2xl p-4 border border-purple-500/10 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-purple-500/60">Gevinster</div>
                                            <div className="text-xs font-bold text-white">+{selectedRecipe.xp || 10} Alkymi XP</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <GameButton
                                    variant="primary"
                                    size="lg"
                                    className={`h-24 text-xl w-full relative overflow-hidden group transition-all duration-500 ${readyProcess ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/50' : 'bg-slate-800 hover:bg-slate-700 border-white/10'}`}
                                    onClick={handleProduce}
                                    disabled={!!actionLoading || (!readyProcess && !inProgressProcess && ((selectedRecipe.requiredLevel || 1) > currentBuildingLevel || !checkActionRequirements(player, { type: 'REFINE', recipeId: selectedRecipeId }, room.world?.season, room.world?.weather).success))}
                                >
                                    {inProgressProcess && (
                                        <div
                                            className="absolute inset-0 bg-emerald-500/20 transition-all duration-1000 ease-linear"
                                            style={{
                                                width: `${Math.min(100, (1 - (inProgressProcess.readyAt - now) / (inProgressProcess.duration || 1000)) * 100)}%`
                                            }}
                                        />
                                    )}

                                    <div className="relative z-10 flex flex-col items-center gap-1">
                                        {readyProcess ? (
                                            <>
                                                <FlaskConical className="w-6 h-6 animate-bounce" />
                                                <span>HENT BRYGG</span>
                                            </>
                                        ) : inProgressProcess ? (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                                                    <span className="font-mono text-3xl">{Math.ceil((inProgressProcess.readyAt - now) / 1000)}s</span>
                                                </div>
                                                <span className="text-[10px] uppercase font-black tracking-widest opacity-60 text-emerald-400">Brygging pågår...</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <FlaskConical className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                                    <span>START BRYGGING</span>
                                                </div>
                                                <div className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">Mini-spill venter</div>
                                            </>
                                        )}
                                    </div>
                                </GameButton>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                                <Beaker className="w-20 h-20 text-slate-500" />
                                <p className="text-xl font-black text-slate-400 tracking-tighter">Velg en oppskrift for å begynne å brygge.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SimulationMapWindow>
    );
};
