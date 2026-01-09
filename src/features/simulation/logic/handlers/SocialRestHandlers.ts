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

    // TAVERN / INN LOGIC
    if (locationId === 'village' || locationId === 'tavern_bar') {

        // Check for specific rest types from the UI
        if (['REST_BASIC', 'REST_COMFY', 'REST_ROYAL'].includes(actionType)) {

            // --- DYNAMIC PRICING LOGIC ---
            if (!ctx.room.metadata) ctx.room.metadata = {};
            const metadata = ctx.room.metadata;

            // 1. Calculate Decay
            const now = Date.now();
            const lastRest = metadata.lastTavernRest || now;
            // To make it feel responsive in short sessions, let's say it decays 10% every 5 minutes (in game scale)
            // Let's us ms directly: 5 mins = 300,000 ms
            const intervalsPassed = (now - lastRest) / 300000;

            let currentDemand = metadata.tavernDemand || 1.0;
            if (intervalsPassed > 0) {
                // Decay: Reduce demand by 0.05 per interval, min 1.0
                currentDemand = Math.max(1.0, currentDemand - (intervalsPassed * 0.05));
            }

            // 2. Define Tiers
            let baseCost = 150;
            let baseStam = 30;
            let hpGain = 0;
            let tierBuff: any = null;
            let label = "Hvilte i salen";

            if (actionType === 'REST_BASIC') {
                baseCost = 150;
                baseStam = 30;
                label = "Hvilte i salen";
            } else if (actionType === 'REST_COMFY') {
                baseCost = 500;
                baseStam = 80;
                hpGain = 10;
                label = "Hvilte i komfortabelt rom";
                tierBuff = {
                    id: 'rest_comfy_' + now,
                    type: 'STAMINA_SAVE',
                    value: 0.2,
                    label: 'Utvilt',
                    description: '20% redusert stamina-forbruk i 10 min.',
                    expiresAt: now + 600000
                };
            } else if (actionType === 'REST_ROYAL') {
                baseCost = 1500;
                baseStam = 100;
                hpGain = 50;
                label = "Hvilte i Kongesuite";
                tierBuff = {
                    id: 'rest_royal_' + now,
                    type: 'STAMINA_SAVE',
                    value: 0.5,
                    label: 'Luksusliv',
                    description: '50% redusert stamina, +1 HP/sek regenerering i 20 min.',
                    expiresAt: now + 1200000,
                    passiveEffect: 'HP_REGEN' // Custom handler needed elsewhere for this, but consistent with metadata 
                };
            }

            // 3. Final Price Calculation
            const finalPrice = Math.ceil(baseCost * currentDemand);

            // 4. Transaction
            if ((actor.resources.gold || 0) < finalPrice) {
                localResult.success = false;
                localResult.message = `Vertshuset krever ${finalPrice}g (Etterspørsel: ${Math.round(currentDemand * 100)}%). Du har ikke råd.`;
                return false;
            }

            actor.resources.gold -= finalPrice;
            localResult.utbytte.push({ resource: 'gold', amount: -finalPrice });

            // 5. Apply Effects
            stam = baseStam;
            hp = hpGain;
            msg = `${label} (-${finalPrice}g). Føler deg bedre!`;

            if (tierBuff) {
                if (!actor.activeBuffs) actor.activeBuffs = [];
                // Remove existing stamina buffs to prevent stacking weirdness
                actor.activeBuffs = actor.activeBuffs.filter(b => b.type !== 'STAMINA_SAVE');
                actor.activeBuffs.push(tierBuff);
                msg += ` (Buff: ${tierBuff.label})`;
            }

            // 6. Update Demand
            // Increase demand by 10% per use
            metadata.tavernDemand = currentDemand + 0.1;
            metadata.lastTavernRest = now;

            return true;
        }

        // Legacy / Fallback for generic 'REST' action if still used at tavern
        /*
        const tavernLevel = ctx.room.world?.settlement?.buildings?.['tavern']?.level || 1;
        if (tavernLevel >= 2) {
             // ... old logic ... kept commented out or removed as we replaced it above
        }
        */
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

export const handleResourceGamble = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { resource, amount, multiplier, isWin } = action;

    const resourceKey = resource as keyof typeof actor.resources;
    const currentVal = (actor.resources as any)[resourceKey] || 0;

    if (currentVal < amount) {
        localResult.success = false;
        localResult.message = `Du har ikke nok ${resource}!`;
        return false;
    }

    // Deduct initial bet
    (actor.resources as any)[resourceKey] = Math.max(0, currentVal - amount);

    if (isWin) {
        // Remove Math.floor to allow decimals (e.g. 1.5x on bet of 1 = 1.5 return, 0.5 gain)
        const gain = amount * multiplier;
        (actor.resources as any)[resourceKey] += gain;

        // Calculate net gain for the toast/log
        const netGain = gain - amount;
        localResult.utbytte.push({ resource: resourceKey, amount: netGain });
        localResult.message = `Soga-hjulet vider seg til din fordel! Vant ${gain} ${resource}.`;

        if (multiplier >= 2.5) {
            actor.status.morale = Math.min(100, (actor.status.morale || 50) + 5);
        }
    } else {
        localResult.message = `Skjebnen var hard. Du mistet ${amount} ${resource} til soga-hjulet.`;
        localResult.utbytte.push({ resource: resourceKey, amount: -amount });
    }

    return true;
};

export const handleBuyMeal = (ctx: ActionContext) => {
    const { actor, room, localResult } = ctx;

    // Get Market Price for Bread
    const marketKey = actor.regionId || 'capital';
    const market = room.markets?.[marketKey] || room.market;
    let breadPrice = 5; // Default fallback

    if (market && (market as any)['bread']) {
        breadPrice = (market as any)['bread'].price;
    }

    // Cost = Market Price + 20% Markup (Service Charge)
    const cost = Math.ceil(breadPrice * 1.2);

    if ((actor.resources.gold || 0) >= cost) {
        actor.resources.gold -= cost;
        const staminaGain = 10;
        actor.status.stamina = Math.min(100, (actor.status.stamina || 0) + staminaGain);
        localResult.utbytte.push({ resource: 'stamina', amount: staminaGain });
        localResult.utbytte.push({ resource: 'gold', amount: -cost });
        localResult.message = `Kjøpte et måltid i baren for ${cost}g. (+10 Stamina)`;
    } else {
        localResult.success = false;
        localResult.message = `Har ikke råd til mat (koster ${cost}g).`;
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

    // --- INVENTORY / RESOURCE CONSUMPTION ---
    const isRes = !!isResource;
    const invArray = (Array.isArray(actor.inventory) ? actor.inventory : Object.values(actor.inventory || {})) as EquipmentItem[];

    // 1. Verify existence and consume
    if (isRes) {
        if (!(actor.resources as any)[itemId] || (actor.resources as any)[itemId] < 1) {
            localResult.success = false;
            localResult.message = "Du har ikke mer igjen.";
            return false;
        }
        (actor.resources as any)[itemId]--;
        localResult.utbytte.push({ resource: itemId, amount: -1 });
    } else {
        const idx = invArray.findIndex(i => i.id === itemId);
        if (idx === -1) {
            localResult.success = false;
            localResult.message = "Fant ikke gjenstanden.";
            return false;
        }
        actor.inventory = invArray.filter((_, i) => i !== idx);
    }

    // 2. Apply Effects
    if (!actor.activeBuffs) actor.activeBuffs = [];
    const now = Date.now();

    switch (itemId) {
        case 'bread':
            actor.status.stamina = Math.min(100, (actor.status.stamina || 0) + 20);
            localResult.message = "Spiste Brød. (+20 Stamina)";
            localResult.utbytte.push({ resource: 'stamina', amount: 20 });
            break;

        case 'omelette':
            actor.activeBuffs = actor.activeBuffs.filter(b => b.type !== 'STAMINA_SAVE');
            actor.activeBuffs.push({
                id: 'buff_omelette_' + now,
                type: 'STAMINA_SAVE',
                value: 0.2,
                label: 'Lett til beins',
                description: 'Reduserer stamina-kostnad med 20%.',
                expiresAt: now + 900000,
                sourceItem: 'omelette'
            });
            localResult.message = "Spiste Omelett. (20% stamina-spare buff)";
            break;

        case 'minor_stamina_potion':
            actor.status.stamina = Math.min(100, (actor.status.stamina || 0) + 30);
            localResult.message = "Drakk Liten Stamina-brygg. (+30 Stamina)";
            localResult.utbytte.push({ resource: 'stamina', amount: 30 });
            break;

        case 'herbal_balm':
            actor.activeBuffs = actor.activeBuffs.filter(b => b.type !== 'SPEED_BONUS');
            actor.activeBuffs.push({
                id: 'buff_balm_' + now,
                type: 'SPEED_BONUS',
                value: 0.15,
                label: 'Lett på foten',
                description: 'Øker sankehastighet med 15%.',
                expiresAt: now + 600000,
                sourceItem: 'herbal_balm'
            });
            localResult.message = "Brukte Urtebalsam. (+15% Arbeidshastighet)";
            break;

        case 'focus_brew':
            actor.activeBuffs = actor.activeBuffs.filter(b => b.type !== 'STAMINA_SAVE');
            actor.activeBuffs.push({
                id: 'buff_focus_' + now,
                type: 'STAMINA_SAVE',
                value: 0.2,
                label: 'Skjerpet Fokus',
                description: 'Reduserer stamina-kostnad med 20% i 15 min.',
                expiresAt: now + 900000,
                sourceItem: 'focus_brew'
            });
            localResult.message = "Drakk Fokus-brygg. (Bedre fokus!)";
            break;

        case 'strength_tincture':
            actor.activeBuffs = actor.activeBuffs.filter(b => b.type !== 'STRENGTH_BONUS');
            actor.activeBuffs.push({
                id: 'buff_strength_' + now,
                type: 'STRENGTH_BONUS',
                value: 10,
                label: 'Kjempestyrke',
                description: 'Øker angrepskraft med 10.',
                expiresAt: now + 600000,
                sourceItem: 'strength_tincture'
            });
            localResult.message = "Drakk Styrke-tinktur. (+10 Angrep)";
            break;

        case 'masters_draught':
            actor.activeBuffs = actor.activeBuffs.filter(b => b.type !== 'YIELD_BONUS');
            actor.activeBuffs.push({
                id: 'buff_master_' + now,
                type: 'YIELD_BONUS',
                value: 0.5,
                label: 'Mesterhånd',
                description: 'Øker utbytte fra alle sankeoppgaver med 50%.',
                expiresAt: now + 1200000,
                sourceItem: 'masters_draught'
            });
            localResult.message = "Drakk Mester-drikk. (Føler deg som en mester!)";
            break;

        case 'elixir_of_life':
            actor.status.stamina = 100;
            actor.status.hp = Math.min(100, (actor.status.hp || 100) + 50);
            localResult.message = "Drakk Livseliksir. Full Stamina og +50 HP!";
            localResult.utbytte.push({ resource: 'stamina', amount: 100 });
            break;

        default:
            localResult.success = false;
            localResult.message = `Kan ikke bruke ${itemId}.`;
            return false;
    }

    logSystemicStat(room.pin, 'consumed', itemId, 1);
    return true;
};
export const handleMountHorse = (ctx: ActionContext) => {
    const { actor, action, localResult, trackXp } = ctx;
    const performance = action.performance || 0.5;
    const method = action.method || 'ride_easy';
    const level = action.level || 1;

    let trackMult = 1.0;
    let diffLabel = 'lav';

    if (method === 'ride_medium') {
        trackMult = 1.6;
        diffLabel = 'middels';
    } else if (method === 'ride_hard') {
        trackMult = 2.5;
        diffLabel = 'høy';
    }

    const levelMult = 1 + (level - 1) * 0.5;
    const grainCost = Math.ceil(10 * trackMult * levelMult);

    // Initial deduction (if not a minigame result)
    if (performance === 0.5 && !action.isComplete) {
        if ((actor.resources.grain || 0) < grainCost) {
            localResult.message = `Du har ikke nok korn! Trenger ${grainCost} korn.`;
            return false;
        }
        actor.resources.grain = (actor.resources.grain || 0) - grainCost;
    }

    const diffMult = trackMult * (1 + (level - 1) * 0.2); // XP scaling

    // Small HP/Stamina bonus for a refreshing ride
    actor.status.stamina = Math.min(100, (actor.status.stamina || 0) + 5);

    const xpAmount = Math.ceil(20 * (1 + performance) * diffMult);
    trackXp('STEWARDSHIP', xpAmount);

    // Progression Unlock Logic
    if (performance >= 0.8) {
        if (!actor.minigameProgress) actor.minigameProgress = {};
        const currentMax = actor.minigameProgress[method] || 1;
        if (level === currentMax && currentMax < 5) {
            actor.minigameProgress[method] = currentMax + 1;
            localResult.message = `Glimrende ridning! Du har låst opp nivå ${currentMax + 1} for ${method === 'ride_easy' ? 'Engelskogen' : method === 'ride_medium' ? 'Fjellpasset' : 'Ulvestien'}! (Brukt ${grainCost} korn)`;
        } else {
            localResult.message = `Du red en tur i ${diffLabel} vanskelighetsgrad (Lvl ${level}). Føler deg forfrisket! (Brukt ${grainCost} korn)`;
        }
    } else {
        localResult.message = `Du red en tur i ${diffLabel} vanskelighetsgrad (Lvl ${level}). (Ytelse: ${Math.round(performance * 100)}%, Brukt ${grainCost} korn)`;
    }

    return true;
};

export const handleBuyHorseCosmetic = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { cosmeticId, cosmeticType, price } = action;

    if (!actor.horseCustomization) {
        actor.horseCustomization = {
            skinId: 'brown',
            maneColor: '#1e1b4b',
            unlockedSkins: ['brown'],
            unlockedManeColors: ['#1e1b4b'],
            unlockedHats: []
        };
    }

    if ((actor.resources.gold || 0) < price) {
        localResult.message = `Du har ikke nok gull! Trenger ${price}g.`;
        return false;
    }

    actor.resources.gold = (actor.resources.gold || 0) - price;

    if (cosmeticType === 'skin') {
        if (!actor.horseCustomization.unlockedSkins) actor.horseCustomization.unlockedSkins = ['brown'];
        if (!actor.horseCustomization.unlockedSkins.includes(cosmeticId)) {
            actor.horseCustomization.unlockedSkins.push(cosmeticId);
        }
    } else if (cosmeticType === 'mane') {
        if (!actor.horseCustomization.unlockedManeColors) actor.horseCustomization.unlockedManeColors = ['#1e1b4b'];
        if (!actor.horseCustomization.unlockedManeColors.includes(cosmeticId)) {
            actor.horseCustomization.unlockedManeColors.push(cosmeticId);
        }
    } else if (cosmeticType === 'hat') {
        if (!actor.horseCustomization.unlockedHats) actor.horseCustomization.unlockedHats = [];
        if (!actor.horseCustomization.unlockedHats.includes(cosmeticId)) {
            actor.horseCustomization.unlockedHats.push(cosmeticId);
        }
    }

    localResult.message = `Du kjøpte en ny ting til hesten din for ${price}g!`;
    return true;
};

export const handleSelectHorseCosmetic = (ctx: ActionContext) => {
    const { actor, action } = ctx;
    const { cosmeticId, cosmeticType } = action;

    if (!actor.horseCustomization) {
        actor.horseCustomization = {
            skinId: 'brown',
            maneColor: '#1e1b4b',
            unlockedSkins: ['brown'],
            unlockedManeColors: ['#1e1b4b'],
            unlockedHats: []
        };
    }

    if (cosmeticType === 'skin') {
        actor.horseCustomization.skinId = cosmeticId;
    } else if (cosmeticType === 'mane') {
        actor.horseCustomization.maneColor = cosmeticId;
    } else if (cosmeticType === 'hat') {
        actor.horseCustomization.hatId = cosmeticId;
    }

    return true;
};
