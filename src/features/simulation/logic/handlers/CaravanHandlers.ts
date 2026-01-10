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

/**
 * Handles repairing the caravan.
 */
export const handleRepairCaravan = (ctx: ActionContext) => {
    const { actor, localResult } = ctx;

    if (!actor.caravan) return false;

    // Get Max Durability for current level
    const config = GAME_BALANCE.CARAVAN.LEVELS.find(l => l.level === actor.caravan!.level);
    const maxDurability = config ? config.durability : 100;

    const currentDurability = actor.caravan.durability || 0;
    if (currentDurability >= maxDurability) {
        localResult.success = false;
        localResult.message = "Karavanen er allerede i topp stand.";
        return false;
    }

    const damage = maxDurability - currentDurability;
    const costPerPoint = 2; // 2g per point
    const totalCost = damage * costPerPoint;

    if ((actor.resources.gold || 0) < totalCost) {
        localResult.success = false;
        localResult.message = `Du mangler ${(totalCost - (actor.resources.gold || 0))} gull. Reparasjon koster ${totalCost}g.`;
        return false;
    }

    // Pay & Repair
    actor.resources.gold -= totalCost;
    actor.caravan.durability = maxDurability;

    localResult.message = `Karavanen reparert for ${totalCost}g.`;
    return true;
};

/**
 * Handles result from Travel Minigame (Damage/Success)
 */
export const handleCaravanTravelResult = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { finalDurability, targetRegionId } = action as { finalDurability: number, targetRegionId: string };

    console.log('[CaravanHandler] Travel Result:', { finalDurability, targetRegionId, currentDurability: actor.caravan?.durability });

    if (!actor.caravan) return false;

    // Apply damage
    actor.caravan.durability = Math.max(0, finalDurability);

    if (actor.caravan.durability <= 0) {
        // FAILED TRAVEL
        localResult.success = false;
        localResult.message = "Karavanen brøt sammen under reisen! Du må reparere den før du kan reise igjen.";
        // Note: Region does NOT change.
        return true;
    }

    // SUCCESSFUL TRAVEL
    // Update region
    actor.regionId = targetRegionId;

    // Also update public profile if possible (handled by caller usually, but we modify actor state here)

    localResult.message = `Ankom destinasjonen! Durability: ${Math.round(finalDurability)}%`;
    return true;
};

/* --- CARAVAN COSMETICS --- */

export const CARAVAN_COSMETICS: Record<string, { id: string; category: string; name: string; cost: number; reqLevel?: number; reqBiome?: string }> = {
    // CHASSIS
    'chassis_oak': { id: 'chassis_oak', category: 'CHASSIS', name: 'Rustikk Eik', cost: 0 },
    'chassis_iron': { id: 'chassis_iron', category: 'CHASSIS', name: 'Forsterket Jern', cost: 1500, reqLevel: 3 },
    'chassis_gold': { id: 'chassis_gold', category: 'CHASSIS', name: 'Gyllen Kongevogn', cost: 5000, reqLevel: 5 },

    // WHEELS
    'wheels_wood': { id: 'wheels_wood', category: 'WHEELS', name: 'Trehjul', cost: 0 },
    'wheels_iron': { id: 'wheels_iron', category: 'WHEELS', name: 'Jernbeslåtte', cost: 150 },
    'wheels_spiked': { id: 'wheels_spiked', category: 'WHEELS', name: 'Pigghjul', cost: 500 },

    // COVER
    'cover_canvas': { id: 'cover_canvas', category: 'COVER', name: 'Slitt Lerret', cost: 0 },
    'cover_leather': { id: 'cover_leather', category: 'COVER', name: 'Lær', cost: 200 },
    'cover_silk': { id: 'cover_silk', category: 'COVER', name: 'Silke med Gullkant', cost: 1000 },
    'cover_stars': { id: 'cover_stars', category: 'COVER', name: 'Stjernehimmel', cost: 2500 },

    // LANTERNS
    'lantern_oil': { id: 'lantern_oil', category: 'LANTERNS', name: 'Oljelampe', cost: 0 },
    'lantern_crystal': { id: 'lantern_crystal', category: 'LANTERNS', name: 'Blå Krystall', cost: 800 },
    'lantern_fireflies': { id: 'lantern_fireflies', category: 'LANTERNS', name: 'Ildfluer i bur', cost: 300 },

    // FLAGS
    'flag_none': { id: 'flag_none', category: 'FLAG', name: 'Ingen', cost: 0 },
    'flag_region': { id: 'flag_region', category: 'FLAG', name: 'Regionens Flagg', cost: 100 },
    'flag_pirate': { id: 'flag_pirate', category: 'FLAG', name: 'Piratflagg', cost: 500 },

    // SKINS (Animals)
    'skin_ox': { id: 'skin_ox', category: 'SKIN', name: 'Standard Okse', cost: 0 },
    'skin_horse_linked': { id: 'skin_horse_linked', category: 'SKIN', name: 'Min Hest', cost: 0 },
    'skin_horse_white': { id: 'skin_horse_white', category: 'SKIN', name: 'Hvit Hest', cost: 1000 },
    'skin_horse_mech': { id: 'skin_horse_mech', category: 'SKIN', name: 'Mekanisk Hest', cost: 5000 },

    // COMPANIONS
    'companion_none': { id: 'companion_none', category: 'COMPANION', name: 'Ingen', cost: 0 },
    'companion_dog': { id: 'companion_dog', category: 'COMPANION', name: 'Vakthund', cost: 400 },
    'companion_cat': { id: 'companion_cat', category: 'COMPANION', name: 'Katt på taket', cost: 200 },

    // TRAILS
    'trail_dust': { id: 'trail_dust', category: 'TRAIL', name: 'Støvsky', cost: 0 },
    'trail_gold': { id: 'trail_gold', category: 'TRAIL', name: 'Gullglitter', cost: 2000 },
    'trail_dark': { id: 'trail_dark', category: 'TRAIL', name: 'Mørk Tåke', cost: 1500 },

    // DECOR
    'decor_none': { id: 'decor_none', category: 'DECOR', name: 'Ingen', cost: 0 },
    'decor_shields': { id: 'decor_shields', category: 'DECOR', name: 'Skjoldrekke', cost: 600 },
    'decor_flowers': { id: 'decor_flowers', category: 'DECOR', name: 'Blomsterkasser', cost: 100 }
};

export const handleBuyCaravanCosmetic = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { cosmeticId } = action as { cosmeticId: string };

    if (!actor.caravan) return false;

    // Init customization structure if missing
    if (!actor.caravan.customization) {
        actor.caravan.customization = {
            chassis: 'chassis_oak', wheels: 'wheels_wood', cover: 'cover_canvas', lanterns: 'lantern_oil',
            flag: 'flag_none', skin: 'skin_ox', companion: 'companion_none', trail: 'trail_dust', decor: 'decor_none',
            unlocked: ['chassis_oak', 'wheels_wood', 'cover_canvas', 'lantern_oil', 'flag_none', 'skin_ox', 'skin_horse_linked', 'companion_none', 'trail_dust', 'decor_none']
        };
    }

    const item = CARAVAN_COSMETICS[cosmeticId];
    if (!item) {
        localResult.success = false;
        localResult.message = "Ugyldig vare.";
        return false;
    }

    if (actor.caravan.customization.unlocked.includes(cosmeticId)) {
        localResult.success = false;
        localResult.message = "Du eier allerede denne.";
        return false;
    }

    if ((actor.resources.gold || 0) < item.cost) {
        localResult.success = false;
        localResult.message = `Du mangler ${(item.cost - (actor.resources.gold || 0))} gull.`;
        return false;
    }

    if (item.reqLevel && (actor.caravan.level || 1) < item.reqLevel) {
        localResult.success = false;
        localResult.message = `Krever Karavan Nivå ${item.reqLevel}.`;
        return false;
    }

    actor.resources.gold -= item.cost;
    actor.caravan.customization.unlocked.push(cosmeticId);

    localResult.message = `Kjøpte ${item.name}!`;
    return true;
};

export const handleEquipCaravanCosmetic = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { cosmeticId } = action as { cosmeticId: string };

    const item = CARAVAN_COSMETICS[cosmeticId];
    if (!item || !actor.caravan) return false;

    if (!actor.caravan.customization) {
        // Should have been initialized, but safe fallback logic same as above could go here
        actor.caravan.customization = {
            chassis: 'chassis_oak', wheels: 'wheels_wood', cover: 'cover_canvas', lanterns: 'lantern_oil',
            flag: 'flag_none', skin: 'skin_ox', companion: 'companion_none', trail: 'trail_dust', decor: 'decor_none',
            unlocked: ['chassis_oak', 'wheels_wood', 'cover_canvas', 'lantern_oil', 'flag_none', 'skin_ox', 'skin_horse_linked', 'companion_none', 'trail_dust', 'decor_none']
        };
    }

    if (!actor.caravan.customization.unlocked.includes(cosmeticId)) {
        localResult.success = false;
        localResult.message = "Du eier ikke denne gjenstanden.";
        return false;
    }

    // Special Logic: Linked Horse Check
    if (cosmeticId === 'skin_horse_linked') {
        const hasHorse = actor.horseCustomization && actor.horseCustomization.skinId;
        if (!hasHorse) {
            localResult.success = false;
            localResult.message = "Du trenger en hest i stallen for å bruke denne.";
            return false;
        }
    }

    // Equip based on category
    switch (item.category) {
        case 'CHASSIS': actor.caravan.customization.chassis = cosmeticId; break;
        case 'WHEELS': actor.caravan.customization.wheels = cosmeticId; break;
        case 'COVER': actor.caravan.customization.cover = cosmeticId; break;
        case 'LANTERNS': actor.caravan.customization.lanterns = cosmeticId; break;
        case 'FLAG': actor.caravan.customization.flag = cosmeticId; break;
        case 'SKIN': actor.caravan.customization.skin = cosmeticId; break;
        case 'COMPANION': actor.caravan.customization.companion = cosmeticId; break;
        case 'TRAIL': actor.caravan.customization.trail = cosmeticId; break;
        case 'DECOR': actor.caravan.customization.decor = cosmeticId; break;
    }

    localResult.message = `Utstyrte ${item.name}.`;
    return true;
};
