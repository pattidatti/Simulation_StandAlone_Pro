import React, { useState, useEffect } from 'react';
import { ref, set, onValue, update, get, remove, DataSnapshot } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';
import { useLayout } from '../../context/LayoutContext';

import { INITIAL_MARKET, INITIAL_RESOURCES, VILLAGE_BUILDINGS, SEASONS, INITIAL_SKILLS } from './constants';
import { assignRoles, collectTaxes } from './gameLogic';
import { generateInitialRoomState, syncServerMetadata } from './logic/roomInit';
import type { SimulationMessage, SimulationRoom } from './simulationTypes';
import { handleAdminGiveGold, handleAdminGiveItem, handleAdminGiveResource } from './globalActions';

import { useGameTicker } from './hooks/useGameTicker';
import { useHostRoomData } from './hooks/useHostRoomData';

import { SimulationHostAuth } from './components/host/SimulationHostAuth';
import { HostRoomList } from './components/host/HostRoomList';
import { ActiveRoomView } from './components/host/ActiveRoomView';

const ADMIN_PASSWORD = "Enevelde";

export const SimulationHost: React.FC = () => {
    const [pin, setPin] = useState<string>('');
    const [allRooms, setAllRooms] = useState<SimulationRoom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'LIST' | 'MANAGE' | 'ECONOMY' | 'AI_LAB'>('LIST');

    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
        return sessionStorage.getItem('admin_session') === 'active';
    });

    const { setFullWidth, setHideHeader } = useLayout();
    const { roomData, setRoomData, onlineCount } = useHostRoomData(pin);

    // --- UTILS & HELPERS ---
    const getMessagesList = (msgs: SimulationMessage[] | Record<string, SimulationMessage> | undefined): SimulationMessage[] => {
        if (!msgs) return [];
        if (Array.isArray(msgs)) return msgs;
        return Object.values(msgs).sort((a, b) => a.timestamp - b.timestamp);
    };

    // --- LAYOUT & TITLE ---
    useEffect(() => {
        setFullWidth(true);
        setHideHeader(true);
        return () => {
            setFullWidth(false);
            setHideHeader(false);
        };
    }, [setFullWidth, setHideHeader]);

    useEffect(() => {
        if (pin && (view === 'MANAGE' || view === 'ECONOMY' || view === 'AI_LAB')) {
            document.title = `Host: ${pin} | Eiriksbok`;
        } else {
            document.title = 'Simuleringshallen | Eiriksbok';
        }
        return () => { document.title = 'Eiriksbok'; };
    }, [pin, view]);

    // --- TICKER ---
    useGameTicker(pin, roomData?.status || 'LOBBY', roomData?.world, onlineCount);

    // --- INITIAL FETCH ---
    useEffect(() => {
        const roomsRef = ref(db, 'simulation_rooms');
        const unsubscribe = onValue(roomsRef, (snapshot: DataSnapshot) => {
            const data = snapshot.val();
            if (data) {
                const roomList = Object.entries(data).map(([key, val]: [string, any]) => ({
                    ...val,
                    pin: val.pin || key
                }));
                setAllRooms(roomList.reverse() as any[]);
            } else {
                setAllRooms([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- CORE HANDLERS ---
    const createRoom = async () => {
        const name = prompt("Hva skal riket hete? (La stå tomt for automatisk navn)");
        if (name === null) return;
        setIsLoading(true);
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        const serverName = name.trim() || `Rike #${newPin}`;
        const initialRoomState = generateInitialRoomState(newPin, serverName);
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

    const deleteRoom = async (roomPin: string) => {
        if (!window.confirm(`ER DU SIKKER? Dette vil slette rommet ${roomPin} permanent!`)) return;
        setIsLoading(true);
        try {
            await remove(ref(db, `simulation_rooms/${roomPin}`));
            await remove(ref(db, `simulation_server_metadata/${roomPin}`));
        } catch (e) {
            console.error(e);
            alert("Kunne ikke slette rommet.");
        } finally {
            setIsLoading(false);
        }
    };

    const cleanupMetadata = async () => {
        setIsLoading(true);
        try {
            const [metaSnap, roomSnap] = await Promise.all([get(ref(db, 'simulation_server_metadata')), get(ref(db, 'simulation_rooms'))]);
            const metas = metaSnap.val() || {};
            const rooms = roomSnap.val() || {};
            let cleaned = 0;
            const updates: any = {};
            Object.keys(metas).forEach(p => {
                if (!rooms[p]) { updates[`simulation_server_metadata/${p}`] = null; cleaned++; }
            });
            if (cleaned > 0) {
                await update(ref(db), updates);
                alert(`Ryddet opp ${cleaned} døde serverkoblinger!`);
            } else {
                alert("Alt ser ryddig ut!");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- ACTIVE ROOM HANDLERS ---
    const startGame = async () => {
        if (!roomData || !roomData.players) return;
        setIsLoading(true);
        try {
            const updatedPlayers = assignRoles(roomData.players);
            const newRegions: any = {
                'region_vest': { id: 'region_vest', name: 'Baroniet Vest', taxRate: 10, defenseLevel: 50, rulerName: 'Ingen' },
                'region_ost': { id: 'region_ost', name: 'Baroniet Øst', taxRate: 10, defenseLevel: 50, rulerName: 'Ingen' }
            };
            const newMarkets: any = { ...roomData.markets };
            if (!newMarkets['capital']) newMarkets['capital'] = JSON.parse(JSON.stringify(INITIAL_MARKET));
            ['region_vest', 'region_ost'].forEach(rid => { if (!newMarkets[rid]) newMarkets[rid] = JSON.parse(JSON.stringify(INITIAL_MARKET)); });

            Object.values(updatedPlayers).forEach(p => {
                if (p.role === 'BARON') {
                    newRegions[p.regionId] = { ...newRegions[p.regionId], rulerName: p.name };
                    const localMarket = JSON.parse(JSON.stringify(INITIAL_MARKET));
                    Object.keys(localMarket).forEach(key => {
                        localMarket[key].price = Math.floor(localMarket[key].price * (0.8 + Math.random() * 0.4));
                        localMarket[key].stock = Math.floor(localMarket[key].stock * (0.8 + Math.random() * 0.4));
                    });
                    newMarkets[p.regionId] = localMarket;
                }
            });

            const publicProfiles: any = {};
            Object.values(updatedPlayers).forEach(p => {
                publicProfiles[p.id] = {
                    id: p.id, name: p.name, role: p.role, regionId: p.regionId,
                    stats: { level: p.stats.level || 1 },
                    status: { isJailed: false, isFrozen: false, legitimacy: 100 },
                    online: true, lastActive: p.lastActive
                };
            });

            const updates: any = {};
            updates[`simulation_rooms/${pin}/players`] = updatedPlayers;
            updates[`simulation_rooms/${pin}/public_profiles`] = publicProfiles;
            updates[`simulation_rooms/${pin}/regions`] = newRegions;
            updates[`simulation_rooms/${pin}/markets`] = newMarkets;
            updates[`simulation_rooms/${pin}/status`] = 'PLAYING';
            await update(ref(db), updates);
            await syncServerMetadata(pin, { ...roomData, status: 'PLAYING' } as any);
        } catch (e) {
            console.error(e);
            alert("Klarte ikke starte.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTaxation = async () => {
        if (!roomData?.players) return;
        setIsLoading(true);
        try {
            const kingTax = roomData.world?.taxRateDetails?.kingTax || 20;
            const { updatedPlayers, results } = collectTaxes(roomData.players, kingTax);
            await update(ref(db, `simulation_rooms/${pin}/players`), updatedPlayers);
            alert(`Suksess! ${results.length} bønder og baroner ble skattlagt.`);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
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
            const newMessage: SimulationMessage = { id: `msg_${Date.now()}`, content: `🌍 Årstiden har skiftet til ${sLabel}!`, timestamp: Date.now(), type: 'SEASON_CHANGE' };
            const updatedMessages = [...getMessagesList(roomData.messages), newMessage].slice(-50);
            await update(ref(db), { [`simulation_rooms/${pin}/world/season`]: nextSeasonVal, [`simulation_rooms/${pin}/messages`]: updatedMessages });
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const changeWeather = async () => {
        if (!roomData) return;
        const weatherList: ('Clear' | 'Rain' | 'Storm' | 'Fog')[] = ['Clear', 'Rain', 'Storm', 'Fog'];
        const currentIdx = weatherList.indexOf(roomData.world.weather || 'Clear');
        const nextWeather = weatherList[(currentIdx + 1) % weatherList.length];
        try {
            const weatherMap: any = { Clear: 'Klart', Rain: 'Regn', Storm: 'Storm', Fog: 'Tåke' };
            const newMessage: SimulationMessage = { id: `msg_${Date.now()}`, content: `☁️ Været har skiftet til ${weatherMap[nextWeather] || nextWeather}!`, timestamp: Date.now(), type: 'WEATHER_CHANGE' };
            const updatedMessages = [...getMessagesList(roomData.messages), newMessage].slice(-50);
            await update(ref(db), { [`simulation_rooms/${pin}/world/weather`]: nextWeather, [`simulation_rooms/${pin}/messages`]: updatedMessages });
        } catch (e) { console.error(e); }
    };

    const startTing = async () => {
        if (!roomData) return;
        const { LAW_TEMPLATES } = await import('./constants');
        const law = LAW_TEMPLATES[Math.floor(Math.random() * LAW_TEMPLATES.length)];
        const activeVote = { lawId: law.id, title: law.label, votes: {}, expiresAt: Date.now() + 60000 };
        try {
            const newMessage: SimulationMessage = { id: `msg_${Date.now()}`, content: `⚖️ TINGET ER SATT! Det skal stemmes over loven: "${law.label}"!`, timestamp: Date.now(), type: 'VOTE_START' };
            const updatedMessages = [...getMessagesList(roomData.messages), newMessage].slice(-50);
            await update(ref(db, `simulation_rooms/${pin}`), { activeVote, messages: updatedMessages });
            setTimeout(() => resolveVote(law.id), 60000);
        } catch (e) { console.error(e); }
    };

    const resolveVote = async (lawId: string) => {
        const snapshot = await get(ref(db, `simulation_rooms/${pin}/activeVote`));
        if (!snapshot.exists()) return;
        const voteData = snapshot.val();
        const votes = Object.values(voteData.votes || {}) as ('YES' | 'NO')[];
        const yesVotes = votes.filter(v => v === 'YES').length;
        const noVotes = votes.filter(v => v === 'NO').length;
        let activeLaws = roomData?.world?.activeLaws || [];
        let msg = yesVotes > noVotes ? `✅ LOVEN ER VEDTATT! "${voteData.title}" er nå gjeldende.` : `❌ LOVEN BLE FORKASTET. "${voteData.title}" ble nedstemt.`;
        if (yesVotes > noVotes) activeLaws = [...activeLaws, lawId];
        const newMessage: SimulationMessage = { id: `msg_${Date.now()}`, content: msg, timestamp: Date.now(), type: 'VOTE_RESULT' };
        try {
            await update(ref(db, `simulation_rooms/${pin}/world`), { activeLaws });
            await update(ref(db, `simulation_rooms/${pin}`), { activeVote: null, messages: [...getMessagesList(roomData?.messages), newMessage].slice(-50) });
        } catch (e) { console.error(e); }
    };

    const spawnRandomEvent = async () => {
        if (!roomData) return;
        const { WORLD_EVENT_TEMPLATES } = await import('./constants');
        const template = WORLD_EVENT_TEMPLATES[Math.floor(Math.random() * WORLD_EVENT_TEMPLATES.length)];
        const eventId = `event_${Date.now()}`;
        try {
            const newMessage: SimulationMessage = { id: `msg_${Date.now()}`, content: `🔔 HENDELSE: ${template.title}! Sjekk kartet!`, timestamp: Date.now(), type: 'EVENT_SPAWN' };
            const updatedMessages = [...getMessagesList(roomData.messages), newMessage].slice(-50);
            await update(ref(db, `simulation_rooms/${pin}/worldEvents`), { [eventId]: { ...template, id: eventId, expiresAt: Date.now() + 300000 } });
            await update(ref(db, `simulation_rooms/${pin}`), { messages: updatedMessages });
        } catch (e) { console.error(e); }
    };

    const spawnCharacter = async (form: { name: string, role: any, level: number }) => {
        setIsLoading(true);
        try {
            const charId = `char_${Math.random().toString(36).substr(2, 9)}`;
            const character: any = {
                id: charId, name: form.name, role: form.role,
                regionId: (form.role === 'KING') ? 'capital' : (Math.random() > 0.5 ? 'region_ost' : 'region_vest'),
                resources: INITIAL_RESOURCES[form.role as keyof typeof INITIAL_RESOURCES] || INITIAL_RESOURCES.PEASANT,
                status: { hp: 100, stamina: 100, morale: 100, legitimacy: 100, authority: 50, loyalty: 100, isJailed: false, isFrozen: false },
                stats: { level: form.level, xp: 0, reputation: 10, contribution: 0 },
                skills: INITIAL_SKILLS[form.role as keyof typeof INITIAL_SKILLS] || INITIAL_SKILLS.PEASANT,
                lastActive: Date.now(), online: true
            };
            const updates: any = {};
            updates[`simulation_rooms/${pin}/players/${charId}`] = character;
            updates[`simulation_rooms/${pin}/public_profiles/${charId}`] = {
                id: charId, name: character.name, role: character.role, regionId: character.regionId,
                stats: { level: character.stats.level }, status: { isJailed: false, isFrozen: false, legitimacy: 100 },
                online: true, lastActive: character.lastActive
            };
            await update(ref(db), updates);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const repairData = async () => {
        if (!window.confirm("Er du sikker? Dette vil regenerere 'public_profiles'.")) return;
        setIsLoading(true);
        try {
            const snapshot = await get(ref(db, `simulation_rooms/${pin}`));
            if (!snapshot.exists()) return;
            const data = snapshot.val();
            const players = data.players || {};
            const updates: any = {};
            Object.entries(players).forEach(([pid, p]: [string, any]) => {
                updates[`simulation_rooms/${pin}/public_profiles/${pid}`] = {
                    id: pid, uid: p.uid || null, name: p.name, role: p.role, regionId: p.regionId,
                    stats: { level: p.stats?.level || 1 }, status: { isJailed: p.status?.isJailed || false, isFrozen: p.status?.isFrozen || false, legitimacy: p.status?.legitimacy || 100 },
                    online: true, lastActive: p.lastActive || Date.now()
                };
            });
            if (!data.status) updates[`simulation_rooms/${pin}/status`] = 'LOBBY';
            await update(ref(db), updates);
            alert("Data reparert!");
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const resetGame = async () => {
        if (!window.confirm("Er du sikker? Alt slettes.")) return;
        setIsLoading(true);
        try {
            const updates: any = {};
            updates[`simulation_rooms/${pin}/status`] = 'LOBBY';
            updates[`simulation_rooms/${pin}/worldEvents`] = {};
            updates[`simulation_rooms/${pin}/messages`] = [];
            updates[`simulation_rooms/${pin}/market`] = INITIAL_MARKET;
            updates[`simulation_rooms/${pin}/markets`] = { 'capital': INITIAL_MARKET };
            updates[`simulation_rooms/${pin}/regions`] = {};
            updates[`simulation_rooms/${pin}/world/monumentProgress`] = 0;
            updates[`simulation_rooms/${pin}/world/activeLaws`] = [];
            updates[`simulation_rooms/${pin}/world/settlement/buildings`] = Object.entries(VILLAGE_BUILDINGS).reduce((acc, [id]) => ({ ...acc, [id]: { id, level: 0, progress: {}, target: 200, contributions: {} } }), {});

            Object.keys(roomData?.players || {}).forEach(id => {
                updates[`simulation_rooms/${pin}/players/${id}/role`] = 'PEASANT';
                updates[`simulation_rooms/${pin}/players/${id}/regionId`] = 'capital';
                updates[`simulation_rooms/${pin}/players/${id}/resources`] = INITIAL_RESOURCES.PEASANT;
                updates[`simulation_rooms/${pin}/players/${id}/status`] = { stamina: 100, legitimacy: 100, authority: 50 };
                updates[`simulation_rooms/${pin}/public_profiles/${id}/role`] = 'PEASANT';
                updates[`simulation_rooms/${pin}/public_profiles/${id}/regionId`] = 'capital';
                updates[`simulation_rooms/${pin}/public_profiles/${id}/stats/level`] = 1;
            });

            await update(ref(db), updates);
            setRoomData((prev: SimulationRoom | null) => prev ? { ...prev, status: 'LOBBY', messages: [] } : null);
            alert("Spillet er nullstilt!");
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const [SimulationEconomyBlueprint, setSimulationEconomyBlueprint] = useState<any>(null);
    useEffect(() => {
        import('./components/SimulationEconomyBlueprint').then(mod => setSimulationEconomyBlueprint(() => mod.SimulationEconomyBlueprint));
    }, []);

    // --- RENDER ---
    if (!isAdminAuthenticated) return <SimulationHostAuth onAuth={() => setIsAdminAuthenticated(true)} adminPassword={ADMIN_PASSWORD} />;

    if (view === 'LIST') return (
        <HostRoomList
            allRooms={allRooms}
            isLoading={isLoading}
            onCreateRoom={createRoom}
            onDeleteRoom={deleteRoom}
            onManageRoom={(p) => { setPin(p); setView('MANAGE'); }}
            onCleanupMetadata={cleanupMetadata}
        />
    );

    const handleExportLog = async () => {
        if (!pin) return;
        setIsLoading(true);

        let logs: any[] = [];

        // 1. Try to get from archive
        try {
            const archiveSnap = await get(ref(db, `simulation_archives/${pin}/full_log`));
            if (archiveSnap.exists()) {
                logs = Object.values(archiveSnap.val());
            }
        } catch (err) {
            console.warn("Archive fetch failed (likely permissions), falling back to live data.", err);
        }

        // 2. If archive is empty or failed, fallback to current live messages
        if (logs.length === 0 && roomData?.messages) {
            logs = Array.isArray(roomData.messages)
                ? roomData.messages
                : Object.values(roomData.messages);

            if (logs.length > 0) {
                console.log("Exported live data fallback.");
            }
        }

        if (logs.length === 0) {
            alert("Ingen data å eksportere (verken i arkiv eller live-feed).");
            setIsLoading(false);
            return;
        }

        try {
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `simulation_log_${pin}_${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Blob creation failed:", err);
            alert("Kunne ikke generere fil.");
        }
        setIsLoading(false);
    };

    if (!roomData) return null;

    const worldActions = {
        onStartGame: startGame,
        onTogglePublic: () => update(ref(db, `simulation_rooms/${pin}`), { isPublic: !roomData.isPublic }),
        onRepairData: repairData,
        onResetGame: resetGame,
        onNextSeason: nextSeason,
        onChangeWeather: changeWeather,
        onSpawnEvent: spawnRandomEvent,
        onStartTing: startTing,
        onExportLog: handleExportLog,
        initializeSettlement: async () => {
            setIsLoading(true);
            await update(ref(db, `simulation_rooms/${pin}/world/settlement`), { buildings: Object.entries(VILLAGE_BUILDINGS).reduce((acc, [id]) => ({ ...acc, [id]: { id, level: 0, progress: {}, target: 200, contributions: {} } }), {}) });
            setIsLoading(false);
        },
        handleBuildingLevelChange: async (bid: string, delta: number) => {
            const building = roomData.world?.settlement?.buildings?.[bid];
            if (!building) return;
            await update(ref(db, `simulation_rooms/${pin}/world/settlement/buildings/${bid}`), { level: Math.max(0, building.level + delta), progress: {} });
        },
        onTaxationBase: handleTaxation
    };

    const playerActions = {
        onRegenStamina: async () => {
            setIsLoading(true);
            const updates: any = {};
            Object.keys(roomData.players || {}).forEach(id => { updates[`simulation_rooms/${pin}/players/${id}/status/stamina`] = 100; });
            await update(ref(db), updates);
            setIsLoading(false);
        },
        onResetUnrest: async () => {
            setIsLoading(true);
            const updates: any = {};
            Object.keys(roomData.regions || {}).forEach(rid => { updates[`simulation_rooms/${pin}/regions/${rid}/coup/bribeProgress`] = 0; updates[`simulation_rooms/${pin}/regions/${rid}/coup/contributions`] = {}; });
            await update(ref(db), updates);
            setIsLoading(false);
        },
        onKickAll: async () => { if (window.confirm("Kast ut alle?")) await update(ref(db), { [`simulation_rooms/${pin}/players`]: {} }); },
        onSpawnCharacter: spawnCharacter,
        kickPlayer: async (id: string, name: string) => { if (window.confirm(`Kast ut ${name}?`)) await update(ref(db), { [`simulation_rooms/${pin}/players/${id}`]: null, [`simulation_rooms/${pin}/public_profiles/${id}`]: null }); },
        handlePlayerLevelChange: async (id: string, lvl: number) => { await update(ref(db), { [`simulation_rooms/${pin}/players/${id}/stats/level`]: lvl, [`simulation_rooms/${pin}/public_profiles/${id}/stats/level`]: lvl }); },
        handleRoleChange: async (id: string, role: any) => { await update(ref(db), { [`simulation_rooms/${pin}/players/${id}/role`]: role, [`simulation_rooms/${pin}/public_profiles/${id}/role`]: role }); },
        handleRegionChange: async (id: string, reg: string) => { await update(ref(db), { [`simulation_rooms/${pin}/players/${id}/regionId`]: reg, [`simulation_rooms/${pin}/public_profiles/${id}/regionId`]: reg }); },
        controlPlayer: (id: string) => window.open(`${window.location.origin}${import.meta.env.BASE_URL}play/${pin}?impersonate=${id}`, '_blank'),
        onGiveGold: (id: string, amt: number) => handleAdminGiveGold(pin, id, amt),
        onGiveResource: (id: string, resId: string, amt: number) => handleAdminGiveResource(pin, id, resId, amt),
        onGiveItem: (id: string, itemId: string, amt: number) => handleAdminGiveItem(pin, id, itemId, amt)
    };

    return (
        <ActiveRoomView
            pin={pin}
            roomData={roomData}
            view={view}
            setView={setView}
            isLoading={isLoading}
            onBack={() => setView('LIST')}
            worldActions={worldActions}
            playerActions={playerActions}
            SimulationEconomyBlueprint={SimulationEconomyBlueprint}
        />
    );
};
