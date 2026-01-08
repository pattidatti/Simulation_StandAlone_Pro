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

        // --- FORTIFICATION LINK ---
        // If this is a defensive building, upgrade region fortification
        if (['watchtower', 'manor_ost', 'manor_vest'].includes(buildingDef.id)) {
            // Find region for this building
            let regionId = 'capital';
            if (buildingDef.id === 'manor_ost') regionId = 'region_ost';
            if (buildingDef.id === 'manor_vest') regionId = 'region_vest';

            if (room.regions && room.regions[regionId]) {
                const fort = room.regions[regionId].fortification || { hp: 1000, maxHp: 1000, level: 1 };
                // Let's just add +500 MaxHP flat per level upgrade
                fort.maxHp += 500;
                fort.hp += 500; // Heal the new amount
                fort.level = Math.max(fort.level, nextLevel);
                room.regions[regionId].fortification = fort;
                localResult.message += ` 🛡️ Murene forsterket! (+500 HP)`;
            }
        }

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

                // --- FORTIFICATION LINK ---
                if (['watchtower', 'manor_ost', 'manor_vest'].includes(bId)) {
                    let regionId = 'capital';
                    if (bId === 'manor_ost') regionId = 'region_ost';
                    if (bId === 'manor_vest') regionId = 'region_vest';

                    if (room.regions && room.regions[regionId]) {
                        const fort = room.regions[regionId].fortification || { hp: 1000, maxHp: 1000, level: 1 };
                        fort.maxHp += 500;
                        fort.hp += 500;
                        fort.level = Math.max(fort.level, nextLevel);
                        room.regions[regionId].fortification = fort;
                    }
                }

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


