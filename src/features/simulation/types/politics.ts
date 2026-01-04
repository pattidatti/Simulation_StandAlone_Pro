import type { Resources } from './item';

export interface CoupData {
    lastRulerChange: number;
    bribeProgress: number;
    challengerId?: string;
    challengerName?: string;
    contributions: Record<string, { name: string, amount: number }>;
    preVotes: Record<string, string>;
}

export interface ElectionCandidate {
    id: string;
    name: string;
    votes: number;
    weightedVotes: number;
    contribution: number;
}

export interface ElectionState {
    startedAt: number;
    expiresAt: number;
    candidates: Record<string, ElectionCandidate>;
    votes: Record<string, { candidateId: string, weight: number }>;
}

export interface DiplomacyMessage {
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    content: string;
    timestamp: number;
}

export type TradeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface TradeOffer {
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    offer: Partial<Resources>;
    demand: Partial<Resources>;
    status: TradeStatus;
    createdAt: number;
    expiresAt: number;
}
