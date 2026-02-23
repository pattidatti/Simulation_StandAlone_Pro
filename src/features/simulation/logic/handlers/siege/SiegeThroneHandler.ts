import type { ActionContext } from '../../actionTypes';

// --- CONSTANTS ---
const TICK_DEBOUNCE_MS = 900;   // Risiko R1: prevent double-tick
const BASE_DRAIN_RATE = 5;      // armor per second
const PROGRESS_RATE = 2;        // % per second
const VICTORY_THRESHOLD = 100;
const CLAIM_ARMOR_MINIMUM = 10;
const PLUNDER_GOLD = 500;

export const handleThroneAction = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;
    const siege = room.regions[regionId]?.activeSiege;

    if (!siege || siege.phase !== 'THRONE_ROOM' || !siege.throneState) return false;
    const throne = siege.throneState;

    // --- TICK (Called periodically by clients) ---
    if (action.subType === 'TICK') {
        const now = Date.now();

        // Risiko R1: Debounce — prevent multiple clients from double-processing ticks
        if (now - throne.lastTick < TICK_DEBOUNCE_MS) return true; // Silent ignore
        const delta = (now - throne.lastTick) / 1000;
        throne.lastTick = now;

        const toRemove: string[] = [];

        const occupiers = (throne.occupiers || {}) as any;
        Object.values(occupiers).forEach((occ: any) => {
            // Legitimacy-based drain: higher legitimacy = slower drain (up to 50% reduction)
            const legitModifier = (occ.legitimacySnapshot || 0) / 100;
            const drainRate = BASE_DRAIN_RATE * (1 - (legitModifier * 0.5));

            occ.armor -= (drainRate * delta);
            occ.progress += (PROGRESS_RATE * delta);

            // Ejection — armor depleted
            if (occ.armor <= 0) {
                toRemove.push(occ.id);
            }

            // Victory — first to 100%
            if (occ.progress >= VICTORY_THRESHOLD) {
                // Set siegeWinnerId — SiegeActions.ts transaction wrapper handles:
                // - Winner → BARON/KING role
                // - Old ruler → PEASANT + exile
                // - Public profiles update
                // - Succession election trigger
                (localResult as any).siegeWinnerId = occ.id;
                (localResult as any).targetRegionId = regionId;

                // --- REWARD DISTRIBUTION ---
                const REWARD_POOL = 2000;
                const allParticipants = { ...siege.attackers || {}, ...siege.defenders || {} };
                const totalDmg = Object.values(allParticipants)
                    .reduce((sum: number, p: any) => sum + (p.stats?.damageDealt || 0), 0);

                if (totalDmg > 0) {
                    const participants = allParticipants || {};
                    Object.entries(participants).forEach(([id, p]: [string, any]) => {
                        const share = (p.stats?.damageDealt || 0) / totalDmg;
                        const goldReward = Math.floor(share * REWARD_POOL);
                        if (goldReward > 0) {
                            const participant = room.players?.[id];
                            if (participant) {
                                participant.resources.gold = (participant.resources.gold || 0) + goldReward;
                            }
                        }
                    });
                }

                delete room.regions[regionId].activeSiege;
                localResult.message = `👑 ${occ.name} HAR TATT TRONEN! Rollebyttet er fullført. Belønning fordelt!`;
            }
        });

        // Process ejections
        toRemove.forEach(id => {
            if (throne.occupiers) delete throne.occupiers[id];
        });

        return true;
    }

    // --- CLAIM_THRONE ---
    if (action.subType === 'CLAIM_THRONE') {
        const armor = actor.resources.siege_armor || 0;
        if (armor < CLAIM_ARMOR_MINIMUM) {
            localResult.success = false;
            localResult.message = `Du trenger minst ${CLAIM_ARMOR_MINIMUM} rustning for å entre tronen. (Har: ${armor})`;
            return false;
        }

        // Already on throne?
        if (throne.occupiers[actor.id]) {
            localResult.message = "Du sitter allerede på tronen!";
            return false;
        }

        // Spend all armor to enter
        const armorSpent = armor;
        actor.resources.siege_armor = 0;

        throne.occupiers[actor.id] = {
            id: actor.id,
            name: actor.name,
            armor: armorSpent,
            progress: 0,
            joinedAt: Date.now(),
            legitimacySnapshot: actor.status?.legitimacy || 0
        };

        localResult.utbytte.push({ resource: 'siege_armor', amount: -armorSpent });
        localResult.message = `👑 Kastet seg på tronen med ${armorSpent} rustning!`;
        return true;
    }

    // --- PLUNDER ---
    if (action.subType === 'PLUNDER') {
        if (throne.plundered) {
            localResult.message = "Tronsalen er allerede plyndret!";
            return false;
        }

        const isAttacker = !!siege.attackers[actor.id];
        if (!isAttacker) {
            localResult.success = false;
            localResult.message = "Bare angripere kan plyndre tronsalen!";
            return false;
        }

        actor.resources.gold = (actor.resources.gold || 0) + PLUNDER_GOLD;
        throne.plundered = true;

        localResult.utbytte.push({ resource: 'gold', amount: PLUNDER_GOLD });
        localResult.message = `💰 PLYNDRET tronsalen! +${PLUNDER_GOLD} Gull.`;
        return true;
    }

    // --- DONATE_ARMOR (Give armor to an occupier on the throne) ---
    if (action.subType === 'DONATE_ARMOR') {
        const targetId = action.payload?.targetId;
        if (!targetId || !throne.occupiers[targetId]) {
            localResult.message = "Ugyldig mål for donasjon.";
            return false;
        }

        const donateAmount = action.payload?.amount || 1;
        if ((actor.resources.siege_armor || 0) < donateAmount) {
            localResult.success = false;
            localResult.message = `Ikke nok rustning! (Har: ${actor.resources.siege_armor || 0})`;
            return false;
        }

        actor.resources.siege_armor -= donateAmount;
        throne.occupiers[targetId].armor += donateAmount;

        // Track stats
        const participant = siege.attackers[actor.id] || siege.defenders[actor.id];
        if (participant?.stats) {
            participant.stats.armorDonated = (participant.stats.armorDonated || 0) + donateAmount;
        }

        localResult.utbytte.push({ resource: 'siege_armor', amount: -donateAmount });
        localResult.message = `♥ Donerte ${donateAmount} rustning til ${throne.occupiers[targetId].name}!`;
        return true;
    }

    // --- SUNDER_ARMOR (Attack an occupier on the throne) ---
    if (action.subType === 'SUNDER_ARMOR') {
        const targetId = action.payload?.targetId;
        if (!targetId || !throne.occupiers[targetId]) {
            localResult.message = "Ingen å angripe!";
            return false;
        }

        // Can't sunder yourself
        if (targetId === actor.id) {
            localResult.message = "Du kan ikke angripe deg selv!";
            return false;
        }

        // Costs 1 sword
        if ((actor.resources.siege_sword || 0) < 1) {
            localResult.success = false;
            localResult.message = "Du trenger et beleiringssverd for å angripe!";
            return false;
        }

        actor.resources.siege_sword -= 1;
        const target = throne.occupiers[targetId];
        const damage = 3; // Remove 3 armor per attack
        target.armor = Math.max(0, target.armor - damage);

        // Track stats
        const participant = siege.attackers[actor.id] || siege.defenders[actor.id];
        if (participant?.stats) {
            participant.stats.damageDealt = (participant.stats.damageDealt || 0) + damage;
        }

        localResult.utbytte.push({ resource: 'siege_sword', amount: -1 });
        localResult.message = `⚔️ Angrep ${target.name}! (-${damage} rustning). Gjenstående: ${target.armor.toFixed(1)}`;

        // Check if ejected
        if (target.armor <= 0) {
            if (throne.occupiers) delete throne.occupiers[targetId];
            localResult.message += ` 💀 ${target.name} ble kastet av tronen!`;
        }

        return true;
    }

    return false;
};
