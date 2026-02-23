import type { ActionContext } from '../../actionTypes';

// --- REINFORCE GARRISON ---
export const handleReinforceGarrison = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const { amount = 1, resource } = action.payload || action;

    const regionId = actor.regionId || 'capital';
    const region = room.regions[regionId];
    if (!region) {
        localResult.success = false;
        localResult.message = "Region ikke funnet.";
        return false;
    }

    // Map resource to garrison key
    const garrisonKey = (resource === 'siege_sword' || resource === 'swords') ? 'swords' : 'armor';
    const resourceId = (resource === 'siege_sword' || resource === 'swords') ? 'siege_sword' : 'siege_armor';

    const currentStock = (actor.resources && actor.resources[resourceId]) || 0;
    if (currentStock < amount) {
        const label = resourceId === 'siege_sword' ? 'beleiringsvåpen' : 'beleiringsrustning';
        localResult.success = false;
        localResult.message = `Mangler ${amount} ${label}. (Har: ${currentStock})`;
        return false;
    }

    // Init garrison if missing
    if (!region.garrison) region.garrison = { swords: 0, armor: 0, morale: 100 };

    // Transfer resources
    (actor.resources as any)[resourceId] -= amount;
    region.garrison[garrisonKey as 'swords' | 'armor'] += amount;
    localResult.utbytte.push({ resource: resourceId, amount: -amount });

    const label = resourceId === 'siege_sword' ? 'beleiringsvåpen' : 'beleiringsrustning';
    localResult.message = `Forsterket garnisonen med ${amount} ${label}.`;

    // --- MID-SIEGE BOSS HEALING (Armor only) ---
    if (
        garrisonKey === 'armor' &&
        region.activeSiege?.phase === 'COURTYARD' &&
        (region.activeSiege as any).courtyardState
    ) {
        const garrison = region.garrison;
        const now = Date.now();
        const lastDonation = (garrison as any).lastDonationDuringSiege || 0;

        if (now - lastDonation >= 60000) {
            const hpBoost = amount * 20;
            const cs = (region.activeSiege as any).courtyardState;
            cs.maxBossHp += hpBoost;
            cs.bossHp += hpBoost;
            (garrison as any).lastDonationDuringSiege = now;
            localResult.message += ` Garnisonssjefen ble styrket! (+${hpBoost} HP)`;
        } else {
            const remaining = Math.ceil((60000 - (now - lastDonation)) / 1000);
            localResult.message += ` (Garnison-healing cooldown: ${remaining}s)`;
        }
    }

    return true;
};

// --- REPAIR WALLS ---
export const handleRepairWalls = (ctx: ActionContext) => {
    const { actor, room, localResult } = ctx;
    const regionId = actor.regionId || 'capital';
    const region = room.regions[regionId];

    if (!region) {
        localResult.success = false;
        localResult.message = "Region ikke funnet.";
        return false;
    }

    const costStone = 10;
    const costWood = 10;
    const repairAmount = 50;

    if ((actor.resources.stone || 0) < costStone || (actor.resources.wood || 0) < costWood) {
        localResult.success = false;
        localResult.message = `Trenger ${costStone} stein og ${costWood} ved for reparasjon.`;
        return false;
    }

    if (!region.fortification) region.fortification = { hp: 1000, maxHp: 1000, level: 1 };

    if (region.fortification.hp >= region.fortification.maxHp) {
        localResult.success = false;
        localResult.message = "Murene er allerede feilfrie.";
        return false;
    }

    actor.resources.stone -= costStone;
    actor.resources.wood -= costWood;
    region.fortification.hp = Math.min(region.fortification.maxHp, region.fortification.hp + repairAmount);

    localResult.utbytte.push(
        { resource: 'stone', amount: -costStone },
        { resource: 'wood', amount: -costWood }
    );
    localResult.message = `Reparerte murene (+${repairAmount} HP). Tilstand: ${region.fortification.hp}/${region.fortification.maxHp}`;
    return true;
};

// --- UPGRADE FORTIFICATION ---
export const handleUpgradeFortification = (ctx: ActionContext) => {
    const { actor, room, localResult } = ctx;
    const regionId = actor.regionId || 'capital';
    const region = room.regions[regionId];

    if (!region) {
        localResult.success = false;
        localResult.message = "Region ikke funnet.";
        return false;
    }

    if (!region.fortification) region.fortification = { hp: 1000, maxHp: 1000, level: 1 };
    const level = region.fortification.level || 1;

    const costGold = level * 5000;
    const costStone = level * 100;
    const costWood = level * 100;

    if (
        (actor.resources.gold || 0) < costGold ||
        (actor.resources.stone || 0) < costStone ||
        (actor.resources.wood || 0) < costWood
    ) {
        localResult.success = false;
        localResult.message = `Oppgradering krever ${costGold} gull, ${costStone} stein, ${costWood} ved.`;
        return false;
    }

    actor.resources.gold -= costGold;
    actor.resources.stone -= costStone;
    actor.resources.wood -= costWood;

    region.fortification.level = level + 1;
    const hpIncrease = 500;
    region.fortification.maxHp += hpIncrease;
    region.fortification.hp += hpIncrease;

    localResult.utbytte.push(
        { resource: 'gold', amount: -costGold },
        { resource: 'stone', amount: -costStone },
        { resource: 'wood', amount: -costWood }
    );
    localResult.message = `Festningen oppgradert til nivå ${level + 1}! (+${hpIncrease} max HP)`;
    return true;
};
