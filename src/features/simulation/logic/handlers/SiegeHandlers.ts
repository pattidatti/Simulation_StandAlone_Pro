import type { ActionContext } from '../actionTypes';
// import type { ActiveSiege } from '../../simulationTypes';

// const SIEGE_TICK_MS = 1000;
// --- CONSTANTS ---
// Archer damage and volley chances
const ARCHER_VOLLEY_CHANCE = 0.15;
const ARCHER_DAMAGE = 15;
// const ARROW_VOLLEY_CHANCE = 0.1; // Reserved for Tick Logic

// --- HANDLERS ---

export const handleStartSiege = (ctx: ActionContext) => {
    const { actor, room, localResult, action } = ctx;

    // Validations
    const regionId = action.payload?.targetRegionId || actor.regionId;
    const isRoyalSiege = regionId === 'capital' && actor.role === 'BARON';

    if (!regionId || (!isRoyalSiege && (regionId === 'capital' || regionId === 'unassigned'))) {
        localResult.success = false;
        localResult.message = (regionId === 'capital' && actor.role !== 'BARON')
            ? "Bare baroner kan gå til beleiring av hovedstaden."
            : "Du må angi en gyldig region for å starte beleiring.";
        return false;
    }

    if (!room.regions) {
        console.error("CRITICAL: room.regions is undefined in handleStartSiege", room);
        localResult.success = false;
        localResult.message = "Systemfeil: Kunne ikke hente regiondata.";
        return false;
    }

    const region = room.regions[regionId];
    if (!region) {
        localResult.success = false;
        localResult.message = "Regionen eksisterer ikke.";
        return false;
    }

    if (region.activeSiege) {
        localResult.success = false;
        localResult.message = "Beleiring pågår allerede!";
        return false;
    }

    if (region.rulerName === actor.name) {
        localResult.success = false;
        localResult.message = "Du kan ikke beleire ditt eget slott!";
        return false;
    }

    // Initialize Siege
    // Constraint: 500 Siege Swords required to initiate (Logic hurdle)
    const playerSwords = actor.resources?.siege_sword || 0;
    if (playerSwords < 500) {
        localResult.success = false;
        localResult.message = `Du trenger minst 500 beleiringssverd i forsyninger for å starte en beleiring! (Eier: ${playerSwords})`;
        return false;
    }

    // DYNAMISK PORT-HP: Basert på regionens murer (Minimum 1000)
    const fortHP = region.fortification?.hp || 1000;

    region.activeSiege = {
        phase: 'BREACH',
        startedAt: Date.now(),
        lastTick: Date.now(),
        attackers: {
            [actor.id]: { lane: 1, hp: 100, name: actor.name }
        },
        defenders: {},
        // Extra state for Phase 1
        gateHp: fortHP,
        maxGateHp: fortHP
    } as any;

    localResult.message = `Beleiringen av ${region.name} har startet!`;
    return true;
};

export const handleJoinSiege = (ctx: ActionContext) => {
    const { actor, room, localResult, action } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;
    if (!regionId || !room.regions[regionId]?.activeSiege) {
        localResult.success = false;
        localResult.message = "Ingen aktiv beleiring her.";
        return false;
    }

    const siege = room.regions[regionId].activeSiege!;

    // Check if already joined
    const attackers = siege.attackers || {};
    const defenders = siege.defenders || {};

    if (attackers[actor.id] || defenders[actor.id]) {
        localResult.message = "Du deltar allerede.";
        return false;
    }

    // Check Eligibility: Resident OR Noble
    const isResident = actor.regionId === regionId;
    const isNoble = ['BARON', 'KING'].includes(actor.role);

    if (!isResident && !isNoble) {
        localResult.success = false;
        localResult.message = "Bare innbyggere eller adelen kan delta i krigføring i dette området.";
        return false;
    }

    // Restore Choice: Join as Attacker or Defender
    const isDefender = action.payload?.side === 'DEFENDER';

    const initialStats = { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0 };

    if (isDefender) {
        if (!siege.defenders) siege.defenders = {};
        siege.defenders[actor.id] = { lane: 1, hp: 100, name: actor.name, stats: initialStats };
        localResult.message = "Du forsvarer murene!";
    } else {
        if (!siege.attackers) siege.attackers = {};
        siege.attackers[actor.id] = { lane: 1, hp: 100, name: actor.name, stats: initialStats };
        localResult.message = "Du har sluttet deg til beleiringen!";
    }

    return true;
};

export const handleSiegeAction = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    // const { type, payload } = action; // payload might contain 'lane' or 'target'

    const regionId = action.payload?.targetRegionId || actor.regionId;
    if (!regionId || !room.regions[regionId]?.activeSiege) {
        localResult.success = false;
        localResult.message = "Ingen aktiv beleiring funnet i dette området.";
        return false;
    }

    const siege = room.regions[regionId].activeSiege as any; // Cast for custom props
    const attackers = siege.attackers || {};
    const defenders = siege.defenders || {};
    const participant = (attackers[actor.id] || defenders[actor.id]) as any;
    if (!participant) {
        localResult.message = "Du må være deltaker i beleiringen (angriper eller forsvarer) for å delta i kappløpet.";
        return false;
    }

    // --- PHASE 1: BREACH (Attack Gate) ---
    if (siege.phase === 'BREACH') {
        if (action.subType === 'ATTACK_GATE') {
            const currentSwords = actor.resources?.siege_sword || 0;
            const hasSwords = currentSwords > 0;
            const damage = hasSwords ? 25 : 2; // Fists do minimal damage, swords do full

            if (hasSwords) {
                actor.resources.siege_sword -= 1;
            }

            siege.gateHp = Math.max(0, (siege.gateHp || 1000) - damage);

            // Stats
            participant.stats = participant.stats || { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0 };
            participant.stats.damageDealt += damage;

            // FX: "Clang!"
            localResult.message = hasSwords
                ? `🗡️ Du hugger løs på porten! (-${damage} HP). Du har ${actor.resources.siege_sword} beleiringssverd igjen.`
                : `👊 Du slår på porten med nevene... det gjør nesten ingen skade. (-${damage} HP)`;

            if (hasSwords) {
                localResult.utbytte.push({ resource: 'siege_sword', amount: -1 });
            }

            // Check Victory
            if (siege.gateHp <= 0) {
                siege.phase = 'COURTYARD';
                siege.gateHp = 0;
                localResult.message = "PORTEN ER KNUST! Storm borggården!";
            }
            return true;
        }

        if (action.subType === 'SHIELD_WALL') {
            // Toggle defense mode?
            return true;
        }
    }

    // --- PHASE 2: COURTYARD (Tactical Lanes) ---
    if (siege.phase === 'COURTYARD') {
        const s = siege as any;
        if (!s.bossHp) {
            // Init Phase 2 Data on first action if missing
            const garrisonArmor = room.regions[regionId]?.garrison?.armor || 0;
            const extraBossHp = garrisonArmor * 20; // 500 armor = 10k extra HP
            const baseBossHp = 10000;

            s.bossHp = baseBossHp + extraBossHp;
            s.maxBossHp = baseBossHp + extraBossHp;
            s.bossTargetLane = 1; // Middle
            s.nextBossAttack = Date.now() + 5000;
        }

        // 1. Handle Player Actions
        if (action.subType === 'MOVE_LANE') {
            const targetLane = action.payload?.lane;
            if (targetLane >= 0 && targetLane <= 2) {
                participant.lane = targetLane;
                localResult.message = `Forflyttet til bane ${targetLane === 0 ? 'Venstre' : targetLane === 1 ? 'Midten' : 'Høyre'}.`;
            }
            // Fallthrough to tick check
        }

        if (action.subType === 'ATTACK_BOSS') {
            const currentSwords = actor.resources?.siege_sword || 0;
            const garrisonSwords = room.regions[regionId]?.garrison?.swords || 0;
            const isDefender = !!defenders[actor.id];

            let damage = 2; // Minimal damage (fists)
            let usedGarrison = false;

            if (currentSwords > 0) {
                damage = 25;
                actor.resources.siege_sword -= 1;
                localResult.utbytte.push({ resource: 'siege_sword', amount: -1 });
            } else if (isDefender && garrisonSwords > 0) {
                damage = 25;
                if (room.regions[regionId].garrison) {
                    room.regions[regionId].garrison.swords -= 1;
                    usedGarrison = true;
                }
            }

            s.bossHp -= damage;

            // Stats
            participant.stats = participant.stats || { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0 };
            participant.stats.damageDealt += damage;

            localResult.message = usedGarrison
                ? `⚔️ Du bruker et sverd fra salens garnison og angriper bossen! (-${damage} HP)`
                : damage > 2
                    ? `🗡️ Du angriper bossen med ditt eget sverd! (-${damage} HP). Du har ${actor.resources.siege_sword} igjen.`
                    : `👊 Du slår på bossen med nevene... (-${damage} HP)`;

            return true;
        }

        // 2. Boss & Defense Logic (Pseudo-Tick)
        const fortLevel = room.regions[regionId]?.fortification?.level || 1;
        const arrowChance = ARCHER_VOLLEY_CHANCE + (fortLevel * 0.05);

        if (Date.now() > s.nextBossAttack) {
            // Boss Attacks previous target lane
            const hitLane = s.bossTargetLane;
            const isHit = participant.lane === hitLane;

            // Random Archer Volley (Home Defense)
            const isShot = Math.random() < arrowChance;

            if (isHit || isShot) {
                const garrisonSwords = room.regions[regionId]?.garrison?.swords || 0;
                const bonusArcherDmg = Math.floor(garrisonSwords / 10);
                const currentArcherDmg = ARCHER_DAMAGE + bonusArcherDmg;

                const totalDmg = (isHit ? 20 : 0) + (isShot ? currentArcherDmg : 0);

                // --- ARMOR BUFFER LOGIC ---
                // If player has armor resource, it absorbs damage first (1 armor = 1 damage)
                const isDefender = !!defenders[actor.id];
                const currentArmor = actor.resources?.siege_armor || 0;
                const garrisonArmor = room.regions[regionId]?.garrison?.armor || 0;

                let armorAbsorb = 0;
                let usedGarrisonArmor = false;

                if (currentArmor > 0) {
                    armorAbsorb = Math.min(currentArmor, totalDmg);
                    actor.resources.siege_armor -= armorAbsorb;
                    localResult.utbytte.push({ resource: 'siege_armor', amount: -armorAbsorb });
                } else if (isDefender && garrisonArmor > 0) {
                    armorAbsorb = Math.min(garrisonArmor, totalDmg);
                    if (room.regions[regionId].garrison) {
                        room.regions[regionId].garrison.armor -= armorAbsorb;
                        usedGarrisonArmor = true;
                    }
                }

                const remainingDmg = totalDmg - armorAbsorb;

                participant.hp -= remainingDmg;
                participant.stats = participant.stats || { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0 };
                participant.stats.damageTaken += totalDmg;

                if (isHit) {
                    localResult.message += usedGarrisonArmor
                        ? " 🏰 Slottets garnison-rustning beskyttet deg fra bossens slag!"
                        : armorAbsorb >= 20 ? " 🛡️ Rustningen din tok støtet fra bossen!" : " 💥 AU! Bossen traff deg!";
                }
                if (isShot) {
                    localResult.message += usedGarrisonArmor
                        ? " 🏰 Portens pilarer og garnison-rustning stoppet pilene!"
                        : armorAbsorb >= ARCHER_DAMAGE ? " 🛡️ Rustningen din stoppet pilene!" : ` 🏹 Piler fra murene traff deg! (-${remainingDmg} HP)`;
                }

                if (remainingDmg > 0 && (armorAbsorb > 0)) {
                    localResult.message += ` (Rustningen absorberte ${armorAbsorb} skade)`;
                }
            }

            // Pick NEXT target
            s.bossTargetLane = Math.floor(Math.random() * 3);
            s.nextBossAttack = Date.now() + 5000;
        }

        // 3. Victory Check
        if (s.bossHp <= 0) {
            siege.phase = 'THRONE_ROOM';

            // Initialize Phase 3 Data
            // Detect if Defender is online (Mock logic for now, or check LastActive)
            const defenderId = room.regions[regionId].rulerId;
            const defender = room.players[defenderId || ''];
            const isOnline = defender && (Date.now() - (defender.lastActive || 0) < 60000);

            const occupiers: any = {};
            if (isOnline && defenderId && defender) {
                occupiers[defenderId] = {
                    id: defenderId,
                    name: defender.name,
                    armor: 100, // Home ground advantage/Palace guard armor
                    progress: 20, // Start with a head start for being the owner
                    joinedAt: Date.now()
                };
            }

            siege.throne = {
                mode: isOnline ? 'PVP' : 'PVE',
                occupation: 0,
                plundered: false,
                bossHp: isOnline ? (defender?.status?.hp || 100) * 5 : 5000, // PvP Baron has 5x HP, PvE Steward has 5k
                maxBossHp: isOnline ? (defender?.status?.hp || 100) * 5 : 5000,
                defendingPlayerId: defenderId,
                occupiers: occupiers
            };

            localResult.message = "GARNISONSSJEFEN ER BESEIRET! Dørene til Tronsalen slås opp!";
        }

        return true;
    }

    // --- PHASE 3: THRONE ROOM (Death Race) ---
    if (siege.phase === 'THRONE_ROOM' || (siege.phase as string) === 'THRONE') {
        let t = siege.throne;

        // Init Schema for Race
        if (!t || !t.occupiers) {
            t = t || {};
            t.occupiers = t.occupiers || {};
            t.lastTick = Date.now();
            siege.throne = t;
        }

        // --- TICK LOGIC (Global Loop) ---
        // Iterate ALL occupiers
        const now = Date.now();
        if (now - (t.lastTick || 0) > 1000) {
            const deltaSeconds = Math.floor((now - (t.lastTick || 0)) / 1000);
            t.lastTick = now;

            const occupiersList = Object.values(t.occupiers || {});
            const garrisonArmor = room.regions[regionId]?.garrison?.armor || 0;
            const armorBuffer = Math.min(0.8, (garrisonArmor / 100) * 0.1); // 100 armor = 10% reduction, max 80%

            occupiersList.forEach((occ: any) => {
                // 1. DRAIN ARMOR
                const isBaron = occ.id === room.regions[regionId].rulerId;
                const drainRate = isBaron ? (1 * (1 - armorBuffer)) : 1;
                occ.armor = Math.max(0, occ.armor - (drainRate * deltaSeconds));

                // 2. INCREASE PROGRESS
                const part = (attackers[occ.id] || defenders[occ.id]);
                const dmgDealt = part?.stats?.damageDealt || 0;
                const momentum = 1 + (dmgDealt / 200);

                const progressGain = (1 * momentum * deltaSeconds);
                occ.progress = Math.min(100, occ.progress + progressGain);

                // 3. TRACK STATS
                if (part) {
                    part.stats = part.stats || { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0 };
                    part.stats.ticksOnThrone += deltaSeconds;
                }

                // 4. CHECK FAILURE (Ejection)
                if (occ.armor <= 0) {
                    delete t.occupiers[occ.id];
                    localResult.message = `${occ.name} falt fra tronen! (0 Beleiringsrustning)`;
                } else if (occ.progress >= 100) {
                    delete room.regions[regionId].activeSiege;
                    const region = room.regions[regionId];
                    const isDefenderWin = occ.id === region.rulerId;

                    if (isDefenderWin) {
                        localResult.message = `🛡️ ${occ.name} har knust opprøret og gjenopprettet kontroll over ${region.name}!`;
                    } else {
                        localResult.message = `👑 ${occ.name} har vunnet kappeløpet og TATT TRONEN med makt!`;
                        // Signal direct takeover to the transaction handler
                        (localResult as any).siegeWinnerId = occ.id;
                        (localResult as any).targetRegionId = regionId;
                    }
                }
            });
        }

        // --- ACTIONS ---

        // 1. JOIN RACE (Claim)
        if (action.subType === 'CLAIM_THRONE') {
            // JOIN
            if (!t.occupiers) t.occupiers = {};
            const initialArmor = 10;
            const armor = actor.resources.siege_armor || 0;
            if (armor < initialArmor) {
                localResult.message = `Mangler Beleiringsrustning! Du har ${armor}, men trenger ${initialArmor}.`;
                return false;
            }

            // TAKE ALL ARMOR (Death Race)
            actor.resources.siege_armor = 0;

            t.occupiers[actor.id] = {
                id: actor.id,
                name: actor.name,
                armor: armor, // Use all available armor
                progress: 0, // Everyone starts at 0
                joinedAt: Date.now()
            };

            localResult.message = `${actor.name} kastet seg inn i kampen om tronen med ${armor} rustning!`;
            return true;
        }

        // 2. DONATE ARMOR (Targeted)
        if (action.subType === 'DONATE_ARMOR') {
            const targetId = action.payload?.targetId;
            const target = t.occupiers[targetId];
            if (!target) {
                localResult.message = "Ugyldig mål.";
                return false;
            }

            const myArmor = actor.resources.siege_armor || 0;
            if (myArmor < 1) {
                localResult.message = "Du har ingen beleiringsrustning å gi!";
                return false;
            }

            actor.resources.siege_armor = myArmor - 1;
            target.armor += 1;

            // Stats
            participant.stats = participant.stats || { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0 };
            participant.stats.armorDonated += 1;
            localResult.message = `Donerte rustning til ${target.name}`;
            return true;
        }

        // 3. SUNDER ARMOR (Targeted)
        if (action.subType === 'SUNDER_ARMOR') {
            const targetId = action.payload?.targetId;
            const target = t.occupiers[targetId];
            if (!target) {
                localResult.success = false;
                localResult.message = "Ingen på tronen å angripe!";
                return false;
            }

            target.armor = Math.max(0, target.armor - 1);

            // Stats
            participant.stats = participant.stats || { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0 };
            participant.stats.damageDealt += 1;

            const isBaron = targetId === room.regions[regionId].rulerId;
            const garrisonArmor = room.regions[regionId]?.garrison?.armor || 0;
            if (isBaron && garrisonArmor > 0) {
                localResult.message = `💥 Du angriper ${target.name}! Angrepet er mindre effektivt pga. slottets garnison-skjold.`;
            } else {
                localResult.message = `💥 Angrep ${target.name} på tronen!`;
            }
            return true;
        }

        if (action.subType === 'TICK') return true;

        return true;
    }

    return false;
};

export const handleReinforceGarrison = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const { resource, amount } = action;

    const regionId = actor.regionId === 'capital' || !actor.regionId ? 'capital' : actor.regionId;
    // Check ownership or residency permissions?
    // For now, allow anyone to reinforce their current region's garrison, but War Room UI limits it to Baron/King.
    // If we want common people to donate, we should relax UI restrictions later.

    // Validate Resource
    if (resource !== 'siege_sword' && resource !== 'siege_armor') {
        localResult.success = false;
        localResult.message = "Ugyldig ressurs for garnisonen.";
        return false;
    }

    const currentStock = (actor.resources as any)[resource] || 0;
    if (currentStock < amount) {
        localResult.success = false;
        localResult.message = `Du har ikke nok ${resource}.`;
        return false;
    }

    if (!room.regions[regionId].garrison) {
        room.regions[regionId].garrison = { swords: 0, armor: 0, morale: 100 };
    }

    // Map resource to garrison key
    const garrisonKey = resource === 'siege_sword' ? 'swords' : 'armor';

    // Transfer
    (actor.resources as any)[resource] -= amount;
    if (!room.regions[regionId].garrison) {
        room.regions[regionId].garrison = { swords: 0, armor: 0, morale: 100 };
    }
    (room.regions[regionId].garrison as any)[garrisonKey] = ((room.regions[regionId].garrison as any)[garrisonKey] || 0) + amount;

    localResult.utbytte.push({ resource, amount: -amount });
    localResult.message = `Forsterket garnisonen med ${amount} ${resource === 'siege_sword' ? 'våpen' : 'rustninger'}.`;
    return true;
};

export const handleRepairWalls = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const { amount } = action; // "amount" here means "number of repairs actions"

    const regionId = actor.regionId === 'capital' || !actor.regionId ? 'capital' : actor.regionId;
    const region = room.regions[regionId];

    if (!region.fortification) {
        region.fortification = { hp: 1000, maxHp: 1000, level: 1 };
    }

    const fort = region.fortification;
    if (fort.hp >= fort.maxHp) {
        localResult.success = false;
        localResult.message = "Murene er allerede i perfekt stand.";
        return false;
    }

    // Cost: 10 Stone + 10 Wood per fix
    const stoneCost = 10 * amount;
    const woodCost = 10 * amount;

    if ((actor.resources.stone || 0) < stoneCost || (actor.resources.wood || 0) < woodCost) {
        localResult.success = false;
        localResult.message = "Mangler stein eller ved til reparasjon.";
        return false;
    }

    // Deduct
    actor.resources.stone = (actor.resources.stone || 0) - stoneCost;
    actor.resources.wood = (actor.resources.wood || 0) - woodCost;

    // Repair Logic: 50 HP per action
    const repairAmount = 50 * amount;
    fort.hp = Math.min(fort.maxHp, fort.hp + repairAmount);

    localResult.utbytte.push({ resource: 'stone', amount: -stoneCost });
    localResult.utbytte.push({ resource: 'wood', amount: -woodCost });
    localResult.message = `Reparerte murene (+${repairAmount} HP).`;

    // Also fix gateHp if siege active logic requires? 
    // SiegeHandler uses 'region.fortification.hp' for gate init, but active siege copies it to 'siege.gateHp'.
    // If siege is ACTIVE, we should maybe heal the active gateHp too?
    if (region.activeSiege && (region.activeSiege as any).gateHp !== undefined) {
        (region.activeSiege as any).gateHp += repairAmount; // Simple heal logic
    }

    return true;
};

export const handleUpgradeFortification = (ctx: ActionContext) => {
    const { actor, room, localResult } = ctx;

    const regionId = actor.regionId === 'capital' || !actor.regionId ? 'capital' : actor.regionId;
    const region = room.regions[regionId];

    if (!region.fortification) {
        region.fortification = { hp: 1000, maxHp: 1000, level: 1 };
    }

    const fort = region.fortification;
    const currentLevel = fort.level || 1;
    const nextLevel = currentLevel + 1;

    // Costs
    const goldCost = 5000 * currentLevel;
    const stoneCost = 100 * currentLevel;
    const woodCost = 100 * currentLevel;

    if ((actor.resources.gold || 0) < goldCost || (actor.resources.stone || 0) < stoneCost || (actor.resources.wood || 0) < woodCost) {
        localResult.success = false;
        localResult.message = `Mangler ressurser til oppgradering. Krever ${goldCost}G, ${stoneCost} stein og ${woodCost} ved.`;
        return false;
    }

    // Deduct
    actor.resources.gold -= goldCost;
    actor.resources.stone -= stoneCost;
    actor.resources.wood -= woodCost;

    // Upgrade
    fort.level = nextLevel;
    fort.maxHp += 500;
    fort.hp = fort.maxHp; // Fully heal on upgrade

    localResult.utbytte.push({ resource: 'gold', amount: -goldCost });
    localResult.utbytte.push({ resource: 'stone', amount: -stoneCost });
    localResult.utbytte.push({ resource: 'wood', amount: -woodCost });

    localResult.message = `🤝 Oppgradert festningsverk til nivå ${nextLevel}! Murens styrke er nå ${fort.maxHp} HP.`;
    return true;
};
