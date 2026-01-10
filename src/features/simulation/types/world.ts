import type { Role, WeatherType, GameStatus } from './base';
import type { Resources } from './item';
import type { SimulationPlayer } from './player';
import type { CoupData, ElectionState, DiplomacyMessage, TradeOffer } from './politics';
import type { ActiveSiege, Garrison, Fortification } from './war';

export interface MarketItem {
    price: number;
    stock: number;
    demand: number;
}

export interface SimulationMarket {
    grain: MarketItem;
    flour: MarketItem;
    bread: MarketItem;
    wood: MarketItem;
    plank: MarketItem;
    iron_ore: MarketItem;
    iron_ingot: MarketItem;
    stone: MarketItem;
    wool: MarketItem;
    cloth: MarketItem;
    honey: MarketItem;
    meat: MarketItem;
    siege_sword: MarketItem;
    siege_armor: MarketItem;
    // Maritime Items
    oak_log: MarketItem;
    oak_lumber: MarketItem;
    flax: MarketItem;
    linen_canvas: MarketItem;
    tar: MarketItem;
    fish_raw: MarketItem;
    silk: MarketItem;
    spice: MarketItem;
}

export interface SimulationRegion {
    id: string;
    name: string;
    rulerId?: string;
    taxRate: number;
    defenseLevel: number;
    rulerName: string;
    coup?: CoupData;
    activeElection?: ElectionState;
    garrison?: Garrison;
    fortification?: Fortification;
    activeSiege?: ActiveSiege;
    lastTaxCollection?: { year: number; season: string };
    taxHistory?: Array<{ year: number; season: string; amountGold: number; amountGrain: number; rate: number; timestamp: number }>;
}

export interface WorldEvent {
    id: string;
    type: 'RAID' | 'QUEST';
    title: string;
    description: string;
    locationId: string;
    expiresAt: number;
    payload?: any;
}

export interface SimulationMessage {
    id?: string;
    content: string;
    type?: 'SYSTEM' | 'CHAT' | 'SEASON_CHANGE' | 'WEATHER_CHANGE' | 'VOTE_START' | 'VOTE_RESULT' | 'EVENT_SPAWN';
    timestamp: number;
    senderId?: string;
    senderName?: string;
    senderRole?: Role;
    isPremiere?: boolean;
}

export interface SimulationRoom {
    pin: string;
    name?: string;
    status: GameStatus;
    settings: string;
    hostName?: string;
    isPublic?: boolean;
    market: SimulationMarket;
    markets: Record<string, SimulationMarket>;
    regions: Record<string, SimulationRegion>;
    players: Record<string, SimulationPlayer>;
    public_profiles?: Record<string, any>;
    world: {
        year: number;
        season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
        weather: WeatherType;
        gameTick: number;
        lastTickAt: number;
        lastRoyalTaxCollection?: { year: number; season: string };
        royalTaxHistory?: Array<{ year: number; season: string; amountGold: number; amountGrain: number; rate: number; timestamp: number }>;
        taxRateDetails: {
            kingTax: number;
        };
        monumentProgress?: number;
        activeLaws?: string[];
        settlement?: {
            buildings: Record<string, {
                id: string;
                level: number;
                progress: Partial<Resources>;
                contributions: Record<string, { name: string, resources: Partial<Resources> }>;
            }>;
        };
    };
    worldEvents: Record<string, WorldEvent>;
    diplomacy: Record<string, DiplomacyMessage>;
    trades?: Record<string, TradeOffer>;
    activeVote?: {
        lawId: string;
        title: string;
        description: string;
        votes: Record<string, 'YES' | 'NO' | 'ABSTAIN'>;
        expiresAt: number;
    };
    messages: SimulationMessage[] | Record<string, SimulationMessage>;
    questionStartTime?: number;
    stats?: {
        roleChanges: Record<string, number>;
        coups: { start: number; success: number; fail: number };
        contributions: Record<string, number>;
        crafted: Record<string, number>;
        produced: Record<string, number>;
        consumed: Record<string, number>;
    };
    metadata?: any;
}
