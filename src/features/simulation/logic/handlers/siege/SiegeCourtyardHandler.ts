import type { ActionContext } from '../../actionTypes';
import type { ActiveSiege, SiegeZone, TacticalCard } from '../../../types/war';

// --- CARD DEFINITIONS (embedded for now, should move to data later) ---
const CARD_DATABASE: Record<string, Partial<TacticalCard>> = {
    'basic_attack': {
        name: 'Sverdslag',
        tags: ['MELEE'],
        staminaCost: 2,
        cooldown: 1000,
        effectPayload: { damage: 50 }
    },
    'defend': {
        name: 'Skjoldheving',
        tags: ['DEFENSE'],
        staminaCost: 1,
        cooldown: 2000,
        effectPayload: { armor: 20 }
    },
    'charge': {
        name: 'Stormangrep',
        tags: ['MELEE', 'MOMENTUM'],
        staminaCost: 4,
        cooldown: 5000,
        effectPayload: { damage: 150, selfDamage: 10 }
    },
    'fire_pot': {
        name: 'Oljekrukke',
        tags: ['OIL'],
        staminaCost: 3,
        cooldown: 8000,
        effectPayload: { zoneMod: 'OILY' }
    },
    'torch_toss': {
        name: 'Fakkelkast',
        tags: ['IGNITER', 'RANGED'],
        staminaCost: 2,
        cooldown: 3000,
        effectPayload: { damage: 20 }
    }
};

export const handleCourtyardAction = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;
    const siege = room.regions[regionId].activeSiege;

    if (!siege || siege.phase !== 'COURTYARD' || !siege.courtyardState) return false;

    // Helper: Get Participant
    const participant = siege.attackers[actor.id] || siege.defenders[actor.id];
    if (!participant) {
        localResult.message = "Du deltar ikke i slaget.";
        return false;
    }

    // 1. MOVE ZONES
    if (action.subType === 'MOVE_ZONE') {
        const targetZone = action.payload?.zone as SiegeZone;
        if (!['VANGUARD', 'FLANK_LEFT', 'FLANK_RIGHT', 'REARGUARD'].includes(targetZone)) {
            return false;
        }

        // Remove from old zone list
        const oldZone = siege.courtyardState.zones[participant.zone];
        oldZone.occupierIds = oldZone.occupierIds.filter(id => id !== actor.id);

        // Add to new
        participant.zone = targetZone;
        siege.courtyardState.zones[targetZone].occupierIds.push(actor.id);

        localResult.message = `Forflyttet til ${targetZone}`;
        return true;
    }

    // 2. PLAY CARD
    if (action.subType === 'PLAY_CARD') {
        const cardId = action.payload?.cardInstanceId; // For specific instance tracking in hand
        const templateId = action.payload?.templateId; // Fallback

        const cardDef = CARD_DATABASE[templateId];
        if (!cardDef) return false;

        // Stamina Check
        if (participant.deck && participant.deck.stamina < (cardDef.staminaCost || 0)) {
            localResult.success = false;
            localResult.message = "Ikke nok utholdenhet!";
            return false;
        }

        // Apply Cost
        if (participant.deck) {
            participant.deck.stamina -= (cardDef.staminaCost || 0);
        }

        // Logic: EFFECTS & COMBOS
        // Check active modifiers in current zone
        const currentZoneState = siege.courtyardState.zones[participant.zone];
        let damage = cardDef.effectPayload?.damage || 0;
        let msg = `Brukte ${cardDef.name}!`;

        // COMBO: IGNITER on OILY zone
        if (cardDef.tags?.includes('IGNITER') && currentZoneState.modifiers.includes('OILY')) {
            damage *= 3; // CRIT!
            msg += " KOMBO! 🔥 Oljen tok fyr! (3x Skade)";
            // Clear modifier
            currentZoneState.modifiers = currentZoneState.modifiers.filter(m => m !== 'OILY');
        }

        // Plain OIL effect
        if (cardDef.tags?.includes('OIL')) {
            currentZoneState.modifiers.push('OILY');
            msg += " Området er nå dekket av olje...";
        }

        // Apply Damage to Boss
        if (damage > 0) {
            siege.courtyardState.bossHp -= damage;
            participant.stats.damageDealt += damage;
            participant.stats.cardsPlayed += 1;
        }

        // VICTORY CHECK
        if (siege.courtyardState.bossHp <= 0) {
            siege.phase = 'THRONE_ROOM';
            siege.throneState = {
                mode: 'PVP',
                occupation: 0,
                plundered: false,
                bossHp: 50000,
                maxBossHp: 50000,
                defendingPlayerId: regionId === 'capital' ? undefined : room.regions[regionId].rulerId, // If capital, no single ruler maybe?
                occupiers: {},
                lastTick: Date.now()
            };
            msg += " GARNISONSSJEFEN FALT! Mot tronsalen!";
        }

        localResult.message = msg;
        return true;
    }

    return false;
};
