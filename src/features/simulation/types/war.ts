export interface Garrison {
    swords: number;
    armor: number;
    morale: number;
}

export interface Fortification {
    hp: number;
    maxHp: number;
    level: number;
}

export interface ThroneOccupier {
    id: string;
    name: string;
    armor: number;
    progress: number;
    joinedAt: number;
}

export interface ThroneRoomData {
    mode: 'PVP' | 'PVE';
    occupation: number;
    plundered: boolean;
    bossHp: number;
    maxBossHp: number;
    defendingPlayerId?: string;
    occupiers?: Record<string, ThroneOccupier>;
    lastTick?: number;
}

export interface SiegeStats {
    damageDealt: number;
    damageTaken: number;
    armorDonated: number;
    ticksOnThrone: number;
}

export interface SiegeParticipant {
    lane: 0 | 1 | 2;
    hp: number;
    name: string;
    stats?: SiegeStats;
}

export interface ActiveSiege {
    phase: 'BREACH' | 'COURTYARD' | 'THRONE_ROOM';
    startedAt: number;
    lastTick: number;
    attackers: Record<string, SiegeParticipant>;
    defenders: Record<string, SiegeParticipant>;
    bossHp?: number;
    maxBossHp?: number;
    bossTargetLane?: 0 | 1 | 2;
    throne?: ThroneRoomData;
}
