import { GAME_BALANCE, VILLAGE_BUILDINGS, UPGRADES_LIST, INITIAL_RESOURCES, INITIAL_SKILLS } from '../../constants';
import type { ActionContext } from '../actionTypes';
import type { Resources, Role } from '../../simulationTypes';

export const handleTax = (ctx: ActionContext) => {
    const { actor, room, localResult } = ctx;
    if (actor.role !== 'BARON' && actor.role !== 'KING') {
        localResult.success = false;
        return false;
    }

    let taxTotal = 0;
    let taxGrain = 0;

    Object.values(room.players).forEach((p: any) => {
        if (p.role === 'PEASANT' && p.id !== actor.id) {
            const goldTax = Math.floor((p.resources.gold || 0) * GAME_BALANCE.TAX.PEASANT_RATE_DEFAULT);
            const grainTax = Math.floor((p.resources.grain || 0) * GAME_BALANCE.TAX.PEASANT_RATE_DEFAULT);

            if (goldTax > 0) {
                p.resources.gold -= goldTax;
                taxTotal += goldTax;
            }
            if (grainTax > 0) {
                p.resources.grain -= grainTax;
                taxGrain += grainTax;
            }
        }
    });

    actor.resources.gold = (actor.resources.gold || 0) + taxTotal;
    actor.resources.grain = (actor.resources.grain || 0) + taxGrain;

    if (taxTotal > 0 || taxGrain > 0) {
        localResult.utbytte.push({ resource: 'gold', amount: taxTotal });
        localResult.utbytte.push({ resource: 'grain', amount: taxGrain });
        localResult.message = `Krevde inn skatt: ${taxTotal}g og ${taxGrain} korn fra bøndene.`;
    } else {
        localResult.message = "Ingen skatt å kreve inn (bøndene er blakke).";
    }

    actor.status.legitimacy = Math.max(0, (actor.status.legitimacy || 100) - 5);
    return true;
};

export const handleDraft = (ctx: ActionContext) => {
    const { actor, localResult } = ctx;
    if (actor.role !== 'BARON' && actor.role !== 'KING') {
        localResult.success = false;
        return false;
    }

    const costGold = 5;
    const costGrain = 10;
    if ((actor.resources.gold || 0) >= costGold && (actor.resources.grain || 0) >= costGrain) {
        actor.resources.gold -= costGold;
        actor.resources.grain -= costGrain;
        actor.resources.manpower = (actor.resources.manpower || 0) + 10;
        localResult.utbytte.push({ resource: 'manpower', amount: 10 });
        localResult.message = `Mobiliserte tropper (+10 Manpower).`;
    } else {
        localResult.success = false;
        localResult.message = "Mangler ressurser for å mobilisere.";
        return false;
    }
    return true;
};

export const handleDecree = (ctx: ActionContext) => {
    const { actor, room, localResult } = ctx;
    if (actor.role !== 'KING') return false;
    localResult.message = "UTSTEDTE KONGELIG DEKRET: Ekstraskatt!";
    let taxTotal = 0;
    Object.values(room.players).forEach((p: any) => {
        if (p.role === 'BARON') {
            const tax = 20;
            if (p.resources.gold >= tax) {
                p.resources.gold -= tax;
                taxTotal += tax;
            }
        }
    });
    actor.resources.gold = (actor.resources.gold || 0) + taxTotal;
    localResult.utbytte.push({ resource: 'gold', amount: taxTotal });
    return true;
};

export const handleContribute = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const { buildingId, resource, amount } = action;
    const buildingDef = VILLAGE_BUILDINGS[buildingId];
    if (!buildingDef) {
        localResult.success = false;
        localResult.message = `Fant ikke bygning med ID: ${buildingId}`;
        return false;
    }

    const isPrivate = buildingId === 'farm_house';
    let buildingState: { level: number; progress: Partial<Resources>; contributions?: any };

    if (isPrivate) {
        if (!actor.buildings) actor.buildings = {};
        if (!actor.buildings[buildingId]) actor.buildings[buildingId] = { level: 1, progress: {} };
        buildingState = actor.buildings[buildingId];
    } else {
        // Ensure World Structure
        if (!room.world) room.world = { season: 'Spring', weather: 'Clear', year: 1066, gameTick: 0, lastTickAt: Date.now(), taxRateDetails: { kingTax: 0.1 }, settlement: { buildings: {} } };
        if (!room.world.settlement) room.world.settlement = { buildings: {} };
        if (!room.world.settlement.buildings) room.world.settlement.buildings = {};

        if (!room.world.settlement.buildings[buildingId]) {
            room.world.settlement.buildings[buildingId] = { id: buildingId, level: 1, progress: {}, contributions: {} };
        }
        buildingState = room.world.settlement.buildings[buildingId] as any;
    }

    if (!buildingState.progress) buildingState.progress = {};
    if (!actor.resources) actor.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES.PEASANT));
    if (!buildingState.level || buildingState.level < 1) buildingState.level = 1;

    const nextLevel = buildingState.level + 1;
    const nextLevelDef = buildingDef.levels[nextLevel];
    if (!nextLevelDef) {
        localResult.success = false;
        localResult.message = "Maksimalt nivå nådd.";
        return false;
    }

    const requirements = nextLevelDef.requirements || {};
    const reqAmount = (requirements as any)[resource] || 0;
    const currentProg = (buildingState.progress as any)[resource] || 0;
    const needed = reqAmount - currentProg;

    if (needed <= 0) {
        localResult.success = false;
        localResult.message = "Ressurskravet er allerede oppfylt.";
        return false;
    }

    const playerHas = (actor.resources as any)[resource] || 0;
    const giveAmount = Math.min(amount, needed, playerHas);

    if (giveAmount <= 0) {
        localResult.success = false;
        localResult.message = `Kan ikke bidra 0 (Har: ${playerHas}, Trenger: ${needed}, Bud: ${amount})`;
        return false;
    }

    // SAFE SUBTRACTION
    (actor.resources as any)[resource] = playerHas - giveAmount;
    (buildingState.progress as any)[resource] = currentProg + giveAmount;

    if (!isPrivate) {
        if (!buildingState.contributions) buildingState.contributions = {};
        if (!buildingState.contributions[actor.id]) {
            buildingState.contributions[actor.id] = { name: actor.name, resources: {} };
        }
        const pCont = buildingState.contributions[actor.id].resources;
        pCont[resource] = (pCont[resource] || 0) + giveAmount;
    }

    localResult.message = `Bidro med ${giveAmount} ${resource} til ${buildingDef.name}.`;
    localResult.utbytte.push({ resource, amount: -giveAmount });

    let finished = true;
    Object.entries(nextLevelDef.requirements).forEach(([res, amt]) => {
        if (((buildingState.progress as any)[res] || 0) < (amt as number)) finished = false;
    });

    if (finished) {
        buildingState.level = nextLevel;
        buildingState.progress = {};
        if (!isPrivate) buildingState.contributions = {};
        localResult.message += ` ⚒️ NYTT NIVÅ: ${buildingDef.name} nådde Nivå ${nextLevel}!`;
    }
    return true;
};

export const handleUpgradeBuilding = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const actionType = typeof action === 'string' ? action : action.type;
    const bId = action.buildingId || actionType.replace('UPGRADE_BUILDING_', '');
    const buildingDef = VILLAGE_BUILDINGS[bId];

    if (buildingDef) {
        if (!room.world.settlement) room.world.settlement = { buildings: {} };
        const currentLevel = room.world.settlement.buildings[bId]?.level || 1;
        const nextLevel = currentLevel + 1;
        const nextLevelDef = buildingDef.levels[nextLevel];

        if (nextLevelDef) {
            let canAfford = true;
            Object.entries(nextLevelDef.requirements || {}).forEach(([res, amt]) => {
                if (((actor.resources as any)[res] || 0) < (amt as number)) canAfford = false;
            });

            if (canAfford) {
                Object.entries(nextLevelDef.requirements || {}).forEach(([res, amt]) => {
                    (actor.resources as any)[res] -= (amt as number);
                });
                if (!room.world.settlement.buildings[bId]) {
                    room.world.settlement.buildings[bId] = { id: bId, level: 1, progress: {}, contributions: {} };
                }
                room.world.settlement.buildings[bId].level = nextLevel;
                localResult.message = `Oppgraderte ${buildingDef.name} til Nivå ${nextLevel}!`;
            } else {
                localResult.success = false;
                localResult.message = "Mangler ressurser for oppgradering.";
                return false;
            }
        }
    }
    return true;
};

export const handleUpgrade = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const upgradeId = action.upgradeId;
    const currRole = actor.role as keyof typeof UPGRADES_LIST;
    const upgradeList = UPGRADES_LIST[currRole];

    if (upgradeList) {
        const upgrade = upgradeList.find(u => u.id === upgradeId);
        if (upgrade && !actor.upgrades?.includes(upgradeId)) {
            let canAfford = true;
            Object.entries(upgrade.cost).forEach(([res, amt]) => {
                if ((actor.resources as any)[res] < (amt as number)) canAfford = false;
            });

            if (canAfford) {
                Object.entries(upgrade.cost).forEach(([res, amt]) => {
                    (actor.resources as any)[res] -= (amt as number);
                });
                if (!actor.upgrades) actor.upgrades = [];
                actor.upgrades.push(upgradeId);
                localResult.message = `Oppgradering fullført: ${upgrade.name}`;
            } else {
                localResult.success = false;
                localResult.message = "Har ikke råd til oppgradering.";
                return false;
            }
        }
    }
    return true;
};

export const handleJoinRole = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const targetRole = action.targetRole as Role;

    if (!targetRole) {
        localResult.success = false;
        localResult.message = "Ingen rolle spesifisert.";
        return false;
    }

    if (actor.role === targetRole) {
        localResult.success = false;
        localResult.message = `Du er allerede ${targetRole}.`;
        return false;
    }

    // 1. Requirement Check (Peasant Level 3 for advanced roles)
    const advancedRoles: Role[] = ['SOLDIER', 'MERCHANT', 'BARON', 'KING'];
    if (advancedRoles.includes(targetRole) && targetRole !== 'BARON' && targetRole !== 'KING') {
        const peasantStats = actor.roleStats?.['PEASANT'];
        const peasantLevel = peasantStats?.level || (actor.role === 'PEASANT' ? actor.stats.level : 1);

        const config = (GAME_BALANCE.CAREERS as any)[targetRole];
        if (config && peasantLevel < config.LEVEL_REQ) {
            localResult.success = false;
            localResult.message = `Du må være Bonde Nivå ${config.LEVEL_REQ} for å bli ${targetRole}. (Nå: ${peasantLevel})`;
            return false;
        }
    }

    // 2. Cost Check
    const cost = (GAME_BALANCE.CAREERS as any)[targetRole]?.COST || 0;
    if ((actor.resources.gold || 0) < cost) {
        localResult.success = false;
        localResult.message = `Det koster ${cost}g å bli ${targetRole}. (Har: ${actor.resources.gold}g)`;
        return false;
    }

    // 3. Save current role state
    if (!actor.roleStats) actor.roleStats = {};
    actor.roleStats[actor.role] = {
        level: actor.stats.level,
        xp: actor.stats.xp,
        skills: JSON.parse(JSON.stringify(actor.skills))
    };

    // 4. Deduct Cost & Switch
    if (cost > 0) {
        actor.resources.gold -= cost;
        localResult.utbytte.push({ resource: 'gold', amount: -cost });
    }

    // 5. Load/Initialize target role state
    const targetStats = actor.roleStats[targetRole];
    if (targetStats) {
        actor.stats.level = targetStats.level;
        actor.stats.xp = targetStats.xp;
        actor.skills = targetStats.skills;
    } else {
        // First time joining this role
        actor.stats.level = 1;
        actor.stats.xp = 0;
        actor.skills = JSON.parse(JSON.stringify(INITIAL_SKILLS[targetRole as keyof typeof INITIAL_SKILLS] || INITIAL_SKILLS.PEASANT));
    }

    actor.role = targetRole;
    localResult.message = `Gratulerer! Du er nå ${targetRole}.`;
    return true;
};

// --- BARON WARFARE ACTIONS ---

export const handleReinforceGarrison = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const { amount, resource } = action; // resource: 'swords' | 'armor'

    if (actor.role !== 'BARON' && actor.role !== 'KING') return false;

    // Safety Init
    const regionId = actor.regionId || 'capital'; // Should be dynamic based on where they are governing
    if (!room.regions) room.regions = {};
    if (!room.regions[regionId]) room.regions[regionId] = { id: regionId, name: regionId, defenseLevel: 1, taxRate: 10, rulerName: actor.name };
    const region = room.regions[regionId];

    if (!region.garrison) region.garrison = { swords: 0, armor: 0, morale: 100 };

    // Logic: Convert Player Inventory (or Resources) -> Garrison Stacks
    // We support both:
    // A) Generic Resource (if we ever decide 'swords' are just a number)
    // B) Inventory Items (finding matching items and removing them)

    // Mode B: Inventory Check (Prioritized as per Phase 3 plan)
    if (actor.inventory) {
        const itemTemplateId = resource === 'swords' ? 'iron_sword' : 'leather_armor';
        const itemsToRemove = [];
        let foundCount = 0;

        // Find X items matching ID
        for (let i = 0; i < actor.inventory.length; i++) {
            if (actor.inventory[i].id === itemTemplateId || (resource === 'swords' && actor.inventory[i].type === 'MAIN_HAND') || (resource === 'armor' && actor.inventory[i].type === 'BODY')) {
                // Relaxed check: Accept any Main Hand as Sword contribution? No, stick to ID for now for precision.
                if (actor.inventory[i].id === itemTemplateId) {
                    itemsToRemove.push(i);
                    foundCount++;
                    if (foundCount >= amount) break;
                }
            }
        }

        if (foundCount < amount) {
            localResult.success = false;
            localResult.message = `Mangler ${amount - foundCount} ${resource === 'swords' ? 'Jernsverd' : 'Lærrustninger'} i inventory.`;
            return false;
        }

        // Remove from inventory (reverse loop to not mess up indices)
        // Actually, safer to filter? Splice is tricky with multiple indices.
        // Let's just remove one by one or filter. 
        // Filter approach: Keep items that are NOT in the removal list (by reference comparison if obj, but here by index is brittle).
        // Better: Splice one by one from end? No, indices change.
        // Simplest: `actor.inventory = actor.inventory.filter(...)` but need unique IDs. Item instances might lack unique GUIDs.
        // Fallback: Remove first N matches.
        let removed = 0;
        actor.inventory = actor.inventory.filter((item: any) => {
            if (removed < amount && item.id === itemTemplateId) {
                removed++;
                return false; // Remove
            }
            return true; // Keep
        });

        // Add to Garrison
        region.garrison[resource as 'swords' | 'armor'] += amount;
        localResult.message = `Forsterket garnisonen med ${amount} ${resource === 'swords' ? 'sverd' : 'rustninger'}.`;
        return true;
    }

    return false;
};

export const handleRepairWalls = (ctx: ActionContext) => {
    const { actor, room, localResult } = ctx;
    // const { amount } = action; // unused

    if (actor.role !== 'BARON' && actor.role !== 'KING') return false;

    const costStone = 10;
    const costWood = 10;
    const repairAmount = 50;

    if ((actor.resources.stone || 0) < costStone || (actor.resources.wood || 0) < costWood) {
        localResult.success = false;
        localResult.message = "Mangler stein eller ved for reparasjon.";
        return false;
    }

    const regionId = actor.regionId || 'capital';
    if (!room.regions[regionId]) return false;
    const region = room.regions[regionId];

    if (!region.fortification) region.fortification = { hp: 1000, maxHp: 1000, level: 1 };

    if (region.fortification.hp >= region.fortification.maxHp) {
        localResult.success = false;
        localResult.message = "Murene er allerede feilfrie.";
        return false;
    }

    // Pay Cost
    actor.resources.stone -= costStone;
    actor.resources.wood -= costWood;

    // Apply Repair
    region.fortification.hp = Math.min(region.fortification.maxHp, region.fortification.hp + repairAmount);

    localResult.message = `Reparerte murer (+${repairAmount} HP).`;
    localResult.utbytte.push({ resource: 'stone', amount: -costStone });
    return true;
};

export const handleSetTax = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const { newRate } = action; // 0-100

    if (actor.role !== 'BARON' && actor.role !== 'KING') return false;

    // Clamp logic
    const safeRate = Math.max(0, Math.min(20, newRate)); // Max 20% to prevent abuse? Or allow high tax with revolt risk? Let's say 20 max for now UI wise.

    const regionId = actor.regionId || 'capital';
    if (!room.regions) room.regions = {};
    if (!room.regions[regionId]) room.regions[regionId] = { id: regionId, name: regionId, defenseLevel: 1, taxRate: 10, rulerName: actor.name };

    room.regions[regionId].taxRate = safeRate;
    localResult.message = `Skattenivå satt til ${safeRate}%.`;
    return true;
};
