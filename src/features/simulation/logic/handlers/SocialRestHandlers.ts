import type { ActionContext } from '../actionTypes';
import { getDayPart } from '../../utils/timeUtils';
import { setCooldown } from '../../utils/actionUtils';
import { logSystemicStat } from '../../utils/statsUtils'; // Stats logging

export const handleSleep = (ctx: ActionContext) => {
    const { actor, room, localResult } = ctx;

    // NIGHT RESTRICTION
    const isNight = getDayPart(room.world?.gameTick || 0) === 'NIGHT';
    if (!isNight) {
        localResult.success = false;
        localResult.message = "💤 Du kan bare sove når det er natt.";
        return false;
    }

    // RESTORE FULL STAMINA
    const preStamina = actor.status.stamina || 0;
    const staminaGain = 100 - preStamina;
    actor.status.stamina = 100;
    actor.status.hp = Math.min(100, (actor.status.hp || 100) + 20);

    // ADD WELL RESTED BUFF
    if (!actor.activeBuffs) actor.activeBuffs = [];
    // Remove existing if any
    actor.activeBuffs = actor.activeBuffs.filter(b => b.type !== 'STAMINA_SAVE' || b.label !== 'Godt utvilt');

    // FARM HOUSE UPGRADE: Higher level = better buff
    const farmLevel = actor.buildings?.['farm_house']?.level || 1;
    let buffValue = 0.5; // Base 50%
    let buffDuration = 300000; // 5 mins

    if (farmLevel >= 3) buffValue = 0.6; // Level 3: 60%
    if (farmLevel >= 4) {
        buffValue = 0.7; // Level 4: 70%
        buffDuration = 600000; // 10 mins
    }

    actor.activeBuffs.push({
        id: 'well_rested_' + Date.now(),
        type: 'STAMINA_SAVE',
        value: buffValue,
        label: 'Godt utvilt',
        description: `${Math.round(buffValue * 100)}% mindre stamina-forbruk etter en god natts søvn (Gård Nivå ${farmLevel}).`,
        expiresAt: Date.now() + buffDuration,
    });

    localResult.message = "Du sov tungt gjennom natten. Våknet opp uthvilt og full av energi!";
    localResult.utbytte.push({ resource: 'stamina', amount: staminaGain });
    return true;
};

export const handleRest = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const actionType = typeof action === 'string' ? action : action.type;
    const locationId = (action as any).locationId;

    let stam = 30;
    let hp = 0;
    let msg = "Hvilte.";

    if (actionType === 'EAT') {
        stam = 40; // Matched WorldMapData label
        msg = "Satt ved varmen og spiste.";
    }
    if (actionType === 'FEAST') { stam = 100; hp = 20; msg = "Holdt gjestebud!"; }

    // WELL COOLDOWN LOGIC
    const isWellAction = actionType === 'GATHER_WATER' || locationId === 'farm_well' || locationId === 'well_water';
    if (isWellAction) {
        if (!actor.activeProcesses) actor.activeProcesses = [];
        // Map GATHER_WATER at well_water to a consistent location ID for cooldown
        const effectiveLocationId = locationId || (actionType === 'GATHER_WATER' ? 'well_water' : null);

        if (effectiveLocationId) {
            const existing = actor.activeProcesses.find(p => p.type === 'WELL' && p.locationId === effectiveLocationId);

            if (existing) {
                if (existing.readyAt > Date.now()) {
                    localResult.success = false;
                    localResult.message = "Brønnen er tom. Den fyller seg med vann...";
                    return false;
                } else {
                    // Cleanup finished cooldown
                    actor.activeProcesses = actor.activeProcesses.filter(p => p.id !== existing.id);
                }
            }

            stam = 5; // Matched WorldMapData label
            msg = "Drakk friskt vann fra brønnen.";

            // Start Cooldown (5 Minutes)
            actor.activeProcesses.push({
                id: 'well_' + Date.now(),
                type: 'WELL',
                itemId: 'water',
                locationId: effectiveLocationId,
                startedAt: Date.now(),
                duration: 300000,
                readyAt: Date.now() + 300000,
                notified: false
            });
        }
    }


    if (locationId === 'village_square') {
        stam = 10; // Matched label
        msg = "Hvilte på torget.";
        setCooldown(actor, 'REST_SQUARE', 6 * 60 * 1000); // 6 min cooldown
    }

    // TAVERN UPGRADE: Dobbel stamina regen at level 2 + 100g cost
    if (locationId === 'village' && actionType === 'REST') {
        const tavernLevel = ctx.room.world?.settlement?.buildings?.['tavern']?.level || 1;
        if (tavernLevel >= 2) {
            const TAVERN_COST = 100;
            if ((actor.resources.gold || 0) < TAVERN_COST) {
                localResult.success = false;
                localResult.message = `Vertshuset krever ${TAVERN_COST}g for et komfortabelt rom. Du har ikke råd.`;
                return false;
            }

            actor.resources.gold -= TAVERN_COST;
            localResult.utbytte.push({ resource: 'gold', amount: -TAVERN_COST });

            stam *= 2;
            msg = `Hvilte i det komfortable vertshuset (-${TAVERN_COST}g). Du føler deg raskt bedre!`;

            if (tavernLevel >= 3) {
                stam = 100;
                msg = `Hvilte i konge-suiten på vertshuset (-${TAVERN_COST}g). All energi gjenopprettet!`;
            }
        }
    }

    if (actor.upgrades?.includes('roof')) stam += 20;

    if (locationId === 'royal_chambers') {
        stam = 100;
        hp = 100;
        msg = "Hvilte ut i de kongelige kamrene. Føler deg som en konge igjen!";

        // Add Royal Wellness Buff
        if (!actor.activeBuffs) actor.activeBuffs = [];
        actor.activeBuffs = actor.activeBuffs.filter(b => b.label !== 'Kongelig Velvære');
        actor.activeBuffs.push({
            id: 'royal_wellness_' + Date.now(),
            type: 'STAMINA_SAVE',
            value: 0.6, // 60% saving (slightly better than peasant bed)
            label: 'Kongelig Velvære',
            description: 'Fyrstelig velvære reduserer stamina-forbruk med 60%.',
            expiresAt: Date.now() + 600000, // 10 minutes (longer than bed)
        });
    }

    actor.status.stamina = Math.min(100, (actor.status.stamina || 0) + stam);
    if (hp > 0) actor.status.hp = Math.min(100, (actor.status.hp || 100) + hp);

    localResult.utbytte.push({ resource: 'stamina', amount: stam });
    localResult.message = msg;
    return true;
};

export const handlePray = (ctx: ActionContext) => {
    const { actor, localResult, trackXp } = ctx;
    const favor = Math.floor(Math.random() * 5) + 1;
    actor.resources.favor = (actor.resources.favor || 0) + favor;
    localResult.utbytte.push({ resource: 'favor', amount: favor });
    trackXp('THEOLOGY', 10);
    localResult.message = `Ba til gudene. (+${favor} velvilje)`;
    return true;
};

export const handleChat = (ctx: ActionContext) => {
    const { localResult } = ctx;
    const gossip = [
        "Baronen ser nervøs ut i dag.",
        "Hørte du ulvene i natt?",
        "Prisen på korn går opp.",
        "Kongens soldater er på vei."
    ];
    localResult.message = `Sladder: "${gossip[Math.floor(Math.random() * gossip.length)]}"`;
    return true;
};

export const handleGamble = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { amount, isWin, playerRoll, houseRoll } = action;
    if (isWin) {
        actor.resources.gold = (actor.resources.gold || 0) + amount;
        localResult.utbytte.push({ resource: 'gold', amount });
        localResult.message = `Vant ${amount}g på terninger! (${playerRoll} mot ${houseRoll})`;
    } else {
        actor.resources.gold = Math.max(0, (actor.resources.gold || 0) - amount);
        localResult.message = `Tapte ${amount}g på terninger. (${playerRoll} mot ${houseRoll})`;
    }
    return true;
};

export const handleBuyMeal = (ctx: ActionContext) => {
    const { actor, localResult } = ctx;
    const cost = 5;
    if ((actor.resources.gold || 0) >= cost) {
        actor.resources.gold -= cost;
        const staminaGain = 10;
        actor.status.stamina = Math.min(100, (actor.status.stamina || 0) + staminaGain);
        localResult.utbytte.push({ resource: 'stamina', amount: staminaGain });
        localResult.message = "Kjøpte et måltid i baren. (+10 Stamina)";
    } else {
        localResult.success = false;
        localResult.message = "Har ikke råd til mat (koster 5g).";
        return false;
    }
    return true;
};

export const handleRetire = (ctx: ActionContext) => {
    const { actor, room, localResult } = ctx;
    // Mark for removal in the global record logic after transaction
    localResult.message = `${actor.name} har valgt å trekke seg tilbake fra dette livet.`;
    delete room.players[actor.id];
    return true;
};

export const handleTradeRoute = (ctx: ActionContext) => {
    const { action, localResult, trackXp } = ctx;
    const { resource, action: direction } = action;
    localResult.message = `Handelsrute ${direction} ${resource} utført.`;
    trackXp('TRADING', 20);
    return true;
};

export const handleConsume = (ctx: ActionContext) => {
    const { actor, action, localResult, room } = ctx;
    const itemId = action.itemId;
    const isResource = action.isResource; // Flag passed from UI

    // --- RESOURCE CONSUMPTION (Stacks) ---
    if (isResource) {
        const currentAmount = (actor.resources as any)[itemId] || 0;
        if (currentAmount < 1) {
            localResult.success = false;
            localResult.message = "Du har ikke mer igjen.";
            return false;
        }

        // Logic for specific resources
        if (itemId === 'omelette') {
            if (!actor.activeBuffs) actor.activeBuffs = [];
            actor.activeBuffs = actor.activeBuffs.filter(b => b.type !== 'STAMINA_SAVE');
            actor.activeBuffs.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'STAMINA_SAVE',
                value: 0.2, // 20%
                label: 'Lett til beins',
                description: 'Reduserer stamina-kostnad med 20%.',
                expiresAt: Date.now() + 900000, // 15 mins
                sourceItem: 'omelette'
            });
            (actor.resources as any)['omelette']--;
            localResult.message = "Spiste Omelett. (20% stamina-spare buff)";
            localResult.utbytte.push({ resource: 'omelette', amount: -1 });
            logSystemicStat(room.pin, 'consumed', 'omelette', 1);
            return true;
        }

        if (itemId === 'bread') {
            const staminaGain = 20;
            actor.status.stamina = Math.min(100, (actor.status.stamina || 0) + staminaGain);
            (actor.resources as any)['bread']--;
            localResult.message = `Spiste Brød. (+${staminaGain} Stamina)`;
            localResult.utbytte.push({ resource: 'stamina', amount: staminaGain });
            localResult.utbytte.push({ resource: 'bread', amount: -1 });
            logSystemicStat(room.pin, 'consumed', 'bread', 1);
            return true;
        }

        localResult.success = false;
        localResult.message = "Kan ikke spises (ukjent ressurs).";
        return false;
    }

    // --- INVENTORY ITEM CONSUMPTION (Unique items) ---
    if (!actor.inventory) {
        localResult.success = false;
        localResult.message = "Ryggsekk er tom.";
        return false;
    }

    const itemIndex = actor.inventory.findIndex(i => i.id === itemId);

    if (itemIndex === -1) {
        localResult.success = false;
        localResult.message = "Fant ikke gjenstanden.";
        return false;
    }

    const item = actor.inventory[itemIndex];

    // MVP Logic: Hardcode effect for Omelette (Legacy Item support)
    // Check if ID is 'omelette' or starts with 'omelette_' (for unique instances)
    if (item.id === 'omelette' || item.id.startsWith('omelette_')) {
        if (!actor.activeBuffs) actor.activeBuffs = [];

        // Remove existing buff of same type if exists (refresh)
        actor.activeBuffs = actor.activeBuffs.filter(b => b.type !== 'STAMINA_SAVE');

        actor.activeBuffs.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'STAMINA_SAVE',
            value: 0.2, // 20%
            label: 'Lett til beins',
            description: 'Reduserer stamina-kostnad med 20%.',
            expiresAt: Date.now() + 900000, // 15 mins
            sourceItem: 'omelette'
        });

        // Remove item
        actor.inventory.splice(itemIndex, 1);

        localResult.message = "Spiste Omelett (Gjenstand).";
        localResult.utbytte.push({ resource: 'omelette', amount: -1 }); // Tracking
        logSystemicStat(room.pin, 'consumed', 'omelette', 1);
        return true;
    }

    // Bread: Instant Stamina (Legacy Item support)
    if (item.id === 'bread' || item.id.startsWith('bread_')) {
        const staminaGain = 20;
        actor.status.stamina = Math.min(100, (actor.status.stamina || 0) + staminaGain);

        // Remove item
        actor.inventory.splice(itemIndex, 1);

        localResult.message = `Spiste Brød (Gjenstand). (+${staminaGain} Stamina)`;
        localResult.utbytte.push({ resource: 'stamina', amount: staminaGain });
        localResult.utbytte.push({ resource: 'stamina', amount: staminaGain });
        localResult.utbytte.push({ resource: 'bread', amount: -1 });
        logSystemicStat(room.pin, 'consumed', 'bread', 1);
        return true;
    }

    localResult.success = false;
    localResult.message = "Kan ikke spises.";
    return false;
};
