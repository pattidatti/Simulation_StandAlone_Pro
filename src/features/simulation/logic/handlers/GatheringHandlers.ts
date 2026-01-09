import { GAME_BALANCE, REWARDS, SEASONS, WEATHER, CROP_DATA, REFINERY_RECIPES } from '../../constants';
import { calculateYield } from '../../utils/simulationUtils';
import { getActionSlots } from '../../utils/actionUtils';
import type { ActionContext } from '../actionTypes';
import type { ActiveProcess } from '../../simulationTypes';


export const handleMaintainCrop = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const processId = action.processId;

    if (!actor.activeProcesses) {
        localResult.success = false;
        localResult.message = "Ingen aktive prosesser.";
        return false;
    }

    const process = actor.activeProcesses.find(p => p.id === processId);

    if (!process) {
        localResult.success = false;
        localResult.message = "Fant ikke avlingen (kanskje den allerede er ferdig?).";
        return false;
    }

    if (process.type !== 'CROP') {
        localResult.success = false;
        localResult.message = "Kan bare vedlikeholde avlinger.";
        return false;
    }

    // Initialize stats if missing
    if (process.maintainCount === undefined) process.maintainCount = 0;
    if (process.yieldBonus === undefined) process.yieldBonus = 0;

    // CAP: Max 3 maintenance actions per crop
    if (process.maintainCount >= 3) {
        localResult.success = false;
        localResult.message = "Denne åkeren er allerede perfekt vedlikeholdt.";
        return false;
    }

    // Apply Logic
    process.maintainCount += 1;
    process.yieldBonus += 0.05; // 5% bonus per action

    const type = action.subType === 'WEED' ? 'Lukte ugress' : 'Skremte vekk kråka';

    localResult.message = `${type}! (+5% Utbytte).`;

    return true;
};

export const handlePlant = (ctx: ActionContext) => {
    const { actor, action, localResult, timestamp: _timestamp } = ctx;
    const cropId = action.cropId || 'grain';
    const crop = CROP_DATA[cropId];

    if (!crop) {
        localResult.success = false;
        localResult.message = `Ukjent grøde: ${cropId}`;
        return false;
    }

    // WINTER RESTRICTION
    const currentSeason = ctx.room.world?.season || 'Spring';
    if (currentSeason === 'Winter') {
        localResult.success = false;
        localResult.message = "Du kan ikke så om vinteren - bakken er frossen.";
        return false;
    }

    // Initialize activeProcesses if missing
    if (!actor.activeProcesses) actor.activeProcesses = [];

    const locationId = (action as any).locationId || 'grain_fields';

    // Prevent double sowing (existing process check)
    const existing = actor.activeProcesses.find(p => p.type === 'CROP' && p.locationId === locationId);
    if (existing) {
        // CLEANUP CHECK: If the existing process is 'done' (readyAt < now) or invalid, we should overwrite it
        // This prevents the "Ghost Crop" bug where a user harvests but the process stays
        const now = Date.now();
        if (existing.readyAt <= now) {
            // It's a stuck crop, remove it
            const idx = actor.activeProcesses.indexOf(existing);
            if (idx > -1) actor.activeProcesses.splice(idx, 1);
        } else {
            localResult.success = false;
            localResult.message = "Det vokser allerede noe her.";
            return false;
        }
    }

    // Create new process
    const newProcess: ActiveProcess = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'CROP',
        itemId: cropId,
        locationId: locationId,
        startedAt: Date.now(),
        duration: crop.duration,
        readyAt: Date.now() + crop.duration,
        notified: false
    };

    actor.activeProcesses.push(newProcess);
    localResult.message = `Sådde ${crop.label}. Klar om ${Math.ceil(crop.duration / 60000)} min.`;

    return true;
};

export const handleHarvest = (ctx: ActionContext) => {
    const { actor, action, localResult, trackXp, damageTool, room } = ctx;

    const now = Date.now();
    const locationId = (action as any).locationId || 'grain_fields';
    const readyIndex = actor.activeProcesses?.findIndex(p => p.locationId === locationId && p.readyAt <= now);

    if (readyIndex === undefined || readyIndex === -1) {
        localResult.success = false;
        localResult.message = "Ingenting er klart til innhøsting her.";
        return false;
    }

    const process = actor.activeProcesses![readyIndex];

    // Determine the recipe/data based on process type or itemId
    let yieldResource = '';
    let yieldAmount = 0;
    let label = '';
    let xpAmount = 0;
    let skill: any = 'FARMING';

    const crop = CROP_DATA[process.itemId];
    const refineryRecipe = (REFINERY_RECIPES as any)[process.itemId];

    if (crop) {
        label = crop.label;
        yieldResource = crop.yieldResource;
        const performance = action.performance || 0.5;
        const baseYield = crop.minYield + (crop.maxYield - crop.minYield) * performance;
        const currentSeason = room.world?.season || 'Spring';
        const seasonData = (SEASONS as any)[currentSeason];
        // Apply Maintenance Bonus
        const maintenanceMod = 1 + (process.yieldBonus || 0);
        yieldAmount = Math.ceil((baseYield * (seasonData?.yieldMod || 1.0)) * maintenanceMod);
        xpAmount = Math.ceil(crop.xp * (1 + performance));
    } else if (refineryRecipe) {
        label = refineryRecipe.label;
        yieldResource = refineryRecipe.outputResource;
        const baseOutput = refineryRecipe.output?.amount || refineryRecipe.outputAmount || 1;
        const performance = action.performance || 0.5;
        yieldAmount = calculateYield(actor, baseOutput, 'CRAFTING', { performance, isRefining: true });
        xpAmount = refineryRecipe.xp || 10;
        skill = refineryRecipe.skill || 'CRAFTING';
    } else {
        localResult.success = false;
        localResult.message = "Ugyldig prosess-data.";
        return false;
    }

    // Remove process
    // Remove process - AGGRESSIVE CLEANUP
    // Remove ALL matching processes at this location to prevent "ghost" crops
    const processesToRemove = actor.activeProcesses!.filter(p => p.locationId === locationId && p.readyAt <= now);
    processesToRemove.forEach(p => {
        const idx = actor.activeProcesses!.indexOf(p);
        if (idx > -1) actor.activeProcesses!.splice(idx, 1);
    });

    // Damage Tool (if applicable)
    getActionSlots(actor, 'WORK').forEach(slot => {
        damageTool(slot, GAME_BALANCE.DURABILITY.LOSS_WORK);
    });

    // Award Resources
    if (!(actor.resources as any)[yieldResource]) {
        (actor.resources as any)[yieldResource] = 0;
    }
    (actor.resources as any)[yieldResource] += yieldAmount;

    localResult.utbytte.push({ resource: yieldResource, amount: yieldAmount });
    localResult.message = `Høstet ${yieldAmount} ${label}`;

    trackXp(skill, xpAmount);

    return true;
};

export const handleWork = (ctx: ActionContext) => {
    const { actor, room, action, localResult, trackXp, damageTool } = ctx;
    const activeLaws = room.world?.activeLaws || [];

    // Damage Tool (Check all relevant slots)
    getActionSlots(actor, 'WORK').forEach(slot => {
        damageTool(slot, GAME_BALANCE.DURABILITY.LOSS_WORK);
    });

    // Modifiers
    let lawYMod = 1.0;
    if (activeLaws.includes('conscription')) lawYMod = 0.8;
    const base = GAME_BALANCE.YIELD.WORK_GRAIN + (actor.upgrades?.includes('iron_plow') ? 5 : 0);

    const currentSeason = room.world?.season || 'Spring';
    const currentWeather = room.world?.weather || 'Clear';
    const seasonData = (SEASONS as any)[currentSeason];
    const weatherData = (WEATHER as any)[currentWeather];

    const performance = action.performance || 0.5;
    const yieldAmount = calculateYield(actor, base, 'FARMING', {
        season: seasonData?.yieldMod || 1.0,
        weather: weatherData?.yieldMod || 1.0,
        law: lawYMod,
        performance,
        actionType: 'WORK',
        regionId: actor.regionId
    });

    actor.resources.grain = (actor.resources.grain || 0) + yieldAmount;
    localResult.utbytte.push({ resource: 'grain', amount: yieldAmount });
    localResult.message = `Høstet ${yieldAmount} korn`;

    trackXp('FARMING', Math.ceil(REWARDS.WORK.xp * (1 + performance)));

    // Lucky Drop
    if (Math.random() < (GAME_BALANCE.LUCKY_DROP.CHANCE + (actor.equipment?.HEAD?.stats?.luckBonus || 0))) {
        const bonus = Math.ceil(yieldAmount * 0.5);
        const totalYield = yieldAmount + bonus;
        actor.resources.grain += bonus;
        localResult.utbytte.push({ resource: 'grain', amount: bonus, bonus: true });
        localResult.message = `Innhøstet ${totalYield} korn! (inkl. ${bonus} flaks)`;
    }
    return true;
};

export const handleChop = (ctx: ActionContext) => {
    const { actor, room, action, localResult, trackXp, damageTool } = ctx;
    const currentSeason = room.world?.season || 'Spring';

    getActionSlots(actor, 'CHOP').forEach(slot => {
        damageTool(slot, GAME_BALANCE.DURABILITY.LOSS_WORK);
    });

    let base = GAME_BALANCE.YIELD.CHOP_WOOD;
    if (currentSeason === 'Summer') base += GAME_BALANCE.YIELD.SUMMER_WOOD_BONUS;

    const performance = action.performance || 0.5;
    const yieldAmount = calculateYield(actor, base, 'WOODCUTTING', { performance, actionType: 'CHOP', regionId: actor.regionId });

    actor.resources.wood = (actor.resources.wood || 0) + yieldAmount;
    localResult.utbytte.push({ resource: 'wood', amount: yieldAmount });
    localResult.message = `Felte ${yieldAmount} ved`;

    trackXp('WOODCUTTING', Math.ceil(REWARDS.CHOP.xp * (1 + performance)));

    if (Math.random() < (GAME_BALANCE.LUCKY_DROP.CHANCE + (actor.equipment?.HEAD?.stats?.luckBonus || 0))) {
        const bonus = Math.ceil(yieldAmount * 0.5);
        const totalYield = yieldAmount + bonus;
        actor.resources.wood += bonus;
        localResult.utbytte.push({ resource: 'wood', amount: bonus, bonus: true });
        localResult.message = `Felte ${totalYield} ved! (inkl. ${bonus} flaks)`;
    }
    return true;
};

export const handleMiningAction = (ctx: ActionContext) => {
    const { actor, action, localResult, trackXp, damageTool } = ctx;
    const actionType = typeof action === 'string' ? action : action.type;

    getActionSlots(actor, actionType).forEach(slot => {
        damageTool(slot, GAME_BALANCE.DURABILITY.LOSS_WORK);
    });

    const skill = 'MINING';
    const base = actionType === 'MINE' ? GAME_BALANCE.YIELD.MINE_ORE : GAME_BALANCE.YIELD.QUARRY_STONE;
    const resource = actionType === 'MINE' ? 'iron_ore' : 'stone';

    const performance = action.performance || 0.5;
    const yieldAmount = calculateYield(actor, base, skill, { performance, actionType, regionId: actor.regionId });

    (actor.resources as any)[resource] = ((actor.resources as any)[resource] || 0) + yieldAmount;
    localResult.utbytte.push({ resource, amount: yieldAmount });
    localResult.message = actionType === 'MINE' ? `Utvant ${yieldAmount} jernmalm` : `Hogde ${yieldAmount} stein`;

    trackXp(skill, Math.ceil(REWARDS.WORK.xp * (1 + performance)));
    return true;
};

export const handleForage = (ctx: ActionContext) => {
    const { actor, action, localResult, trackXp, damageTool } = ctx;

    // Optional tool damage
    getActionSlots(actor, 'FORAGE').forEach(slot => {
        damageTool(slot, 1);
    });

    const base = GAME_BALANCE.YIELD.FORAGE_BREAD;
    const performance = action.performance || 0.5;
    const yieldAmount = calculateYield(actor, base, 'FARMING', { performance, actionType: 'FORAGE' });

    if (!actor.resources) (actor as any).resources = {};
    actor.resources.bread = (actor.resources.bread || 0) + yieldAmount;
    localResult.utbytte.push({ resource: 'bread', amount: yieldAmount });
    localResult.message = `Sanket ${yieldAmount} nødproviant (brød/bær)`;

    trackXp('FARMING', Math.ceil(REWARDS.FORAGE.xp * (1 + performance)));
    return true;
};

export const handleHunt = (ctx: ActionContext) => {
    const { actor, action, localResult, trackXp, damageTool } = ctx;

    getActionSlots(actor, 'HUNT').forEach(slot => {
        damageTool(slot, 2);
    });

    const base = 8; // Base meat yield (increased from 5)
    const performance = action.performance || 0.5;
    const yieldAmount = calculateYield(actor, base, 'COMBAT', { performance, actionType: 'HUNT' });

    actor.resources.meat = (actor.resources.meat || 0) + yieldAmount;
    localResult.utbytte.push({ resource: 'meat', amount: yieldAmount });
    localResult.message = `Felte bytte og fikk ${yieldAmount} kjøtt`;

    trackXp('COMBAT', Math.ceil(15 * (1 + performance)));
    return true;
};

export const handleGatherWool = (ctx: ActionContext) => {
    const { actor, action, localResult, trackXp } = ctx;
    const base = 6; // Base wool yield (increased from 3)
    const performance = action.performance || 0.5;
    const yieldAmount = calculateYield(actor, base, 'FARMING', { performance, actionType: 'GATHER_WOOL', requiresTool: true } as any);

    if (yieldAmount === 0) {
        localResult.message = `Du trenger en Saks for å klippe sauene!`;
        return false; // Return false so costs might not be deducted or just to indicate failure
    }

    actor.resources.wool = (actor.resources.wool || 0) + yieldAmount;
    localResult.utbytte.push({ resource: 'wool', amount: yieldAmount });
    localResult.message = `Klippet sauer og fikk ${yieldAmount} ull`;

    trackXp('FARMING', Math.ceil(10 * (1 + performance)));
    return true;
};

export const handleGatherHoney = (ctx: ActionContext) => {
    const { actor, action, localResult, trackXp } = ctx;
    const locationId = (action as any).locationId || 'beehives';

    // Cooldown Check
    if (!actor.activeProcesses) actor.activeProcesses = [];
    const existing = actor.activeProcesses.find(p => p.type === 'HIVE' && p.locationId === locationId);
    if (existing) {
        if (existing.readyAt > Date.now()) {
            localResult.success = false;
            localResult.message = "Biene trenger hvile før de kan lage mer honning.";
            return false;
        }
        // Cleanup finished cooldown
        actor.activeProcesses = actor.activeProcesses.filter(p => p.id !== existing.id);
    }

    const base = 4; // Base honey yield (increased from 2)
    const performance = action.performance || 0.5;
    const yieldAmount = calculateYield(actor, base, 'FARMING', { performance, actionType: 'GATHER_HONEY' });

    actor.resources.honey = (actor.resources.honey || 0) + yieldAmount;
    localResult.utbytte.push({ resource: 'honey', amount: yieldAmount });
    localResult.message = `Hentet ${yieldAmount} honning fra bikubene`;

    trackXp('FARMING', Math.ceil(12 * (1 + performance)));

    // Start Cooldown (5 Minutes)
    actor.activeProcesses.push({
        id: 'hive_' + Date.now(),
        type: 'HIVE',
        itemId: 'honey',
        locationId: locationId,
        startedAt: Date.now(),
        duration: 300000,
        readyAt: Date.now() + 300000,
        notified: false
    });

    return true;
};

export const handleFeedChickens = (ctx: ActionContext) => {
    const { actor, localResult } = ctx;
    const GRAIN_COST = 5;

    if ((actor.resources.grain || 0) < GRAIN_COST) {
        localResult.success = false;
        localResult.message = `Mangler korn. Trenger ${GRAIN_COST} korn for å mate hønene.`;
        return false;
    }

    // Initialize activeProcesses if missing
    if (!actor.activeProcesses) actor.activeProcesses = [];

    // Check if already feeding
    const existing = actor.activeProcesses.find(p => p.type === 'COOP' && p.locationId === 'chicken_coop' && p.readyAt > Date.now());
    if (existing) {
        localResult.success = false;
        localResult.message = "Hønene har allerede mat.";
        return false;
    }

    actor.resources.grain -= GRAIN_COST;
    localResult.utbytte.push({ resource: 'grain', amount: -GRAIN_COST });

    const DURATION = 240000; // 4 Minutes

    // Create new process
    const newProcess: ActiveProcess = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'COOP',
        itemId: 'egg',
        locationId: 'chicken_coop',
        startedAt: Date.now(),
        duration: DURATION,
        readyAt: Date.now() + DURATION,
        notified: false
    };

    actor.activeProcesses.push(newProcess);
    localResult.message = `Matet hønene. Egg klare om 4 minutter.`;

    return true;
};

export const handleCollectEggs = (ctx: ActionContext) => {
    const { actor, localResult, trackXp } = ctx;

    const now = Date.now();
    const readyIndex = actor.activeProcesses?.findIndex(p => p.type === 'COOP' && p.locationId === 'chicken_coop' && p.readyAt <= now);

    if (readyIndex === undefined || readyIndex === -1) {
        localResult.success = false;
        localResult.message = "Ingen egg å hente ennå.";
        return false;
    }

    // const process = actor.activeProcesses![readyIndex];
    actor.activeProcesses!.splice(readyIndex, 1);

    const yieldAmount = Math.floor(Math.random() * 3) + 3; // 3-5 eggs

    if (!actor.resources.egg) (actor.resources as any).egg = 0;
    (actor.resources as any).egg += yieldAmount;

    localResult.utbytte.push({ resource: 'egg', amount: yieldAmount });
    localResult.message = `Samlet ${yieldAmount} egg.`;

    trackXp('FARMING', 15);

    return true;
};
