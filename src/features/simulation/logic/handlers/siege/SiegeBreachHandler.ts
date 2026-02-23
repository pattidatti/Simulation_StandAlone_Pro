import type { ActionContext } from '../../actionTypes';
import type { ActiveSiege, SiegeParticipant, SiegeSide } from '../../../types/war';
import { generateDeck } from './SiegeCourtyardHandler';

// --- CONSTANTS ---
const RAM_PLANKS_REQUIRED = 200;
const RAM_IRON_REQUIRED = 50;
const RAM_DAMAGE = 500;
const RAM_COOLDOWN = 10000; // 10s
const OIL_WOOD_COST = 20;
const OIL_ARMOR_DESTROYED = 5;
const OIL_MAX_USES = 3;
const OIL_COOLDOWN = 30000; // 30s

// --- START SIEGE ---
export const handleStartSiege = (ctx: ActionContext) => {
    const { actor, room, localResult, action } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;
    const isRoyalSiege = regionId === 'capital' && actor.role === 'BARON';

    // 1. Validations
    if (!regionId || (!isRoyalSiege && (regionId === 'capital' || regionId === 'unassigned'))) {
        localResult.success = false;
        localResult.message = (regionId === 'capital' && actor.role !== 'BARON')
            ? "Bare baroner kan gå til beleiring av hovedstaden."
            : "Du må angi en gyldig region for å starte beleiring.";
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

    // 2. Cost Check (500 Swords)
    const playerSwords = actor.resources?.siege_sword || 0;
    if (playerSwords < 500) {
        localResult.success = false;
        localResult.message = `Du trenger minst 500 beleiringssverd for å starte krig! (Har: ${playerSwords})`;
        return false;
    }

    // 3. Initialize Siege
    const fortHP = region.fortification?.hp || 1000;

    const starter: SiegeParticipant = {
        side: 'ATTACKER',
        zone: 'VANGUARD',
        hp: 100,
        maxHp: 100,
        name: actor.name,
        stats: { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0, cardsPlayed: 0 },
        deck: generateDeck(actor.role, actor.equipment)
    };

    const newSiege: ActiveSiege = {
        phase: 'BREACH',
        startedAt: Date.now(),
        lastTick: Date.now(),
        attackers: { [actor.id]: starter },
        defenders: {},
        breachState: {
            gateHp: fortHP,
            maxGateHp: fortHP,
            gateCondition: 'PRISTINE',
            activeWeapons: {},
            ramPool: {
                planks: 0,
                iron: 0,
                ready: false,
                cooldownUntil: 0,
                contributors: {}
            },
            oilState: {
                usesRemaining: OIL_MAX_USES,
                playerCooldowns: {}
            }
        }
    };

    region.activeSiege = newSiege;
    localResult.message = `Beleiringen av ${region.name} har startet!`;
    return true;
};

// --- JOIN SIEGE ---
export const handleJoinSiege = (ctx: ActionContext) => {
    const { actor, room, localResult, action } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;
    if (!regionId || !room.regions[regionId]?.activeSiege) {
        localResult.success = false;
        localResult.message = "Ingen aktiv beleiring her.";
        return false;
    }

    const siege = room.regions[regionId].activeSiege!;

    if (siege.attackers[actor.id] || siege.defenders[actor.id]) {
        localResult.message = "Du deltar allerede.";
        return false;
    }

    const isResident = actor.regionId === regionId;
    const isNoble = ['BARON', 'KING'].includes(actor.role);
    if (!isResident && !isNoble) {
        localResult.success = false;
        localResult.message = "Bare innbyggere eller adelen kan delta i krigføring i dette området.";
        return false;
    }

    // F4: Siege ban check
    const hasBan = (actor.activeBuffs || []).some(
        (b: any) => b.type === 'DEBUFF' && b.label?.includes('beleiring') && b.expiresAt > Date.now()
    );
    if (hasBan) {
        localResult.success = false;
        localResult.message = "💀 Du er utslått og kan ikke joine beleiringer ennå! Vent til debuff-en utløper.";
        return false;
    }

    const side = action.payload?.side as SiegeSide;
    const newParticipant: SiegeParticipant = {
        side: side,
        zone: 'VANGUARD',
        hp: 100,
        maxHp: 100,
        name: actor.name,
        stats: { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0, cardsPlayed: 0 },
        deck: generateDeck(actor.role, actor.equipment)
    };

    if (side === 'DEFENDER') {
        siege.defenders[actor.id] = newParticipant;
        localResult.message = "Du forsvarer murene!";
    } else {
        siege.attackers[actor.id] = newParticipant;
        localResult.message = "Du har sluttet deg til beleiringen!";
    }

    return true;
};

// --- Helper: Update gate condition ---
const updateGateCondition = (bs: NonNullable<ActiveSiege['breachState']>) => {
    const hpPct = bs.gateHp / bs.maxGateHp;
    if (hpPct < 0.25) bs.gateCondition = 'SHATTERED';
    else if (hpPct < 0.5) bs.gateCondition = 'BROKEN';
    else if (hpPct < 0.75) bs.gateCondition = 'CRACKED';
    else bs.gateCondition = 'PRISTINE';
};

// --- Helper: Check phase transition ---
const checkPhaseTransition = (siege: ActiveSiege, localResult: any) => {
    if (siege.breachState && siege.breachState.gateHp <= 0) {
        siege.phase = 'COURTYARD';
        // Courtyard init happens via INIT_COURTYARD in SiegeCourtyardHandler (Risiko R2 fix)
        localResult.message = "⚔️ PORTEN ER KNUST! Storm borggården!";
    }
};

// --- PHASE 1: BREACH ---
export const handleBreachAction = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;
    const siege = room.regions[regionId]?.activeSiege;

    if (!siege || siege.phase !== 'BREACH' || !siege.breachState) return false;
    const bs = siege.breachState;

    // --- TICK (F1: noop for timeout — router handles it) ---
    if (action.subType === 'TICK') return true;

    // --- ATTACK GATE (Sword / Fists) ---
    if (action.subType === 'ATTACK_GATE') {
        let damage = 2; // Fists

        if ((actor.resources.siege_sword || 0) > 0) {
            damage = 25;
            actor.resources.siege_sword -= 1;
            localResult.utbytte.push({ resource: 'siege_sword', amount: -1 });
        }

        bs.gateHp = Math.max(0, bs.gateHp - damage);
        updateGateCondition(bs);

        // Track stats
        const participant = siege.attackers[actor.id] || siege.defenders[actor.id];
        if (participant) {
            participant.stats.damageDealt += damage;
        }

        localResult.message = `🗡️ Angrep porten! (-${damage} HP). Tilstand: ${bs.gateCondition}`;
        checkPhaseTransition(siege, localResult);
        return true;
    }

    // --- CONTRIBUTE TO RAM ---
    if (action.subType === 'CONTRIBUTE_RAM') {
        const planks = Math.max(0, action.payload?.planks || 0);
        const iron = Math.max(0, action.payload?.iron || 0);

        if (planks === 0 && iron === 0) {
            localResult.message = "Du må bidra med noe!";
            return false;
        }

        if (planks > 0 && (actor.resources.plank || 0) < planks) {
            localResult.success = false;
            localResult.message = `Ikke nok planker! (Har: ${actor.resources.plank || 0})`;
            return false;
        }
        if (iron > 0 && (actor.resources.iron_ingot || 0) < iron) {
            localResult.success = false;
            localResult.message = `Ikke nok jernbarrer! (Har: ${actor.resources.iron_ingot || 0})`;
            return false;
        }

        // Deduct & contribute
        if (!actor.resources) {
            localResult.success = false;
            localResult.message = "Fant ikke spillerens ressurser!";
            return false;
        }

        if (planks > 0) {
            actor.resources.plank -= planks;
            bs.ramPool.planks += planks;
            localResult.utbytte.push({ resource: 'plank', amount: -planks });
        }
        if (iron > 0) {
            actor.resources.iron_ingot -= iron;
            bs.ramPool.iron += iron;
            localResult.utbytte.push({ resource: 'iron_ingot', amount: -iron });
        }

        // Track contributors
        if (!bs.ramPool.contributors) bs.ramPool.contributors = {};
        if (!bs.ramPool.contributors[actor.id]) bs.ramPool.contributors[actor.id] = { planks: 0, iron: 0 };
        bs.ramPool.contributors[actor.id].planks += planks;
        bs.ramPool.contributors[actor.id].iron += iron;

        // Check readiness
        bs.ramPool.ready = bs.ramPool.planks >= RAM_PLANKS_REQUIRED && bs.ramPool.iron >= RAM_IRON_REQUIRED;

        const statusPlanks = `${bs.ramPool.planks}/${RAM_PLANKS_REQUIRED}`;
        const statusIron = `${bs.ramPool.iron}/${RAM_IRON_REQUIRED}`;
        localResult.message = `🔨 Bidro til murbrekker! Planker: ${statusPlanks}, Jern: ${statusIron}.${bs.ramPool.ready ? ' MURBREKKER KLAR!' : ''}`;
        return true;
    }

    // --- ACTIVATE RAM ---
    if (action.subType === 'ACTIVATE_RAM') {
        if (!bs.ramPool.ready) {
            localResult.success = false;
            localResult.message = `Murbrekker ikke klar! (Planker: ${bs.ramPool.planks}/${RAM_PLANKS_REQUIRED}, Jern: ${bs.ramPool.iron}/${RAM_IRON_REQUIRED})`;
            return false;
        }

        const now = Date.now();
        if (now < bs.ramPool.cooldownUntil) {
            const remaining = Math.ceil((bs.ramPool.cooldownUntil - now) / 1000);
            localResult.success = false;
            localResult.message = `Murbrekker på cooldown! (${remaining}s gjenstår)`;
            return false;
        }

        // IMPACT
        bs.gateHp = Math.max(0, bs.gateHp - RAM_DAMAGE);
        updateGateCondition(bs);

        // Reset pool
        bs.ramPool = {
            planks: 0,
            iron: 0,
            ready: false,
            cooldownUntil: now + RAM_COOLDOWN,
            contributors: {}
        };

        // Track stats for all participants
        const participant = siege.attackers[actor.id] || siege.defenders[actor.id];
        if (participant) participant.stats.damageDealt += RAM_DAMAGE;

        localResult.message = `🔨💥 MURBREKKER! Massiv skade på porten! (-${RAM_DAMAGE} HP). Tilstand: ${bs.gateCondition}`;
        checkPhaseTransition(siege, localResult);
        return true;
    }

    // --- BOILING OIL (Defenders only) ---
    if (action.subType === 'BOILING_OIL') {
        const isDefender = !!siege.defenders[actor.id];
        if (!isDefender) {
            localResult.success = false;
            localResult.message = "Bare forsvarere kan bruke kokende olje!";
            return false;
        }

        if (bs.oilState.usesRemaining <= 0) {
            localResult.success = false;
            localResult.message = "Ingen olje gjenstår denne beleiringen!";
            return false;
        }

        const now = Date.now();
        if (!bs.oilState.playerCooldowns) bs.oilState.playerCooldowns = {};
        const playerCooldown = bs.oilState.playerCooldowns[actor.id] || 0;
        if (now < playerCooldown) {
            const remaining = Math.ceil((playerCooldown - now) / 1000);
            localResult.success = false;
            localResult.message = `Kokende olje på cooldown! (${remaining}s)`;
            return false;
        }

        if ((actor.resources.wood || 0) < OIL_WOOD_COST) {
            localResult.success = false;
            localResult.message = `Trenger ${OIL_WOOD_COST} ved for kokende olje! (Har: ${actor.resources.wood || 0})`;
            return false;
        }

        // Deduct wood
        actor.resources.wood -= OIL_WOOD_COST;
        localResult.utbytte.push({ resource: 'wood', amount: -OIL_WOOD_COST });

        // Find random attacker with siege_armor
        const attackers = siege.attackers || {};
        const attackerIds = Object.keys(attackers);
        const targets = attackerIds.filter(id => {
            const p = (room.players as any)?.[id];
            return p && (p.resources?.siege_armor || 0) > 0;
        });

        if (targets.length === 0) {
            bs.oilState.usesRemaining -= 1;
            bs.oilState.playerCooldowns[actor.id] = now + OIL_COOLDOWN;
            localResult.message = `🫗 Kokende olje helles ned, men ingen angripere hadde rustning å ødelegge! (${bs.oilState.usesRemaining}/${OIL_MAX_USES} gjenstår)`;
            return true;
        }

        const targetId = targets[Math.floor(Math.random() * targets.length)];
        const target = (room.players as any)[targetId];
        const destroyed = Math.min(OIL_ARMOR_DESTROYED, target.resources.siege_armor || 0);
        target.resources.siege_armor -= destroyed;

        bs.oilState.usesRemaining -= 1;
        bs.oilState.playerCooldowns[actor.id] = now + OIL_COOLDOWN;

        localResult.message = `🫗 Kokende olje! Ødela ${destroyed} beleiringsrustning hos ${target.name}! (${bs.oilState.usesRemaining}/${OIL_MAX_USES} gjenstår)`;
        return true;
    }

    return false;
};
