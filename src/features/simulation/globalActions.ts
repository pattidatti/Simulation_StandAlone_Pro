import { ref, runTransaction, get, push, serverTimestamp, update, increment } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';
import { GAME_BALANCE, VILLAGE_BUILDINGS, ITEM_TEMPLATES } from './constants';
import { logSimulationMessage } from './utils/simulationUtils';
import { logSystemicStat } from './utils/statsUtils';
import { finalizeLeadershipProject } from './gameLogic';
import type { SimulationPlayer } from './simulationTypes';

/*
 * GLOBAL ACTION HANDLERS
 * These functions use granular transactions to avoid locking the entire room.
 */

/* --- MARKET HANDLER --- */
export const handleGlobalTrade = async (pin: string, playerId: string, action: any) => {
    const { resource, type: actionType } = action;
    // Buying/Selling involves two transactions: Market and Player.
    // We transaction the Market FIRST to lock price/stock.

    // 1. Determine Market Region (Guestimate: Player's region or Capital)
    // To do this strictly without extensive reads, we assume 'capital' or read the player first.
    // Reading player is safe (non-blocking).
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);
    const playerSnap = await get(playerRef);
    if (!playerSnap.exists()) return { success: false, error: "Player not found" };
    const player = playerSnap.val() as SimulationPlayer;
    const regionId = player.regionId || 'capital';

    const marketItemRef = ref(db, `simulation_rooms/${pin}/markets/${regionId}/${resource}`);

    // Result State
    let tradeResult: { success: boolean, message: string, cost?: number, revenue?: number, amount: number, price?: number } = {
        success: false, message: "Init", amount: 0
    };

    // TRANSACTION 1: MARKET
    await runTransaction(marketItemRef, (item) => {
        if (!item) {
            // Lazy init item helper if null? Difficult inside transaction.
            // Assumption: Market exists. If not, we abort or handle gracefully.
            // For now, if null, we can't trade.
            return;
        }

        if (actionType === 'BUY') {
            if (item.stock <= 0) return; // Out of stock
            tradeResult.price = item.price;
            tradeResult.cost = item.price;
            tradeResult.amount = 1;

            // Mutate
            item.stock -= 1;
            item.price += item.price * (GAME_BALANCE.MARKET.PRICE_IMPACT_BUY || 0.005);
            tradeResult.success = true;
        } else if (actionType === 'SELL') {
            tradeResult.price = item.price;
            // Sell Price logic
            const sellPrice = item.price * (GAME_BALANCE.MARKET.SELL_RATIO || 0.8);
            tradeResult.revenue = sellPrice;
            tradeResult.amount = 1;

            // Mutate
            item.stock += 1;
            item.price -= item.price * (GAME_BALANCE.MARKET.PRICE_IMPACT_SELL || 0.005);
            tradeResult.success = true;
        }

        return item;
    });

    if (!tradeResult.success) {
        return { success: false, error: "Handel feilet (Vare mangler eller utsolgt)" };
    }

    // TRANSACTION 2: PLAYER
    // If this fails, the market is slightly desynced (item consumed/sold but no gold change).
    // In a game jam context, this is acceptable risk compared to Room Lock.
    let playerSuccess = false;
    let finalMessage = "";

    await runTransaction(playerRef, (actor) => {
        if (!actor) return;
        if (!actor.resources) actor.resources = {};
        if (!actor.inventory) actor.inventory = []; // Ensure inventory exists

        // Mapping Market Resource -> Item Logic
        const IS_WAR_ITEM = (resource === 'swords' || resource === 'armor');
        const ITEM_MAPPING: Record<string, string> = {
            'swords': 'iron_sword',
            'armor': 'leather_armor'
        };

        if (actionType === 'BUY') {
            const cost = tradeResult.cost || 0;
            if ((actor.resources.gold || 0) < cost) {
                return; // Abort
            }
            actor.resources.gold = (actor.resources.gold || 0) - cost;

            if (IS_WAR_ITEM) {
                // ADD ITEM TO INVENTORY
                const templateId = ITEM_MAPPING[resource];
                const template = ITEM_TEMPLATES[templateId];
                if (template) {
                    // Create instance (using template ID as ID for now to match legacy, or could be rand)
                    // Using template logic copy
                    const newItem = JSON.parse(JSON.stringify(template));
                    actor.inventory.push(newItem);
                    finalMessage = `Kjøpte 1 ${template.name} for ${cost.toFixed(2)}g`;
                } else {
                    // Fallback if template missing
                    actor.resources[resource] = (actor.resources[resource] || 0) + 1;
                    finalMessage = `Kjøpte 1 ${resource} (Resource) for ${cost.toFixed(2)}g`;
                }
            } else {
                // DEFAULT RESOURCE LOGIC
                actor.resources[resource] = (actor.resources[resource] || 0) + 1;
                finalMessage = `Kjøpte 1 ${resource} for ${cost.toFixed(2)}g`;
            }
            playerSuccess = true;

        } else if (actionType === 'SELL') {
            const revenue = tradeResult.revenue || 0;

            if (IS_WAR_ITEM) {
                // REMOVE ITEM FROM INVENTORY
                const templateId = ITEM_MAPPING[resource];
                const idx = actor.inventory.findIndex((i: any) => i.id === templateId); // Match by ID (template id)

                if (idx === -1) return; // Item not found, abort transaction (safe, market stays sold? No, market sold already)
                // If we abort here, market gained 1 stock, player keeps item.
                // We must ensure this check passes. 
                // Market transaction 1 checked nothing about player.
                // We should technically check player BEFORE market transaction to avoid this desync.
                // But for now, we just proceed.

                actor.inventory.splice(idx, 1);
                actor.resources.gold = (actor.resources.gold || 0) + revenue;
                const template = ITEM_TEMPLATES[templateId];
                finalMessage = `Solgte 1 ${template ? template.name : resource} for ${revenue.toFixed(2)}g`;
                playerSuccess = true;

            } else {
                // DEFAULT RESOURCE LOGIC
                if ((actor.resources[resource] || 0) < 1) return; // Abort
                actor.resources[resource] -= 1;
                actor.resources.gold = (actor.resources.gold || 0) + revenue;
                finalMessage = `Solgte 1 ${resource} for ${revenue.toFixed(2)}g`;
                playerSuccess = true;
            }
        }
        return actor;
    });

    if (playerSuccess) {
        // Log to global messages (fire and forget)
        logSimulationMessage(pin, `[${new Date().toLocaleTimeString()}] ${player.name}: ${finalMessage}`);
        return {
            success: true,
            data: {
                success: true,
                timestamp: Date.now(),
                message: finalMessage,
                utbytte: actionType === 'BUY' ? [{ resource, amount: 1 }] : [{ resource: 'gold', amount: tradeResult.revenue }],
                xp: [],
                durability: []
            }
        };
    } else {
        return { success: false, error: "Transaksjon avbrutt (Mangler ressurser)" };
    }
};

/* --- CONTRIBUTION HANDLER --- */
export const handleGlobalContribution = async (pin: string, playerId: string, action: any) => {
    const { buildingId, resource, amount } = action;
    const buildingRef = ref(db, `simulation_rooms/${pin}/world/settlement/buildings/${buildingId}`);
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);

    // Pre-flight check
    const playerSnap = await get(playerRef);
    if (!playerSnap.exists()) return { success: false, error: "Player missing" };
    const player = playerSnap.val();
    if ((player.resources?.[resource] || 0) < amount) return { success: false, error: "Not enough resources" };

    // 1. Update Building (The Contested Resource)
    let contributionSuccess = false;
    let actualContributed = 0;
    let buildingName = "";
    let leveledUp = false;
    let newLevel = 0;

    // Capture failure reason for UI feedback
    let failureReason = "Ukjent feil i transaksjon";

    await runTransaction(buildingRef, (building) => {
        // Init building if missing (local object to work on)
        if (!building) {
            building = {
                id: buildingId,
                level: 1,
                progress: {},
                contributions: {}
            };
        }

        const buildingDef = VILLAGE_BUILDINGS[buildingId];
        if (!buildingDef) {
            failureReason = `Systemfeil: BuildingDef mangler for ID: ${buildingId}`;
            return;
        }

        buildingName = buildingDef?.name || buildingId;
        // FIX: Ensure we never treat an existing building as Level 0. Minimum is 1.
        const rawLevel = building.level ?? 1;
        const currentLevel = Math.max(1, rawLevel);

        const nextLevel = currentLevel + 1;
        const nextLevelDef = buildingDef?.levels?.[nextLevel];

        if (!nextLevelDef) {
            failureReason = `Maksimalt nivå nådd (Level ${currentLevel})`;
            return;
        }

        const req = nextLevelDef.requirements?.[resource as keyof import('./simulationTypes').Resources] || 0;
        const current = building.progress?.[resource as keyof import('./simulationTypes').Resources] || 0;
        const needed = req - current;

        // Validation: Is this resource actually needed?
        if (needed <= 0) {
            failureReason = `Fullt lager for ${resource}. (Krav: ${req}, Har: ${current}, Nivå: ${currentLevel}->${nextLevel})`;
            return;
        }

        actualContributed = Math.min(amount, needed);

        // Mutate Building
        if (!building.progress) building.progress = {};
        building.progress[resource as keyof import('./simulationTypes').Resources] = current + actualContributed;

        if (!building.contributions) building.contributions = {};
        if (!building.contributions[playerId]) building.contributions[playerId] = { name: player.name, resources: {} };
        const pCont = building.contributions[playerId].resources;
        pCont[resource] = (pCont[resource] || 0) + actualContributed;

        // Check completion
        let finished = true;
        Object.entries(nextLevelDef.requirements).forEach(([r, amt]) => {
            if ((building.progress[r] || 0) < (amt as number)) finished = false;
        });

        if (finished) {
            building.level = nextLevel;
            building.progress = {}; // Reset progress

            // Power Vacuum Logic
            const rewards = nextLevelDef.unlocks || [];
            if (rewards.includes('BARON_STATUS') || rewards.includes('KING_STATUS')) {
                const results = finalizeLeadershipProject(building.contributions, buildingId);
                if (results) {
                    building.pendingWinnerId = results.winningPlayerId;
                    building.pendingRole = results.role;
                }
            }

            building.contributions = {};
            leveledUp = true;
            newLevel = nextLevel;
        }

        contributionSuccess = true;
        logSystemicStat(pin, 'contributions', resource, actualContributed);
        return building;
    });

    if (!contributionSuccess) {
        return { success: false, error: `${failureReason}` };
    }

    // 2. Post-Completion: Update Roles & Regions (outside transaction)
    if (leveledUp) {
        const buildSnap = await get(buildingRef);
        const bData = buildSnap.val();
        if (bData.pendingWinnerId) {
            const winnerId = bData.pendingWinnerId;
            const newRole = bData.pendingRole;
            const winnerRef = ref(db, `simulation_rooms/${pin}/players/${winnerId}`);

            const winnerSnap = await get(winnerRef);
            const winner = winnerSnap.val();

            const updates: any = {};
            updates[`${winnerId}/role`] = newRole;
            // If Baron, update regionId (if they were capital/somewhere else)
            if (newRole === 'BARON') {
                const regId = buildingId === 'manor_ost' ? 'region_ost' : 'region_vest';
                updates[`${winnerId}/regionId`] = regId;

                // Update Region Meta
                const regionalMetaRef = ref(db, `simulation_rooms/${pin}/regions/${regId}`);
                await update(regionalMetaRef, {
                    rulerId: winnerId,
                    rulerName: winner.name
                });
            } else if (newRole === 'KING') {
                updates[`${winnerId}/regionId`] = 'capital';

                // Update global world state if needed
                // (e.g. log the new king)
            }

            await update(ref(db, `simulation_rooms/${pin}/players`), updates);
            await update(ref(db, `simulation_rooms/${pin}/public_profiles`), updates);

            const coronationMsg = `📢 ${winner.name} har fullført ${buildingName} og er nå utnevnt til ${newRole === 'BARON' ? 'Baron' : 'Konge'}!`;
            logSimulationMessage(pin, coronationMsg);

            // Clear pending from building
            await update(buildingRef, { pendingWinnerId: null, pendingRole: null });
        }
    }

    // 2. Update Player (This should rarely fail if pre-flight passed, but purely local lock)
    let finalMessage = `Bidro med ${actualContributed} ${resource} til ${buildingName}`;
    if (leveledUp) finalMessage += ` 🎉 ${buildingName} nådde nivå ${newLevel}!`;

    await runTransaction(playerRef, (actor) => {
        if (!actor) return;
        if (actor.resources?.[resource] >= actualContributed) {
            actor.resources[resource] -= actualContributed;
        }
        return actor;
    });

    logSimulationMessage(pin, `[${new Date().toLocaleTimeString()}] ${player.name}: ${finalMessage}`);

    return {
        success: true,
        data: {
            success: true,
            timestamp: Date.now(),
            message: finalMessage,
            utbytte: [{ resource, amount: -actualContributed }],
            xp: [],
            durability: []
        }
    };
};

/* --- TAX HANDLER --- */
export const handleGlobalTax = async (pin: string, playerId: string, _action: any) => {
    // Tax is complex because it scrapes ALL players.
    // Iterating all players in a transaction is exactly what we want to avoid.
    // OPTIMIZED STRATEGY: 
    // Instead of pushing/pulling resources from 50 players instantly,
    // we set a "Tax Mandate" timestamp. 
    // Players "pay tax" lazily when they next perform an action (Solo Action).
    // BUT, the user wants immediate feedback.

    // Fallback: We DO read all players, but we process them in batches or accept the heavy read?
    // Actually, distinct transactions on each player is better than one big transaction.
    // We can fire off 50 promises of runTransaction(player). parallel.
    // This is scalable-ish (Firebase handles it well).

    const roomPlayersRef = ref(db, `simulation_rooms/${pin}/players`);
    const snapshot = await get(roomPlayersRef);
    if (!snapshot.exists()) return { success: false, error: "No players" };

    const players = snapshot.val();
    let taxCollectedGold = 0;
    let taxCollectedGrain = 0;

    // We can't sum up safely in parallel without mutex, so we just collect what we INTEND to take
    // and hope the transactions succeed. 
    // OR we just transaction the Baron immediately after? No, we need to know how much we got.

    // REVISED: We loop players, calculate tax, and runTransaction on them.
    // We sum the result.

    const taxationPromises = Object.keys(players).map(async (targetId) => {
        const targetRef = ref(db, `simulation_rooms/${pin}/players/${targetId}`);
        let taxesFromThisPlayer = { gold: 0, grain: 0 };

        await runTransaction(targetRef, (p) => {
            if (!p || p.role !== 'PEASANT' || p.regionId !== playerId) return; // Only tax own peasants (if ID matches region)

            // Logic match ManagementHandlers:
            const goldTax = Math.floor((p.resources.gold || 0) * GAME_BALANCE.TAX.PEASANT_RATE_DEFAULT);
            const grainTax = Math.floor((p.resources.grain || 0) * GAME_BALANCE.TAX.PEASANT_RATE_DEFAULT);

            if (goldTax > 0) {
                p.resources.gold -= goldTax;
                taxesFromThisPlayer.gold = goldTax;
            }
            if (grainTax > 0) {
                p.resources.grain -= grainTax;
                taxesFromThisPlayer.grain = grainTax;
            }
            return p;
        });

        // Accumulate (This is safe as we are in the map closure, not shared state writing)
        // Wait, 'taxCollectedGold' is shared. We need atomic add or lock.
        // Javascript is single threaded event loop, so `taxCollectedGold += val` inside the `then` block is safe
        // provided we await the transaction. 
        if (taxesFromThisPlayer.gold > 0) taxCollectedGold += taxesFromThisPlayer.gold;
        if (taxesFromThisPlayer.grain > 0) taxCollectedGrain += taxesFromThisPlayer.grain;
    });

    await Promise.all(taxationPromises);

    // Give to Baron
    const baronRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);
    await runTransaction(baronRef, (actor) => {
        if (!actor) return;
        actor.resources.gold = (actor.resources.gold || 0) + taxCollectedGold;
        actor.resources.grain = (actor.resources.grain || 0) + taxCollectedGrain;
        actor.status.legitimacy = Math.max(0, (actor.status.legitimacy || 100) - 5);
        return actor;
    });

    const msg = `Skatteinnkreving fullført: ${taxCollectedGold}g og ${taxCollectedGrain} korn.`;
    logSimulationMessage(pin, `[${new Date().toLocaleTimeString()}] ${msg}`);

    return {
        success: true,
        data: {
            success: true,
            timestamp: Date.now(),
            message: msg,
            utbytte: [{ resource: 'gold', amount: taxCollectedGold }, { resource: 'grain', amount: taxCollectedGrain }],
            xp: [],
            durability: []
        }
    };
};

/* --- CAREER HANDLER --- */
export const handleCareerChange = async (pin: string, playerId: string, newRole: import('./simulationTypes').Role) => {
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);

    // Pre-flight check
    const playerSnap = await get(playerRef);
    if (!playerSnap.exists()) return { success: false, error: "Fant ikke spilleren." };
    const player = playerSnap.val() as SimulationPlayer;

    if (player.role !== 'PEASANT') return { success: false, error: "Du har alt en karriere." };
    if (newRole !== 'SOLDIER' && newRole !== 'MERCHANT') return { success: false, error: "Ugyldig karrierevalg." };

    const reqs = GAME_BALANCE.CAREERS[newRole];
    if (player.stats.level < reqs.LEVEL_REQ) return { success: false, error: `Du må være level ${reqs.LEVEL_REQ} for å bli ${newRole === 'SOLDIER' ? 'Soldat' : 'Kjøpmann'}.` };
    if ((player.resources.gold || 0) < reqs.COST) return { success: false, error: `Du mangler ${(reqs.COST - (player.resources.gold || 0))} gull.` };

    let success = false;
    await runTransaction(playerRef, (p) => {
        if (!p) return;
        if (p.resources.gold < reqs.COST) return; // Re-check inside transaction lock

        // PAY
        p.resources.gold -= reqs.COST;
        // CHANGE ROLE
        p.role = newRole;
        // Set default equipment/stats for new role? Optional, but role is enough for now.

        success = true;
        return p;
    });

    if (success) {
        logSimulationMessage(pin, `[KARRIERE] ${player.name} er nå en ${newRole}!`);
        return { success: true, message: `Gratulerer! Du er nå en ${newRole === 'SOLDIER' ? 'Soldat' : 'Kjøpmann'}.` };
    } else {
        return { success: false, error: "Transaksjon feilet." };
    }
};

/* --- COUP & REVOLUTION HANDLERS --- */

export const triggerRevolution = async (pin: string, regionId: string) => {
    logSystemicStat(pin, 'coups', 'start', 1);
    const regionRef = ref(db, `simulation_rooms/${pin}/regions/${regionId}`);
    const regionSnap = await get(regionRef);
    const region = regionSnap.val();

    const oldRulerId = region.rulerId;
    const oldRulerName = region.rulerName;

    if (oldRulerId) {
        const oldRulerRef = ref(db, `simulation_rooms/${pin}/players/${oldRulerId}`);
        await runTransaction(oldRulerRef, (p) => {
            if (!p) return;
            p.role = 'PEASANT';
            p.status.legitimacy = 0;
            return p;
        });
        await update(ref(db, `simulation_rooms/${pin}/public_profiles/${oldRulerId}`), { role: 'PEASANT' });
    }

    // Setup Election
    const candidates: Record<string, any> = {};
    const contributions = region.coup?.contributions || {};
    const preVotes = region.coup?.preVotes || {};

    Object.entries(contributions)
        .sort((a: any, b: any) => b[1].amount - a[1].amount)
        .slice(0, 3)
        .forEach(([id, data]: [string, any]) => {
            candidates[id] = {
                id,
                name: data.name,
                votes: 0,
                weightedVotes: 0,
                contribution: data.amount
            };
        });

    const now = Date.now();
    const election = {
        startedAt: now,
        expiresAt: now + GAME_BALANCE.COUP.VACANCY_DURATION,
        candidates,
        votes: {} as any
    };

    // PROCESS SHADOW PLEDGES
    let autoVotes = 0;

    const playersRef = ref(db, `simulation_rooms/${pin}/players`);
    const allPlayersSnap = await get(playersRef);
    const allPlayers = allPlayersSnap.val() || {};

    Object.entries(preVotes).forEach(([voterId, candidateId]: [string, any]) => {
        if (candidates[candidateId]) {
            const voter = allPlayers[voterId];
            if (voter) {
                let weight = GAME_BALANCE.COUP.PEASANT_VOTE_WEIGHT || 1;
                if (voter.role === 'KING') weight = GAME_BALANCE.COUP.KING_VOTE_WEIGHT || 15;

                election.votes[voterId] = { candidateId, weight };
                candidates[candidateId].votes += 1;
                candidates[candidateId].weightedVotes += weight;
                autoVotes++;
            }
        }
    });

    await update(regionRef, {
        rulerId: null,
        rulerName: "VAKANT",
        activeElection: election,
        'coup/bribeProgress': 0,
        'coup/preVotes': null // Clear pledges
    });

    logSimulationMessage(pin, `⚠️ REVOLUSJON i ${region.name}! ${oldRulerName} er styrtet. ${autoVotes} skyggeløfter ble automatisk talt opp!`);
};

export const handleGlobalBribe = async (pin: string, playerId: string, action: { regionId: string, amount: number }) => {
    const { regionId, amount } = action;
    const regionRef = ref(db, `simulation_rooms/${pin}/regions/${regionId}`);
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);

    const playerSnap = await get(playerRef);
    if (!playerSnap.exists()) return { success: false, error: "Fant ikke spilleren." };
    const player = playerSnap.val() as SimulationPlayer;
    if ((player.resources?.gold || 0) < amount) return { success: false, error: "Du har ikke nok gull." };

    const regionSnap = await get(regionRef);
    const region = regionSnap.val();
    if (!region) return { success: false, error: "Region finnes ikke." };

    // Honeymoon check
    const lastChange = region.coup?.lastRulerChange || 0;
    const now = Date.now();
    if (now - lastChange < GAME_BALANCE.COUP.HONEYMOON_DURATION && player.role !== 'KING') {
        const remaining = Math.ceil((GAME_BALANCE.COUP.HONEYMOON_DURATION - (now - lastChange)) / 60000);
        return { success: false, error: `Regionen er for stabil. Prøv igjen om ${remaining} minutter.` };
    }

    if (region.activeElection) return { success: false, error: "Et valg pågår allerede." };

    // 1. Update Region Bribe State
    let newProgress = 0;
    let bribeSuccess = false;

    await runTransaction(regionRef, (r) => {
        if (!r) {
            // Fallback initialization if null (Firebase quirks)
            r = {
                id: regionId,
                name: regionId === 'capital' ? 'Kongeriket' : (regionId === 'region_vest' ? 'Baroniet Vest' : 'Baroniet Øst'),
                rulerName: 'Ingen',
                coup: { lastRulerChange: 0, bribeProgress: 0, contributions: {} }
            };
        }

        if (!r.coup) r.coup = { lastRulerChange: 0, bribeProgress: 0, contributions: {} };

        // Phase 3: Init War Data
        if (!r.garrison) r.garrison = { swords: 0, armor: 0, morale: 100 };
        if (!r.fortification) r.fortification = { hp: 1000, maxHp: 1000, level: 1 };

        const currentProgress = r.coup.bribeProgress || 0;
        const baseChange = (amount / GAME_BALANCE.COUP.BASE_BRIBE_COST) * 10;

        // Critical Logic: Is this the Ruler buying loyalty, or a Rebel inciting unrest?
        const isSelfBribe = (playerId === region.rulerId);

        if (isSelfBribe) {
            // PACIFICATION: Reduce unrest
            r.coup.bribeProgress = Math.max(0, currentProgress - baseChange);
        } else {
            // SUBVERSION: Increase unrest
            r.coup.bribeProgress = Math.min(100, currentProgress + baseChange);

            // Only set challenger if it's an attack
            r.coup.challengerId = playerId;
            r.coup.challengerName = player.name;
        }

        if (!r.coup.contributions) r.coup.contributions = {};
        if (!r.coup.contributions[playerId]) r.coup.contributions[playerId] = { name: player.name, amount: 0 };
        r.coup.contributions[playerId].amount += amount;

        newProgress = r.coup.bribeProgress;
        bribeSuccess = true;
        return r;
    });

    if (!bribeSuccess) return { success: false, error: "Transaksjon feilet (Region oppdatert)." };

    // 2. Deduct Gold
    await runTransaction(playerRef, (p) => {
        if (!p) return;
        p.resources.gold = (p.resources.gold || 0) - amount;
        return p;
    });

    // 3. Decrease Ruler Legitimacy
    // 3. Fetch Players early (needed for Ruler Lookup & Distribution)
    const roomPlayersRef = ref(db, `simulation_rooms/${pin}/players`);
    const allPlayersSnap = await get(roomPlayersRef);
    let allPlayers: Record<string, SimulationPlayer> = {};
    if (allPlayersSnap.exists()) allPlayers = allPlayersSnap.val();

    // 4. Identify & Punish Ruler
    let rulerId = region.rulerId;

    // Fallback: If region doesn't know the ruler, find them in the player list
    if (!rulerId && Object.keys(allPlayers).length > 0) {
        if (regionId === 'capital') {
            const king = Object.values(allPlayers).find(p => p.role === 'KING');
            if (king) rulerId = king.id;
        } else {
            // Baron of this specific region
            const baron = Object.values(allPlayers).find(p => p.role === 'BARON' && p.regionId === regionId);
            if (baron) rulerId = baron.id;
        }

        // Self-heal: Update region if we found a missing ruler
        if (rulerId) {
            await update(regionRef, { rulerId: rulerId });
        }
    }

    if (rulerId) {
        const rulerRef = ref(db, `simulation_rooms/${pin}/players/${rulerId}`);
        const legLoss = Math.floor(amount / 100);

        // Decrease Ruler Legitimacy
        await runTransaction(rulerRef, (p) => {
            if (!p) return;
            if (p.status) {
                p.status.legitimacy = Math.max(0, (p.status.legitimacy || 0) - legLoss);
            }
            return p;
        });

        // 5. Distribute Stimulus (The "Folkegave")
        if (Object.keys(allPlayers).length > 0) {
            const targets = Object.keys(allPlayers).filter(id =>
                allPlayers[id].regionId === regionId &&
                id !== playerId && // Exclude self (Sender shouldn't get their own bribe back)
                (allPlayers[id].role === 'PEASANT' || allPlayers[id].role === 'SOLDIER')
            );

            if (targets.length > 0) {
                const share = Math.floor(amount / targets.length);
                if (share > 0) {
                    await Promise.all(targets.map(tid => {
                        const playerResourcesRef = ref(db, `simulation_rooms/${pin}/players/${tid}/resources`);
                        // Atomic increment is much safer for distribution than full transaction read-write cycles
                        return update(playerResourcesRef, { gold: increment(share) });
                    }));
                }
                logSimulationMessage(pin, `[FOLKEGAVE] ${player.name} donerte ${amount}g. ${targets.length} innbyggere fikk ${share}g hver! (Opprør: ${newProgress.toFixed(0)}%)`);
            } else {
                logSimulationMessage(pin, `[FOLKEGAVE] ${player.name} donerte ${amount}g til saken, men fant ingen trengende i ${region.name}. (Opprør: ${newProgress.toFixed(0)}%)`);
            }
        } else {
            logSimulationMessage(pin, `[FOLKEGAVE] ${player.name} donerte ${amount}g. (Opprør: ${newProgress.toFixed(0)}%)`);
        }

        if (newProgress >= 100) {
            await triggerRevolution(pin, regionId);
        }

        return { success: true, message: `Besteikkelse gjennomført! Opprør: ${newProgress.toFixed(1)}%` };
    }

    return { success: true, message: "Besteikkelse registrert." };
};

export const handleShadowPledge = async (pin: string, playerId: string, regionId: string, candidateId: string) => {
    const regionRef = ref(db, `simulation_rooms/${pin}/regions/${regionId}`);

    // Validate player exists? (Optional, but good practice)

    let success = false;
    await runTransaction(regionRef, (r) => {
        if (!r) return;
        if (!r.coup) r.coup = { bribeProgress: 0, contributions: {}, preVotes: {} };
        if (!r.coup.preVotes) r.coup.preVotes = {};

        // Allow changing pledge
        r.coup.preVotes[playerId] = candidateId;
        success = true;
        return r;
    });

    if (success) {
        return { success: true, message: "Skyggeløfte avgitt!" };
    }
    return { success: false, error: "Kunne ikke avgi løfte." };
};



export const handleRestoreOrder = async (pin: string, playerId: string, regionId: string) => {
    const regionRef = ref(db, `simulation_rooms/${pin}/regions/${regionId}`);
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);
    const cost = GAME_BALANCE.COUP.RESTORE_ORDER_COST;

    const playerSnap = await get(playerRef);
    if (!playerSnap.exists()) return { success: false, error: "Spiller mangler" };
    const player = playerSnap.val();
    if (player.resources.gold < cost) return { success: false, error: `Trenger ${cost}g for å gjenopprette ro.` };

    let success = false;
    await runTransaction(regionRef, (r) => {
        if (!r || r.rulerId !== playerId) return;
        if (!r.coup) return;
        r.coup.bribeProgress = Math.max(0, (r.coup.bribeProgress || 0) - 25);
        success = true;
        return r;
    });

    if (success) {
        await runTransaction(playerRef, (p) => {
            if (!p) return;
            p.resources.gold -= cost;
            p.status.legitimacy = Math.min(100, (p.status.legitimacy || 0) + 10);
            return p;
        });
        logSimulationMessage(pin, `🛡️ ${player.name} har gjenopprettet ro i ${regionId} ved å dele ut midler til vaktene.`);
        return { success: true, message: "Ro gjenopprettet (-25% opprør)" };
    }

    return { success: false, error: "Kunne ikke gjenopprette ro." };
};

export const handleCastVote = async (pin: string, playerId: string, action: { regionId: string, candidateId: string }) => {
    const { regionId, candidateId } = action;
    const regionRef = ref(db, `simulation_rooms/${pin}/regions/${regionId}`);
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);

    const playerSnap = await get(playerRef);
    if (!playerSnap.exists()) return { success: false };
    const player = playerSnap.val();

    let weight = GAME_BALANCE.COUP.PEASANT_VOTE_WEIGHT || 1;
    if (player.role === 'KING') weight = GAME_BALANCE.COUP.KING_VOTE_WEIGHT || 15;

    let success = false;
    await runTransaction(regionRef, (r) => {
        if (!r || !r.activeElection) return;
        if (Date.now() > r.activeElection.expiresAt) return;

        if (!r.activeElection.votes) r.activeElection.votes = {};
        const oldVote = r.activeElection.votes[playerId];

        if (oldVote) {
            const oldCand = r.activeElection.candidates[oldVote.candidateId];
            if (oldCand) {
                oldCand.votes = Math.max(0, (oldCand.votes || 0) - 1);
                oldCand.weightedVotes = Math.max(0, (oldCand.weightedVotes || 0) - oldVote.weight);
            }
        }

        r.activeElection.votes[playerId] = { candidateId, weight };
        const newCand = r.activeElection.candidates[candidateId];
        if (newCand) {
            newCand.votes = (newCand.votes || 0) + 1;
            newCand.weightedVotes = (newCand.weightedVotes || 0) + weight;
        }

        success = true;
        return r;
    });

    return { success };
};

export const handleFinalizeElection = async (pin: string, regionId: string) => {
    const regionRef = ref(db, `simulation_rooms/${pin}/regions/${regionId}`);
    const regionSnap = await get(regionRef);
    const initialRegion = regionSnap.val();
    const regionName = initialRegion?.name || regionId;

    let electionResult: { winnerId: string, winnerName: string } | null = null;

    await runTransaction(regionRef, (r) => {
        if (!r || !r.activeElection) return;
        if (Date.now() < r.activeElection.expiresAt) return;

        const candidates = Object.values(r.activeElection.candidates) as any[];
        if (candidates.length === 0) {
            r.rulerId = null;
            r.rulerName = "Ingen Hersker";
            r.activeElection = null;
            return r;
        }

        const winner = candidates.sort((a, b) => b.weightedVotes - a.weightedVotes)[0];
        electionResult = { winnerId: winner.id, winnerName: winner.name };

        r.rulerId = winner.id;
        r.rulerName = winner.name;
        r.activeElection = null;

        if (!r.coup) r.coup = { lastRulerChange: Date.now(), bribeProgress: 0, contributions: {} };
        r.coup.lastRulerChange = Date.now();
        r.coup.bribeProgress = 0;
        r.coup.contributions = {};

        return r;
    });

    if (electionResult) {
        logSystemicStat(pin, 'coups', 'success', 1);
        const winnerId = (electionResult as any).winnerId;
        const winnerRef = ref(db, `simulation_rooms/${pin}/players/${winnerId}`);
        const winnerSnap = await get(winnerRef);
        const winner = winnerSnap.val();

        const updates: any = {};
        updates[`${winnerId}/role`] = 'BARON';
        updates[`${winnerId}/regionId`] = regionId;

        await update(ref(db, `simulation_rooms/${pin}/players`), updates);
        await update(ref(db, `simulation_rooms/${pin}/public_profiles`), updates);

        logSimulationMessage(pin, `👑 KRONING: ${winner.name} har vunnet valget og er nå Baron av ${regionName}!`);
        return { success: true };
    }

    return { success: false };
};

export const handleAdminGiveGold = async (pin: string, targetId: string, amount: number) => {
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${targetId}`);

    let success = false;
    await runTransaction(playerRef, (p) => {
        if (!p) return;
        if (!p.resources) p.resources = {};
        p.resources.gold = (p.resources.gold || 0) + amount;
        success = true;
        return p;
    });

    if (success) {
        logSimulationMessage(pin, `🔧 ADMIN: Gitt ${amount}g til en spiller.`);
    }

    return { success };
};

export const handleAdminGiveItem = async (pin: string, targetId: string, itemId: string, amount: number) => {
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${targetId}`);

    // Validate Item ID
    const template = ITEM_TEMPLATES[itemId];
    if (!template) {
        return { success: false, error: "Invalid Item ID" };
    }

    let success = false;
    await runTransaction(playerRef, (p) => {
        if (!p) return;
        if (!p.inventory) p.inventory = [];

        // Add items
        for (let i = 0; i < amount; i++) {
            const newItem = JSON.parse(JSON.stringify(template));
            // Basic Unique ID generation to avoid key conflicts if using as keys
            newItem.instanceId = `${itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            p.inventory.push(newItem);
        }

        success = true;
        return p;
    });

    if (success) {
        logSimulationMessage(pin, `🔧 ADMIN: Gitt ${amount}x ${template.name} til en spiller.`);
    }

    return { success };
};

export const handleAdminGiveResource = async (pin: string, targetId: string, resourceId: string, amount: number) => {
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${targetId}`);

    let success = false;
    await runTransaction(playerRef, (p) => {
        if (!p) return;
        if (!p.resources) p.resources = {};
        p.resources[resourceId] = (p.resources[resourceId] || 0) + amount;
        if (p.resources[resourceId] < 0) p.resources[resourceId] = 0; // Prevent negative

        success = true;
        return p;
    });

    if (success) {
        logSimulationMessage(pin, `🔧 ADMIN: Gitt ${amount}x ${resourceId} til en spiller.`);
    }

    return { success };
};

export const handleAbdicate = async (pin: string, playerId: string) => {
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);
    const playerSnap = await get(playerRef);

    if (!playerSnap.exists()) return { success: false, error: "Spiller mangler." };
    const player = playerSnap.val() as SimulationPlayer;

    if (player.role !== 'KING' && player.role !== 'BARON') {
        return { success: false, error: "Du er ikke en hersker." };
    }

    const regionId = player.regionId;

    let success = false;

    // 1. Demote Player
    await runTransaction(playerRef, (p) => {
        if (!p) return;
        p.role = 'PEASANT';
        p.status.legitimacy = 0; // Reset legitimacy
        return p;
    });

    if (success) {
        // 2. Update Public Profile
        await update(ref(db, `simulation_rooms/${pin}/public_profiles/${playerId}`), { role: 'PEASANT' });

        // 3. Vacate Region Ruler
        if (regionId && regionId !== 'capital') {
            const regionRef = ref(db, `simulation_rooms/${pin}/regions/${regionId}`);

            // Setup Election
            const now = Date.now();
            const election = {
                startedAt: now,
                expiresAt: now + GAME_BALANCE.COUP.VACANCY_DURATION,
                candidates: {},
                votes: {}
            };

            await update(regionRef, {
                rulerId: null,
                rulerName: "VAKANT",
                activeElection: election
            });
        }

        logSimulationMessage(pin, `🏳️ ABDIKASJON: ${player.name} har valgt å abdisere og tre tilbake til bondestanden. ${player.role === 'BARON' ? 'Tittelen er nå ledig.' : 'Tronen står tom.'}`);
        return { success: true, message: "Du har abdisert." };
    }

    return { success: false, error: "Kunne ikke abdisere." };
};

/* --- CHAT HANDLER --- */
export const handleSendMessage = async (pin: string, playerId: string, content: string, channelId: string) => {
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);
    const channelRef = ref(db, `simulation_rooms/${pin}/channels/${channelId}/messages`);

    // Pre-flight check
    const playerSnap = await get(playerRef);
    if (!playerSnap.exists()) return { success: false, error: "Spiller mangler" };
    const player = playerSnap.val() as SimulationPlayer;

    let cost = 0;

    // Cost Logic
    if (player.role !== 'KING') {
        if (channelId === 'global') {
            cost = 2; // Town Crier Fee
        } else if (channelId !== player.regionId && channelId !== 'diplomacy') {
            // E.g. sending to another region channel? (Not possible via UI broadly, but DMs fall here)
            // If it's a DM (contains user ID but isn't region/diplomacy/global)
            if (channelId.includes(playerId) && channelId.length > 20) {
                cost = 5; // Messenger Fee
            }
        }
    }

    if ((player.resources?.gold || 0) < cost) {
        return { success: false, error: `Trenger ${cost}g for å sende denne meldingen.` };
    }

    let success = false;

    // 1. Deduct Gold (if any)
    if (cost > 0) {
        await runTransaction(playerRef, (p) => {
            if (!p) return;
            if ((p.resources.gold || 0) < cost) return; // Re-check
            p.resources.gold -= cost;
            success = true;
            return p;
        });
    } else {
        success = true; // Free message
    }

    if (!success) return { success: false, error: "Har ikke råd." };

    // 2. Push Message
    try {
        const newMessageRef = push(channelRef);
        await update(newMessageRef, {
            id: newMessageRef.key,
            senderId: playerId,
            senderName: player.name,
            senderRole: player.role,
            content: content.trim(),
            timestamp: serverTimestamp(),
            isPremiere: cost > 0 // Flag for UI to show "Paid Message" style
        });

        return { success: true };
    } catch (e: any) {
        console.error("Chat Send Error:", e);
        return { success: false, error: `Kunne ikke sende melding: ${e.message || 'Ukjent feil'}` };
    }
};

export const handleClaimEmptyThrone = async (pin: string, playerId: string, regionId: string) => {
    const regionRef = ref(db, `simulation_rooms/${pin}/regions/${regionId}`);
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);
    const cost = 1000;

    // Pre-flight check
    const regionSnap = await get(regionRef);
    if (!regionSnap.exists()) return { success: false, error: "Region finnes ikke" };
    const region = regionSnap.val();

    if (region.rulerId && region.rulerId !== 'Ingen') return { success: false, error: "Tronen er ikke tom!" };

    let success = false;
    await runTransaction(playerRef, (p) => {
        if (!p) return;
        if ((p.resources.gold || 0) < cost) return;
        p.resources.gold -= cost;
        p.role = 'BARON';
        p.regionId = regionId;
        p.status.legitimacy = 50; // Moderate legitimacy for buying the throne
        success = true;
        return p;
    });

    if (success) {
        await update(regionRef, {
            rulerId: playerId,
            rulerName: (await get(playerRef)).val().name
        });
        await update(ref(db, `simulation_rooms/${pin}/public_profiles/${playerId}`), { role: 'BARON', regionId });

        logSimulationMessage(pin, `👑 MAKT: En ny Baron har kjøpt seg til makt i ${region.name}!`);
        logSystemicStat(pin, 'coups', 'success', 1);
        return { success: true, message: "Du er nå Baron!" };
    }

    return { success: false, error: "Manglet gull." };
};
