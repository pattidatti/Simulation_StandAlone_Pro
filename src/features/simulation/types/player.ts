import type { Role, SkillType } from './base';
import type { Resources, EquipmentItem, EquipmentSlot } from './item';

export interface Buff {
    id: string;
    type: string;
    value: number;
    label: string;
    description?: string;
    expiresAt: number;
    sourceItem?: string;
}

export interface SkillData {
    level: number;
    xp: number;
    maxXp: number;
}

export interface PlayerStats {
    xp: number;
    level: number;
    reputation: number;
    contribution: number;
}

export interface PlayerStatus {
    hp: number;
    morale: number;
    stamina: number;
    legitimacy: number;
    authority: number;
    loyalty: number;
    isJailed: boolean;
    isFrozen: boolean;
    thought?: string;
    lastAction?: string;
    lastTick?: number;
}

export interface RoleStats {
    level: number;
    xp: number;
    skills: Record<SkillType, SkillData>;
}

export interface ActiveProcess {
    id: string;
    type: 'CROP' | 'CRAFT' | 'COOP' | 'MILL' | 'WELL' | 'COOLDOWN';
    itemId: string;
    startedAt: number;
    duration: number;
    readyAt: number;
    notified: boolean;
    locationId: string;
    maintainCount?: number;
    yieldBonus?: number;
}

export interface Achievement {
    id: string;
    name: string;
    icon: string;
    unlockedAt: number;
}

export interface SimulationPlayer {
    id: string;
    uid?: string;
    name: string;
    role: Role;
    regionId: string;
    resources: Resources;
    stats: PlayerStats;
    status: PlayerStatus;
    activeBuffs?: Buff[];
    upgrades: string[];
    skills: Record<SkillType, SkillData>;
    equipment: Partial<Record<EquipmentSlot, EquipmentItem>>;
    achievements?: Achievement[];
    inventory?: EquipmentItem[];
    history?: string[];
    avatar?: string;
    activeProcesses?: ActiveProcess[];
    buildings?: Record<string, {
        level: number;
        progress: Partial<Resources>;
    }>;
    minigameProgress?: Record<string, number>; // e.g., { ride_easy: 3, ride_medium: 1 }
    horseCustomization?: {
        skinId: string;
        maneColor: string;
        hatId?: string;
        unlockedSkins: string[];
        unlockedManeColors: string[];
        unlockedHats: string[];
    };
    roleStats?: Partial<Record<Role, RoleStats>>;
    online?: boolean;
    hasSeenIntro?: boolean;
    lastActive: number;
}

export interface SimulationAccount {
    uid: string;
    displayName: string;
    globalXp: number;
    globalLevel: number;
    totalGoldEarned: number;
    unlockedAchievements: string[];
    characterHistory: {
        roomPin: string;
        name: string;
        role: Role;
        level: number;
        timestamp: number;
    }[];
    activeSessions?: {
        roomPin: string;
        name: string;
        role: Role;
        regionId?: string;
        lastPlayed: number;
    }[];
    lastActive: number;
}

export interface PlayerUpgrade {
    id: string;
    name: string;
    description: string;
    cost: Partial<Resources>;
    benefit: string;
}

export interface Quest {
    id: string;
    name: string;
    description: string;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    progress: number;
    target: number;
}
