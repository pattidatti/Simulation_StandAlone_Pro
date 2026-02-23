import type { ActionContext } from '../../actionTypes';
import type { TacticalCard, PlayerDeck } from '../../../types/war';
import type { Role } from '../../../types/base';

// --- CARD DEFINITIONS ---
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
        description: 'Aktiverer skjold i 2 sekunder. Blokkerer angrep, men du kan ikke angripe.',
        tags: ['DEFENSE'],
        staminaCost: 1,
        weaponCost: { type: 'siege_armor', amount: 1 },
        effectPayload: { shieldDuration: 2000, blocksAttack: true }
    },
};

export const generateDeck = (_role: Role, _equipment: any): PlayerDeck => {
    const fixedTemplates = ['basic_attack', 'strong_attack', 'defend'];

    const hand: TacticalCard[] = fixedTemplates.map(id => {
        const template = CARD_DATABASE[id];
        return {
            id: id,
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

// --- BOSS AI TICK (runs on every action) ---
const processBossAI = (siege: any, room: any) => {
    const cs = siege.courtyardState;
    if (!cs) return;

    const now = Date.now();

    // Phase transition based on timer
    if (now >= cs.bossAttackTimer) {
        if (cs.bossAttackPhase === 'IDLE') {
            cs.bossAttackPhase = 'WINDUP';
            cs.bossAttackTimer = now + 2000; // 2s windup
        } else if (cs.bossAttackPhase === 'WINDUP') {
            cs.bossAttackPhase = 'STRIKE';
            cs.bossAttackTimer = now + 500; // Brief strike moment

            // DEAL DAMAGE to all participants without active shields
            const allParticipants = { ...siege.attackers, ...siege.defenders };
            Object.entries(allParticipants).forEach(([id, p]: [string, any]) => {
                const shield = cs.playerShields?.[id];
                const isShielded = shield && shield.expiresAt > now;
                if (!isShielded) {
                    p.hp = (p.hp || 100) - 30;
                    if (!p.stats) p.stats = { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0, cardsPlayed: 0 };
                    p.stats.damageTaken += 30;
                }
            });

            // --- KO CHECK (F4) — remove players with HP <= 0 ---
            Object.entries(allParticipants).forEach(([id, p]: [string, any]) => {
                if ((p.hp || 100) <= 0) {
                    delete siege.attackers[id];
                    delete siege.defenders[id];

                    // Apply 1hr siege ban debuff
                    const player = room?.players?.[id];
                    if (player) {
                        if (!player.activeBuffs) player.activeBuffs = [];
                        player.activeBuffs.push({
                            id: `siege_ban_${now}_${id}`,
                            type: 'DEBUFF',
                            value: 0,
                            label: '💀 Slått ut av beleiring',
                            description: 'Du ble beseiret i kamp. Kan ikke joine beleiringer i 1 time.',
                            expiresAt: now + 3600000
                        });
                    }
                }
            });
        } else if (cs.bossAttackPhase === 'STRIKE') {
            cs.bossAttackPhase = 'IDLE';
            cs.bossAttackTimer = now + 3000; // 3s idle
        }
    }

    // Clean expired shields
    if (cs.playerShields) {
        Object.keys(cs.playerShields).forEach(id => {
            if (cs.playerShields[id].expiresAt <= now) {
                delete cs.playerShields[id];
            }
        });
    }
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

    // 0. INIT_COURTYARD
    if (action.subType === 'INIT_COURTYARD') {
        participant.deck = generateDeck(actor.role, actor.equipment);

        if (participant.deck) {
            participant.deck.stamina = participant.deck.maxStamina;
        }

        if (!participant.zone) {
            participant.zone = 'VANGUARD';
        }

        if (!siege.courtyardState) {
            const garrisonArmor = room.regions[regionId]?.garrison?.armor || 0;
            const baseBossHp = 50000;
            const extraBossHp = garrisonArmor * 20;

            siege.courtyardState = {
                bossHp: baseBossHp + extraBossHp,
                maxBossHp: baseBossHp + extraBossHp,
                bossStance: 'DEFENSIVE',
                bossTargetZone: 'VANGUARD',
                nextBossActionAt: Date.now() + 5000,
                zones: {
                    VANGUARD: { id: 'VANGUARD', occupierIds: [actor.id], modifiers: [] },
                    FLANK_LEFT: { id: 'FLANK_LEFT', occupierIds: [], modifiers: [] },
                    FLANK_RIGHT: { id: 'FLANK_RIGHT', occupierIds: [], modifiers: [] },
                    REARGUARD: { id: 'REARGUARD', occupierIds: [], modifiers: [] }
                },
                bossAttackPhase: 'IDLE',
                bossAttackTimer: Date.now() + 3000,
                playerShields: {}
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

    // --- BOSS AI TICK (runs on every action) ---
    processBossAI(siege, room);

    // --- TICK (F1: noop for timeout enforcement from SiegeContainer) ---
    if (action.subType === 'TICK') {
        return true;
    }

    // MOVE (DISABLED)
    if (action.subType === 'MOVE_ZONE') {
        localResult.message = "Du er låst i kamp med bossen!";
        return false;
    }

    // PLAY CARD
    if (action.subType === 'PLAY_CARD') {
        const templateId = action.payload?.templateId;
        const cardDef = CARD_DATABASE[templateId];
        if (!cardDef) return false;

        const cs = siege.courtyardState;

        // --- SHIELD BLOCK CHECK: Can't attack while shield is active ---
        if (cardDef.tags?.includes('MELEE') || cardDef.tags?.includes('HEAVY')) {
            const shield = cs.playerShields?.[actor.id];
            if (shield && shield.expiresAt > Date.now()) {
                localResult.message = "⛔ Du kan ikke angripe mens skjoldet er oppe!";
                return false;
            }
        }

        // Weapon Check & Cost
        if (cardDef.weaponCost) {
            const currentAmount = (actor.resources as any)[cardDef.weaponCost.type] || 0;
            if (currentAmount < cardDef.weaponCost.amount) {
                localResult.success = false;
                localResult.message = `Mangler ${cardDef.weaponCost.type === 'siege_sword' ? 'beleiringssverd' : 'beleiringsrustning'}!`;
                return false;
            }
            (actor.resources as any)[cardDef.weaponCost.type] -= cardDef.weaponCost.amount;
        }

        // Apply Stamina Cost
        if (participant.deck) {
            participant.deck.stamina -= (cardDef.staminaCost || 0);
        }

        let damage = cardDef.effectPayload?.damage || 0;
        let msg = `Brukte ${cardDef.name}!`;

        // --- SHIELD ACTIVATION (2s timed) ---
        if (cardDef.effectPayload?.shieldDuration) {
            if (!cs.playerShields) cs.playerShields = {};
            cs.playerShields[actor.id] = {
                expiresAt: Date.now() + cardDef.effectPayload.shieldDuration
            };
            msg = "🛡️ SKJOLDMUR AKTIV! (2s) Du er beskyttet — men kan ikke angripe.";
        }

        // Stamina Recovery
        if (cardDef.effectPayload?.recoverStamina && participant.deck) {
            participant.deck.stamina += cardDef.effectPayload.recoverStamina;
            if (participant.deck.stamina > participant.deck.maxStamina) {
                participant.deck.stamina = participant.deck.maxStamina;
            }
            msg += ` +${cardDef.effectPayload.recoverStamina} Energi.`;
        }



        // Apply Damage to Boss
        if (damage > 0) {
            cs.bossHp -= damage;

            if (!participant.stats) {
                participant.stats = { damageDealt: 0, damageTaken: 0, armorDonated: 0, ticksOnThrone: 0, cardsPlayed: 0 };
            }
            participant.stats.damageDealt += damage;
            participant.stats.cardsPlayed = (participant.stats.cardsPlayed || 0) + 1;
        }

        // VICTORY CHECK
        if (cs.bossHp <= 0) {
            siege.phase = 'THRONE_ROOM';
            siege.throneState = {
                mode: 'PVP',
                occupation: 0,
                plundered: false,
                bossHp: 50000,
                maxBossHp: 50000,
                defendingPlayerId: regionId === 'capital' ? undefined : room.regions[regionId]?.rulerId,
                occupiers: {},
                lastTick: Date.now()
            };
            msg += " ⚔️ GARNISONSSJEFEN FALT! Mot tronsalen!";
        }

        localResult.message = msg;
        return true;
    }

    // DRAW CARDS (DISABLED)
    if (action.subType === 'DRAW_CARDS') {
        localResult.message = "Forsyninger er alltid klare.";
        return false;
    }

    // REST (Recover Stamina)
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
