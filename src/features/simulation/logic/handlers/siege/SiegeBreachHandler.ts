import type { ActionContext } from '../../actionTypes';
import type { ActiveSiege, SiegeParticipant, SiegeSide } from '../../../types/war';
import { generateDeck } from './SiegeCourtyardHandler';

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

    // 3. Initialize Siege (New Structure)
    const fortHP = region.fortification?.hp || 1000;

    // Initial Participant (The Starter)
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
            activeWeapons: {}
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

    // Check Membership
    if (siege.attackers[actor.id] || siege.defenders[actor.id]) {
        localResult.message = "Du deltar allerede.";
        return false;
    }

    // Eligibility: Resident or Noble
    const isResident = actor.regionId === regionId;
    const isNoble = ['BARON', 'KING'].includes(actor.role);
    if (!isResident && !isNoble) {
        localResult.success = false;
        localResult.message = "Bare innbyggere eller adelen kan delta i krigføring i dette området.";
        return false;
    }

    const side = action.payload?.side as SiegeSide;
    const newParticipant: SiegeParticipant = {
        side: side,
        zone: 'VANGUARD', // Default zone
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

// --- PHASE 1: BREACH ---
export const handleBreachAction = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;
    const siege = room.regions[regionId].activeSiege;

    if (!siege || siege.phase !== 'BREACH' || !siege.breachState) return false;

    // ATTACK GATE (Basic)
    if (action.subType === 'ATTACK_GATE') {

        let damage = 2; // Fists

        // Resource consumption logic could go here (Swords/Arrows)
        if (actor.resources.siege_sword > 0) {
            damage = 25;
            actor.resources.siege_sword -= 1;
            localResult.utbytte.push({ resource: 'siege_sword', amount: -1 });
        }

        siege.breachState.gateHp = Math.max(0, siege.breachState.gateHp - damage);

        // Visual Feedback based on HP %
        const hpPct = siege.breachState.gateHp / siege.breachState.maxGateHp;
        if (hpPct < 0.25) siege.breachState.gateCondition = 'SHATTERED';
        else if (hpPct < 0.5) siege.breachState.gateCondition = 'BROKEN';
        else if (hpPct < 0.75) siege.breachState.gateCondition = 'CRACKED';

        localResult.message = `Angrep porten! (-${damage} HP). Tilstand: ${siege.breachState.gateCondition}`;

        // Phase Transition
        if (siege.breachState.gateHp <= 0) {
            siege.phase = 'COURTYARD';
            siege.courtyardState = {
                bossHp: 10000, // Default, logic to scale this is in CourtyardHandler init
                maxBossHp: 10000,
                bossStance: 'DEFENSIVE',
                bossTargetZone: 'VANGUARD',
                nextBossActionAt: Date.now() + 5000,
                zones: {
                    VANGUARD: { id: 'VANGUARD', occupierIds: [], modifiers: [] },
                    FLANK_LEFT: { id: 'FLANK_LEFT', occupierIds: [], modifiers: [] },
                    FLANK_RIGHT: { id: 'FLANK_RIGHT', occupierIds: [], modifiers: [] },
                    REARGUARD: { id: 'REARGUARD', occupierIds: [], modifiers: [] }
                }
            };
            localResult.message = "PORTEN ER KNUST! Storm borggården!";
        }
        return true;
    }

    return false;
};
