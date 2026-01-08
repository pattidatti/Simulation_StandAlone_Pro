import { ref, runTransaction, get, update } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';
import { calculateStaminaCost, logSimulationMessage } from './utils/simulationUtils';
import { ACTION_COSTS, GAME_BALANCE, INITIAL_RESOURCES, INITIAL_SKILLS } from './constants';
import { ACTION_REGISTRY } from './logic/actionRegistry';
import { handleGlobalContribution, handleGlobalTax, handleGlobalTrade, handleReinforceGarrison, handleRepairWalls, handleSetTax } from './globalActions';
import { logSystemicStat } from './utils/statsUtils';
import type { SkillType, EquipmentSlot, ActionType, Resources } from './simulationTypes';

import { addXp, recordCharacterLife } from './logic/playerLogic';
import { performSiegeTransaction } from './logic/handlers/SiegeActions';

/* --- ACTIONS CLASSIFICATION --- */
const GLOBAL_ACTIONS = ['RAID', 'TAX', 'TAX_PEASANTS', 'TAX_ROYAL', 'TRADE', 'TRADE_ROUTE', 'CONTRIBUTE_TO_UPGRADE', 'BUY', 'SELL', 'CONTRIBUTE', 'CONSTRUCT', 'UPGRADE_BUILDING', 'START_SIEGE', 'JOIN_SIEGE', 'SIEGE_ACTION', 'REINFORCE_GARRISON', 'REPAIR_WALLS', 'SET_TAX'];

export const performAction = async (pin: string, playerId: string, action: any): Promise<{ success: boolean, data?: { success: boolean, timestamp: number, message: string, utbytte: any[], xp: any[], durability: any[] }, error?: any }> => {
    const actionType = typeof action === 'string' ? action : action.type;
    const isGlobalAction = GLOBAL_ACTIONS.includes(actionType);

    if (isGlobalAction) {
        return await performGlobalAction(pin, playerId, action) as any;
    }

    return performSoloAction(pin, playerId, action);
};

/* --- SOLO ACTION HANDLER --- */
async function performSoloAction(pin: string, playerId: string, action: any) {
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);
    const worldRef = ref(db, `simulation_rooms/${pin}/world`);

    let result: any = null;

    try {
        const worldSnap = await get(worldRef);
        const world = worldSnap.exists() ? worldSnap.val() : { season: 'Spring', weather: 'Clear', activeLaws: [] };

        await runTransaction(playerRef, (actor: any) => {
            if (!actor) return actor;

            // Initialize Core State if missing
            if (!actor.resources) actor.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES[actor.role as keyof typeof INITIAL_RESOURCES] || INITIAL_RESOURCES.PEASANT));
            if (!actor.skills) actor.skills = JSON.parse(JSON.stringify(INITIAL_SKILLS[actor.role as keyof typeof INITIAL_SKILLS] || INITIAL_SKILLS.PEASANT));
            if (!actor.status) actor.status = { stamina: 100, hp: 100, authority: 0, gold: actor.resources.gold || 0, level: 1, xp: 0 };
            if (!actor.equipment) actor.equipment = { HEAD: null, BODY: null, MAIN_HAND: null, OFF_HAND: null, FEET: null, TRINKET: null, AXE: null, PICKAXE: null, SCYTHE: null, HAMMER: null };
            if (!actor.stats) actor.stats = { level: 1, xp: 0 };
            if (!actor.activeBuffs) actor.activeBuffs = [];

            const localResult = {
                success: true,
                timestamp: Date.now(),
                message: "",
                utbytte: [] as any[],
                xp: [] as any[],
                durability: [] as any[]
            };

            const trackXp = (skill: SkillType, amount: number) => {
                let finalAmount = amount;

                // Building-based XP Boosts (+10% for Level 2+)
                const buildings = world.settlement?.buildings || {};
                const skillToBuilding: Record<string, string> = {
                    'WOODCUTTING': 'sawmill',
                    'FARMING': 'windmill',
                    'MINING': 'smeltery',
                    'CRAFTING': 'great_forge',
                    'TRADING': 'weavery'
                };

                const buildingId = skillToBuilding[skill];
                if (buildingId) {
                    const level = buildings[buildingId]?.level || 1;
                    if (level >= 2) {
                        finalAmount = Math.ceil(finalAmount * 1.1); // +10%
                    }
                }

                const preLevel = actor.skills?.[skill]?.level || 0;
                const msgList: string[] = [];
                addXp(actor, skill, finalAmount, msgList);
                if (msgList.length > 0) localResult.message += " " + msgList.join(" ");

                const postLevel = actor.skills?.[skill]?.level || 0;
                localResult.xp.push({ skill, amount: finalAmount, levelUp: postLevel > preLevel });
            };

            const initialLevel = actor.stats.level || 1;

            const damageTool = (slot: EquipmentSlot, amount: number) => {
                const item = actor.equipment?.[slot];
                if (item) {
                    item.durability = Math.max(0, item.durability - amount);
                    localResult.durability.push({
                        slot,
                        item: item.name || 'Gjenstand',
                        amount,
                        broken: item.durability <= 0
                    });
                    if (item.durability <= 0) {
                        localResult.message = `❌ ${item.name} ble ødelagt!`;
                        localResult.success = false;
                        return false;
                    }
                }
                return true;
            };

            // Passive Regen
            const now = Date.now();
            const elapsedMs = now - (actor.lastActive || now);
            const elapsedMinutes = Math.min(60, isNaN(elapsedMs) ? 0 : elapsedMs / 60000);

            if (elapsedMinutes > 0.1) {
                let passiveGold = 0;
                if (actor.upgrades?.includes('cow')) passiveGold += elapsedMinutes * GAME_BALANCE.PASSIVE_INCOME.COW;
                if (actor.upgrades?.includes('accounting_books')) passiveGold += elapsedMinutes * GAME_BALANCE.PASSIVE_INCOME.ACCOUNTING_BOOKS;
                if (actor.upgrades?.includes('caravan')) passiveGold += elapsedMinutes * GAME_BALANCE.PASSIVE_INCOME.CARAVAN;
                if (passiveGold > 0) {
                    actor.resources.gold = (actor.resources.gold || 0) + Math.floor(passiveGold);
                }
                const staminaRegen = elapsedMinutes * 2;
                actor.status.stamina = Math.min(100, (actor.status.stamina || 0) + staminaRegen);
            }

            const initialRole = actor.role;
            const actionType = typeof action === 'string' ? action : action.type;

            // Handle Costs
            const cost = ACTION_COSTS[actionType as ActionType];
            if (cost) {
                const finalStaminaCost = calculateStaminaCost(cost.stamina || 0, world.season, world.weather, actor.activeBuffs, world.gameTick || 0);

                for (const [res, amt] of Object.entries(cost)) {
                    if (res === 'stamina') continue;
                    const resourceKey = res as keyof Resources;
                    if ((actor.resources[resourceKey] || 0) < (amt as number)) {
                        localResult.success = false;
                        localResult.message = `❌ Mangler ${amt} ${res}!`;
                        result = localResult;
                        return actor;
                    }
                }

                if ((actor.status.stamina || 0) < finalStaminaCost) {
                    localResult.success = false;
                    localResult.message = `💤 For sliten! (${finalStaminaCost}⚡ kreves)`;
                    result = localResult;
                    return actor;
                }

                for (const [res, amt] of Object.entries(cost)) {
                    if (res === 'stamina') continue;
                    const resourceKey = res as keyof Resources;
                    actor.resources[resourceKey] = (actor.resources[resourceKey] || 0) - (amt as number);
                    logSystemicStat(pin, 'consumed', res, amt as number);
                }
                actor.status.stamina -= finalStaminaCost;
            }

            // Logic Execution
            const handler = ACTION_REGISTRY[actionType];
            if (handler) {
                const ctx = {
                    actor,
                    room: { world, players: { [playerId]: actor }, messages: [] } as any,
                    pin,
                    action,
                    timestamp: new Date().toLocaleTimeString(),
                    localResult,
                    trackXp,
                    damageTool
                };

                const handlerSuccess = handler(ctx);
                if (handlerSuccess === false) {
                    result = localResult;
                    return actor;
                }
            } else {
                localResult.success = false;
                localResult.message = `Ukjent handling: ${actionType}`;
            }

            if (!localResult.message) localResult.message = "Handling utført.";

            // Jackpot
            if (localResult.success && Math.random() < 0.005) {
                actor.resources.gold = (actor.resources.gold || 0) + 150;
                localResult.utbytte.push({ id: 'ancient_relic', name: 'Gammel Relikvie', type: 'ITEM', icon: '🏺', amount: 1, jackpot: true });
                localResult.message += " ✨ ET JORDFUNN! Du fant en eldgammel relikvie!";
            }

            actor.lastActive = Date.now();
            result = localResult;

            if (actionType === 'RETIRE' && localResult.success) {
                (result as any).characterSnapshot = JSON.parse(JSON.stringify(actor));
            }

            if (actor.stats.level > initialLevel) {
                (result as any).newLevel = actor.stats.level;
            }

            if (actor.role !== initialRole) {
                logSystemicStat(pin, 'roleChanges', actor.role, 1);
            }

            return actor;
        });

        // Post-Action Processing
        if (result && result.success) {
            if (result.message) {
                await logSimulationMessage(pin, `[${new Date().toLocaleTimeString()}] ${result.message}`);
            }

            if (result.utbytte && result.utbytte.length > 0) {
                result.utbytte.forEach((u: any) => {
                    const category = u.type === 'ITEM' ? 'crafted' : 'produced';
                    logSystemicStat(pin, category, u.id || u.resource, u.amount || 1);
                });
            }

            if ((result as any).characterSnapshot) {
                const uid = (result as any).characterSnapshot.uid || playerId; // Fallback to playerId if uid missing
                await recordCharacterLife(uid, pin, (result as any).characterSnapshot);
            }

            if ((result as any).newLevel) {
                try {
                    await update(ref(db, `simulation_rooms/${pin}/public_profiles/${playerId}`), {
                        "stats/level": (result as any).newLevel,
                        lastActive: Date.now()
                    });
                } catch (e) {
                    console.error("Failed to sync level", e);
                }
            }
        }

        return { success: !!result?.success, data: result || undefined };

    } catch (e: any) {
        console.error("Action error:", e);
        return { success: false, error: e.message || "Handling feilet" };
    }
}

/* --- GLOBAL ACTION HANDLER --- */
async function performGlobalAction(pin: string, playerId: string, action: any) {
    const actionType = typeof action === 'string' ? action : action.type;

    try {
        if (actionType === 'BUY' || actionType === 'SELL' || actionType === 'TRADE_ROUTE') {
            return await handleGlobalTrade(pin, playerId, action);
        }

        if (actionType === 'CONTRIBUTE' || actionType === 'CONTRIBUTE_TO_UPGRADE' || actionType === 'CONSTRUCT' || actionType === 'UPGRADE_BUILDING') {
            return await handleGlobalContribution(pin, playerId, action);
        }

        if (actionType === 'TAX' || actionType === 'TAX_PEASANTS' || actionType === 'TAX_ROYAL') {
            return await handleGlobalTax(pin, playerId, action);
        }

        if (actionType === 'START_SIEGE' || actionType === 'JOIN_SIEGE' || actionType === 'SIEGE_ACTION') {
            return await performSiegeTransaction(pin, playerId, action);
        }

        if (actionType === 'REINFORCE_GARRISON') {
            return await handleReinforceGarrison(pin, playerId, action);
        }

        if (actionType === 'REPAIR_WALLS') {
            return await handleRepairWalls(pin, playerId, action);
        }

        if (actionType === 'SET_TAX') {
            return await handleSetTax(pin, playerId, action);
        }

        return { success: false, error: "Global handling not available." };

    } catch (e: any) {
        console.error("Global Action ERROR:", e);
        return { success: false, error: e.message || "Global handling feilet" };
    }
}
