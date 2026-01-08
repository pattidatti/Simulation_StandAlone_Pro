import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import type { SimulationPlayer } from '../simulationTypes';
import { VILLAGE_BUILDINGS, CRAFTING_RECIPES } from '../constants';

import { MINIGAME_VARIANTS } from '../SimulationMinigames';
import { checkActionRequirements, getActionCostString, getActionEquipment } from '../utils/actionUtils';
import { UPGRADES_LIST, ITEM_TEMPLATES } from '../constants';
import { calculateStaminaCost } from '../utils/simulationUtils';
import { ArrowRight, Zap } from 'lucide-react';
import type { EquipmentItem } from '../simulationTypes';
import { SimulationRoleWarningModal } from './SimulationRoleWarningModal';

interface FloatingActionTooltipProps {
    poi: any; // Type accurately if possible
    player: SimulationPlayer;
    room: any;
    viewingRegionId: string;
    onAction: (action: any) => void;
    onClose: () => void;
}

export const FloatingActionTooltip: React.FC<FloatingActionTooltipProps> = ({ poi, player, room, viewingRegionId, onAction, onClose }) => {

    // Calculate position manually or pass styles? 
    // The WorldMap calculates position based on POI coordinates. 
    // Ideally, WorldMap should compute styles and pass them, or we compute here.
    // Let's assume WorldMap passes the style container, and this renders INSIDE it.
    // Actually, WorldMap renders the container `absolute`. This component will be the content `div`.
    // Wait, let's make this component render the WHOLE container for encapsulation.

    const containerRef = useRef<HTMLDivElement>(null);
    const top = (viewingRegionId === 'region_ost' && poi.ost ? poi.ost.top : poi.top);
    const left = (viewingRegionId === 'region_ost' && poi.ost ? poi.ost.left : poi.left);

    const [adjustedTransform, setAdjustedTransform] = useState({ x: '3rem', y: '-50%' });
    const [isReady, setIsReady] = useState(false);
    const [warningState, setWarningState] = useState<{ isOpen: boolean; action: any | null }>({ isOpen: false, action: null });

    const currentSeason = (room.world?.season || 'Spring') as any;
    const currentWeather = (room.world?.weather || 'Clear') as any;

    // Filter Actions
    const availableActions = useMemo(() => {
        // Find building context
        const buildingId = (poi.id in VILLAGE_BUILDINGS) ? poi.id : poi.parentId;
        const buildingDef = VILLAGE_BUILDINGS[buildingId];
        const settlement = room.world?.settlement || {};
        const buildingLevel = (settlement.buildings?.[buildingId]?.level as number) || 1;

        // Get all unlocked action IDs for current and lower levels
        let unlockedActions: string[] = [];
        if (buildingDef) {
            for (let i = 1; i <= buildingLevel; i++) {
                if (buildingDef.levels[i]) {
                    unlockedActions = [...unlockedActions, ...buildingDef.levels[i].unlocks];
                }
            }
        }

        const availableActionsRaw = poi.actions.filter((a: any) => {
            // General hardcoded filters
            if (a.id === 'TAX_PEASANTS' && player.role !== 'BARON') return false;
            if (a.id === 'TAX_ROYAL' && player.role !== 'KING') return false;
            if (a.id === 'DECREE' && player.role !== 'KING') return false;
            if (a.id === 'RAID' && player.role !== 'BARON') return false;
            // if (a.id === 'REST' && poi.id === 'village_square' && (player.role === 'KING' || player.role === 'BARON')) return false; // UNLOCKED FOR ALL
            if (a.id === 'FEAST' && player.role !== 'KING' && player.role !== 'BARON') return false;

            // Building level filtering
            const ALWAYS_AVAILABLE = ['OPEN_CRAFTING', 'CRAFT', 'REFINE', 'MARKET_VIEW', 'OPEN_GARRISON', 'OPEN_TAVERN_MENU'];

            if (buildingDef && !a.id.startsWith('BUILDING_UPGRADE_') && !ALWAYS_AVAILABLE.includes(a.id) && !unlockedActions.includes(a.id)) return false;

            return true;
        });

        // SPECIAL: For production Primary POIs (like anvil, sawmill blade), 
        // we only want to show the production entry point, not individual recipes.
        const isProductionPOIRoot = [
            'windmill_stones', 'sawmill_blade', 'smeltery_furnace',
            'bakery_oven', 'weavery_loom', 'forge_anvil'
        ].includes(poi.id);

        if (isProductionPOIRoot) {
            // Only keep one action that represents the building's main function
            // This button will trigger the PRODUCTION tab in handlePOIAction
            return availableActionsRaw.filter((a: any) =>
                a.id === 'OPEN_CRAFTING' || a.id === 'REFINE' || a.id === 'CRAFT' ||
                a.id.startsWith('REFINE_') || a.id.startsWith('CRAFT_') || a.id in CRAFTING_RECIPES
            ).slice(0, 1);
        }

        return availableActionsRaw;
    }, [poi, player.role, room.world?.settlement]);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const parent = containerRef.current.offsetParent;
        if (!parent) {
            setIsReady(true);
            return;
        }
        const parentRect = parent.getBoundingClientRect();

        const xPos = parseFloat(left);
        const yPos = parseFloat(top);

        // 1. Horizontal Logic - Pivot to side with most space
        // Use a 50% threshold to decide side
        const xShift = xPos < 50 ? '3rem' : 'calc(-100% - 3rem)';

        // 2. Vertical Containment - Start centered, then clamp
        // We calculate the theoretical top/bottom based on current top and height
        const theoreticalTop = (yPos / 100) * parentRect.height - (rect.height / 2);
        const theoreticalBottom = theoreticalTop + rect.height;

        let yShift = '-50%';

        // Manual Clamping relative to parent
        if (theoreticalTop < 20) {
            const nudge = 20 - theoreticalTop;
            yShift = `calc(-50% + ${nudge}px)`;
        } else if (theoreticalBottom > parentRect.height - 20) {
            const nudge = theoreticalBottom - (parentRect.height - 20);
            yShift = `calc(-50% - ${nudge}px)`;
        }

        setAdjustedTransform({ x: xShift, y: yShift });
        setIsReady(true);
    }, [top, left, availableActions.length]);


    const getBonusDetails = (actionId: string) => {
        const details: { source: string, type: 'Fart' | 'Utbytte' | 'Flaks' | 'Utstyr' | 'ADVARSEL', value: string, icon: string, isBonus: boolean }[] = [];
        const equipment = getActionEquipment(player, actionId);

        // Equipment
        equipment.forEach(item => {
            if (item.stats?.speedBonus && item.stats.speedBonus !== 1) {
                details.push({ source: item.name, type: 'Fart', value: `+${Math.round((item.stats.speedBonus - 1) * 100)}%`, icon: item.icon, isBonus: true });
            }
            if (item.stats?.yieldBonus) {
                details.push({ source: item.name, type: 'Utbytte', value: `+${item.stats.yieldBonus}`, icon: item.icon, isBonus: true });
            }
            if (item.stats?.luckBonus) {
                details.push({ source: item.name, type: 'Flaks', value: `+${Math.round(item.stats.luckBonus * 100)}%`, icon: item.icon, isBonus: true });
            }

            // If item is relevant but has no specific stats, list it as gear
            // If item is relevant but has no specific stats, we skip listing it.
            // if (!hasBonus) { ... }
        });

        // Upgrades (Match specific IDs or patterns)
        if (player.upgrades) {
            const roleUpgrades = (UPGRADES_LIST as any)[player.role] || [];
            player.upgrades.forEach((uId: string) => {
                const upg = roleUpgrades.find((u: any) => u.id === uId);
                if (upg) {
                    if (upg.benefit === 'YIELD_GRAIN' && (actionId === 'WORK' || actionId === 'MILL')) {
                        details.push({ source: upg.name, type: 'Utbytte', value: '+5', icon: '📜', isBonus: true });
                    }
                    if (upg.benefit === 'RAID_SPEED' && actionId === 'RAID') {
                        details.push({ source: upg.name, type: 'Fart', value: 'Raskere', icon: '🐎', isBonus: true });
                    }
                }
            });
        }

        // Building Level Bonuses
        const buildingId = poi.id === 'tavern' || poi.id === 'bakery' || poi.id === 'great_forge' || poi.id === 'weavery' || poi.id === 'sawmill' || poi.id === 'windmill' || poi.id === 'smeltery' ? poi.id : poi.parentId;
        const settlement = room.world?.settlement || {};
        const buildingLevel = (settlement.buildings?.[buildingId]?.level as number) || 1;

        if (buildingLevel >= 2) {
            details.push({ source: 'Bygningsbonus (Lvl 2)', type: 'Utbytte', value: '+10% XP', icon: '🏛️', isBonus: true });
        }
        if (buildingLevel >= 3) {
            details.push({ source: 'Bygningsbonus (Lvl 3)', type: 'Utbytte', value: 'Master Tier', icon: '🏆', isBonus: true });
        }


        // Check for Missing Required Tool
        if (MINIGAME_VARIANTS[actionId]) {
            const requiredVariant = MINIGAME_VARIANTS[actionId][0];
            const isManualAction = requiredVariant.id === 'manual' || requiredVariant.id === 'gather';

            if (!isManualAction) {
                const hasTool = equipment.some(item =>
                    item.type?.toLowerCase().includes(requiredVariant.id.toLowerCase()) ||
                    item.id.toLowerCase().includes(requiredVariant.id.toLowerCase())
                );
                if (!hasTool) {
                    details.push({
                        source: 'System',
                        type: 'ADVARSEL',
                        value: `Du mangler ${requiredVariant.label}, utbytte redusert med 80%`,
                        icon: '⚠️',
                        isBonus: false
                    });
                }
            }
        }

        return details;
    };

    // --- Active Process Logic ---
    const activeProcess = useMemo(() => {
        return player.activeProcesses?.find(p => {
            if (p.locationId !== poi.id || p.type === 'COOP') return false;
            // Special: Don't block the UI if a WELL cooldown is finished
            if (p.type === 'WELL' && p.readyAt <= Date.now()) return false;
            return true;
        });
    }, [player.activeProcesses, poi.id]);

    const calculateTimeLeft = () => {
        if (!activeProcess) return 0;
        const now = Date.now();
        return Math.max(0, activeProcess.readyAt - now);
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (!activeProcess) return;
        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (left <= 0) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [activeProcess]);

    const formatTime = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        return `${mins}m ${secs}s`;
    };

    // --- Render ---
    const tooltipContent = (
        <>
            <div className="absolute inset-0 z-[90]" onClick={onClose} />
            <div
                ref={containerRef}
                style={{
                    top, left,
                    transform: `translate(${adjustedTransform.x}, ${adjustedTransform.y})`,
                    visibility: isReady ? 'visible' : 'hidden',
                    opacity: isReady ? 1 : 0
                }}
                className={`absolute z-[100] ${isReady ? 'animate-in fade-in zoom-in' : ''} duration-200 pointer-events-auto`}
            >
                <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)] min-w-[320px] w-max max-w-[400px] relative transition-all duration-500 overflow-hidden group/tooltip">
                    {/* Atmospheric Glow */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px] pointer-events-none group-hover/tooltip:bg-indigo-500/20 transition-all duration-1000" />

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner relative overflow-hidden group/icon">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                                {poi.icon}
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-display font-black text-white text-xl uppercase tracking-tighter leading-none">{poi.label}</h3>
                                <span className="text-xs font-black text-indigo-400 uppercase tracking-[.2em] mt-1 opacity-90">Landemerke</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="text-white/60 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center border border-white/10 hover:border-white/30 active:scale-90">✕</button>
                        </div>
                    </div>

                    {/* Actions List OR Process Status */}
                    <div className="space-y-3">
                        {activeProcess ? (
                            <div className="w-full relative py-4">
                                {timeLeft <= 0 ? (
                                    <div className="relative group/harvest">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-25 group-hover/harvest:opacity-50 transition duration-1000 group-hover:duration-200" />
                                        <button
                                            onClick={() => onAction({ type: 'HARVEST', locationId: poi.id })}
                                            disabled={player.status.stamina < calculateStaminaCost(15, currentSeason, currentWeather)}
                                            className={`w-full relative px-6 py-8 border rounded-3xl flex items-center justify-between overflow-hidden active:scale-[0.98] transition-all
                                                ${player.status.stamina < calculateStaminaCost(15, currentSeason, currentWeather)
                                                    ? 'bg-red-900/20 border-red-500/30 cursor-not-allowed grayscale opacity-80'
                                                    : 'bg-slate-900 border-emerald-500/50 hover:bg-emerald-950/30'
                                                }`}
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16" />
                                            <div className="flex flex-col items-start z-10">
                                                <span className={`text-2xl font-black uppercase tracking-tighter italic ${player.status.stamina < calculateStaminaCost(15, currentSeason, currentWeather) ? 'text-slate-500' : 'text-white'}`}>Innhøsting</span>
                                                <span className={`text-xs font-black uppercase tracking-[0.2em] mt-1 ${player.status.stamina < calculateStaminaCost(15, currentSeason, currentWeather) ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {player.status.stamina < calculateStaminaCost(15, currentSeason, currentWeather)
                                                        ? `Mangler energi (${Math.ceil(player.status.stamina)}/${calculateStaminaCost(15, currentSeason, currentWeather).toFixed(0)})`
                                                        : 'Klar til å hentes!'}
                                                </span>
                                            </div>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)] ${player.status.stamina < calculateStaminaCost(15, currentSeason, currentWeather) ? 'bg-slate-800 text-slate-600' : 'bg-emerald-500/20 animate-bounce'}`}>
                                                {player.status.stamina < calculateStaminaCost(15, currentSeason, currentWeather) ? <Zap size={24} className="text-red-500" /> : '✨'}
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center gap-6 relative overflow-hidden group/timer">
                                        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />

                                        <div className="relative w-24 h-24">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <circle
                                                    cx="18" cy="18" r="16"
                                                    fill="none"
                                                    className="stroke-white/5"
                                                    strokeWidth="2"
                                                />
                                                <circle
                                                    cx="18" cy="18" r="16"
                                                    fill="none"
                                                    className="stroke-emerald-500 transition-all duration-1000 ease-linear"
                                                    strokeWidth="2"
                                                    strokeDasharray="100"
                                                    strokeDashoffset={100 - (1 - (timeLeft / activeProcess.duration)) * 100}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-3xl animate-pulse">
                                                    {activeProcess.type === 'MILL' ? '⚙️' : activeProcess.type === 'WELL' ? '💧' : '🌱'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">
                                                {activeProcess.type === 'WELL' ? 'Brønnen fyller seg med vann' : 'Venter på produksjon'}
                                            </span>
                                            <span className="text-2xl font-mono font-black text-white">{formatTime(timeLeft)}</span>
                                        </div>

                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                                                style={{ width: `${(1 - (timeLeft / activeProcess.duration)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {availableActions.map((action: any) => {
                                    const currentSeason = (room.world?.season || 'Spring') as any;
                                    const currentWeather = (room.world?.weather || 'Clear') as any;
                                    const bonusDetails = getBonusDetails(action.id);

                                    // Check requirements
                                    let canAfford = true;
                                    let missingReason = '';

                                    // List of actions that open menus/sub-UIs and should always be clickabled
                                    const MENU_OPENING_ACTIONS = ['CRAFT', 'REFINE', 'OPEN_CRAFTING', 'BAKE', 'SMELT', 'MILL', 'WEAVE', 'MIX', 'OPEN_CHICKEN_COOP', 'OPEN_DICE_GAME', 'MARKET_VIEW', 'OPEN_GARRISON'];

                                    if (viewingRegionId !== player.regionId && player.role !== 'KING' && action.id !== 'MARKET_VIEW') {
                                        canAfford = false; missingReason = "Dette er ikke ditt baroni";
                                    } else {
                                        // Skip requirement check for menu openers
                                        if (!MENU_OPENING_ACTIONS.includes(action.id)) {
                                            const check = checkActionRequirements(player, action.id, currentSeason, currentWeather, room.world?.gameTick || 0);
                                            if (!check.success) {
                                                canAfford = false;
                                                missingReason = check.reason || 'Krav ikke møtt';
                                            }
                                        }
                                    }

                                    const costLabel = getActionCostString(action.id, currentSeason, currentWeather, room.world?.gameTick || 0);
                                    const variants = MINIGAME_VARIANTS[action.id];

                                    return (
                                        <div key={action.id} className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {/* Action Section Title */}
                                            <div className="flex items-center justify-between px-1 mb-3">
                                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">{action.label}</h4>
                                                {costLabel && (
                                                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{costLabel}</span>
                                                )}
                                            </div>

                                            {!variants ? (
                                                <button
                                                    onClick={() => {
                                                        if (action.id === 'JOIN_ROLE') {
                                                            setWarningState({ isOpen: true, action: { ...action, locationId: poi.id } });
                                                        } else {
                                                            onAction({ ...action, type: action.id, locationId: poi.id });
                                                        }
                                                    }}
                                                    disabled={!canAfford}
                                                    className={`w-full group relative overflow-hidden p-5 rounded-3xl border transition-all duration-300 ${canAfford
                                                        ? 'bg-white/5 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 active:scale-[0.98]'
                                                        : 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{action.label}</span>
                                                            {!canAfford && <span className="text-sm font-black text-rose-500 uppercase tracking-widest mt-1">{missingReason}</span>}
                                                        </div>
                                                        <ArrowRight size={20} className="text-white/20 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {variants.map(variant => {
                                                        const equipment = getActionEquipment(player, action.id);
                                                        const bestTool = equipment.find(item =>
                                                            item.type?.toLowerCase().includes(variant.id.toLowerCase()) ||
                                                            item.id.toLowerCase().includes(variant.id.toLowerCase())
                                                        ) || equipment[0];

                                                        const toolDurabilityPct = bestTool ? (bestTool.durability / bestTool.maxDurability) * 100 : null;

                                                        return (
                                                            <button
                                                                key={variant.id}
                                                                onClick={() => onAction({ type: action.id, method: variant.id, locationId: poi.id })}
                                                                disabled={!canAfford}
                                                                className={`group relative flex items-center gap-6 w-full p-5 rounded-[2rem] border transition-all duration-300 ${canAfford
                                                                    ? 'bg-white/5 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 active:scale-[0.98]'
                                                                    : 'bg-black/20 border-white/5 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {/* Icon Surface */}
                                                                <div className={`w-16 h-16 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500 ${!canAfford && 'opacity-40'}`}>
                                                                    {variant.icon}
                                                                </div>

                                                                <div className="flex-1 flex flex-col justify-center min-w-0 items-start">
                                                                    <span className="font-display font-black text-white text-xl uppercase tracking-tighter group-hover:text-indigo-400 transition-colors truncate">
                                                                        {variant.label}
                                                                    </span>

                                                                    {!canAfford ? (
                                                                        <span className="text-xs font-black text-rose-500 uppercase tracking-widest mt-0.5">
                                                                            {missingReason}
                                                                        </span>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate opacity-60">
                                                                                {variant.desc}
                                                                            </span>
                                                                            {bonusDetails.length > 0 && (
                                                                                <div className="flex gap-1.5">
                                                                                    {bonusDetails.filter(d => !d.isBonus || d.value.includes('+')).slice(0, 1).map((d, i) => (
                                                                                        <span key={i} className="text-[10px] text-emerald-400 font-black px-2 py-0.5 bg-emerald-400/10 rounded-full">
                                                                                            {d.value}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Tool Health & Arrow */}
                                                                <div className="flex flex-col items-end gap-3 ml-2">
                                                                    {toolDurabilityPct !== null && canAfford && (
                                                                        <div className="w-10 h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                                                            <div
                                                                                className={`h-full transition-all duration-1000 ${toolDurabilityPct > 50 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : toolDurabilityPct > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                                style={{ width: `${toolDurabilityPct}%` }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <ArrowRight size={22} className={`transition-all ${canAfford ? 'text-white/20 group-hover:text-indigo-400 group-hover:translate-x-1' : 'text-white/5'}`} />
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* CONSOLIDATED PROGRESSION FOOTER */}
                        {(() => {
                            // Find the best next upgrade for the primary tools relevant here
                            const primaryActions = availableActions.map((a: any) => a.id);
                            const equipment = Object.values(player.equipment || {}) as EquipmentItem[] | any;

                            // 1. Identify relevant tools for these actions
                            const relevantTools = Object.values(ITEM_TEMPLATES).filter(t =>
                                t.relevantActions?.some(ra => primaryActions.includes(ra))
                            );

                            // 2. For each tool type, find if player has it OR find the lowest level one
                            const recommendations = relevantTools.map(template => {
                                const playerItem = equipment.find((item: any) => item.id === template.id || item.id.startsWith(template.id + '_'));

                                if (playerItem) {
                                    // Player has it, recommend NEXT tier
                                    const nextId = template.nextTierId;
                                    return nextId ? ITEM_TEMPLATES[nextId] : null;
                                } else {
                                    // Player DOES NOT have it, recommend THIS tier if it's the starter (lvl 1)
                                    // Actually, let's recommend the lowest level version of this tool type
                                    return template.level === 1 ? template : null;
                                }
                            }).filter(Boolean);

                            // 3. Remove duplicates and pick the most relevant one (prioritize main tools)
                            const finalUpgrades = recommendations
                                .filter((v, i, a) => a.findIndex(t => t?.id === v?.id) === i)
                                .sort((a, b) => {
                                    if (!a || !b) return 0;
                                    const aPri = (a.type === 'MAIN_HAND' || a.type === 'AXE' || a.type === 'PICKAXE' || a.type === 'SCYTHE' || a.type === 'BOW' || a.type === 'CHISEL') ? 1 : 0;
                                    const bPri = (b.type === 'MAIN_HAND' || b.type === 'AXE' || b.type === 'PICKAXE' || b.type === 'SCYTHE' || b.type === 'BOW' || b.type === 'CHISEL') ? 1 : 0;
                                    return bPri - aPri;
                                });

                            if (finalUpgrades.length > 0) {
                                const upg = finalUpgrades[0];
                                if (!upg) return null;

                                const upgRecipe = Object.values(CRAFTING_RECIPES).find((r: any) => r.outputItemId === upg.id);
                                const settlement = room.world?.settlement || { buildings: {} };
                                const buildingId = upgRecipe?.buildingId || 'great_forge';
                                const currentBuildingLevel = (settlement.buildings as any)?.[buildingId]?.level || 1;
                                const requiredLevel = upgRecipe?.level || 1;
                                const isLockedByBuilding = currentBuildingLevel < requiredLevel;
                                const buildingName = (VILLAGE_BUILDINGS as any)[buildingId]?.name || 'Smien';

                                const currentItem = equipment.find((item: any) => {
                                    if (!item) return false;
                                    const tid = Object.keys(ITEM_TEMPLATES).find(k => item.id === k || item.id.startsWith(k + '_'));
                                    const template = tid ? ITEM_TEMPLATES[tid] : null;
                                    return (template as any)?.relevantActions?.some((ra: string) => primaryActions.includes(ra));
                                });

                                return (
                                    <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <div className="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1" />
                                                <span className={`text-xs font-black uppercase tracking-[0.2em] ${isLockedByBuilding ? 'text-slate-400' : 'text-amber-500 animate-pulse'}`}>
                                                    {isLockedByBuilding ? `Krever nivå ${requiredLevel}` : 'Utvikling venter'}
                                                </span>
                                                <div className="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1" />
                                            </div>

                                            <div className="flex items-center justify-between gap-6 px-4">
                                                {/* Evolution Start */}
                                                <div className="flex flex-col items-center gap-2 group/evolve">
                                                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-3xl opacity-40 transition-all group-hover/evolve:opacity-60">
                                                        {currentItem?.icon || '❓'}
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nå</span>
                                                </div>

                                                {/* Evolution Path */}
                                                <div className="flex flex-col items-center flex-1 gap-2 pt-2">
                                                    <div className="relative w-full flex justify-center">
                                                        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-indigo-500/0" />
                                                        <ArrowRight className="text-indigo-500/50 w-6 h-6 animate-pulse relative z-10" />
                                                    </div>
                                                    {upg.stats?.yieldBonus && (
                                                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                                            +{upg.stats.yieldBonus} Utbytte
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Evolution End */}
                                                <div className="flex flex-col items-center gap-2 group/next">
                                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl border-2 shadow-2xl transition-all duration-500 ${isLockedByBuilding
                                                        ? 'bg-slate-900/50 border-white/5 grayscale'
                                                        : 'bg-indigo-600/20 border-indigo-500/50 shadow-indigo-500/20 hover:scale-110 active:scale-95'
                                                        }`}>
                                                        {upg.icon}
                                                    </div>
                                                    <span className={`text-xs font-black uppercase tracking-tight ${isLockedByBuilding ? 'text-slate-500' : 'text-amber-500'}`}>{upg.name}</span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-400 text-center font-medium italic px-6 mt-2">
                                                {isLockedByBuilding
                                                    ? `Forbedre ${buildingName} til nivå ${requiredLevel} for å låse opp.`
                                                    : `Besøk ${buildingName} i landsbyen for å smi din ${upg.name}.`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {tooltipContent}
            <SimulationRoleWarningModal
                isOpen={warningState.isOpen}
                onClose={() => setWarningState({ isOpen: false, action: null })}
                onConfirm={() => {
                    if (warningState.action) {
                        onAction(warningState.action);
                    }
                    setWarningState({ isOpen: false, action: null });
                }}
                roleName={warningState.action?.targetRole === 'SOLDIER' ? 'Soldat' : (warningState.action?.targetRole || 'Ukjent')}
            />
        </>
    );
};
