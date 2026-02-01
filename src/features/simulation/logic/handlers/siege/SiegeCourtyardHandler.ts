import type { ActionContext } from '../../actionTypes';
import type { SiegeZone, TacticalCard, PlayerDeck } from '../../../types/war';
import type { Role } from '../../../types/base';

// --- CARD DEFINITIONS (embedded for now, should move to data later) ---
export const CARD_DATABASE: Record<string, Partial<TacticalCard> & { weaponCost?: { type: 'siege_sword' | 'siege_armor', amount: number } }> = {
    'basic_attack': {
        name: 'Sverdslag',
        description: 'Et raskt hogg som påfører moderat skade.',
        tags: ['MELEE'],
        staminaCost: 2,
        cooldown: 1000,
        weaponCost: { type: 'siege_sword', amount: 1 },
        effectPayload: { damage: 50 }
    },
    'defend': {
        name: 'Skjoldheving',
        description: 'Hev skjoldet for å blokkere innkommende angrep.',
        tags: ['DEFENSE'],
        staminaCost: 1,
        cooldown: 2000,
        weaponCost: { type: 'siege_armor', amount: 1 },
        effectPayload: { armor: 20 }
    },
    'strong_attack': {
        name: 'Hardt Slag',
        description: 'Et kraftig slag som krever mye energi.',
        tags: ['MELEE', 'HEAVY'],
        staminaCost: 4,
        cooldown: 3000,
        weaponCost: { type: 'siege_sword', amount: 2 },
        effectPayload: { damage: 120 }
    },
    'charge': {
        name: 'Stormangrep',
        description: 'Storm fremover. Gjør enorm skade på fienden.',
        tags: ['MELEE', 'MOMENTUM'],
        staminaCost: 4,
        cooldown: 5000,
        weaponCost: { type: 'siege_sword', amount: 2 },
        effectPayload: { damage: 150, selfDamage: 10 }
    },
    'fire_pot': {
        name: 'Oljekrukke',
        description: 'Kast en krukke med olje som gjør sonen brennbar.',
        tags: ['OIL'],
        staminaCost: 3,
        cooldown: 8000,
        weaponCost: { type: 'siege_sword', amount: 1 }, // Costs a "blade" or similar resource as fuel?
        effectPayload: { zoneMod: 'OILY' }
    },
    'torch_toss': {
        name: 'Fakkelkast',
        description: 'Kast en fakkel. Gjør skade og antenner olje!',
        tags: ['IGNITER', 'RANGED'],
        staminaCost: 2,
        cooldown: 3000,
        effectPayload: { damage: 20 }
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

export const generateDeck = (role: Role, _equipment: any): PlayerDeck => {
    let drawPile: string[] = [];
    let maxHand = 4;
    let maxStamina = 10;

    switch (role) {
        case 'SOLDIER':
            drawPile = ['basic_attack', 'strong_attack', 'defend', 'charge', 'fire_pot'];
            maxStamina = 15;
            break;
        case 'PEASANT':
            drawPile = ['basic_attack', 'scavenge', 'torch_toss', 'harvest', 'defend'];
            maxStamina = 8;
            break;
        case 'BARON':
        case 'KING':
            drawPile = ['basic_attack', 'rally', 'fire_pot', 'defend', 'strong_attack', 'charge'];
            maxHand = 5;
            maxStamina = 12;
            break;
        default:
            drawPile = ['basic_attack', 'defend', 'torch_toss'];
            break;
    }

    // Shuffle drawPile (Fisher-Yates) -> actually just random sort for now
    drawPile.sort(() => Math.random() - 0.5);

    // Initial Draw (3 cards)
    // We actually want a full hand? No, let's start with 3.
    // The hand needs to be typed as TacticalCard[] in the interface (ActiveSiege), 
    // BUT the Mock in useSimulationData used strings.
    // And SiegeCourtyard map renders strings OR objects.
    // To satisfy the type checker for PlayerDeck which expects TacticalCard[], we'll cast it or refactor.
    // Given we are in "Execution/Fix" mode: The Interface PlayerDeck says `hand: TacticalCard[]`.
    // But we are pushing strings. This IS a type mismatch we should fix.
    // For now, to stop the nagging and make it work with the current lenient React component:
    // We will hydrate them to partial objects.

    // const initialDraw = drawPile.splice(0, 3);
    // const hand: TacticalCard[] = initialDraw.map(id => ({ 
    //    ...CARD_DATABASE[id] as TacticalCard,
    //    id: Math.random().toString(36).substr(2, 9), // Info: Instance ID
    //    templateId: id
    // }));

    // ACTUALLY: The React component `SiegeCourtyard.tsx` handles both strings and objects due to legacy/mock.
    // But `types/war.ts` strictly defines `hand: TacticalCard[]`.
    // So if we return strings here, we violate the interface in Typescript land, even if JS works.
    // Let's implement valid hydration.

    const initialDraw = drawPile.splice(0, 3);
    const hand: TacticalCard[] = initialDraw.map(id => {
        const template = CARD_DATABASE[id];
        return {
            id: Math.random().toString(36).substr(2, 9),
            templateId: id,
            name: template?.name || 'Unknown',
            description: template?.description || '',
            type: template?.type || 'ATTACK', // Default
            rarity: template?.rarity || 'COMMON',
            staminaCost: template?.staminaCost || 0,
            cooldown: template?.cooldown || 0,
            tags: template?.tags || [],
            effectPayload: template?.effectPayload || {}
        } as TacticalCard;
    });

    return {
        hand: hand, // Using the hydrated hand
        drawPile: drawPile,
        discardPile: [],
        maxHandSize: maxHand,
        stamina: maxStamina,
        maxStamina: maxStamina,
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

    // 1. MOVE ZONES
    if (action.subType === 'MOVE_ZONE') {
        const targetZone = action.payload?.zone as SiegeZone;
        if (!['VANGUARD', 'FLANK_LEFT', 'FLANK_RIGHT', 'REARGUARD'].includes(targetZone)) {
            return false;
        }

        // Remove from old zone list
        const oldZone = siege.courtyardState.zones[participant.zone];
        oldZone.occupierIds = oldZone.occupierIds.filter((id: string) => id !== actor.id);

        // Add to new
        participant.zone = targetZone;
        siege.courtyardState.zones[targetZone].occupierIds.push(actor.id);

        localResult.message = `Forflyttet til ${targetZone}`;
        return true;
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
        // Check active modifiers in current zone
        const zoneId = participant.zone || 'VANGUARD';
        const currentZoneState = siege.courtyardState.zones[zoneId];
        let damage = cardDef.effectPayload?.damage || 0;
        let msg = `Brukte ${cardDef.name}!`;

        // Card Consumption
        if (participant.deck) {
            const cardIndex = participant.deck.hand.findIndex((c: any) =>
                (typeof c === 'string' ? c === templateId : c.templateId === templateId)
            );
            if (cardIndex !== -1) {
                participant.deck.hand.splice(cardIndex, 1);
                participant.deck.discardPile.push(templateId);
            }
        }

        // COMBO: IGNITER on OILY zone
        if (cardDef.tags?.includes('IGNITER') && currentZoneState?.modifiers?.includes('OILY')) {
            damage *= 3; // CRIT!
            msg += " KOMBO! 🔥 Oljen tok fyr! (3x Skade)";
            // Clear modifier
            currentZoneState.modifiers = currentZoneState.modifiers.filter((m: string) => m !== 'OILY');
        }

        // Plain OIL effect
        if (cardDef.tags?.includes('OIL') && currentZoneState) {
            if (!currentZoneState.modifiers) currentZoneState.modifiers = [];
            currentZoneState.modifiers.push('OILY');
            msg += " Området er nå dekket av olje...";
        }

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

    // 3. DRAW CARDS (Resupply)
    if (action.subType === 'DRAW_CARDS') {
        // Legacy/Empty Check: If no deck, give them one.
        if (!participant.deck || !participant.deck.hand) {
            participant.deck = generateDeck(actor.role, actor.equipment);
            localResult.message = "Forsyninger mottatt! (Nytt dekk)";
            return true;
        }

        const deck = participant.deck;
        const cardsNeeded = (deck.maxHandSize || 5) - deck.hand.length;

        if (cardsNeeded <= 0) {
            localResult.message = "Hånden din er allerede full.";
            return false;
        }

        // Draw logic
        let drawnCount = 0;
        while (drawnCount < cardsNeeded) {
            if (deck.drawPile.length === 0) {
                if (deck.discardPile.length === 0) break; // No cards left at all
                // Reshuffle
                deck.drawPile = [...deck.discardPile].sort(() => Math.random() - 0.5);
                deck.discardPile = [];
                localResult.message = "Resirkulerer kortstokken...";
            }

            const cardId = deck.drawPile.pop();
            if (cardId) {
                // Hydrate card (copy-paste from generateDeck hydration logic)
                const template = CARD_DATABASE[cardId];
                const cardObj: TacticalCard = {
                    id: Math.random().toString(36).substr(2, 9),
                    templateId: cardId,
                    name: template?.name || 'Unknown',
                    description: template?.description || '',
                    type: template?.type || 'ATTACK',
                    rarity: template?.rarity || 'COMMON',
                    staminaCost: template?.staminaCost || 0,
                    cooldown: template?.cooldown || 0,
                    tags: template?.tags || [],
                    effectPayload: template?.effectPayload || {}
                } as TacticalCard;

                deck.hand.push(cardObj);
                drawnCount++;
            }
        }

        // Reset/Refill Stamina a bit on manual resupply? Maybe not, that's exploitable.
        // But if they are stuck with 0 stamina and 0 cards, they are bricked.
        // Let's assume Stamina regenerates over time (needs a tick handler) OR we give a small boost here.
        // For now, just cards.

        localResult.message = `Trakk ${drawnCount} nye kort.`;
        return true;
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
