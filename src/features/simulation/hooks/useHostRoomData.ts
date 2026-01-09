import { useState, useEffect, useMemo } from 'react';
import { ref, onValue, get, DataSnapshot } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import type { SimulationRoom } from '../simulationTypes';
import { INITIAL_MARKET } from '../constants';

export const useHostRoomData = (pin: string) => {
    const [roomData, setRoomData] = useState<SimulationRoom | null>(null);

    useEffect(() => {
        if (!pin) {
            setRoomData(null);
            return;
        }

        const baseUrl = `simulation_rooms/${pin}`;

        // 1. Metadata & Status
        const unsubStatus = onValue(ref(db, `${baseUrl}/status`), (snap: DataSnapshot) => {
            setRoomData((prev: SimulationRoom | null) => {
                const status = snap.val() || 'LOBBY';
                if (!prev) return { pin, status, markets: {}, market: INITIAL_MARKET, players: {}, messages: [], regions: {}, worldEvents: {} } as any;
                return { ...prev, status };
            });
        });

        // 2. World State
        const unsubWorld = onValue(ref(db, `${baseUrl}/world`), (snap: DataSnapshot) => {
            setRoomData((prev: SimulationRoom | null) => {
                const world = snap.val();
                if (!prev) return { pin, world, markets: {}, market: INITIAL_MARKET, players: {}, messages: [], regions: {}, worldEvents: {} } as any;
                return { ...prev, world };
            });
        });

        // 3. Markets
        const unsubMarkets = onValue(ref(db, `${baseUrl}/markets`), (snap: DataSnapshot) => {
            setRoomData((prev: SimulationRoom | null) => {
                const markets = snap.val() || {};
                if (!prev) return { pin, markets, market: INITIAL_MARKET, players: {}, messages: [], regions: {}, worldEvents: {} } as any;
                return { ...prev, markets };
            });
        });

        // 4. Messages
        const unsubMessages = onValue(ref(db, `${baseUrl}/messages`), (snap: DataSnapshot) => {
            setRoomData((prev: SimulationRoom | null) => {
                const messages = snap.val() || [];
                if (!prev) return { pin, messages, markets: {}, market: INITIAL_MARKET, players: {}, regions: {}, worldEvents: {} } as any;
                return { ...prev, messages };
            });
        });

        // 5. Players
        const unsubPlayers = onValue(ref(db, `${baseUrl}/players`), (snap: DataSnapshot) => {
            setRoomData((prev: SimulationRoom | null) => {
                const players = snap.val() || {};
                if (!prev) return { pin, players, markets: {}, market: INITIAL_MARKET, messages: [], regions: {}, worldEvents: {} } as any;
                return { ...prev, players };
            });
        });

        // 6. World Events
        const unsubEvents = onValue(ref(db, `${baseUrl}/worldEvents`), (snap: DataSnapshot) => {
            setRoomData((prev: SimulationRoom | null) => {
                const worldEvents = snap.val() || {};
                if (!prev) return { pin, worldEvents, markets: {}, market: INITIAL_MARKET, players: {}, messages: [], regions: {} } as any;
                return { ...prev, worldEvents };
            });
        });

        // 7. Active Vote
        const unsubVote = onValue(ref(db, `${baseUrl}/activeVote`), (snap: DataSnapshot) => {
            setRoomData((prev: SimulationRoom | null) => {
                const activeVote = snap.val();
                if (!prev) return { pin, activeVote, markets: {}, market: INITIAL_MARKET, players: {}, messages: [], regions: {}, worldEvents: {} } as any;
                return { ...prev, activeVote };
            });
        });

        // 8. Regions
        const unsubRegions = onValue(ref(db, `${baseUrl}/regions`), (snap: DataSnapshot) => {
            setRoomData((prev: SimulationRoom | null) => {
                const regions = snap.val() || {};
                if (!prev) return { pin, regions, markets: {}, market: INITIAL_MARKET, players: {}, messages: [], worldEvents: {} } as any;
                return { ...prev, regions };
            });
        });

        // Initial Skeleton Fetch (Parallel to subscriptions to ensure base data is there)
        get(ref(db, baseUrl)).then((snap: DataSnapshot) => {
            if (snap.exists()) {
                const val = snap.val();
                setRoomData((prev: SimulationRoom | null) => ({
                    ...prev!,
                    pin: val.pin,
                    status: val.status,
                    settings: val.settings,
                    hostName: val.hostName,
                    isPublic: val.isPublic ?? true,
                    world: val.world,
                    markets: val.markets || {},
                    market: val.market || INITIAL_MARKET,
                    players: prev?.players || val.players || {},
                    messages: prev?.messages || val.messages || [],
                    regions: val.regions || {},
                    diplomacy: val.diplomacy || {},
                    worldEvents: val.worldEvents || {}
                }));
            }
        });

        return () => {
            unsubStatus();
            unsubWorld();
            unsubMarkets();
            unsubMessages();
            unsubPlayers();
            unsubEvents();
            unsubVote();
            unsubRegions();
        };
    }, [pin]);

    const onlineCount = useMemo(() => {
        if (!roomData?.players) return 0;
        const now = Date.now();
        return Object.values(roomData.players).filter((p: any) => p.online && (now - (p.lastActive || 0) < 60000)).length;
    }, [roomData?.players]);

    return { roomData, setRoomData, onlineCount };
};
