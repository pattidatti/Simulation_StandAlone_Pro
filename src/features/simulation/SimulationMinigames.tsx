import React from 'react';
import { calculateYield } from './utils/simulationUtils';
import { GAME_BALANCE, SEASONS, WEATHER } from './constants';
import { ITEM_TEMPLATES, RESOURCE_DETAILS } from './data/items';
import type { EquipmentItem, ActionType, SimulationPlayer } from './simulationTypes';
import { getActionCostString } from './utils/actionUtils';

// Extracted Minigames
import { PlantingGame } from './minigames/PlantingGame';
import { HarvestingGame } from './minigames/HarvestingGame';
import { CraftingGame } from './minigames/CraftingGame';
import { BakingGame } from './minigames/BakingGame';
import { WoodcuttingGame } from './minigames/WoodcuttingGame';
import { ScytheSweepGame } from './minigames/ScytheSweepGame';
import { TrappingGame } from './minigames/TrappingGame';
import { WeavingGame } from './minigames/WeavingGame';
import { ApothecaryGame } from './minigames/ApothecaryGame';
import { SawingGame } from './minigames/SawingGame';
import { SmeltingGame } from './minigames/SmeltingGame';
import { HorseRidingGame } from './minigames/HorseRidingGame';
import { ArcheryGame } from './minigames/ArcheryGame';
import { CaravanTravelGame } from './components/CaravanTravelGame';

interface MinigameProps {
    type: ActionType;
    onComplete: (score: number, data?: any) => void;
    onCancel: () => void;

    // Context
    playerUpgrades?: string[];
    equipment?: EquipmentItem[];
    skills?: any; // Record<SkillType, SkillData>

    // Optional presets
    selectedMethod?: string; // e.g., 'scythe' vs 'sickle'

    // Environmental
    currentSeason?: string;
    currentWeather?: string;
    totalTicks?: number;
    action?: any;
    player?: SimulationPlayer;
}

export const MINIGAME_VARIANTS: Record<string, { id: string, label: string, icon: string, desc: string }[]> = {
    WORK: [
        { id: 'sickle', label: 'Sigd', icon: '🌾', desc: 'Presisjons-høsting for høy kvalitet.' },
        { id: 'sweep', label: 'Ljå', icon: '🎋', desc: 'Rask innhøsting av store områder.' },
    ],
    CHOP: [
        { id: 'axe', label: 'Øks', icon: '🪓', desc: 'Fell trær med rå makt.' },
    ],
    FORAGE: [
        { id: 'gather', label: 'Sanking', icon: '🍄', desc: 'Let etter mat og urter i skogen.' },
        { id: 'traps', label: 'Snarefangst', icon: '🕸️', desc: 'Sett feller for småvilt.' },
    ],
    MINE: [
        { id: 'pickaxe', label: 'Hakke', icon: '⛏️', desc: 'Hugg ut malm fra fjellet.' },
    ],
    QUARRY: [
        { id: 'chisel', label: 'Meisel', icon: '🔨', desc: 'Hugg ut steinblokker.' },
    ],
    CRAFT: [
        { id: 'hammer', label: 'Smiing', icon: '⚒️', desc: 'Form metallet på ambolten.' },
    ],
    BAKE: [
        { id: 'oven', label: 'Steking', icon: '🔥', desc: 'Stek brød i ovnen.' },
    ],
    WEAVE: [
        { id: 'loom', label: 'Veving', icon: '🧶', desc: 'Vev tråd til stoffer.' },
    ],
    MIX: [
        { id: 'brew', label: 'Brygging', icon: '⚗️', desc: 'Bland urter til medisiner.' },
    ],
    SMELT: [
        { id: 'furnace', label: 'Smelting', icon: '🌋', desc: 'Smelt malm til barrer.' },
    ],
    PLANT: [
        { id: 'manual', label: 'Håndsåing', icon: '🌱', desc: 'Så frø for hånd.' },
    ],
    HUNT: [
        { id: 'bow', label: 'Bueskyting', icon: '🏹', desc: 'Presisjonsjakt fra avstand.' },
        { id: 'trap', label: 'Fellefangst', icon: '🕸️', desc: 'Sett ut snarer for småvilt.' },
    ],
    SAWMILL: [
        { id: 'saw', label: 'Saging', icon: '🪚', desc: 'Sag opp tømmer til planker.' },
    ],
    GATHER_WOOL: [
        { id: 'shears', label: 'Saks', icon: '✂️', desc: 'Klipp ullen av sauene.' },
    ]
};

const MinigameToolBadge: React.FC<{ item: EquipmentItem }> = ({ item }) => {
    const durabilityPct = (item.durability / item.maxDurability) * 100;
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-slate-900/90 border border-white/10 rounded-full px-6 py-3 flex items-center gap-4 backdrop-blur-md shadow-2xl">
                <div className="text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{item.icon}</div>
                <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <div className={`w-2 h-2 rounded-full ${durabilityPct > 20 ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                        <span>Slitasje</span>
                        <span>{Math.round(durabilityPct)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { getBestToolForAction } from './utils/simulationUtils';

/* --- MAIN OVERLAY COMPONENT --- */
export const MinigameOverlay: React.FC<MinigameProps> = ({ type, onComplete, onCancel, equipment, skills, playerUpgrades, currentSeason = 'Spring', currentWeather = 'Clear', totalTicks = 0, selectedMethod: initialMethod, action, player }) => {
    const [selectedMethod, setSelectedMethod] = React.useState<string | null>(initialMethod || null);

    // Auto-select method if only one option exists or if passed as prop
    React.useEffect(() => {
        const variants = MINIGAME_VARIANTS[type];
        if (variants && variants.length === 1 && !selectedMethod) {
            setSelectedMethod(variants[0].id);
        }
    }, [type, selectedMethod]);

    // Determine relevant tool
    const activeTool = React.useMemo(() => {
        return getBestToolForAction(type, equipment || []);
    }, [type, equipment]);
    const environmentMods = React.useMemo(() => {
        const seasonData = SEASONS[currentSeason as keyof typeof SEASONS];
        const weatherData = WEATHER[currentWeather as keyof typeof WEATHER];

        return {
            speedMultiplier: (weatherData?.speedMod || 1.0) * (activeTool?.stats?.speedBonus || 1.0),
            staminaCostMod: (seasonData?.staminaMod || 1.0) * (weatherData?.staminaMod || 1.0),
            yieldMod: (activeTool?.stats?.yieldBonus || 0) + ((seasonData as any)?.yieldMod || 1.0)
        };
    }, [currentSeason, currentWeather, activeTool]);


    // Calculate Predicted Yield for UI Feedback
    const projectedYield = React.useMemo(() => {
        // Mock actor structure for the utility function
        const mockActor = { skills: skills || {}, equipment: {} };
        // Convert equipment array to object map for utility
        if (equipment) {
            equipment.forEach(item => {
                // Use slot if available, otherwise fallback to type (common convention in this codebase)
                const key = (item as any).slot || item.type;
                if (item && key) (mockActor.equipment as any)[key] = item;
            });
        }

        let base = 10;
        let skillType = 'FARMING';
        let actionType = type;

        switch (type) {
            case 'MINE':
                base = GAME_BALANCE.YIELD.MINE_ORE;
                skillType = 'MINING';
                break;
            case 'QUARRY':
                base = GAME_BALANCE.YIELD.QUARRY_STONE;
                skillType = 'MINING';
                break;
            case 'CHOP':
                base = GAME_BALANCE.YIELD.CHOP_WOOD;
                if (currentSeason === 'Summer') base += GAME_BALANCE.YIELD.SUMMER_WOOD_BONUS;
                skillType = 'WOODCUTTING';
                break;
            case 'WORK':
            case 'HARVEST':
                base = GAME_BALANCE.YIELD.WORK_GRAIN;
                if (playerUpgrades?.includes('iron_plow')) base += GAME_BALANCE.YIELD.PLOW_BONUS;
                skillType = 'FARMING';
                break;
            case 'FORAGE':
                base = GAME_BALANCE.YIELD.FORAGE_BREAD;
                skillType = 'FARMING';
                break;
        }

        const modifiers = {
            season: (SEASONS as any)[currentSeason]?.yieldMod || 1.0,
            weather: (WEATHER as any)[currentWeather]?.yieldMod || 1.0,
            actionType,
            upgrades: 1.0 // Simple approximation
        };

        // Calculate without performance to get the "standard" expected yield
        try {
            const result = calculateYield(mockActor as any, base, skillType as any, modifiers);
            console.log(`[MinigameOverlay] Yield Calc. Type: ${type}, Base: ${base}. Result: ${result}. Equipment:`, mockActor.equipment);
            return isNaN(result) ? 1.5 : result; // Safety check
        } catch (e) {
            console.error("Yield Calc Error:", e);
            return 1.5; // Fail safe to low yield to trigger warning
        }

    }, [type, skills, equipment, playerUpgrades, currentSeason, currentWeather]);

    // Check for severe penalty (indicates missing tool)
    const hasToolPenalty = React.useMemo(() => {
        let base = 10;
        switch (type) {
            case 'MINE': base = GAME_BALANCE.YIELD.MINE_ORE; break;
            case 'QUARRY': base = GAME_BALANCE.YIELD.QUARRY_STONE; break;
            case 'CHOP': base = GAME_BALANCE.YIELD.CHOP_WOOD; break;
            case 'WORK':
            case 'HARVEST': base = GAME_BALANCE.YIELD.WORK_GRAIN; break;
            case 'FORAGE': base = GAME_BALANCE.YIELD.FORAGE_BREAD; break;
        }
        // If projected yield is less than half of base, we likely have a penalty
        // Also check if it's very low (e.g., 2 or less)
        return projectedYield <= 2 || projectedYield < (base * 0.4);
    }, [projectedYield, type]);


    const handleMethodSelect = (methodId: string) => {
        setSelectedMethod(methodId);
    };

    // Warn about missing tool BEFORE starting (User Request)
    const [acknowledgedWarning, setAcknowledgedWarning] = React.useState(false);

    if (hasToolPenalty && !acknowledgedWarning && (type === 'MINE' || type === 'QUARRY' || type === 'CHOP' || type === 'WORK' || type === 'HARVEST' || type === 'FORAGE') && selectedMethod) {
        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(244,63,94,0.3)]">
                    <div className="text-6xl mb-6">⚠️</div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Manglende Verktøy!</h2>
                    <p className="text-slate-300 font-medium mb-8 leading-relaxed">
                        Du forsøker å utføre <span className="text-rose-400 font-bold">{type}</span> uten riktig verktøy.
                        Effektiviteten din er redusert med 80%.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setAcknowledgedWarning(true)}
                            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                            Fortsett likevel
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl font-bold uppercase tracking-widest transition-all"
                        >
                            Avbryt
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    // If method not selected, show Selection Screen
    if (!selectedMethod && MINIGAME_VARIANTS[type]) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                <div className="max-w-4xl w-full p-8">
                    <h2 className="text-4xl font-black text-white text-center mb-12 uppercase tracking-tighter drop-shadow-lg">Velg Metode</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {MINIGAME_VARIANTS[type].map((variant) => (
                            <button
                                key={variant.id}
                                onClick={() => handleMethodSelect(variant.id)}
                                className="group relative bg-slate-900 border-2 border-slate-700 hover:border-indigo-500 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(79,70,229,0.3)] text-left overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col items-center text-center gap-6">
                                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300">{variant.icon}</div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide group-hover:text-indigo-400 transition-colors">{variant.label}</h3>
                                        <p className="text-slate-400 font-medium leading-relaxed">{variant.desc}</p>
                                    </div>
                                    {/* Cost/Requirement Preview */}
                                    <div className="mt-4 pt-4 border-t border-white/5 w-full">
                                        {(() => {
                                            const costLabel = getActionCostString(type, currentSeason as any, currentWeather as any, totalTicks);
                                            if (costLabel) {
                                                return (
                                                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
                                                        <span>{costLabel}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <button onClick={onCancel} className="mt-12 mx-auto block text-slate-500 font-bold hover:text-white transition-colors uppercase tracking-widest text-sm">Avbryt</button>
                </div>
            </div>
        );
    }

    // Render Active Minigame
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="absolute top-8 right-8 z-[110]">
                <button
                    onClick={onCancel}
                    className="bg-black/40 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 w-12 h-12 rounded-full flex items-center justify-center transition-all"
                >
                    ✕
                </button>
            </div>

            {/* Environmental HUD */}
            <div className="absolute top-8 left-8 z-[110] flex gap-4">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
                    <span className="text-2xl" title={SEASONS[currentSeason as keyof typeof SEASONS]?.label || currentSeason}>
                        {currentSeason === 'Winter' ? '❄️' : currentSeason === 'Summer' ? '☀️' : currentSeason === 'Autumn' ? '🍂' : '🌱'}
                    </span>
                    <span className="text-2xl" title={WEATHER[currentWeather as keyof typeof WEATHER]?.label || currentWeather}>
                        {WEATHER[currentWeather as keyof typeof WEATHER]?.icon}
                    </span>
                    <div className="h-4 w-[1px] bg-white/10 mx-2" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Forhold</span>
                        <span className={`text-xs font-bold ${environmentMods.speedMultiplier < 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {Math.round(environmentMods.speedMultiplier * 100)}% Hastighet
                        </span>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">
                {/* Minigame Content Switcher */}
                {(() => {
                    switch (type) {
                        case 'PLANT':
                            return <PlantingGame onComplete={onComplete} />;

                        case 'HARVEST': // Generic Harvest (Mining, Chopping etc if grouped) or specific crop harvest
                        case 'WORK': // Farming / Harvesting
                            if (selectedMethod === 'sweep' || selectedMethod === 'scythe') {
                                return <ScytheSweepGame onComplete={onComplete} equipment={equipment} speedMultiplier={environmentMods.speedMultiplier} />;
                            }
                            // Default to Harvesting Game (Rhythm)
                            return <HarvestingGame onComplete={onComplete} equipment={equipment} speedMultiplier={environmentMods.speedMultiplier} possibleYield={projectedYield} />;

                        case 'CHOP':
                            return <WoodcuttingGame onComplete={onComplete} equipment={equipment} speedMultiplier={environmentMods.speedMultiplier} possibleYield={projectedYield} />;

                        case 'SAWMILL':
                            return <SawingGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} />;

                        case 'FORAGE':
                            if (selectedMethod === 'traps') return <TrappingGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} variant="land" />; // Foraging traps usually land (small game? berries?) actually foraging might mean "Gathering". Let's assume traps in forage is "land" variant.
                            return <HarvestingGame isForaging onComplete={onComplete} equipment={equipment} speedMultiplier={environmentMods.speedMultiplier} resourceName="Mat/Urter" possibleYield={projectedYield} />;

                        case 'MINE':
                            return <HarvestingGame isMining onComplete={onComplete} equipment={equipment} speedMultiplier={environmentMods.speedMultiplier} resourceName="Malm" possibleYield={projectedYield} />;

                        case 'QUARRY':
                            return <HarvestingGame isQuarrying onComplete={onComplete} equipment={equipment} speedMultiplier={environmentMods.speedMultiplier} resourceName="Stein" possibleYield={projectedYield} />;

                        case 'CRAFT':
                        case 'REPAIR': // Repair uses crafting game for now
                            return <CraftingGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} />;


                        case 'SMELT':
                            return <SmeltingGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} />;

                        case 'BAKE':
                            const bakeIcon = action?.subType ? (ITEM_TEMPLATES[action.subType]?.icon || '🥖') : (RESOURCE_DETAILS[action?.recipeId]?.icon || '🥖');
                            return <BakingGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} icon={bakeIcon} />;

                        case 'WEAVE':
                            return <WeavingGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} />;

                        case 'MIX': // Apothecary
                            return <ApothecaryGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} />;

                        case 'GATHER_WOOL':
                            return <ScytheSweepGame onComplete={onComplete} equipment={equipment} speedMultiplier={environmentMods.speedMultiplier} />;

                        case 'MOUNT_HORSE':
                            return <HorseRidingGame
                                onComplete={onComplete}
                                speedMultiplier={environmentMods.speedMultiplier}
                                levelId={selectedMethod || 'ride_easy'}
                                level={action?.level || 1}
                                horse={player?.horseCustomization}
                            />;

                        case 'HUNT':
                            if (selectedMethod === 'bow') {
                                return <ArcheryGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} />;
                            }
                            if (selectedMethod === 'trap') {
                                return <TrappingGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} variant="land" />;
                            }
                            return <ArcheryGame onComplete={onComplete} speedMultiplier={environmentMods.speedMultiplier} />;

                        case 'TRAVEL_START':
                            const caravanLevel = player?.caravan?.level || 1;
                            const levelConfig = GAME_BALANCE.CARAVAN.LEVELS.find(l => l.level === caravanLevel) || GAME_BALANCE.CARAVAN.LEVELS[0];
                            const maxDurability = levelConfig.durability;

                            return (
                                <CaravanTravelGame
                                    onComplete={(success, data) => onComplete(success ? 1 : 0, data)}
                                    targetRegionId={action?.targetRegionId || 'capital'}
                                    caravanLevel={caravanLevel}
                                    upgrades={player?.caravan?.upgrades || []}
                                    initialDurability={player?.caravan?.durability || maxDurability}
                                    maxDurability={maxDurability}
                                    customization={player?.caravan?.customization}
                                    resolvedHorseSkin={player?.horseCustomization?.skinId}
                                />
                            );

                        default:
                            return (
                                <div className="p-12 text-center">
                                    <h2 className="text-2xl font-bold text-white mb-4">Ukjent Minispill: {type}</h2>
                                    <button onClick={() => onComplete(0.5)} className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-white">
                                        Fullfør (Skip)
                                    </button>
                                </div>
                            );
                    }
                })()}

                {/* Show Active Tool Badge */}
                {activeTool && <MinigameToolBadge item={activeTool} />}
            </div>
        </div>
    );
};
