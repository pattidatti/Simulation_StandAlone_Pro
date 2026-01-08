import { ref, set, update } from 'firebase/database';
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

export const syncServerMetadata = async (pin: string, data: Partial<SimulationRoom> | null) => {
    if (!pin || !data) return;
    const metadataRef = ref(db, `simulation_server_metadata/${pin}`);

    // Explicitly check for false, otherwise default to true (Public)
    if (data.isPublic === false) {
        await set(metadataRef, null);
        return;
    }

    const payload: any = {
        pin: pin,
        lastUpdated: Date.now()
    };

    if ((data as any).name) payload.name = (data as any).name;
    if (data.status) payload.status = data.status;
    if (data.players) payload.playerCount = Object.keys(data.players).length;
    if ((data as any).playerCount !== undefined) payload.playerCount = (data as any).playerCount;
    if (data.world?.year) payload.worldYear = data.world.year;
    if (data.world?.season) payload.season = data.world.season;
    if (data.hostName) payload.hostName = data.hostName;
    if (data.isPublic !== undefined) payload.isPublic = data.isPublic;

    await update(metadataRef, payload);
};
