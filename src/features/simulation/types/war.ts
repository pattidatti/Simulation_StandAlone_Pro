// --- ENUMS & CONSTANTS ---
export type SiegePhase = 'BREACH' | 'COURTYARD' | 'THRONE_ROOM';
export type SiegeZone = 'VANGUARD' | 'FLANK_LEFT' | 'FLANK_RIGHT' | 'REARGUARD';
export type SiegeSide = 'ATTACKER' | 'DEFENDER';

// --- CARD SYSTEM ---
export type CardRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
export type CardType = 'ATTACK' | 'DEFENSE' | 'SUPPORT' | 'TACTIC';

export interface TacticalCard {
    id: string; // Unique instance ID
    templateId: string; // e.g. "fire_arrow"
    name: string;
    description: string;
    type: CardType;
    rarity: CardRarity;
    staminaCost: number;
    cooldown: number;
    tags: string[]; // [FLAMMABLE], [HEAVY], etc.
    effectPayload: any;
}

export interface PlayerDeck {
    hand: TacticalCard[];
    drawPile: string[]; // List of templateIDs
    discardPile: string[]; // List of templateIDs
    maxHandSize: number;
    stamina: number;
    maxStamina: number;
    lastStaminaRegen: number;
}

// --- BREACH PHASE SPECIFIC ---
export type BreachWeapon = 'RAM' | 'LADDER' | 'CATAPULT';

export interface RamPool {
    planks: number;
    iron: number;
    ready: boolean;
    cooldownUntil: number;
    contributors: Record<string, { planks: number, iron: number }>;
}

export interface OilState {
    usesRemaining: number;
    playerCooldowns: Record<string, number>;
}

export interface BreachData {
    gateHp: number;
    maxGateHp: number;
    gateCondition: 'PRISTINE' | 'CRACKED' | 'BROKEN' | 'SHATTERED';
    activeWeapons: Record<string, { type: BreachWeapon, hp: number, ownerId: string }>;
    ramPool: RamPool;
    oilState: OilState;
}

// --- COURTYARD PHASE SPECIFIC ---
export interface CourtyardZoneState {
    id: SiegeZone;
    occupierIds: string[];
    modifiers: string[]; // e.g. "Obscured by Smoke"
}

export interface CourtyardData {
    bossHp: number;
    maxBossHp: number;
    bossStance: 'AGGRESSIVE' | 'DEFENSIVE' | 'CHANNELING';
    bossTargetZone: SiegeZone | null;
    nextBossActionAt: number;
    zones: Record<SiegeZone, CourtyardZoneState>;
    bossAttackPhase: 'IDLE' | 'WINDUP' | 'STRIKE';
    bossAttackTimer: number;
    playerShields: Record<string, { expiresAt: number }>;
}

// --- THRONE PHASE SPECIFIC ---
export interface ThroneOccupier {
    id: string;
    name: string;
    armor: number;
    progress: number;
    joinedAt: number;
    legitimacySnapshot: number; // Snapshot at join time to calculate drain
}

export interface ThroneRoomData {
    mode: 'PVP' | 'PVE';
    occupation: number;
    plundered: boolean;
    bossHp: number;
    maxBossHp: number;
    defendingPlayerId?: string;
    occupiers: Record<string, ThroneOccupier>;
    lastTick: number;
}

// --- CORE STATE ---
export interface Garrison {
    swords: number;
    armor: number;
    morale: number;
    lastDonationDuringSiege?: number;
}

export interface Fortification {
    hp: number;
    maxHp: number;
    level: number;
}

export interface SiegeStats {
    damageDealt: number;
    damageTaken: number;
    armorDonated: number;
    ticksOnThrone: number;
    cardsPlayed: number;
}

export interface SiegeParticipant {
    side: SiegeSide;
    zone: SiegeZone; // Replaces 'lane'
    hp: number;
    maxHp: number;
    name: string;
    deck?: PlayerDeck; // NEW: Card System State
    stats: SiegeStats;
}

export interface ActiveSiege {
    phase: SiegePhase;
    startedAt: number;
    lastTick: number;

    // Roster
    attackers: Record<string, SiegeParticipant>;
    defenders: Record<string, SiegeParticipant>;

    // Phase Specific Data (Nullable based on phase)
    breachState?: BreachData;
    courtyardState?: CourtyardData;
    throneState?: ThroneRoomData;
}

