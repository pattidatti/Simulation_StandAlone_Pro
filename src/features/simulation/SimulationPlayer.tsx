import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSimulationData } from './hooks/useSimulationData';
import { useSimulationActions } from './hooks/useSimulationActions';
import { useSimulationAuth } from './SimulationAuthContext';
import { useSimulation } from './SimulationContext';
import { useLayout } from '../../context/LayoutContext';
import type { SimulationRoom } from './simulationTypes';

import { SimHeader as SimulationHeader } from './components/SimHeader';
import { SimulationViewport } from './components/SimulationViewport';
import { SimulationAnimationLayer } from './components/SimulationAnimationLayer';
import { MinigameOverlay } from './SimulationMinigames';
import { LevelUpOverlay } from './components/LevelUpOverlay';
import { SimulationOnboarding } from './components/SimulationOnboarding';
import { StablesWindow } from './components/StablesWindow';
import { SimulationDestinySplash } from './components/SimulationDestinySplash';
import { ChatSystem } from './components/ChatSystem';
import { PlayerProfileModal } from './components/PlayerProfileModal';
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
    const { activeMinigame, setActiveMinigame, activeMinigameAction, setActiveMinigameAction, activeMinigameMethod, setActiveMinigameMethod } = useSimulation();
    const { setHideHeader, setFullWidth } = useLayout();

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
        player, world, players, roomStatus, markets, messages, diplomacy, activeVote, worldEvents, trades, regions, hasAttemptedPlayerLoad, isRetired
    } = useSimulationData(pin, impersonateId) as any;

    const {
        handleAction, actionResult, handleClearActionResult
    } = useSimulationActions(pin, player, world, setActiveMinigame as any, setActiveMinigameMethod, setActiveMinigameAction, activeMinigame);

    const [isCreating, setIsCreating] = useState(false);
    const [levelUpData, setLevelUpData] = useState<{ level: number, title: string } | null>(null);
    const [inspectingPlayer, setInspectingPlayer] = useState<SimPlayer | null>(null);
    const [isStablesOpen, setIsStablesOpen] = useState(false);

    const handleSimulationAction = (action: any) => {
        const actionType = typeof action === 'string' ? action : action.type;
        if (actionType === 'MOUNT_HORSE' && !action.method) {
            setIsStablesOpen(true);
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

    if (authLoading || !hasAttemptedPlayerLoad) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8 p-12">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-indigo-500/20 rounded-full" />
                    <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-2xl font-black italic text-white animate-pulse">Kaller på åndene...</h2>
            </div>
        );
    }

    if (isRetired) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
                <div className="max-w-md bg-slate-900 border-2 border-indigo-500/30 rounded-[3rem] p-12 space-y-8 shadow-2xl">
                    <Trophy size={48} className="text-white mx-auto animate-bounce" />
                    <h2 className="text-4xl font-black italic text-white">ET LIV ER OVER</h2>
                    <button onClick={() => navigate('/sim')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase">Tilbake til Lobby</button>
                </div>
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

                    {activeMinigame && (
                        <MinigameOverlay
                            type={activeMinigame}
                            player={player}
                            playerUpgrades={player.upgrades}
                            equipment={Object.values(player.equipment || {})}
                            skills={player.skills}
                            selectedMethod={activeMinigameMethod || undefined}
                            action={activeMinigameAction}
                            onComplete={(score) => handleAction({ ...(activeMinigameAction || {}), performance: score, method: activeMinigameMethod })}
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
        </div>
    );
};
