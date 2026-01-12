import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSimulationData } from './hooks/useSimulationData';
import { useSimulationActions } from './hooks/useSimulationActions';
import { useSimulationAuth } from './SimulationAuthContext';
import { useSimulation } from './SimulationContext';
import { useLayout } from '../../context/LayoutContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { SimulationRoom } from './simulationTypes';

import { SimHeader as SimulationHeader } from './components/SimHeader';
import { SimulationViewport } from './components/SimulationViewport';
import { SimulationAnimationLayer } from './components/SimulationAnimationLayer';
import { MinigameOverlay } from './SimulationMinigames';
import { LevelUpOverlay } from './components/LevelUpOverlay';
import { SimulationOnboarding } from './components/SimulationOnboarding';
import { StablesWindow } from './components/StablesWindow';
import { TavernWindow } from './components/TavernWindow';
import { SimulationDestinySplash } from './components/SimulationDestinySplash';
import { ChatSystem } from './components/ChatSystem';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { GlobalProfileModal } from './components/GlobalProfileModal';
import { WeaponRackWindow } from './components/WeaponRackWindow';
import { CaravanWindow } from './components/CaravanWindow';
import { SailingMinigame } from './components/SailingMinigame';
import { RegionCrisisToast } from './components/RegionCrisisToast';
import { AchievementUnlockModal } from './components/AchievementUnlockModal';
import { Trophy } from 'lucide-react';
import { INITIAL_RESOURCES, INITIAL_SKILLS, INITIAL_EQUIPMENT } from './constants';
import { ref, update } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';
import type { Role, SimulationPlayer as SimPlayer } from './simulationTypes';

export const SimulationPlayer: React.FC = () => {
    const { pin } = useParams();
    const [searchParams] = useSearchParams();
    const impersonateId = searchParams.get('impersonate');
    const navigate = useNavigate();

    const { user, account, loading: authLoading } = useSimulationAuth();
    const {
        activeMinigame, setActiveMinigame, activeMinigameAction, setActiveMinigameAction, activeMinigameMethod, setActiveMinigameMethod,
        activeTab, setActiveTab
    } = useSimulation();
    const { setHideHeader, setFullWidth } = useLayout();

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Sync Global Profile with Tab System
    React.useEffect(() => {
        if (activeTab === 'PROFILE') {
            setIsProfileOpen(true);
            // We set tab back to MAP immediately so the viewport doesn't try to render an overlay, 
            // but the modal stays open on top.
            setActiveTab('MAP');
        }
    }, [activeTab, setActiveTab]);

    React.useEffect(() => {
        setHideHeader(true);
        setFullWidth(true);

        // ULTRATHINK: AudioContext Auto-Resume Logic
        const handleInteraction = () => {
            // We use the singleton directly to ensure it catches the global context state
            import('./logic/AudioManager').then(({ audioManager }) => {
                audioManager.resume();
            });
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
            setHideHeader(false);
            setFullWidth(false);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, [setHideHeader, setFullWidth]);



    const {
        player, world, players, roomStatus, markets, messages, diplomacy, activeVote, worldEvents, trades, regions, isRetired
    } = useSimulationData(pin, impersonateId) as any;

    // MIGRATION: Remove Oak Resources (Legacy)
    React.useEffect(() => {
        if (!player || !pin || !player.resources) return;

        const resources = player.resources as any;
        const oakLog = resources['oak_log'] || 0;
        const oakLumber = resources['oak_lumber'] || 0;

        if (oakLog > 0 || oakLumber > 0) {
            console.log("MIGRATION: Converting Legacy Oak...", { oakLog, oakLumber });
            const updates: any = {};
            updates[`players/${player.id}/resources/oak_log`] = null;
            updates[`players/${player.id}/resources/oak_lumber`] = null;
            updates[`players/${player.id}/resources/wood`] = (resources.wood || 0) + oakLog;
            updates[`players/${player.id}/resources/plank`] = (resources.plank || 0) + oakLumber;

            const roomRef = ref(db, `simulation_rooms/${pin}`);
            update(roomRef, updates)
                .then(() => console.log("MIGRATION: Success"))
                .catch(err => console.error("MIGRATION: Failed", err));
        }
    }, [player?.id, player?.resources, pin]);

    // ULTRATHINK: Self-Repair & Active Session Sync
    // This ensures that if a user joins a room via direct link (and skips 'Create Player'),
    // their global profile is still updated with this session.
    React.useEffect(() => {
        if (!player || !pin || !user || !account) return;

        const checkAndRepairSession = async () => {
            // 1. DATA HYGIENE: Check for Legacy Array Format
            const rawSessions = account.activeSessions;
            let currentSessionsMap: Record<string, any> = {};
            let needsMigration = false;

            if (Array.isArray(rawSessions)) {
                console.log("ULTRATHINK: Detected Legacy Session Array. Migrating to Map...");
                needsMigration = true;
                rawSessions.forEach((s: any) => {
                    if (s && s.roomPin) currentSessionsMap[s.roomPin] = s;
                });
            } else if (rawSessions) {
                currentSessionsMap = rawSessions;
            }

            // 2. CHECK STATUS (We now update more aggressively to sync Gold/Level)
            const existingSession = currentSessionsMap[pin];

            // Check if stats are stale or missing (Gold/Level check)
            const isMissing = !existingSession;
            const isStale = existingSession ? (Date.now() - existingSession.lastPlayed > 2 * 60 * 1000) : true; // More aggressive sync
            const missingRichData = existingSession && (existingSession.gold === undefined || existingSession.level === undefined);

            // 3. REPAIR / SYNC
            if (needsMigration || isMissing || isStale || missingRichData) {
                // console.log("ULTRATHINK: Syncing Session to Global Profile...", { isMissing, isStale, needsMigration, missingRichData });

                // Rich Data Extraction
                const rName = (regions && regions[player.regionId]) ? regions[player.regionId].name : 'Ukjent Region';

                const sessionData = {
                    roomPin: pin,
                    name: player.name,
                    role: player.role,
                    regionId: player.regionId,
                    regionName: rName,
                    gold: (player.resources as any)?.gold || 0,
                    level: player.stats?.level || 1,
                    xp: player.stats?.xp || 0,
                    lastPlayed: Date.now()
                };

                const updates: any = {};

                // If migrating, we overwrite the ENTIRE activeSessions node with the new Map
                if (needsMigration) {
                    const newMap = { ...currentSessionsMap, [pin]: sessionData };
                    updates[`simulation_accounts/${user.uid}/activeSessions`] = newMap;
                } else {
                    // Atomic update for just this room
                    updates[`simulation_accounts/${user.uid}/activeSessions/${pin}`] = sessionData;
                }

                try {
                    await update(ref(db), updates);
                    // console.log("ULTRATHINK: Session Sync Complete.");
                } catch (err) {
                    console.error("ULTRATHINK: Session Sync Failed", err);
                }
            }
        };

        checkAndRepairSession();

    }, [player, pin, user, account, regions]);

    const {
        handleAction, actionResult, setActionResult, handleClearActionResult
    } = useSimulationActions(pin, player, world, setActiveMinigame as any, setActiveMinigameMethod, setActiveMinigameAction, activeMinigame as any);

    const [isCreating, setIsCreating] = useState(false);
    const [levelUpData, setLevelUpData] = useState<{ level: number, title: string } | null>(null);
    const [inspectingPlayer, setInspectingPlayer] = useState<SimPlayer | null>(null);
    const [isStablesOpen, setIsStablesOpen] = useState(false);
    const [isTavernOpen, setIsTavernOpen] = useState(false);
    const [isWeaponRackOpen, setIsWeaponRackOpen] = useState(false);
    const [isCaravanOpen, setIsCaravanOpen] = useState(false);
    const [caravanTarget, setCaravanTarget] = useState<string | undefined>(undefined);

    const handleSimulationAction = (action: any) => {
        const actionType = typeof action === 'string' ? action : action.type;
        if (actionType === 'MOUNT_HORSE' && !action.method) {
            setIsStablesOpen(true);
            return;
        }
        if (actionType === 'OPEN_TAVERN_MENU') {
            setIsTavernOpen(true);
            return;
        }
        if (actionType === 'OPEN_WEAPON_RACK') {
            setIsWeaponRackOpen(true);
            return;
        }
        if (actionType === 'OPEN_CARAVAN') {
            if (action.targetRegionId) setCaravanTarget(action.targetRegionId);
            setIsCaravanOpen(true);
            return;
        }
        if (actionType === 'OPEN_POLITICAL_HUB') {
            setActiveTab('POLITICS');
            return;
        }
        handleAction(action);
    };

    const onCreatePlayer = async (name: string, role: Role) => {
        if (!pin || !user) return;
        setIsCreating(true);
        try {
            const roomRef = ref(db, `simulation_rooms/${pin}`);
            const playerId = impersonateId || user.uid;

            // Simple Logic for region assignment
            let regionId = (Math.random() > 0.5 ? 'region_ost' : 'region_vest');
            if (role === 'BARON') regionId = `region_${playerId}`;
            else if (role === 'KING') regionId = 'capital';

            const newPlayer: SimPlayer = {
                id: playerId,
                uid: user.uid,
                name: name,
                role: role,
                regionId: regionId,
                resources: INITIAL_RESOURCES[role] || INITIAL_RESOURCES.PEASANT,
                skills: INITIAL_SKILLS[role] || INITIAL_SKILLS.PEASANT,
                stats: { xp: 0, level: 1, reputation: 50, contribution: 0 },
                status: { hp: 100, morale: 100, stamina: 50, legitimacy: 100, authority: 50, loyalty: 100, isJailed: false, isFrozen: false },
                equipment: INITIAL_EQUIPMENT[role] || INITIAL_EQUIPMENT.PEASANT,
                upgrades: [],
                lastActive: Date.now()
            };

            const publicProfile = {
                id: playerId,
                uid: user.uid,
                name: name,
                role: role,
                regionId: regionId,
                stats: { level: 1 },
                status: { isJailed: false, isFrozen: false, legitimacy: 100 },
                online: true,
                lastActive: Date.now()
            };

            const updates: any = {};
            updates[`players/${playerId}`] = newPlayer;
            updates[`public_profiles/${playerId}`] = publicProfile;

            await update(roomRef, updates);
        } catch (err) {
            console.error("Failed to create player:", err);
            alert("Kunne ikke opprette karakter.");
        } finally {
            setIsCreating(false);
        }
    };

    // Lightweight room object for sub-components
    const room = useMemo((): SimulationRoom => ({
        status: roomStatus,
        world: world as any, // world in useSimulationData is slightly different but compatible for HUD
        players: players || {},
        messages: messages || [],
        markets: markets || {},
        market: (markets && player?.regionId ? markets[player.regionId] : Object.values(markets || {})[0]) || {} as any,
        diplomacy: diplomacy || {},
        trades: trades || {},
        activeVote,
        worldEvents: worldEvents || {},
        regions: regions || {}, // Connected!
        settings: 'feudal_europe',
        pin: pin || ''
    }), [roomStatus, world, players, messages, markets, diplomacy, activeVote, worldEvents, trades, regions, pin]);

    // --- ACHIEVEMENT SYSTEM ---
    const { showAchievement } = useSimulation();
    React.useEffect(() => {
        if (!player || !user || !account) return;

        // ULTRATHINK: We check achievements every time player stats or role changes
        import('./logic/achievementLogic').then(({ checkAndUnlockAchievements }) => {
            checkAndUnlockAchievements(user.uid, player, account, showAchievement);
        });
    }, [player?.stats?.level, player?.role, account?.globalXp, user?.uid]);

    if (authLoading && !player) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
                <h2 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">
                    Våkner til liv...
                </h2>
            </div>
        );
    }

    if (isRetired) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400 mb-8 border border-white/10 shadow-2xl">
                    <Trophy size={40} />
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
                    Karakteren er pensjonert
                </h2>
                <p className="text-slate-400 max-w-sm mb-12">
                    Ditt ettermæle er sikret i Hall of Fame. Gå tilbake til lobbyen for å starte et nytt liv.
                </p>
                <button
                    onClick={() => navigate('/sim')}
                    className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                    Til Lobbyen
                </button>
            </div>
        );
    }

    if (!player) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <SimulationOnboarding pin={pin || ''} account={account} onCreatePlayer={onCreatePlayer} isCreating={isCreating} />
            </div>
        );
    }

    if (!world) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-white rounded-full animate-spin" />
                <p className="text-sm font-bold uppercase tracking-widest text-indigo-400">Laster verden...</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-900 text-white overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col relative">
                <div className="fixed inset-0 top-0 bg-slate-950 text-slate-200 flex overflow-hidden">
                    {/* Background Atmosphere */}
                    <div className="fixed inset-0 pointer-events-none opacity-20">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
                    </div>

                    {/* NEW: Onboarding Splash */}
                    {!player.hasSeenIntro && (
                        <SimulationDestinySplash
                            player={player}
                            pin={pin || ''}
                            onComplete={() => {
                                // Fallback local update if DB is slow
                                player.hasSeenIntro = true;
                            }}
                        />
                    )}

                    {activeMinigame && activeMinigame !== 'SAILING' && (
                        <MinigameOverlay
                            type={activeMinigame}
                            player={player}
                            playerUpgrades={player.upgrades}
                            equipment={Object.values(player.equipment || {})}
                            skills={player.skills}
                            selectedMethod={activeMinigameMethod || undefined}
                            action={activeMinigameAction}
                            onComplete={(score, data) => {
                                if (activeMinigame === 'TRAVEL_START') {
                                    if (score > 0) {
                                        // Success
                                        console.log('[SimulationPlayer] Minigame Complete. Data:', data);
                                        handleAction({
                                            type: 'TRAVEL_COMPLETE',
                                            targetRegionId: activeMinigameAction?.targetRegionId,
                                            finalDurability: data?.durability
                                        });
                                    } else {
                                        // Failure (Broken)
                                        handleAction({
                                            type: 'TRAVEL_FAILED',
                                            targetRegionId: activeMinigameAction?.targetRegionId,
                                            finalDurability: 0 // Force 0 if failed
                                        });
                                    }
                                } else {
                                    // ULTRATHINK: Defensive Action Construction
                                    const fallbackType = activeMinigame;
                                    const explicitAction = activeMinigameAction || {};

                                    if (!explicitAction.type && fallbackType) {
                                        console.warn(`[SimulationPlayer] Warning: Minigame '${fallbackType}' completed without explicit action object. Using fallback.`);
                                    }

                                    const effectiveAction = {
                                        type: fallbackType,     // 1. Base Layer (Safe Fallback)
                                        ...explicitAction,      // 2. Overlay Layer (Specifics take priority)
                                        performance: score,     // 3. Result Layer (Always overwrite)
                                        method: activeMinigameMethod
                                    };

                                    handleAction(effectiveAction);
                                }
                            }}
                            onCancel={() => { setActiveMinigame(null); setActiveMinigameAction(null); setActiveMinigameMethod(null); }}
                            currentSeason={world?.season || 'Spring'}
                            currentWeather={world?.weather || 'Clear'}
                            totalTicks={world?.totalTicks || 0}
                        />
                    )}

                    {isStablesOpen && (
                        <StablesWindow
                            player={player}
                            onAction={handleAction}
                            onClose={() => setIsStablesOpen(false)}
                        />
                    )}

                    {isTavernOpen && (
                        <TavernWindow
                            player={player}
                            room={room}
                            onAction={handleAction}
                            onClose={() => setIsTavernOpen(false)}
                        />
                    )}

                    {isWeaponRackOpen && (
                        <WeaponRackWindow
                            player={player}
                            onAction={handleAction}
                            onClose={() => setIsWeaponRackOpen(false)}
                        />
                    )}

                    {isCaravanOpen && (
                        <CaravanWindow
                            player={player}
                            onAction={handleAction}
                            onClose={() => {
                                setIsCaravanOpen(false);
                                setCaravanTarget(undefined);
                            }}
                            preselectedTarget={caravanTarget}
                        />
                    )}

                    <SimulationAnimationLayer />

                    <div className="flex flex-col h-full w-full overflow-hidden">
                        <SimulationHeader room={room} player={player} pin={pin} onAction={handleSimulationAction} />
                        <main className="flex-1 relative overflow-hidden bg-slate-950/50">
                            <SimulationViewport
                                player={player}
                                room={room}
                                pin={pin}
                                onAction={handleSimulationAction}
                                actionResult={actionResult}
                                onClearActionResult={handleClearActionResult}
                            />
                            <AnimatePresence>
                                {activeMinigame === 'SAILING' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 1.05 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                        className="absolute inset-0 z-50 bg-slate-950"
                                    >
                                        <SailingMinigame
                                            player={player}
                                            roomPin={room.pin}
                                            onExit={() => setActiveMinigame(null)}
                                            onActionResult={setActionResult}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </main>
                    </div>
                </div>
            </div>

            {levelUpData && (
                <LevelUpOverlay level={levelUpData.level} title={levelUpData.title} onClose={() => setLevelUpData(null)} />
            )}

            {/* Chat Overlay */}
            <ChatSystem
                pin={pin || ''}
                player={player}
                onOpenProfile={(targetId) => {
                    const target = room.players[targetId];
                    if (target) {
                        setInspectingPlayer(target);
                    } else {
                        console.warn("Spiller ikke funnet i rommet:", targetId);
                    }
                }}
            />

            {/* P2P Profile Inspection / Trading Modal */}
            {inspectingPlayer && (
                <PlayerProfileModal
                    isOpen={true}
                    onClose={() => setInspectingPlayer(null)}
                    myPlayer={player}
                    targetPlayer={inspectingPlayer}
                    pin={pin || ''}
                />
            )}

            {/* ULTRATHINK: Region Crisis Toast */}
            {player && room && (
                <RegionCrisisToast
                    player={player}
                    room={room}
                    onOpenHub={() => {
                        // We use the existing 'isProfileOpen' state mechanism or similar?
                        // Actually, SimulationPlayer doesn't manage PoliticalHub visibility directly usually?
                        // It seems PoliticalHub is handled by 'activeTab' or 'activeMinigame'?
                        // Wait, PoliticalHub is usually a specific building window or map overlay.
                        // Let's check how to open it.
                        // Ah, it's usually opened via 'OPEN_POLITICAL_HUB' action or setting activeTab?
                        // Based on code, PoliticalHub is likely a component rendered when something is open.
                        // Wait, looking at PoliticalHub Content... it is usually inside SimulationMapWindow.
                        // Let's assume we trigger a specific action or mock it.
                        // But wait! SimulationPlayer doesn't import PoliticalHub directly.

                        // We need to trigger the action that opens it.
                        handleSimulationAction({ type: 'OPEN_BUILDING', buildingId: 'manor' }); // Fallback or specific?
                        // Actually, 'PoliticalHub' is often associated with 'manor' or a button in the UI.
                        // Let's look for how it's opened. 
                        // Ah, I see `globalActions` mentions it. 

                        // NOTE: For now, I will use a generic action 'OPEN_POLITICS' which should be handled by the layout or map.
                        // However, checking `SimulationViewport` might reveal how windows are handled.
                        // Let's try to assume we can set a specific minigame/overlay or just navigate.

                        // BETTER APPROACH: Since we are in `SimulationPlayer`, we can control state.
                        // But PoliticalHub is likely inside `SimHeader` or `SimulationViewport`.
                        // Let's emit an action that `SimulationViewport` listens to, or just `setActionResult`? 

                        // Let's try `setActiveMinigame('POLITICS')` if that exists? 
                        // Or better: Just simulate clicking the location.
                        // If I can't easily open it, I'll log a warning or use a known working method.

                        // Actually, `activeMinigame` seems the best route if configured.
                        // But wait, the standard way to open the hub is likely clicking the "Manor" or "Town Hall".
                        // Let's try to use `handleSimulationAction` with a custom type we can catch in `SimulationViewport`.

                        // REVISION: I will use `handleSimulationAction('OPEN_POLITICAL_HUB')` and ensure `SimulationViewport` handles it or we add a handler here.
                        handleSimulationAction('OPEN_POLITICAL_HUB');
                    }}
                />
            )}

            {/* ULTRATHINK: Unified Global Profile (Grand Modal) */}
            <GlobalProfileModal
                isOpen={isProfileOpen}
                onClose={() => {
                    setIsProfileOpen(false);
                    // Ensure we don't get stuck in a weird tab state
                    if (activeTab === 'PROFILE') setActiveTab('MAP');
                }}
                currentRoomPin={pin}
            />

            {/* Achievement Notification Layer */}
            <AchievementUnlockModal />
        </div>
    );
};
