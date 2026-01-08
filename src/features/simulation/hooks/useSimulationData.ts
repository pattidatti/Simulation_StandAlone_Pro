import { useState, useEffect, useRef } from 'react';
import { ref, onValue, update, onDisconnect } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import type { SimulationPlayer, SimulationRoom, TradeOffer } from '../simulationTypes';
import { useSimulationAuth } from '../SimulationAuthContext';
import { useGameTicker } from './useGameTicker';

export function useSimulationData(pin: string | undefined, impersonateId: string | null) {
    const { user, authLoading } = useSimulationAuth() as any;

    const [player, setPlayer] = useState<SimulationPlayer | null>(null);
    const [world, setWorld] = useState<SimulationRoom['world'] | null>(null);
    const [players, setPlayers] = useState<Record<string, SimulationPlayer>>({});
    const [roomStatus, setRoomStatus] = useState<SimulationRoom['status']>('LOBBY');
    const [markets, setMarkets] = useState<Record<string, any>>({});
    const [regions, setRegions] = useState<Record<string, any>>({});
    const [messages, setMessages] = useState<string[]>([]);
    const [activeVote, setActiveVote] = useState<SimulationRoom['activeVote'] | null>(null);
    const [diplomacy, setDiplomacy] = useState<Record<string, any>>({});
    const [trades, setTrades] = useState<Record<string, TradeOffer>>({});
    const [hasAttemptedPlayerLoad, setHasAttemptedPlayerLoad] = useState(false);
    const [hasActiveSession, setHasActiveSession] = useState(false);
    const [isRetired, setIsRetired] = useState(false);

    const nullTimeoutRef = useRef<any>(null);
    const lastValidPlayerRef = useRef<SimulationPlayer | null>(null);

    useEffect(() => {
        if (authLoading) return;

        const storedId = localStorage.getItem('sim_player_id');
        // PRIORITY FIX: If user is logged in, use UID. If impersonating (Admin), use that. Lastly, fall back to stored guest ID.
        // If a user IS logged in, we should check if the storedId is actually them, or a stale guest. 
        // Logic: If (Auth), use (Auth). Else use (Local).

        let playerId = impersonateId;
        if (!playerId) {
            if (user?.uid) playerId = user.uid;
            else playerId = storedId;
        }
        if (!playerId || !pin) return;

        const baseUrl = `simulation_rooms/${pin}`;

        const playerRef = ref(db, `${baseUrl}/players/${playerId}`);
        const unsubPlayer = onValue(playerRef, (snap) => {
            setHasAttemptedPlayerLoad(true);
            if (snap.exists()) {
                if (nullTimeoutRef.current) {
                    clearTimeout(nullTimeoutRef.current);
                    nullTimeoutRef.current = null;
                }
                const data = snap.val();
                if (pin === 'TEST' && data.regionId === 'unassigned' && data.role !== 'KING') {
                    const newRegion = Math.random() > 0.5 ? 'region_east' : 'region_west';
                    update(playerRef, { regionId: newRegion });
                }
                const fullPlayerData = { ...data, id: playerId };
                setPlayer(fullPlayerData);
                lastValidPlayerRef.current = fullPlayerData;
                setHasActiveSession(true);
            } else {
                if (hasActiveSession) {
                    if (!nullTimeoutRef.current) {
                        nullTimeoutRef.current = setTimeout(() => {
                            setIsRetired(true);
                            setPlayer(null);
                            setHasActiveSession(false);
                            lastValidPlayerRef.current = null;
                        }, 5000);
                    }
                } else {
                    setPlayer(null);
                }
            }
        });

        const worldRef = ref(db, `${baseUrl}/world`);
        const unsubWorld = onValue(worldRef, (snap) => {
            const data = snap.val();
            if (data) setWorld(data);
        });

        const statusRef = ref(db, `${baseUrl}/status`);
        const unsubStatus = onValue(statusRef, (snap) => {
            const data = snap.val();
            if (data) setRoomStatus(data || 'LOBBY');
        });

        const marketsRef = ref(db, `${baseUrl}/markets`);
        const unsubMarkets = onValue(marketsRef, (snap) => {
            const data = snap.val();
            if (data) setMarkets(data);
        });

        const messagesRef = ref(db, `${baseUrl}/messages`);
        const unsubMessages = onValue(messagesRef, (snap) => {
            const data = snap.val();
            if (data) setMessages(data);
        });

        const voteRef = ref(db, `${baseUrl}/activeVote`);
        const unsubVote = onValue(voteRef, (snap) => {
            setActiveVote(snap.val());
        });

        const diplomacyRef = ref(db, `${baseUrl}/diplomacy`);
        const unsubDiplomacy = onValue(diplomacyRef, (snap) => {
            setDiplomacy(snap.val() || {});
        });

        const tradesRef = ref(db, `${baseUrl}/trades`);
        const unsubTrades = onValue(tradesRef, (snap) => {
            setTrades(snap.val() || {});
        });

        const profilesRef = ref(db, `${baseUrl}/public_profiles`);
        const unsubPlayers = onValue(profilesRef, (snap) => {
            const data = snap.val() || {};
            setPlayers(data);
        });

        const regionsRef = ref(db, `${baseUrl}/regions`);
        const unsubRegions = onValue(regionsRef, (snap) => {
            setRegions(snap.val() || {});
        });

        return () => {
            unsubPlayer();
            unsubWorld();
            unsubStatus();
            unsubMarkets();
            unsubMessages();
            unsubVote();
            unsubDiplomacy();
            unsubPlayers();
            unsubTrades();
            unsubRegions();
        };
    }, [pin, impersonateId, user?.uid, authLoading, hasActiveSession]);

    // --- PLAYER PRESENCE HEARTBEAT ---
    useEffect(() => {
        if (!player || !pin) return;
        const playerRef = ref(db, `simulation_rooms/${pin}/players/${player.id}`);
        const publicProfileRef = ref(db, `simulation_rooms/${pin}/public_profiles/${player.id}`);

        // Set up disconnect hook
        onDisconnect(playerRef).update({ online: false });
        onDisconnect(publicProfileRef).update({ online: false });

        const heartbeat = setInterval(() => {
            const now = Date.now();
            update(playerRef, { lastActive: now, online: true });
            update(publicProfileRef, { lastActive: now, online: true });
        }, 30000); // Every 30s

        // Initial bump
        update(playerRef, { lastActive: Date.now(), online: true });
        update(publicProfileRef, { lastActive: Date.now(), online: true });

        return () => clearInterval(heartbeat);
    }, [pin, player?.id]);

    // --- NEXUS / VESSEL MOCK LOADING ---
    useEffect(() => {
        if (!pin || !pin.startsWith('v')) return;

        // Try to load simulated vessel data
        const storedVessel = localStorage.getItem('nexus_active_vessel');
        if (storedVessel) {
            try {
                const vesselData = JSON.parse(storedVessel);
                if (vesselData.id === pin) {
                    console.log("Nexus Vessel Detected. Injecting Mock Data...", vesselData);

                    // Create a full SimulationPlayer object from the simpler Vessel data
                    const mockPlayer: SimulationPlayer = {
                        id: vesselData.id,
                        uid: user?.uid || 'nexus_user',
                        name: vesselData.name,
                        role: vesselData.role.toUpperCase() as any,
                        regionId: 'nexus_region',
                        resources: {
                            gold: vesselData.gold,
                            grain: 100,
                            flour: 0,
                            bread: 5,
                            wood: 50,
                            plank: 0,
                            iron_ore: 0,
                            iron_ingot: 0,
                            stone: 0,
                            swords: 0,
                            armor: 0,
                            favor: 0,
                            wool: 0,
                            cloth: 0,
                            honey: 0,
                            meat: 0,
                            glass: 0,
                            manpower: 10,
                            egg: 0,
                            omelette: 0
                        },
                        stats: { xp: 0, level: 1, reputation: 50, contribution: 0 },
                        status: {
                            hp: vesselData.health,
                            morale: 100,
                            stamina: 100,
                            legitimacy: 100,
                            authority: 100,
                            loyalty: 100,
                            isJailed: false,
                            isFrozen: false
                        },
                        equipment: {},
                        skills: {
                            FARMING: { level: 1, xp: 0, maxXp: 100 },
                            WOODCUTTING: { level: 1, xp: 0, maxXp: 100 },
                            MINING: { level: 1, xp: 0, maxXp: 100 },
                            CRAFTING: { level: 1, xp: 0, maxXp: 100 },
                            STEWARDSHIP: { level: 1, xp: 0, maxXp: 100 },
                            COMBAT: { level: 1, xp: 0, maxXp: 100 },
                            TRADING: { level: 1, xp: 0, maxXp: 100 },
                            THEOLOGY: { level: 1, xp: 0, maxXp: 100 }
                        },
                        upgrades: [],
                        lastActive: Date.now()
                    };

                    setPlayer(mockPlayer);
                    setHasActiveSession(true);
                    setHasAttemptedPlayerLoad(true);

                    // Also mock world and status so we don't get stuck
                    setRoomStatus('PLAYING');
                    setWorld({
                        year: 1250,
                        season: 'Spring',
                        weather: 'Clear',
                        gameTick: 100,
                        lastTickAt: Date.now(),
                        taxRateDetails: { kingTax: 10 },
                        settlement: { buildings: {} }
                    } as any);
                }
            } catch (e) {
                console.error("Failed to parse Nexus vessel data", e);
            }
        }
    }, [pin, user?.uid]);

    const onlineCount = Object.values(players || {}).filter((p: any) =>
        p.online && (Date.now() - (p.lastActive || 0) < 60000)
    ).length;

    // --- ROBUST RACE-TO-TICK HEARTBEAT ---
    useGameTicker(pin, roomStatus, world, onlineCount);

    return {
        player,
        world,
        players,
        roomStatus,
        markets,
        regions,
        messages,
        activeVote,
        diplomacy,
        trades,
        hasAttemptedPlayerLoad,
        hasActiveSession,
        isRetired,
        setIsRetired,
        setPlayer,
        lastValidPlayer: lastValidPlayerRef.current
    };
}
