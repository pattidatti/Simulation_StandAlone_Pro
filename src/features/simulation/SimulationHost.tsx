import React, { useState, useEffect } from 'react';
import { ref, set, onValue, update, get, remove } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';
import { useLayout } from '../../context/LayoutContext';

import { INITIAL_MARKET, ROLE_DEFINITIONS, INITIAL_RESOURCES, VILLAGE_BUILDINGS, SEASONS, RESOURCE_DETAILS, INITIAL_SKILLS, ITEM_TEMPLATES } from './constants';
import { Globe, Lock } from 'lucide-react';
import { assignRoles, collectTaxes } from './gameLogic';
import { generateInitialRoomState, syncServerMetadata } from './logic/roomInit';
import type { SimulationMessage, SimulationRoom } from './simulationTypes';
import { handleAdminGiveGold, handleAdminGiveItem, handleAdminGiveResource } from './globalActions';
import { useGameTicker } from './hooks/useGameTicker';
import { AITrainingLab } from './logic/bots/AITrainingLab';


export const SimulationHost: React.FC = () => {
    const [pin, setPin] = useState<string>('');
    const [roomData, setRoomData] = useState<SimulationRoom | null>(null);
    const [allRooms, setAllRooms] = useState<SimulationRoom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'LIST' | 'MANAGE' | 'ECONOMY' | 'AI_LAB'>('LIST');
    const [giveGoldAmounts, setGiveGoldAmounts] = useState<Record<string, number>>({});
    const [giveItemSelection, setGiveItemSelection] = useState<Record<string, { itemId: string, amount: number }>>({});
    const [giveResourceSelection, setGiveResourceSelection] = useState<Record<string, { resourceId: string, amount: number }>>({});
    const { setFullWidth, setHideHeader } = useLayout();

    // Lazy load the blueprint
    const [SimulationEconomyBlueprint, setSimulationEconomyBlueprint] = useState<any>(null);

    useEffect(() => {
        import('./components/SimulationEconomyBlueprint').then(mod => {
            setSimulationEconomyBlueprint(() => mod.SimulationEconomyBlueprint);
        });
    }, []);

    const deleteRoom = async (roomPin: string) => {
        if (!window.confirm(`ER DU SIKKER? Dette vil slette rommet ${roomPin} permanent! Denne handlingen kan ikke angres.`)) return;
        setIsLoading(true);
        try {
            await remove(ref(db, `simulation_rooms/${roomPin}`));
            await remove(ref(db, `simulation_server_metadata/${roomPin}`)); // Also delete metadata
        } catch (e) {
            console.error(e);
            alert("Kunne ikke slette rommet.");
        } finally {
            setIsLoading(false);
        }
    };


    // Handle Layout
    useEffect(() => {
        setFullWidth(true);
        setHideHeader(true);
        return () => {
            setFullWidth(false);
            setHideHeader(false);
        };
    }, [setFullWidth, setHideHeader]);

    // Fetch all rooms on mount
    useEffect(() => {
        const roomsRef = ref(db, 'simulation_rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roomList = Object.entries(data).map(([key, val]: [string, any]) => ({
                    ...val,
                    pin: val.pin || key
                }));
                // Sort by pin or creation? Reverse seems to be the intent
                setAllRooms(roomList.reverse() as any[]);
            } else {
                setAllRooms([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Sync specific room data using SHARDED SUBSCRIPTIONS (Scalability Fix)
    // instead of downloading the entire 'room' object (which includes all players).
    useEffect(() => {
        if (!pin) return;
        const baseUrl = `simulation_rooms/${pin}`;

        // 1. Metadata & Status (Lightweight)
        const unsubStatus = onValue(ref(db, `${baseUrl}/status`), snap => {
            setRoomData(prev => prev ? { ...prev, status: snap.val() || 'LOBBY' } : null);
        });

        // 2. World State (Medium)
        const unsubWorld = onValue(ref(db, `${baseUrl}/world`), snap => {
            setRoomData(prev => prev ? { ...prev, world: snap.val() } : null);
        });

        // 3. Markets (Medium)
        const unsubMarkets = onValue(ref(db, `${baseUrl}/markets`), snap => {
            const val = snap.val() || {};
            setRoomData(prev => prev ? { ...prev, markets: val } : null);
        });

        // 4. Regions (Crucial for Hierarchy/Siege)
        const unsubRegions = onValue(ref(db, `${baseUrl}/regions`), snap => {
            setRoomData(prev => prev ? { ...prev, regions: snap.val() || {} } : null);
        });

        return () => {
            unsubStatus();
            unsubWorld();
            unsubMarkets();
            unsubRegions();
        };
    }, [pin]);

    // --- GAME TICKER (ADMIN HOST) ---
    // Ensure time ticks even if only Admin is online
    // --- GAME TICKER (ADMIN HOST) ---
    // Ensure time ticks even if only Admin is online
    useGameTicker(pin, roomData?.status || 'LOBBY', roomData?.world);

    // --- GAME TICKER (ADMIN HOST) ---

    // 4. Messages (Heavy - Capped)
    useEffect(() => {
        if (!pin) return;
        const baseUrl = `simulation_rooms/${pin}`;

        const unsubMessages = onValue(ref(db, `${baseUrl}/messages`), snap => {
            setRoomData(prev => prev ? { ...prev, messages: snap.val() || [] } : null);
        });
        return () => unsubMessages();
    }, [pin]);

    // 5. Players (Replaced by Public Profiles for Host list)
    // We DO NOT fetch 'players' root anymore. We fetch 'public_profiles' for the list.
    // We map 'public_profiles' -> 'players' in the local state for compatibility.
    // Deep player inspection will require a separate fetch.
    // 5. Players & Other Data
    useEffect(() => {
        if (!pin) return;
        const baseUrl = `simulation_rooms/${pin}`;

        // 5. Players (FULL FETCH for Host - required for Bot Brain/God Mode)
        const unsubPlayers = onValue(ref(db, `${baseUrl}/players`), snap => {
            const players = snap.val() || {};
            setRoomData(prev => {
                if (!prev) return null;

                const realCount = Object.keys(players).length;
                const metadataRef = ref(db, `simulation_server_metadata/${pin}`);
                setTimeout(() => {
                    get(metadataRef).then(metaSnap => {
                        if (metaSnap.exists()) {
                            const meta = metaSnap.val();
                            if (meta.playerCount !== realCount) {
                                // console.log("Fixing player count metadata...", realCount);
                                update(metadataRef, { playerCount: realCount });
                            }
                        }
                    });
                }, 5000);

                return { ...prev, players: players };
            });
        });

        // 6. World Events
        const unsubEvents = onValue(ref(db, `${baseUrl}/worldEvents`), snap => {
            setRoomData(prev => prev ? { ...prev, worldEvents: snap.val() || {} } : null);
        });

        // 7. Active Vote
        const unsubVote = onValue(ref(db, `${baseUrl}/activeVote`), snap => {
            setRoomData(prev => prev ? { ...prev, activeVote: snap.val() } : null);
        });

        // 8. Regions (Crucial for Politics)
        const unsubRegions = onValue(ref(db, `${baseUrl}/regions`), snap => {
            setRoomData(prev => prev ? { ...prev, regions: snap.val() || {} } : null);
        });

        // Initial Skeleton
        get(ref(db, baseUrl)).then((snap) => {
            if (snap.exists()) {
                const val = snap.val();
                setRoomData(prev => ({
                    ...prev!, // Safe cast as we likely have partial data or will overwrite
                    pin: val.pin,
                    status: val.status,
                    settings: val.settings,
                    hostName: val.hostName,
                    isPublic: val.isPublic ?? true, // Default to true if undefined
                    world: val.world,
                    markets: val.markets || {},
                    market: val.market || INITIAL_MARKET,
                    players: prev?.players || {}, // Keep existing if any
                    messages: prev?.messages || [],
                    regions: val.regions || {},
                    diplomacy: {},
                    worldEvents: {}
                }));
            }
        });

        return () => {
            unsubPlayers();
            unsubEvents();
            unsubVote();
            unsubRegions();
        };
    }, [pin]);



    // Handle Title Change (Moved from inside previous useEffect)
    useEffect(() => {
        if (pin && view === 'MANAGE') {
            document.title = `Host: ${pin} | Eiriksbok`;
        } else {
            document.title = 'Simuleringshallen | Eiriksbok';
        }
        return () => {
            document.title = 'Eiriksbok';
        };
    }, [pin, view]);

    const createRoom = async () => {
        const name = prompt("Hva skal riket hete? (La stå tomt for automatisk navn)");
        if (name === null) return; // Cancelled

        setIsLoading(true);
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        const serverName = name.trim() || `Rike #${newPin}`;

        const initialRoomState: SimulationRoom = generateInitialRoomState(newPin, serverName);
        try {
            await set(ref(db, `simulation_rooms/${newPin}`), initialRoomState);
            await syncServerMetadata(newPin, initialRoomState);
            setPin(newPin);
            setView('MANAGE');
        } catch (error) {
            console.error(error);
            alert("Kunne ikke opprette rom.");
        } finally {
            setIsLoading(false);
        }
    };

    const startGame = async () => {
        if (!roomData || !roomData.players) return;
        setIsLoading(true);
        try {
            const updatedPlayers = assignRoles(roomData.players);
            // Initialize default regions (Vest and Øst always exist)
            const newRegions: any = {
                'region_vest': {
                    id: 'region_vest',
                    name: 'Baroniet Vest',
                    taxRate: 10,
                    defenseLevel: 50,
                    rulerName: 'Ingen'
                },
                'region_ost': {
                    id: 'region_ost',
                    name: 'Baroniet Øst',
                    taxRate: 10,
                    defenseLevel: 50,
                    rulerName: 'Ingen'
                }
            };

            const newMarkets: any = { ...roomData.markets };

            // Ensure capital market exists
            if (!newMarkets['capital']) newMarkets['capital'] = JSON.parse(JSON.stringify(INITIAL_MARKET));

            // Ensure region markets exist (default)
            ['region_vest', 'region_ost'].forEach(rid => {
                if (!newMarkets[rid]) {
                    newMarkets[rid] = JSON.parse(JSON.stringify(INITIAL_MARKET));
                }
            });

            Object.values(updatedPlayers).forEach(p => {
                if (p.role === 'BARON') {

                    // Update the region with Baron's info
                    newRegions[p.regionId] = {
                        ...newRegions[p.regionId],
                        rulerName: p.name
                    };

                    // Create/Update Local Market for this Baron with variance
                    const localMarket: any = JSON.parse(JSON.stringify(INITIAL_MARKET));
                    Object.keys(localMarket).forEach(key => {
                        const item = localMarket[key];
                        // Random +/- 20% price and stock
                        item.price = Math.floor(item.price * (0.8 + Math.random() * 0.4));
                        item.stock = Math.floor(item.stock * (0.8 + Math.random() * 0.4));
                    });
                    newMarkets[p.regionId] = localMarket;
                }
            });

            const publicProfiles: any = {};
            Object.values(updatedPlayers).forEach(p => {
                publicProfiles[p.id] = {
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    regionId: p.regionId,
                    stats: { level: p.stats.level || 1 },
                    status: { isJailed: false, isFrozen: false, legitimacy: 100 },
                    online: true,
                    lastActive: p.lastActive
                };
            });
            const updates: any = {}; // Re-added missing declaration
            updates[`simulation_rooms/${pin}/players`] = updatedPlayers;
            updates[`simulation_rooms/${pin}/public_profiles`] = publicProfiles;
            updates[`simulation_rooms/${pin}/regions`] = newRegions;
            updates[`simulation_rooms/${pin}/markets`] = newMarkets;
            updates[`simulation_rooms/${pin}/status`] = 'PLAYING';
            await update(ref(db), updates);
            // Sync metadata
            const updatedRoom = { ...roomData, status: 'PLAYING' } as SimulationRoom;
            await syncServerMetadata(pin, updatedRoom);
        } catch (e) {
            console.error(e);
            alert("Klarte ikke starte.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTaxation = async () => {
        if (!roomData || !roomData.players) return;
        setIsLoading(true);
        try {
            const kingTax = roomData.world?.taxRateDetails?.kingTax || 20;
            const { updatedPlayers, results } = collectTaxes(roomData.players, kingTax);

            await update(ref(db, `simulation_rooms/${pin}/players`), updatedPlayers);
            alert(`Suksess! ${results.length} bønder og baroner ble skattlagt.`);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const resetPoliticalUnrest = async () => {
        if (!roomData?.regions) return;
        if (!window.confirm("Vil du nullstille all politisk uro (bestikkelser) i alle regioner?")) return;

        setIsLoading(true);
        try {
            const updates: any = {};
            Object.keys(roomData.regions).forEach(rid => {
                updates[`simulation_rooms/${pin}/regions/${rid}/coup/bribeProgress`] = 0;
                updates[`simulation_rooms/${pin}/regions/${rid}/coup/contributions`] = {};
                updates[`simulation_rooms/${pin}/regions/${rid}/coup/challengerId`] = null;
                updates[`simulation_rooms/${pin}/regions/${rid}/coup/challengerName`] = null;
            });
            await update(ref(db), updates);
            alert("Politisk ro er gjenopprettet i alle regioner!");
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const regenAllStamina = async () => {
        if (!roomData || !roomData.players) return;
        setIsLoading(true);
        try {
            const updates: any = {};
            Object.keys(roomData.players).forEach(id => {
                updates[`simulation_rooms/${pin}/players/${id}/status/stamina`] = 100;
            });
            await update(ref(db), updates);
            alert("All energi er gjenopprettet!");
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to normalize messages
    // Helper to normalize messages
    const getMessagesList = (msgs: SimulationMessage[] | Record<string, SimulationMessage> | undefined): SimulationMessage[] => {
        if (!msgs) return [];
        if (Array.isArray(msgs)) return msgs;
        return Object.values(msgs).sort((a, b) => a.timestamp - b.timestamp);
    };

    const nextSeason = async () => {
        if (!roomData) return;
        const seasonsList: ('Spring' | 'Summer' | 'Autumn' | 'Winter')[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
        const currentIdx = seasonsList.indexOf(roomData.world?.season || 'Spring');
        const nextIdx = (currentIdx + 1) % seasonsList.length;
        const nextSeasonVal = seasonsList[nextIdx];

        setIsLoading(true);
        try {
            const sLabel = (SEASONS as any)[nextSeasonVal]?.label || nextSeasonVal;
            const msgContent = `🌍 Årstiden har skiftet til ${sLabel}!`;
            const newMessage: SimulationMessage = {
                id: `msg_${Date.now()}`,
                content: msgContent,
                timestamp: Date.now(),
                type: 'SEASON_CHANGE'
            };

            const currentMessages = getMessagesList(roomData.messages as any);
            const updatedMessages = [...currentMessages, newMessage].slice(-50);

            const updates: any = {};
            updates[`simulation_rooms/${pin}/world/season`] = nextSeasonVal;
            updates[`simulation_rooms/${pin}/messages`] = updatedMessages;

            await update(ref(db), updates);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const changeWeather = async () => {
        if (!roomData) return;
        const weatherList: ('Clear' | 'Rain' | 'Storm' | 'Fog')[] = ['Clear', 'Rain', 'Storm', 'Fog'];
        const currentIdx = weatherList.indexOf(roomData.world.weather || 'Clear');
        const nextIdx = (currentIdx + 1) % weatherList.length;
        const nextWeather = weatherList[nextIdx];

        try {
            const weatherMap: any = { Clear: 'Klart', Rain: 'Regn', Storm: 'Storm', Fog: 'Tåke' };
            const wLabel = weatherMap[nextWeather] || nextWeather;
            const msgContent = `☁️ Været har skiftet til ${wLabel}!`;
            const newMessage: SimulationMessage = {
                id: `msg_${Date.now()}`,
                content: msgContent,
                timestamp: Date.now(),
                type: 'WEATHER_CHANGE'
            };

            const currentMessages = getMessagesList(roomData.messages as any);
            const updatedMessages = [...currentMessages, newMessage].slice(-50);

            const updates: any = {};
            updates[`simulation_rooms/${pin}/world/weather`] = nextWeather;
            updates[`simulation_rooms/${pin}/messages`] = updatedMessages;

            await update(ref(db), updates);
        } catch (e) {
            console.error(e);
        }
    };

    const startTing = async () => {
        if (!roomData) return;
        const { LAW_TEMPLATES } = await import('./constants');
        const law = LAW_TEMPLATES[Math.floor(Math.random() * LAW_TEMPLATES.length)];

        const activeVote = {
            lawId: law.id,
            title: law.label,
            votes: {},
            expiresAt: Date.now() + (60 * 1000) // 1 minute to vote
        };

        try {
            await update(ref(db, `simulation_rooms/${pin}`), { activeVote });
            const msgContent = `⚖️ TINGET ER SATT! Det skal stemmes over loven: "${law.label}"!`;
            const newMessage: SimulationMessage = {
                id: `msg_${Date.now()}`,
                content: msgContent,
                timestamp: Date.now(),
                type: 'VOTE_START'
            };

            const currentMessages = getMessagesList(roomData.messages as any);
            const updatedMessages = [...currentMessages, newMessage].slice(-50);

            await update(ref(db, `simulation_rooms/${pin}`), { messages: updatedMessages });

            // Auto resolve after 1 minute
            setTimeout(() => resolveVote(law.id), 60000);
        } catch (e) {
            console.error(e);
        }
    };

    const resolveVote = async (lawId: string) => {
        const snapshot = await get(ref(db, `simulation_rooms/${pin}/activeVote`));
        if (!snapshot.exists()) return;
        const voteData = snapshot.val();

        const votes = Object.values(voteData.votes || {}) as ('YES' | 'NO' | 'ABSTAIN')[];
        const yesVotes = votes.filter(v => v === 'YES').length;
        const noVotes = votes.filter(v => v === 'NO').length;

        let msgContent = '';
        let activeLaws = roomData?.world?.activeLaws || [];

        if (yesVotes > noVotes) {
            msgContent = `✅ LOVEN ER VEDTATT! "${voteData.title}" er nå gjeldende.`;
            activeLaws = [...activeLaws, lawId];
        } else {
            msgContent = `❌ LOVEN BLE FORKASTET. "${voteData.title}" ble nedstemt.`;
        }

        const newMessage: SimulationMessage = {
            id: `msg_${Date.now()}`,
            content: msgContent,
            timestamp: Date.now(),
            type: 'VOTE_RESULT'
        };

        try {
            await update(ref(db, `simulation_rooms/${pin}/world`), { activeLaws });

            const currentMessages = getMessagesList(roomData?.messages as any);
            await update(ref(db, `simulation_rooms/${pin}`), {
                activeVote: null,
                messages: [...currentMessages, newMessage].slice(-50)
            });
        } catch (e) {
            console.error(e);
        }
    };

    const spawnRandomEvent = async () => {

        if (!roomData) return;
        const { WORLD_EVENT_TEMPLATES } = await import('./constants');
        const template = WORLD_EVENT_TEMPLATES[Math.floor(Math.random() * WORLD_EVENT_TEMPLATES.length)];
        const eventId = `event_${Date.now()}`;
        const newEvent = {
            ...template,
            id: eventId,
            expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
        };

        try {
            await update(ref(db, `simulation_rooms/${pin}/worldEvents`), { [eventId]: newEvent });
            const msgContent = `🔔 HENDELSE: ${template.title}! Sjekk kartet!`;
            const newMessage: SimulationMessage = {
                id: `msg_${Date.now()}`,
                content: msgContent,
                timestamp: Date.now(),
                type: 'EVENT_SPAWN'
            };


            const currentMessages = getMessagesList(roomData.messages as any);
            const updatedMessages = [...currentMessages, newMessage].slice(-50);

            await update(ref(db, `simulation_rooms/${pin}`), { messages: updatedMessages });
        } catch (e) {
            console.error(e);
        }
    };

    const handleBuildingLevelChange = async (buildingId: string, delta: number) => {
        if (!roomData?.world?.settlement?.buildings?.[buildingId]) return;
        const building = roomData.world.settlement.buildings[buildingId];
        const newLevel = Math.max(0, building.level + delta);

        try {
            await update(ref(db, `simulation_rooms/${pin}/world/settlement/buildings/${buildingId}`), {
                level: newLevel,
                progress: {} // Reset progress on manual level change
            });
        } catch (e) {
            console.error(e);
        }
    };

    const [charForm, setCharForm] = useState({ name: '', role: 'PEASANT' as any, level: 1 });

    const spawnCharacter = async () => {
        if (!charForm.name) {
            alert("Vennligst oppgi et navn.");
            return;
        }

        setIsLoading(true);
        try {
            const charId = `char_${Math.random().toString(36).substr(2, 9)}`;
            const character: any = {
                id: charId,
                name: charForm.name,
                role: charForm.role || 'PEASANT',
                regionId: (charForm.role === 'KING') ? 'capital' : (Math.random() > 0.5 ? 'region_ost' : 'region_vest'),
                resources: INITIAL_RESOURCES[charForm.role as keyof typeof INITIAL_RESOURCES] || INITIAL_RESOURCES.PEASANT,
                status: { hp: 100, stamina: 100, morale: 100, legitimacy: 100, authority: 50, loyalty: 100, isJailed: false, isFrozen: false },
                stats: { level: charForm.level, xp: 0, reputation: 10, contribution: 0 },
                skills: INITIAL_SKILLS[charForm.role as keyof typeof INITIAL_SKILLS] || INITIAL_SKILLS.PEASANT,
                lastActive: Date.now(),
                online: true
            };

            const updates: any = {};
            updates[`simulation_rooms/${pin}/players/${charId}`] = character;
            updates[`simulation_rooms/${pin}/public_profiles/${charId}`] = {
                id: charId,
                name: character.name,
                role: character.role,
                regionId: character.regionId,
                stats: { level: character.stats.level },
                status: { isJailed: false, isFrozen: false, legitimacy: 100 },
                online: true,
                lastActive: character.lastActive
            };

            await update(ref(db), updates);
            setCharForm({ name: '', role: 'PEASANT', level: 1 });
        } catch (e) {
            console.error(e);
            alert("Kunne ikke opprette karakter.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayerLevelChange = async (playerId: string, newLevel: number) => {
        try {
            const updates: any = {};
            updates[`simulation_rooms/${pin}/players/${playerId}/stats/level`] = newLevel;
            updates[`simulation_rooms/${pin}/public_profiles/${playerId}/stats/level`] = newLevel;
            await update(ref(db), updates);
        } catch (e) {
            console.error(e);
        }
    };

    const initializeSettlement = async () => {
        if (!roomData) return;
        setIsLoading(true);
        try {
            await update(ref(db, `simulation_rooms/${pin}/world`), {
                settlement: {
                    buildings: Object.entries(VILLAGE_BUILDINGS).reduce((acc, [id]: [string, any]) => ({
                        ...acc,
                        [id]: { id, level: 0, progress: {}, target: 200, contributions: {} }
                    }), {}),

                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const resetGame = async () => {
        console.log("Attempting resetGame...");
        if (!window.confirm("Er du sikker på at du vil starte spillet på nytt? Alle fremdrift slettes.")) {
            console.log("Reset cancelled by user.");
            return;
        }
        console.log("Reset confirmed. Pin:", pin);
        setIsLoading(true);
        try {
            const updates: any = {};
            updates[`simulation_rooms/${pin}/status`] = 'LOBBY';
            updates[`simulation_rooms/${pin}/worldEvents`] = {};
            updates[`simulation_rooms/${pin}/messages`] = [];
            updates[`simulation_rooms/${pin}/market`] = INITIAL_MARKET;
            updates[`simulation_rooms/${pin}/markets`] = { 'capital': INITIAL_MARKET };
            updates[`simulation_rooms/${pin}/regions`] = {}; // Clear regions
            updates[`simulation_rooms/${pin}/world/monumentProgress`] = 0;
            updates[`simulation_rooms/${pin}/world/activeLaws`] = [];
            updates[`simulation_rooms/${pin}/world/settlement`] = {
                buildings: Object.entries(VILLAGE_BUILDINGS).reduce((acc, [id]: [string, any]) => ({
                    ...acc,
                    [id]: { id, level: 0, progress: {}, target: 200, contributions: {} }
                }), {}),
            };

            // Reset players
            Object.keys(roomData?.players || {}).forEach(id => {
                updates[`simulation_rooms/${pin}/players/${id}/role`] = 'PEASANT'; // Reset role
                updates[`simulation_rooms/${pin}/players/${id}/regionId`] = 'capital'; // Reset region
                updates[`simulation_rooms/${pin}/players/${id}/resources`] = INITIAL_RESOURCES.PEASANT;
                updates[`simulation_rooms/${pin}/players/${id}/status`] = { stamina: 100, legitimacy: 100, authority: 50 };
                updates[`simulation_rooms/${pin}/players/${id}/equipment`] = {};
                // Reset Public Profile Logic
                const publicPath = `simulation_rooms/${pin}/public_profiles/${id}`;
                updates[`${publicPath}/role`] = 'PEASANT';
                updates[`${publicPath}/regionId`] = 'capital';
                updates[`${publicPath}/stats/level`] = 1;

                // Clear multi-role stats
                updates[`simulation_rooms/${pin}/players/${id}/roleStats`] = null;

            });

            console.log("Constructed updates:", updates);
            await update(ref(db), updates);

            // Force immediate local state update to reflect changes
            if (roomData) {
                setRoomData({ ...roomData, status: 'LOBBY', messages: [] });
            }

            console.log("Update successful!");
            alert("Spillet er nullstilt!");
        } catch (e) {
            console.error("Reset failed:", e);
            alert("Kunne ikke nullstille spill: " + e);
        } finally {
            setIsLoading(false);
        }
    };


    const kickPlayer = async (playerId: string, playerName: string) => {
        if (!window.confirm(`Er du sikker på at du vil kaste ut ${playerName}?`)) return;
        try {
            const updates: any = {};
            updates[`simulation_rooms/${pin}/players/${playerId}`] = null;
            updates[`simulation_rooms/${pin}/public_profiles/${playerId}`] = null;
            await update(ref(db), updates);
        } catch (e) {
            console.error(e);
            alert("Kunne ikke kaste ut spiller.");
        }
    };

    const kickAllPlayers = async () => {
        if (!window.confirm("ER DU SIKKER? Dette vil kaste ut ALLE spillere fra rommet!")) return;
        try {
            const updates: any = {};
            updates[`simulation_rooms/${pin}/players`] = {};
            await update(ref(db), updates);
            alert("Alle spillere er kastet ut.");
        } catch (e) {
            console.error(e);
            alert("Kunne ikke utføre handlingen.");
        }
    };

    const controlPlayer = (playerId: string) => {
        const url = `${window.location.origin}/sim/play/${pin}?impersonate=${playerId}`;
        window.open(url, '_blank');
    };

    const handleRoleChange = async (playerId: string, newRole: any) => {
        try {
            const updates: any = {};
            updates[`simulation_rooms/${pin}/players/${playerId}/role`] = newRole;
            updates[`simulation_rooms/${pin}/public_profiles/${playerId}/role`] = newRole;
            await update(ref(db), updates);
        } catch (e) {
            console.error(e);
            alert("Kunne ikke endre rolle.");
        }
    };

    const handleRegionChange = async (playerId: string, newRegion: string) => {
        try {
            const updates: any = {};
            updates[`simulation_rooms/${pin}/players/${playerId}/regionId`] = newRegion;
            updates[`simulation_rooms/${pin}/public_profiles/${playerId}/regionId`] = newRegion;
            await update(ref(db), updates);
        } catch (e) {
            console.error(e);
            alert("Kunne ikke endre baroni.");
        }
    };

    const togglePublicRoom = async () => {
        if (!roomData) return;
        const newVal = !roomData.isPublic;
        try {
            await update(ref(db, `simulation_rooms/${pin}`), { isPublic: newVal });
            await syncServerMetadata(pin, { ...roomData, isPublic: newVal });
        } catch (e) {
            console.error(e);
        }
    };

    if (view === 'LIST') {
        return (
            <div className="fixed inset-0 top-0 bg-slate-950 text-slate-200 p-12 overflow-y-auto custom-scrollbar font-sans z-20">
                <div className="fixed inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h1 className="text-5xl font-black text-white px-2 tracking-tighter">Simuleringshallen</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 px-2">Sentralt kontrollpanel for administratoren</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={async () => {
                                    setIsLoading(true);
                                    try {
                                        const metaRef = ref(db, 'simulation_server_metadata');
                                        const roomRef = ref(db, 'simulation_rooms');

                                        const [metaSnap, roomSnap] = await Promise.all([get(metaRef), get(roomRef)]);
                                        const metas = metaSnap.val() || {};
                                        const rooms = roomSnap.val() || {};

                                        let cleaned = 0;
                                        const updates: any = {};

                                        Object.keys(metas).forEach(pin => {
                                            if (!rooms[pin]) {
                                                updates[`simulation_server_metadata/${pin}`] = null;
                                                cleaned++;
                                            }
                                        });

                                        if (cleaned > 0) {
                                            await update(ref(db), updates);
                                            alert(`Ryddet opp ${cleaned} døde serverkoblinger!`);
                                        } else {
                                            alert("Alt ser ryddig ut! Ingen døde linker funnet.");
                                        }

                                    } catch (err) {
                                        console.error(err);
                                        alert("Kunne ikke rydde opp " + err);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading}
                                className="bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                🧹 Vask Serverlisten
                            </button>
                            <button
                                onClick={createRoom}
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
                            >
                                + Opprett Nytt Rike
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allRooms.map(r => (
                            <div key={r.pin} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] group hover:border-indigo-500/50 transition-all shadow-xl flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors truncate pr-4" title={(r as any).name || `Rike #${r.pin}`}>{(r as any).name || `Rike #${r.pin}`}</h2>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${r.status === 'PLAYING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'} shrink-0`}>
                                            {typeof r.status === 'string' ? r.status : 'KORRUPT'}
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-600 mb-6 uppercase tracking-widest">
                                        PIN: <span className="text-slate-400 font-bold">{r.pin}</span>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                                            <span>Innbyggere:</span>
                                            <span className="text-white">{Object.keys(r.players || {}).length} sjeler</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                                            <span>Årstid:</span>
                                            <span className="text-indigo-300">{(INITIAL_MARKET as any)[r.world?.season] || r.world?.season || 'Ukjent'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setPin(r.pin); setView('MANAGE'); }}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/5"
                                    >
                                        Administrer &rarr;
                                    </button>
                                    <button
                                        onClick={() => deleteRoom(r.pin)}
                                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 w-16 rounded-2xl flex items-center justify-center border border-rose-500/20 transition-all hover:scale-105 active:scale-95"
                                        title="Slett rom"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div >
        );
    }
    if (!roomData) return null;

    // DATA INTEGRITY CHECK (Non-blocking warning)


    const repairData = async () => {
        if (!window.confirm("Er du sikker? Dette vil regenerere 'public_profiles' basert på 'players'. Bruk kun hvis listen er tom.")) return;
        setIsLoading(true);
        try {
            // Fetch ALL data (heavy, but necessary for repair)
            const snapshot = await get(ref(db, `simulation_rooms/${pin}`));
            if (!snapshot.exists()) return;
            const data = snapshot.val();
            const players = data.players || {};

            const updates: any = {};

            // Re-generate public profiles
            Object.entries(players).forEach(([pid, p]: [string, any]) => {
                updates[`simulation_rooms/${pin}/public_profiles/${pid}`] = {
                    id: pid,
                    uid: p.uid || null,
                    name: p.name,
                    role: p.role,
                    regionId: p.regionId,
                    stats: { level: p.stats?.level || 1 },
                    status: {
                        isJailed: p.status?.isJailed || false,
                        isFrozen: p.status?.isFrozen || false,
                        legitimacy: p.status?.legitimacy || 100
                    },
                    online: true,
                    lastActive: p.lastActive || Date.now()
                };
            });

            // Force status fix
            if (!data.status) updates[`simulation_rooms/${pin}/status`] = 'LOBBY';
            if (!data.world) {
                updates[`simulation_rooms/${pin}/world`] = {
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
                };
            }

            await update(ref(db), updates);
            alert("Data reparert! Profiler er synkronisert.");

            // Also sync metadata
            await syncServerMetadata(pin, { ...data, players } as any);

        } catch (e) {
            console.error(e);
            alert("Reparasjon feilet: " + e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 top-0 bg-slate-950 text-slate-200 flex overflow-hidden font-sans selection:bg-indigo-500/30 z-20">

            {/* Atmosphere */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />
            </div>

            {/* LEFT PANEL: ADMIN COMMAND CENTER */}
            <aside className="w-80 border-r border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col z-20 shadow-2xl overflow-y-auto no-scrollbar">
                <div className="p-8 border-b border-white/5 bg-black/20">
                    <button onClick={() => setView('LIST')} className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-4 hover:text-white transition-colors flex items-center gap-2">
                        &larr; Tilbake til oversikt
                    </button>
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-4xl font-mono font-black text-white">{pin}</h1>
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">Admin</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
                        {typeof roomData.status === 'string' ? roomData.status : 'FEIL: DATA KORRUPT'} MODUS
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={startGame}
                            disabled={roomData.status === 'PLAYING' || isLoading}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg ${roomData.status === 'PLAYING' ? 'bg-emerald-600/20 text-emerald-500 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'}`}
                        >
                            {roomData.status === 'PLAYING' ? '✅ SPILL AKTIVT' : '🚀 START SPILL'}
                        </button>
                        <button
                            onClick={togglePublicRoom}
                            disabled={isLoading}
                            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border flex items-center justify-center gap-2 ${roomData.isPublic ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white' : 'bg-slate-800 text-slate-500 border-white/5 hover:border-indigo-500/20'}`}
                        >
                            {roomData.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                            {roomData.isPublic ? 'OFFENTLIG SERVER' : 'PRIVAT (KUN PIN)'}
                        </button>
                        <button
                            onClick={repairData}
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white transition-all border border-amber-500/20"
                        >
                            🛠 REPARER DATA
                        </button>
                        <button
                            onClick={resetGame}
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white transition-all border border-rose-500/20"
                        >
                            ⚠ NULLSTILL ALT
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    {/* World Controls */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Verdensstyring</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-slate-400 italic">Årstid: {(SEASONS as any)[roomData.world?.season]?.label || 'Ukjent'}</span>
                                    <span className="text-2xl group-hover:rotate-12 transition-transform">{{ Spring: '🌱', Summer: '☀️', Autumn: '🍂', Winter: '❄️' }[roomData.world?.season || 'Spring']}</span>
                                </div>
                                <button onClick={nextSeason} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-black uppercase text-[10px] transition-all">Neste Årstid</button>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-slate-400 italic">Vær: {roomData.world?.weather || 'Klart'}</span>
                                    <span className="text-2xl group-hover:scale-110 transition-transform">☁️</span>
                                </div>
                                <button onClick={changeWeather} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-black uppercase text-[10px] transition-all">Endre Vær</button>
                            </div>
                        </div>
                    </section>

                    {/* Mass Actions */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Massehandlinger</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={handleTaxation} className="w-full bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-600/20 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2">
                                💰 Skattlegg Riket
                            </button>
                            <button onClick={regenAllStamina} className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/20 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 text-center">
                                ⚡ Gjenopprett Stamina
                            </button>
                            <button onClick={resetPoliticalUnrest} className="w-full bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white border border-indigo-600/20 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 text-center">
                                🕊️ Nullstill Politisk Uro
                            </button>
                            <button onClick={kickAllPlayers} className="w-full bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-600/20 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 text-center mt-2">
                                ☠️ Kast ut alle
                            </button>
                        </div>
                    </section>

                    {/* Special Actions */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 text-center">Intervensjoner</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={spawnRandomEvent} className="bg-rose-600/80 hover:bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-rose-600/20 transition-all active:scale-95">🎲 Event</button>
                                <button onClick={startTing} disabled={!!roomData.activeVote} className="bg-amber-600/80 hover:bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-amber-600/20 disabled:opacity-20 text-center transition-all active:scale-95">⚖️ Tinget</button>
                            </div>
                            {/* Character Creator Form */}
                            <section className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 space-y-4 shadow-inner">
                                <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-2 px-2">Legg til Karakter</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Navn..."
                                        value={charForm.name}
                                        onChange={(e) => setCharForm({ ...charForm, name: e.target.value })}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-0 transition-all"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={charForm.role}
                                            onChange={(e) => setCharForm({ ...charForm, role: e.target.value as any })}
                                            className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-400 focus:ring-0"
                                        >
                                            {Object.keys(ROLE_DEFINITIONS).map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-3 py-2">
                                            <span className="text-[8px] font-black text-slate-600">LVL</span>
                                            <input
                                                type="number"
                                                value={charForm.level}
                                                onChange={(e) => setCharForm({ ...charForm, level: parseInt(e.target.value) })}
                                                className="w-full bg-transparent border-none p-0 text-xs font-black text-white focus:ring-0 font-mono"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={spawnCharacter}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                                    >
                                        ✨ SKAP KARAKTER
                                    </button>
                                </div>
                            </section>
                        </div>
                    </section>

                    {/* Settlement Management */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Landsby-fokus</h3>
                        {!roomData.world?.settlement ? (
                            <button onClick={initializeSettlement} className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black uppercase text-[10px] animate-pulse">Initialiser Landsby</button>
                        ) : (
                            <div className="text-xs text-slate-500 italic">
                                Landsbyen er initialisert.
                            </div>
                        )}
                    </section>
                </div>
            </aside>

            {/* CENTER PANEL: THE REALM OBSERVER */}
            <main className="flex-1 relative flex flex-col bg-slate-900/10 overflow-hidden no-scrollbar">
                <header className="h-16 border-b border-white/5 bg-slate-950/30 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10">
                    <div className="flex items-center gap-8">
                        <nav className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                            <button
                                onClick={() => setView('MANAGE')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'MANAGE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                Overvåking
                            </button>
                            <button
                                onClick={() => setView('ECONOMY')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'ECONOMY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                Blueprint
                            </button>
                            <button
                                onClick={() => setView('AI_LAB')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'AI_LAB' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                AI Training Lab
                            </button>
                        </nav>
                        <div className="h-4 w-[1px] bg-white/10 mx-2" />
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Innbyggere:</span>
                                <span className="text-sm font-bold text-white">{Object.keys(roomData.players || {}).length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">År i Riket:</span>
                                <span className="text-sm font-bold text-white">{roomData.world?.year || 1100}</span>
                            </div>
                        </div>
                    </div>
                    {isLoading && <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">Prosesserer Endringer...</div>}
                </header>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar no-scrollbar">
                    {view === 'ECONOMY' ? (
                        SimulationEconomyBlueprint ? <SimulationEconomyBlueprint /> : <div className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Laster Blueprint...</div>
                    ) : view === 'AI_LAB' ? (
                        <AITrainingLab roomData={roomData} pin={pin} />
                    ) : (
                        <div className="space-y-12 pb-20">
                            {/* Player Grid */}

                            <section>
                                <h2 className="text-3xl font-black text-white px-2 mb-8 tracking-tighter">Innbyggere i Riket</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.values(roomData.players || {}).map(p => (
                                        <div key={p.id} className="relative bg-slate-900/80 border border-white/5 p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all group">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); kickPlayer(p.id, p.name); }}
                                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center font-bold text-xs"
                                                title="Kast ut spiller"
                                            >
                                                ✕
                                            </button>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                                                    {p.avatar ? <img src={p.avatar} alt={p.role} className="w-full h-full object-cover" /> : ({
                                                        KING: '👑',
                                                        BARON: '🏰',
                                                        PEASANT: '🌾',
                                                        SOLDIER: '⚔️',
                                                        MERCHANT: '💰'
                                                    } as any)[p.role] || '👤'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-lg font-black text-white truncate leading-tight">{p.name}</h3>
                                                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase">LVL</span>
                                                            <input
                                                                type="number"
                                                                value={p.stats?.level || 1}
                                                                onChange={(e) => handlePlayerLevelChange(p.id, parseInt(e.target.value))}
                                                                className="w-8 bg-transparent border-none p-0 text-[10px] font-black text-indigo-400 focus:ring-0 text-center font-mono"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <select
                                                            value={p.role}
                                                            onChange={(e) => handleRoleChange(p.id, e.target.value)}
                                                            className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border-none p-0 focus:ring-0 cursor-pointer hover:text-white transition-colors w-full text-left"
                                                        >
                                                            {Object.entries(ROLE_DEFINITIONS).map(([id, def]) => (
                                                                <option key={id} value={id} className="bg-slate-900">{def.label}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={p.regionId || 'region_ost'}
                                                            onChange={(e) => handleRegionChange(p.id, e.target.value)}
                                                            className="bg-white/5 text-slate-500 text-[9px] font-bold uppercase tracking-wider border-none p-0 focus:ring-0 cursor-pointer hover:text-slate-300 transition-colors w-full text-left"
                                                        >
                                                            <option value="capital" className="bg-slate-900">Hovedstaden</option>
                                                            <option value="region_ost" className="bg-slate-900">Baroniet Øst</option>
                                                            <option value="region_vest" className="bg-slate-900">Baroniet Vest</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* BOT THOUGHTS (QA TELEMETRY) */}
                                            {p.id.startsWith('bot_') && p.status?.thought && (
                                                <div className="mb-4 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Mental Tilstand</span>
                                                        <div className="flex-1 h-[1px] bg-indigo-500/20"></div>
                                                    </div>
                                                    <p className="text-[10px] text-white/90 font-bold leading-relaxed mb-2">
                                                        "{p.status.thought}"
                                                    </p>
                                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-indigo-400/60">
                                                        <span>Handling: {p.status.lastAction}</span>
                                                        <span>Tid: {p.status.lastTick ? new Date(p.status.lastTick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Nå'}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-3 mb-6">
                                                <div>
                                                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 mb-1">
                                                        <span>Stamina</span>
                                                        <span className="text-white">{p.status.stamina}%</span>
                                                    </div>
                                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${p.status.stamina}%` }} />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span className="text-slate-500">Gull:</span>
                                                    <span className="text-amber-500 font-black">{p.resources.gold}💰</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mb-6">
                                                {p.upgrades?.map((upg: string) => (
                                                    <span key={upg} className="text-[7px] font-black bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-tighter">{upg}</span>
                                                ))}
                                                {(!p.upgrades || p.upgrades.length === 0) && <span className="text-[7px] font-bold text-slate-700 uppercase italic">Ingen oppgraderinger</span>}
                                            </div>

                                            <button
                                                onClick={() => controlPlayer(p.id)}
                                                className="w-full py-4 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all border border-indigo-500/20 flex items-center justify-center gap-2 group/btn"
                                            >
                                                <span className="group-hover/btn:scale-125 transition-transform">🎮</span>
                                                Styr spiller
                                            </button>

                                            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Gull..."
                                                        value={giveGoldAmounts[p.id] || ''}
                                                        onChange={(e) => setGiveGoldAmounts({ ...giveGoldAmounts, [p.id]: parseInt(e.target.value) || 0 })}
                                                        className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black text-white focus:border-indigo-500/50 transition-all font-mono"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const amt = giveGoldAmounts[p.id] || 0;
                                                            if (amt > 0) {
                                                                handleAdminGiveGold(pin, p.id, amt);
                                                                setGiveGoldAmounts({ ...giveGoldAmounts, [p.id]: 0 });
                                                            }
                                                        }}
                                                        className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all"
                                                    >
                                                        GI GULL
                                                    </button>
                                                </div>

                                                {/* ADMIN: GIVE RESOURCE */}
                                                <div className="flex gap-2">
                                                    <select
                                                        value={giveResourceSelection[p.id]?.resourceId || ''}
                                                        onChange={(e) => setGiveResourceSelection({ ...giveResourceSelection, [p.id]: { resourceId: e.target.value, amount: giveResourceSelection[p.id]?.amount || 10 } })}
                                                        className="flex-[2] bg-black/40 border border-white/5 rounded-xl px-2 py-2 text-[10px] font-bold text-amber-300 focus:border-amber-500/50 transition-all cursor-pointer"
                                                    >
                                                        <option value="">Velg Ressurs...</option>
                                                        {Object.entries(RESOURCE_DETAILS).map(([key, detail]) => (
                                                            <option key={key} value={key}>{detail.icon} {detail.label}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        placeholder="#"
                                                        value={giveResourceSelection[p.id]?.amount || 10}
                                                        onChange={(e) => setGiveResourceSelection({ ...giveResourceSelection, [p.id]: { resourceId: giveResourceSelection[p.id]?.resourceId || '', amount: parseInt(e.target.value) || 1 } })}
                                                        className="w-12 bg-black/40 border border-white/5 rounded-xl px-2 py-2 text-[10px] font-black text-white focus:border-amber-500/50 transition-all font-mono text-center"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const selection = giveResourceSelection[p.id];
                                                            if (selection && selection.resourceId && selection.amount > 0) {
                                                                handleAdminGiveResource(pin, p.id, selection.resourceId, selection.amount);
                                                                setGiveResourceSelection({ ...giveResourceSelection, [p.id]: { resourceId: '', amount: 10 } });
                                                            }
                                                        }}
                                                        className="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all"
                                                    >
                                                        GI RESSURS
                                                    </button>
                                                </div>

                                                {/* ADMIN: GIVE ITEM */}
                                                <div className="flex gap-2">
                                                    <select
                                                        value={giveItemSelection[p.id]?.itemId || ''}
                                                        onChange={(e) => setGiveItemSelection({ ...giveItemSelection, [p.id]: { itemId: e.target.value, amount: giveItemSelection[p.id]?.amount || 1 } })}
                                                        className="flex-[2] bg-black/40 border border-white/5 rounded-xl px-2 py-2 text-[10px] font-bold text-slate-300 focus:border-indigo-500/50 transition-all cursor-pointer"
                                                    >
                                                        <option value="">Velg Gjenstand...</option>
                                                        {Object.values(ITEM_TEMPLATES).map(item => (
                                                            <option key={item.id} value={item.id}>{item.icon} {item.name}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        placeholder="#"
                                                        value={giveItemSelection[p.id]?.amount || 1}
                                                        onChange={(e) => setGiveItemSelection({ ...giveItemSelection, [p.id]: { itemId: giveItemSelection[p.id]?.itemId || '', amount: parseInt(e.target.value) || 1 } })}
                                                        className="w-12 bg-black/40 border border-white/5 rounded-xl px-2 py-2 text-[10px] font-black text-white focus:border-indigo-500/50 transition-all font-mono text-center"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const selection = giveItemSelection[p.id];
                                                            if (selection && selection.itemId && selection.amount > 0) {
                                                                handleAdminGiveItem(pin, p.id, selection.itemId, selection.amount);
                                                                // Optional: Reset or keep selection? Resetting amount but keeping item might be nice.
                                                                // Resetting all for safety.
                                                                setGiveItemSelection({ ...giveItemSelection, [p.id]: { itemId: '', amount: 1 } });
                                                            }
                                                        }}
                                                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all"
                                                    >
                                                        GI ITEM
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(roomData.players || {}).length === 0 && (
                                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                                            <span className="text-6xl block mb-4 opacity-20">🏰</span>
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Venter på at undersåtter skal ankomme...</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Settlement Progress */}
                            {roomData.world?.settlement && (
                                <section className="bg-indigo-900/10 border border-indigo-500/10 p-10 rounded-[3rem] relative overflow-hidden group">
                                    <div className="relative z-10">

                                        <h2 className="text-3xl font-black text-white mb-8 tracking-tighter flex items-center justify-between">
                                            Landsbyutvikling
                                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full">Status Rapport</span>
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {Object.values(roomData.world?.settlement?.buildings || {}).map((building: any) => {
                                                const meta = (VILLAGE_BUILDINGS as any)[building.id];
                                                const progress = (building.progress / (building.target || 200)) * 100;
                                                return (
                                                    <div key={building.id} className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <h4 className="text-sm font-black text-white uppercase">{meta?.name}</h4>
                                                                <p className="text-[10px] text-slate-500 font-bold tracking-tight">Nivå {building.level}</p>
                                                            </div>
                                                            <span className="text-xs font-mono text-indigo-500">
                                                                {Object.values(building.progress || {}).reduce((sum: number, val: any) => sum + (val as number), 0)} / {building.target || 200}
                                                            </span>
                                                        </div>
                                                        <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 relative group/progress">
                                                            <div className={`h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-fuchsia-500 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.4)] relative`} style={{ width: `${progress}%` }}>
                                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                            </div>
                                                            {/* Manual Controls Overlay */}
                                                            <div className="absolute inset-0 opacity-0 group-hover/progress:opacity-100 transition-opacity flex justify-between items-center px-1 pointer-events-none">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleBuildingLevelChange(building.id, -1); }}
                                                                    className="w-5 h-5 bg-white/10 hover:bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black pointer-events-auto transition-all"
                                                                >
                                                                    -
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleBuildingLevelChange(building.id, 1); }}
                                                                    className="w-5 h-5 bg-white/10 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black pointer-events-auto transition-all"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="absolute top-[-20%] right-[-10%] text-[15rem] text-indigo-500 opacity-[0.03] pointer-events-none group-hover:rotate-6 transition-transform duration-[3000ms]">🏠</div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main >

            {/* RIGHT PANEL: INTELLIGENCE & FEED */}
            < aside className="w-80 border-l border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col z-20 shadow-2xl overflow-hidden" >
                <div className="p-8 border-b border-white/5 bg-black/20 shrink-0">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-6 flex items-center justify-between">
                        Rikets Formue
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    </h3>
                    <div className="space-y-4">
                        {Object.values(roomData.players || {})
                            .sort((a, b) => (b.resources.gold || 0) - (a.resources.gold || 0))
                            .slice(0, 5)
                            .map((p, i) => (
                                <div key={p.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-600 font-mono">#{i + 1}</span>
                                        <span className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">{p.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-amber-400">{p.resources.gold}💰</span>
                                </div>
                            ))}
                        {Object.keys(roomData.players || {}).length === 0 && <p className="text-[10px] text-slate-600 font-bold italic text-center py-4">Ingen data tilgjengelig...</p>}
                    </div>
                </div>



                <div className="p-8 border-b border-white/5 shrink-0">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6">Markedsanalyse</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(roomData.market || {}).slice(0, 4).map(([res, data]: [string, any]) => {
                            const details = (RESOURCE_DETAILS as any)[res] || { label: res };
                            return (
                                <div key={res} className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="text-[8px] font-black uppercase text-slate-500 mb-1">{details.label}</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-white">{data.stock}</span>
                                        <span className="text-[10px] font-mono text-emerald-400">{data.price.toFixed(1)}g</span>
                                    </div>
                                </div>
                            );
                        })}
                        {Object.entries(roomData.market || {}).slice(0, 4).length === 0 && (
                            <div className="col-span-2 text-[10px] text-slate-600 font-bold italic text-center py-4">Ingen markedsdata...</div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-8 pb-4 shrink-0">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
                            Global Logg
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-8 custom-scrollbar">
                        {getMessagesList(roomData.messages).slice().reverse().map((msg: any, idx: number) => (
                            <div key={idx} className="bg-indigo-950/20 border-l-2 border-indigo-500/50 p-4 rounded-r-2xl animate-in slide-in-from-right-4 duration-300">
                                <p className="text-[10px] font-medium leading-relaxed text-slate-400 antialiased italic font-serif opacity-80">
                                    {typeof msg === 'object' ? JSON.stringify(msg) : msg}
                                </p>
                            </div>
                        ))}
                        {getMessagesList(roomData.messages).length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                                <span className="text-4xl mb-4">📜</span>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em]">Arkivet er tomt</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside >

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </div >
    );
};
