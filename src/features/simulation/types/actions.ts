import type { Resources } from './item';

export interface ActionCost extends Partial<Resources> {
    stamina?: number;
}

export interface ActionResult {
    success: boolean;
    timestamp: number;
    message: string;
    utbytte: {
        resource: string;
        amount: number;
        id?: string;
        name?: string;
        icon?: string;
        type?: 'RESOURCE' | 'ITEM';
        jackpot?: boolean;
        bonus?: boolean;
    }[];
    xp: {
        skill: string;
        amount: number;
        levelUp?: boolean;
    }[];
    durability: {
        slot: string;
        item: string;
        amount: number;
        broken?: boolean;
    }[];
}

export type EventType = 'THEFT' | 'TRADE' | 'WAR' | 'JUDGEMENT' | 'MARKET_UPDATE' | 'GLOBAL_ALERT' | 'LEGITIMACY' | 'MILL' | 'CRAFT';

export interface SimulationEvent {
    id: string;
    type: EventType;
    sourceId: string;
    targetId?: string;
    payload: any;
    timestamp: number;
    expiresAt: number;
}
