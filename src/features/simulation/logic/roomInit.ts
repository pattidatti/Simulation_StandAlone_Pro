import { ref, set } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import { VILLAGE_BUILDINGS, INITIAL_MARKET } from '../constants';
import type { SimulationRoom, SimulationMessage } from '../simulationTypes';

export const generateInitialRoomState = (pin: string, name: string): SimulationRoom => ({
    pin: pin,
    name: name,
    status: 'PLAYING',
    settings: 'feudal_europe',
    hostName: 'Host',
    isPublic: true,
    market: JSON.parse(JSON.stringify(INITIAL_MARKET)),
    world: {
        year: 1100,
        season: 'Spring',
        weather: 'Clear',
        gameTick: 0,
        lastTickAt: Date.now(),
        taxRateDetails: { kingTax: 20 },
        settlement: {
            buildings: Object.entries(VILLAGE_BUILDINGS).reduce((acc, [id]: [string, any]) => ({
                ...acc,
                [id]: { id, level: 0, progress: {}, target: 200, contributions: {} }
            }), {}),
        }
    },
    markets: {
        capital: { ...INITIAL_MARKET },
        region_vest: { ...INITIAL_MARKET },
        region_ost: { ...INITIAL_MARKET },
    },
    players: {},
    public_profiles: {},
    messages: [] as SimulationMessage[],
    regions: {
        'region_vest': { id: 'region_vest', name: 'Baroniet Vest', taxRate: 10, defenseLevel: 50, rulerName: 'Ingen' },
        'region_ost': { id: 'region_ost', name: 'Baroniet Øst', taxRate: 10, defenseLevel: 50, rulerName: 'Ingen' }
    },
    diplomacy: {},
    worldEvents: {},
});

export const syncServerMetadata = async (pin: string, data: SimulationRoom | null) => {
    if (!pin || !data) return;
    const metadataRef = ref(db, `simulation_server_metadata/${pin}`);

    // Explicitly check for false, otherwise default to true (Public)
    if (data.isPublic === false) {
        await set(metadataRef, null);
        return;
    }

    await set(metadataRef, {
        pin: pin,
        name: (data as any).name || `Rike #${pin}`,
        status: data.status,
        playerCount: Object.keys(data.players || {}).length,
        worldYear: data.world?.year || 1100,
        season: data.world?.season || 'Spring',
        isPublic: data.isPublic ?? true, // Default to true if undefined
        hostName: data.hostName || "Anonym Host",
        lastUpdated: Date.now()
    });
};
