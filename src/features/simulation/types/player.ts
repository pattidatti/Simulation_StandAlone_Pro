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
    type: 'CROP' | 'CRAFT' | 'COOP' | 'MILL' | 'WELL' | 'COOLDOWN' | 'HIVE';
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
    homeRegionId?: string;
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
    weaponRack?: {
        level: number;
        lastPolishedAt?: number;
        slots: {
            id: string; // Slot ID (0, 1, 2...)
            type: 'TROPHY' | 'ITEM';
            itemId: string;
            instanceId?: string;
        }[];
        unlockedTrophies: string[];
    };
    roleStats?: Partial<Record<Role, RoleStats>>;
    caravan?: {
        level: number;
        inventory: Partial<Resources>;
        durability: number;
        upgrades: string[];
        customization?: {
            chassis: string;
            wheels: string;
            cover: string;
            lanterns: string;
            flag: string;
            skin: string;
            companion: string;
            trail: string;
            decor: string;
            unlocked: string[];
        };
    };
    boat?: {
        stage: number;        // 0-4
        model: 'standard' | 'sloop' | 'cog' | 'galleon'; // NEW: Architecture model
        componentLevels: {    // NEW: Detailed upgrades
            sails: number;
            cannons: number;
            nets: number;
            hull: number;
        };
        hullType: string;     // Legacy: 'oak_standard' (Keep for back-compat until full migration)
        stamina: number;      // Actual boat stamina/fuel
        durability: number;
        upgrades: string[];
        customization?: {
            color: string;
            flagId: string;
            figurehead: string;
            sailPattern?: 'none' | 'striped' | 'emblem'; // NEW
            sternDecor?: string; // NEW
            unlocked: string[];
        };
        // Combat Stats
        hp: number;
        maxHp: number;
        cannons: number;
        cannonballs: number;
        isDamaged: boolean;
        position?: { x: number, y: number, rotation: number };
    };
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
    unlockedAchievements: Record<string, number>;
    characterHistory: {
        roomPin: string;
        name: string;
        role: Role;
        level: number;
        timestamp: number;
    }[];
    activeSessions?: Record<string, {
        roomPin: string;
        name: string;
        role: Role;
        regionId?: string;
        lastPlayed: number;
    }>;
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
