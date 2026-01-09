import { ref, runTransaction, push } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import { GAME_BALANCE, SEASONS, WEATHER } from '../constants';
import { ITEM_TEMPLATES } from '../data/equipment';
import { getDayPart } from './timeUtils';
import type { EquipmentItem, SimulationMessage, SkillType, Buff } from '../simulationTypes';

/**
 * Logs a message to the simulation room, ensuring the message list is capped at 50 items.
 * Uses a transaction to prevent race conditions.
 */

/**
 * ROBUST TOOL DETECTION
 * 
 * Helper to identify the template ID of a potentially instanced item.
 * accounts for "stone_pickaxe_12345" matching "stone_pickaxe" template.
 * Sorts candidates by length descending to ensure specific overrides match before generic base types.
 */
export const getTemplateIdFromItem = (item: EquipmentItem | null | undefined): string | null => {
    if (!item || !item.id) return null;

    // 1. Direct match (fastest)
    if (ITEM_TEMPLATES[item.id]) return item.id;

    // 2. Prefix match (Sort by length desc to match "super_axe" before "axe")
    const templates = Object.keys(ITEM_TEMPLATES).sort((a, b) => b.length - a.length);
    const match = templates.find(tplId => item.id.startsWith(tplId + '_'));

    return match || null;
};

/**
 * Finds the BEST equipped tool for a specific action type.
 * Uses the robust template matching logic.
 */
export const getBestToolForAction = (type: string, equipment: (EquipmentItem | undefined | null)[] | Record<string, EquipmentItem>): EquipmentItem | undefined => {
    if (!equipment) return undefined;

    const equipmentList = Array.isArray(equipment) ? equipment : Object.values(equipment);

    // Filter for items that are RELEVANT to the action
    const candidates = equipmentList.filter(item => {
        if (!item) return false;
        const tid = getTemplateIdFromItem(item);
        const template = tid ? ITEM_TEMPLATES[tid] : null;

        // Check relevance in template OR instance
        const relevantActions = item.relevantActions || template?.relevantActions;
        return relevantActions?.includes(type);
    }).filter((item): item is EquipmentItem => !!item);

    if (candidates.length === 0) return undefined;

    // Sort valid candidates by stats (e.g. yieldBonus) to pick the 'best' one
    return candidates.sort((a, b) => {
        // Resolve stats (instance priority > template fallback)
        const tIdA = getTemplateIdFromItem(a);
        const tIdB = getTemplateIdFromItem(b);
        const statsA = a.stats || (tIdA ? ITEM_TEMPLATES[tIdA]?.stats : {});
        const statsB = b.stats || (tIdB ? ITEM_TEMPLATES[tIdB]?.stats : {});

        const yieldA = statsA?.yieldBonus || 0;
        const yieldB = statsB?.yieldBonus || 0;

        return yieldB - yieldA; // Descending
    })[0];
};

export const logSimulationMessage = async (pin: string, message: string) => {
    const messagesRef = ref(db, `simulation_rooms/${pin}/messages`);

    const newMsg: SimulationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: message,
        timestamp: Date.now(),
        type: 'SYSTEM'
    };

    // 1. ARCHIVE LOG (Persistent, uncapped) - Done outside transaction for safety
    try {
        const archiveRef = ref(db, `simulation_archives/${pin}/full_log`);
        push(archiveRef, newMsg);
    } catch (e) {
        console.error("Critical: Archive log failed:", e);
    }

    // 2. LIVE FEED (Capped at 50 for performance)
    await runTransaction(messagesRef, (currentMessages) => {
        let newMessages: SimulationMessage[] = [];

        if (Array.isArray(currentMessages)) {
            newMessages = currentMessages as SimulationMessage[];
        } else if (currentMessages && typeof currentMessages === 'object') {
            newMessages = Object.values(currentMessages) as SimulationMessage[];
        }

        newMessages.push(newMsg);

        if (newMessages.length > 50) {
            newMessages = newMessages.sort((a, b) => a.timestamp - b.timestamp).slice(newMessages.length - 50);
        }

        return newMessages;
    });
};

/**
 * Calculates the yield for a production action, incorporating skills, equipment, 
 * seasonal/weather modifiers, and minigame performance.
 */
export const calculateYield = (
    actor: {
        skills?: Record<string, { level: number }>,
        equipment?: Partial<Record<string, { stats?: { yieldBonus?: number }, relevantActions?: string[], id: string }>>,
        activeBuffs?: Buff[]
    },
    baseYield: number,
    skillType: SkillType,
    modifiers: {
        season?: number,
        weather?: number,
        law?: number,
        performance?: number,
        upgrades?: number,
        isRefining?: boolean,
        actionType?: string,
        regionId?: string
    } = {}
) => {
    // 1. Equipment Bonus (Flat + Yield)
    let equipBonus = 0;
    let hasRelevantTool = false;

    if (actor.equipment) {
        const slots = Object.keys(actor.equipment);
        slots.forEach(slot => {
            const item = (actor.equipment as any)[slot];
            if (!item) return;

            let relevantActions = item.relevantActions;
            if (!relevantActions && item.id) {
                const tid = getTemplateIdFromItem(item);
                if (tid) {
                    relevantActions = ITEM_TEMPLATES[tid]?.relevantActions;
                }
            }

            const isRelevant = !modifiers.actionType || relevantActions?.includes(modifiers.actionType);

            if (isRelevant) {
                const stats = item.stats || (getTemplateIdFromItem(item) ? ITEM_TEMPLATES[getTemplateIdFromItem(item)!]?.stats : undefined);
                if (stats?.yieldBonus) equipBonus += stats.yieldBonus;

                if (slot === 'AXE' || slot === 'PICKAXE' || slot === 'SCYTHE' || slot === 'MAIN_HAND' || slot === 'OFF_HAND' || slot === 'BOW' || slot === 'TRAP' || slot === 'CHISEL') {
                    hasRelevantTool = true;
                }
            }
        });
    }

    // 2. Base + Equip
    let total = baseYield + equipBonus;

    // 3. Skill Bonus (Now scales with equipment!)
    const skill = actor.skills?.[skillType] || { level: 0 };
    const bonusPerLevel = modifiers.isRefining
        ? GAME_BALANCE.SKILLS.REFINING_BONUS
        : GAME_BALANCE.SKILLS.GATHERING_BONUS;

    const skillMultiplier = 1 + (skill.level * bonusPerLevel);
    total *= skillMultiplier;

    // 4. No-tool Penalty (Utbytte-straff)
    // If it's a gathering task and we have no relevant tool, apply a massive penalty
    const isExempt = modifiers.actionType === 'FORAGE' || modifiers.actionType === 'GATHER_HONEY';

    if (!modifiers.isRefining && !hasRelevantTool && !isExempt) {
        // Strict requirement check
        if ((modifiers as any).requiresTool) return 0;

        const penalty = GAME_BALANCE.GATHERING?.NO_TOOL_PENALTY || 0.8; // 80% reduction default
        total *= (1 - penalty);
    }

    // 5. Regional Arbitrage (Phase 2)
    let regionalMod = 1.0;
    if (modifiers.regionId) {
        // Iron Ore logic (Vest is Iron Hub)
        if (modifiers.actionType === 'MINE') {
            if (modifiers.regionId === 'region_vest') regionalMod = 1.2; // +20%
            else if (modifiers.regionId === 'region_ost') regionalMod = 0.8; // -20%
        }
        // Wood logic (Øst is Wood Hub)
        if (modifiers.actionType === 'CHOP') {
            if (modifiers.regionId === 'region_vest') regionalMod = 0.8; // -20%
            else if (modifiers.regionId === 'region_ost') regionalMod = 1.2; // +20%
        }
    }

    // 6. Buff Multipliers
    let buffYieldMult = 1.0;
    if (actor.activeBuffs && actor.activeBuffs.length > 0) {
        const now = Date.now();
        const yieldBuff = actor.activeBuffs.find((b: Buff) => b.type === 'YIELD_BONUS' && b.expiresAt > now);
        if (yieldBuff) {
            buffYieldMult += yieldBuff.value;
        }
    }

    // 7. Multipliers (Season, Weather, Law, Upgrade, Region, Buffs)
    const multiplier = (modifiers.season || 1) * (modifiers.weather || 1) * (modifiers.law || 1) * (modifiers.upgrades || 1) * regionalMod * buffYieldMult;
    total = Math.floor(total * multiplier);

    // 5. Minigame Performance
    if (modifiers.performance !== undefined) {
        const perfMult = GAME_BALANCE.MINIGAME.BASE_MULTIPLIER + (modifiers.performance * GAME_BALANCE.MINIGAME.PERFORMANCE_WEIGHT);
        total = Math.ceil(total * perfMult);
    }

    return Math.max(0, total);
};

/**
 * Calculates the final stamina cost for an action based on base costs and world modifiers.
 */
// ... (existing imports/code)

export const calculateStaminaCost = (
    baseCost: number,
    season: keyof typeof SEASONS,
    weather: keyof typeof WEATHER,
    activeBuffs?: Buff[],
    gameTick: number = 0
) => {
    const seasonData = (SEASONS as any)[season];
    const weatherData = (WEATHER as any)[weather];

    const baseStaminaMod = seasonData?.staminaMod || 1.0;
    const weatherStaminaMod = weatherData?.staminaMod || 1.0;

    // Night Penalty
    const isNight = getDayPart(gameTick) === 'NIGHT';
    const nightMod = isNight ? 1.2 : 1.0;

    const total = baseCost * baseStaminaMod * weatherStaminaMod * nightMod;
    let finalCost = total;

    // Apply Buffs
    if (activeBuffs && activeBuffs.length > 0) {
        const now = Date.now();
        const staminaBuff = activeBuffs.find(b => b.type === 'STAMINA_SAVE' && b.expiresAt > now);
        if (staminaBuff) {
            finalCost *= (1 - staminaBuff.value);
        }
    }

    return Math.ceil(finalCost);
};
