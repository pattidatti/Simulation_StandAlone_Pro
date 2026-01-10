import { GAME_BALANCE } from '../../data/gameBalance';
import type { ActionContext } from '../actionTypes';
import type { ResourceType } from '../../simulationTypes';

/**
 * Handles loading resources from player inventory into the caravan.
 */
export const handleLoadCaravan = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { resource, amount } = action as { resource: ResourceType; amount: number };

    if (!actor.caravan) {
        // Initialize if missing (should be done on role change, but self-healing here)
        actor.caravan = {
            level: 1,
            inventory: {},
            durability: 100,
            upgrades: []
        };
    }

    const config = GAME_BALANCE.CARAVAN.LEVELS.find(l => l.level === actor.caravan!.level);
    if (!config) return false;

    // Check inventory
    const hasAmount = actor.resources[resource] || 0;
    if (hasAmount < amount) {
        localResult.success = false;
        localResult.message = `Du har ikke nok ${resource}.`;
        return false;
    }

    // Check capacity
    const currentCargo = Object.values(actor.caravan.inventory).reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
    if (currentCargo + amount > config.capacity) {
        localResult.success = false;
        localResult.message = "Karavanen er full!";
        return false;
    }

    // Move
    actor.resources[resource]! -= amount;
    actor.caravan.inventory[resource] = (actor.caravan.inventory[resource] || 0) + amount;

    localResult.message = `Lastet ${amount} ${resource} på karavanen.`;
    localResult.utbytte.push({ resource, amount: -amount });
    return true;
};

/**
 * Handles unloading resources from the caravan into player inventory.
 */
export const handleUnloadCaravan = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { resource, amount } = action as { resource: ResourceType; amount: number };

    if (!actor.caravan || !actor.caravan.inventory[resource] || actor.caravan.inventory[resource]! < amount) {
        localResult.success = false;
        localResult.message = `Mangelfull last i karavanen.`;
        return false;
    }

    // Move
    actor.caravan.inventory[resource]! -= amount;
    actor.resources[resource] = (actor.resources[resource] || 0) + amount;

    localResult.message = `Losset ${amount} ${resource} fra karavanen.`;
    localResult.utbytte.push({ resource, amount: amount });
    return true;
};

/**
 * Handles upgrading the Caravan or buying modules.
 */
export const handleUpgradeCaravan = (ctx: ActionContext) => {
    const { actor, action, localResult, trackXp } = ctx;
    const { upgradeType, upgradeId } = action as { upgradeType: 'LEVEL' | 'MODULE'; level?: number; upgradeId?: string };

    if (!actor.caravan) {
        actor.caravan = { level: 1, inventory: {}, durability: 100, upgrades: [] };
    }

    if (upgradeType === 'LEVEL') {
        const nextLevel = (actor.caravan.level || 1) + 1;
        const config = GAME_BALANCE.CARAVAN.LEVELS.find(l => l.level === nextLevel);

        if (!config) {
            localResult.success = false;
            localResult.message = "Karavanen er allerede på maks nivå.";
            return false;
        }

        if ((actor.resources.gold || 0) < config.cost) {
            localResult.success = false;
            localResult.message = `Du mangler ${(config.cost - (actor.resources.gold || 0))} gull for oppgraderingen.`;
            return false;
        }

        // Pay & Upgrade
        actor.resources.gold -= config.cost;
        actor.caravan.level = nextLevel;
        actor.caravan.durability = config.durability;

        localResult.message = `Karavanen oppgradert til: ${config.name}!`;
        trackXp('TRADING', 100);
        return true;
    }

    if (upgradeType === 'MODULE' && upgradeId) {
        const upgrade = (GAME_BALANCE.CARAVAN.UPGRADES as any)[upgradeId.toUpperCase()];
        if (!upgrade) return false;

        if (actor.caravan.upgrades.includes(upgrade.id)) {
            localResult.success = false;
            localResult.message = "Du har allerede denne oppgraderingen.";
            return false;
        }

        if ((actor.resources.gold || 0) < upgrade.cost) {
            localResult.success = false;
            localResult.message = "Ikke nok gull.";
            return false;
        }

        actor.resources.gold -= upgrade.cost;
        actor.caravan.upgrades.push(upgrade.id);
        localResult.message = `Kjøpte modulen: ${upgrade.name}!`;
        trackXp('TRADING', 50);
        return true;
    }

    return false;
};
