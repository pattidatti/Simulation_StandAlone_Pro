import type { ActionContext } from '../../actionTypes';
import type { TacticalCard, PlayerDeck } from '../../../types/war';
import type { Role } from '../../../types/base';

// --- CARD DEFINITIONS (embedded for now, should move to data later) ---
export const CARD_DATABASE: Record<string, Partial<TacticalCard> & { weaponCost?: { type: 'siege_sword' | 'siege_armor', amount: number } }> = {
    'basic_attack': {
        name: 'Sverdlyn (Lett)',
        description: 'Et raskt hogg. Lav energi-kost.',
        tags: ['MELEE'],
        staminaCost: 1,
        weaponCost: { type: 'siege_sword', amount: 1 },
        effectPayload: { damage: 40 }
    },
    'strong_attack': {
        name: 'Tungt Slag (Kraftig)',
        description: 'Knusende slag. Krever mye ressurser.',
        tags: ['MELEE', 'HEAVY'],
        staminaCost: 3,
        weaponCost: { type: 'siege_sword', amount: 2 },
        effectPayload: { damage: 120 }
    },
    'defend': {
        name: 'Skjoldmur (Forsvar)',
        description: 'Blokkerer neste angrep fra bossen.',
        tags: ['DEFENSE'],
        staminaCost: 1,
        weaponCost: { type: 'siege_armor', amount: 1 },
        effectPayload: { armor: 100 } // Logic: Full protection for next hit
    },
    'rally': {
        name: 'Rop om Samling',
        description: 'Inspirer dine allierte til å kjempe videre.',
        tags: ['SUPPORT', 'BUFF'],
        staminaCost: 5,
        cooldown: 15000,
        effectPayload: { groupStamina: 10 }
    },
    'scavenge': {
        name: 'Plyndre',
        description: 'Let etter forsyninger for å gjenvinne energi.',
        tags: ['SUPPORT'],
        staminaCost: 2,
        cooldown: 5000,
        effectPayload: { recoverStamina: 3 }
    },
    'harvest': {
        name: 'Rasjoner',
        description: 'Spis dine rasjoner for å gjenvinne energi.',
        tags: ['SUPPORT'],
        staminaCost: 0, // No cost to eat
        cooldown: 5000,
        effectPayload: { recoverStamina: 5 }
    }
};

export const generateDeck = (_role: Role, _equipment: any): PlayerDeck => {
    const fixedTemplates = ['basic_attack', 'strong_attack', 'defend'];

    const hand: TacticalCard[] = fixedTemplates.map(id => {
        const template = CARD_DATABASE[id];
        return {
            id: id, // Template ID as instance ID for stability
            templateId: id,
            name: template?.name || 'Unknown',
            description: template?.description || '',
            staminaCost: template?.staminaCost || 0,
            tags: template?.tags || [],
            effectPayload: template?.effectPayload || {}
        } as TacticalCard;
    });

    return {
        hand: hand,
        drawPile: [],
        discardPile: [],
        maxHandSize: 3,
        stamina: 10,
        maxStamina: 10,
        lastStaminaRegen: Date.now()
    };
};

export const handleCourtyardAction = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;
    const siege = (room.regions as any)[regionId]?.activeSiege;
    if (!siege) return false;

    // Helper: Get Participant
    const participant = (siege.attackers as any)[actor.id] || (siege.defenders as any)[actor.id];
    if (!participant) {
        localResult.message = "Du deltar ikke i slaget.";
        return false;
    }

    // 0. INIT (Legacy Fix / Refresh)
    if (action.subType === 'INIT_COURTYARD') {
        // Force refresh participant deck to apply new role-based logic
        participant.deck = generateDeck(actor.role, actor.equipment);

        // Safety: Initial Stamina Refill on Sync
        if (participant.deck) {
            participant.deck.stamina = participant.deck.maxStamina;
        }

        // Ensure zone assignment
        if (!participant.zone) {
            participant.zone = 'VANGUARD';
        }

        if (!siege.courtyardState) {
            siege.courtyardState = {
                bossHp: 50000,
                maxBossHp: 50000,
                bossStance: 'DEFENSIVE',
                bossTargetZone: 'VANGUARD',
                nextBossActionAt: Date.now() + 5000,
                zones: {
                    VANGUARD: { id: 'VANGUARD', occupierIds: [actor.id], modifiers: [] },
                    FLANK_LEFT: { id: 'FLANK_LEFT', occupierIds: [], modifiers: [] },
                    FLANK_RIGHT: { id: 'FLANK_RIGHT', occupierIds: [], modifiers: [] },
                    REARGUARD: { id: 'REARGUARD', occupierIds: [], modifiers: [] }
                }
            };
            localResult.message = "Initialiserte Borggård og oppdaterte kortstokk.";
            return true;
        }

        // Add to occupier list if not there
        const currentZone = siege.courtyardState.zones[participant.zone || 'VANGUARD'];
        if (currentZone && !currentZone.occupierIds.includes(actor.id)) {
            currentZone.occupierIds.push(actor.id);
        }

        localResult.message = "Kortstokk og data er synkronisert.";
        return true;
    }

    if (!siege || !siege.courtyardState) return false;

    // 2. MOVE (DISABLED in V9)
    if (action.subType === 'MOVE_ZONE') {
        localResult.message = "Du er låst i kamp med bossen!";
        return false;
    }

    // 2. PLAY CARD
    if (action.subType === 'PLAY_CARD') {
        const templateId = action.payload?.templateId; // Fallback

        const cardDef = CARD_DATABASE[templateId];
        if (!cardDef) return false;

        // Weapon Check & Cost
        if (cardDef.weaponCost) {
            const currentAmount = (actor.resources as any)[cardDef.weaponCost.type] || 0;
            if (currentAmount < cardDef.weaponCost.amount) {
                localResult.success = false;
                localResult.message = `Mangler ${cardDef.weaponCost.type === 'siege_sword' ? 'beleiringssverd' : 'beleiringsrustning'}!`;
                return false;
            }
            // Deduct
            (actor.resources as any)[cardDef.weaponCost.type] -= cardDef.weaponCost.amount;
        }

        // Apply Stamina Cost
        if (participant.deck) {
            participant.deck.stamina -= (cardDef.staminaCost || 0);
        }

        // Logic: EFFECTS & COMBOS
        // In Duel Mode (V9), there are no zones. Targeting is global.
        let damage = cardDef.effectPayload?.damage || 0;
        let msg = `Brukte ${cardDef.name}!`;

        // NO CARD CONSUMPTION (Streamlined V9)

        // Handle Defense Buff specifically
        if (cardDef.tags?.includes('DEFENSE')) {
            participant.shieldActive = true;
            msg = "SKJOLDMUR AKTIV! Du er beskyttet mot neste angrep.";
        }

        // COMBO LOGIC: Removed in Duel Mode (V9) for simplicity.

        // Stamina Recovery
        if (cardDef.effectPayload?.recoverStamina && participant.deck) {
            participant.deck.stamina += cardDef.effectPayload.recoverStamina;
            if (participant.deck.stamina > participant.deck.maxStamina) {
                participant.deck.stamina = participant.deck.maxStamina;
            }
            msg += ` +${cardDef.effectPayload.recoverStamina} Energi.`;
        }

        // Group Recovery
        if (cardDef.effectPayload?.groupStamina) {
            Object.values(siege.attackers).forEach((p: any) => {
                if (p.zone === participant.zone && p.deck) {
                    p.deck.stamina = Math.min(p.deck.maxStamina, p.deck.stamina + (cardDef.effectPayload?.groupStamina || 0));
                }
            });
            msg += " Styrket moralen til dine allierte!";
        }

        // Apply Damage to Boss
        if (damage > 0) {
            siege.courtyardState.bossHp -= damage;

            // Legacy Migration: Ensure stats object exists
            if (!participant.stats) {
                participant.stats = { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0, cardsPlayed: 0 };
            }

            participant.stats.damageDealt += damage;
            participant.stats.cardsPlayed = (participant.stats.cardsPlayed || 0) + 1;
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

    // 3. DRAW CARDS (DISABLED in V8)
    if (action.subType === 'DRAW_CARDS') {
        localResult.message = "Forsyninger er alltid klare.";
        return false;
    }

    // 4. REST (Recover Stamina)
    if (action.subType === 'REST') {
        if (participant.deck) {
            const BREAD_COST = 1;

            if ((actor.resources.bread || 0) < BREAD_COST) {
                localResult.message = "Du trenger brød for å hvile skikkelig!";
                return false;
            }

            const missing = participant.deck.maxStamina - participant.deck.stamina;
            if (missing > 0) {
                actor.resources.bread -= BREAD_COST;
                participant.deck.stamina = participant.deck.maxStamina;
                localResult.message = "Spiste litt brød og tok en pust i bakken. (Full Energi)";
                return true;
            }
            localResult.message = "Du er allerede uthvilt.";
            return false;
        }
    }

    return false;
};
