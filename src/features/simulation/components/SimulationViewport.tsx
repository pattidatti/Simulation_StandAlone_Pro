import React from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../../../lib/firebase';
import type { SimulationPlayer, SimulationRoom } from '../simulationTypes';
import { useSimulation } from '../SimulationContext';
import { WorldMap } from '../WorldMap';
// ULTRATHINK: Lazy Load Heavy Components for Code Splitting
const SimulationMarket = React.lazy(() => import('./SimulationMarket').then(module => ({ default: module.SimulationMarket })));
const SimulationVault = React.lazy(() => import('./SimulationVault').then(module => ({ default: module.SimulationVault })));
const SimulationSkills = React.lazy(() => import('./SimulationSkills').then(module => ({ default: module.SimulationSkills })));
const SimulationProduction = React.lazy(() => import('./SimulationProduction').then(module => ({ default: module.SimulationProduction })));
const SimulationActivity = React.lazy(() => import('./SimulationActivity').then(module => ({ default: module.SimulationActivity })));
const SimulationDiplomacy = React.lazy(() => import('./SimulationDiplomacy').then(module => ({ default: module.SimulationDiplomacy })));
const SimulationHierarchy = React.lazy(() => import('./SimulationHierarchy').then(module => ({ default: module.SimulationHierarchy })));
const SimulationProfile = React.lazy(() => import('./SimulationProfile').then(module => ({ default: module.SimulationProfile })));
const SimulationSettings = React.lazy(() => import('./SimulationSettings').then(module => ({ default: module.SimulationSettings })));
const PoliticalHub = React.lazy(() => import('./ui/PoliticalHub').then(module => ({ default: module.PoliticalHub })));
const SimulationWarRoom = React.lazy(() => import('./SimulationWarRoom').then(module => ({ default: module.SimulationWarRoom })));
const SiegeEngine = React.lazy(() => import('./SiegeEngine').then(module => ({ default: module.SiegeEngine })));

import { SimulationMusicWindow } from './ui/SimulationMusicWindow';
import { AnimatePresence } from 'framer-motion';




interface SimulationViewportProps {
    player: SimulationPlayer;
    room: SimulationRoom;
    pin?: string;
    onAction: (action: any) => void;
    actionResult: any | null;
    onClearActionResult: () => void;
}

import { ActionResultOverlay } from './ActionResultOverlay';
import { SimulationNotificationLayer } from './SimulationNotificationLayer';

export const SimulationViewport: React.FC<SimulationViewportProps> = ({ player, room, pin, onAction, actionResult, onClearActionResult }) => {
    const { activeTab, setActiveTab, isMusicWindowOpen, setMusicWindowOpen, viewingRegionId } = useSimulation();
    const [isVoting, setIsVoting] = React.useState(false);

    const handleVote = async (vote: 'YES' | 'NO') => {
        if (isVoting) return;
        setIsVoting(true);
        try {
            await update(ref(db, `simulation_rooms/${pin}/activeVote/votes`), { [player.id]: vote });
        } catch (e) {
            console.error("Voting failed", e);
        } finally {
            setTimeout(() => setIsVoting(false), 1500);
        }
    };

    const isOverlayTab = ['MAP', 'PRODUCTION', 'MARKET', 'INVENTORY', 'SKILLS', 'DIPLOMACY', 'HIERARCHY', 'PROFILE', 'POLITICS'].includes(activeTab);

    // Main Content Switcher
    return (
        <div className="flex-1 relative flex flex-col overflow-hidden w-full h-full">
            {/* HUD Moved to WorldMap for better layout context */}
            <div className={`flex-1 relative w-full h-full ${isOverlayTab ? 'p-4 md:p-6 overflow-hidden flex items-center justify-center' : 'p-4 md:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar'}`}>
                {/* Always render WorldMap when in these tabs to keep it as background */}
                {/* LAYER 0: Background World Map (Always rendered in simulation modes) */}
                {isOverlayTab && (
                    <div className="absolute inset-0 z-0">
                        <WorldMap
                            player={player}
                            room={room}
                            world={room.world}
                            worldEvents={room.worldEvents}
                            players={room.players}
                            onAction={onAction}
                            onOpenMarket={() => setActiveTab('MARKET')}
                        />
                    </div>
                )}

                <React.Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center pointer-events-none">
                        {/* Subtle loading indicator specific to tab switching */}
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                }>
                    {/* LAYER 0.5: SIEGE ENGINE BACKGROUND (If Siege Active) */}
                    {/* This ensures we don't lose context when opening Inventory/Skills/etc during a siege */}
                    {(() => {
                        const targetRegionId = viewingRegionId || player.regionId || '';
                        const siege = room.regions[targetRegionId]?.activeSiege;
                        if (!siege || !(activeTab === 'SIEGE' || isOverlayTab)) return null;

                        return (
                            <div className={`absolute inset-0 z-10 ${activeTab !== 'SIEGE' ? 'opacity-20 pointer-events-none blur-sm grayscale' : ''}`}>
                                <SiegeEngine
                                    player={player}
                                    siege={siege}
                                    regionId={targetRegionId}
                                    onAction={onAction}
                                    messages={Array.isArray(room.messages) ? room.messages : Object.values(room.messages || {})}
                                />
                            </div>
                        );
                    })()}

                    {/* LAYER 1: UI Overlays (Absolute positioning on top of Map/Siege) */}
                    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">

                        {activeTab === 'PRODUCTION' && (
                            <div className="pointer-events-auto w-full h-full md:max-w-4xl md:h-auto md:max-h-[85vh] overflow-hidden">
                                <SimulationProduction player={player} room={room} onAction={onAction} pin={pin || ''} />
                            </div>
                        )}

                        {activeTab === 'MARKET' && (
                            <div className="pointer-events-auto w-full h-full md:max-w-5xl md:h-[90vh] overflow-hidden">
                                <SimulationMarket
                                    player={player}
                                    market={room.markets?.[player.regionId || 'capital'] || room.market}
                                    regions={room.regions}
                                    allMarkets={room.markets}
                                    onAction={onAction}
                                    pin={pin || ''}
                                />
                            </div>
                        )}

                        {activeTab === 'INVENTORY' && (
                            <div className="pointer-events-auto w-full h-full md:max-w-4xl md:h-[80vh] overflow-hidden">
                                {/* Assuming SimulationVault is Inventory. If not, we might need a specific component, but standard is Vault=Inventory in this codebase context usually? 
                                    Wait, imports show SimulationVault. Let's assume this is correct or check imports.
                                    Imports: SimulationVault.
                                */}
                                <SimulationVault player={player} onAction={onAction} />
                            </div>
                        )}

                        {activeTab === 'SKILLS' && (
                            <div className="pointer-events-auto w-full h-full md:max-w-4xl md:h-[80vh] overflow-hidden">
                                <SimulationSkills player={player} />
                            </div>
                        )}

                        {activeTab === 'DIPLOMACY' && (
                            <div className="pointer-events-auto w-full h-full md:max-w-4xl md:h-[85vh] overflow-hidden">
                                <SimulationDiplomacy player={player} diplomacy={room.diplomacy} pin={pin || ''} />
                            </div>
                        )}

                        {activeTab === 'HIERARCHY' && (
                            <div className="pointer-events-auto w-full h-full md:max-w-5xl md:h-[85vh] overflow-hidden">
                                <SimulationHierarchy
                                    players={room.players}
                                    currentPlayer={player}
                                    regions={room.regions}
                                    onAction={onAction}
                                    pin={pin || ''}
                                />
                            </div>
                        )}

                        {activeTab === 'PROFILE' && (
                            <div className="pointer-events-auto w-full h-full md:max-w-2xl md:h-[85vh] overflow-hidden">
                                <SimulationProfile
                                    player={player}
                                    regions={room.regions || {}}
                                    allPlayers={room.players || {}}
                                />
                            </div>
                        )}

                        {activeTab === 'POLITICS' && (
                            <div className="pointer-events-auto w-full h-full md:max-w-6xl md:h-[90vh] overflow-hidden">
                                <PoliticalHub
                                    player={player}
                                    room={room}
                                    onClose={() => setActiveTab('MAP')}
                                />
                            </div>
                        )}

                        {activeTab === 'WAR_ROOM' && (
                            <div className="pointer-events-auto w-full h-full md:max-w-4xl md:h-[85vh] overflow-hidden">
                                <SimulationWarRoom
                                    player={player}
                                    regions={room.regions}
                                    onAction={onAction}
                                    onClose={() => setActiveTab('HIERARCHY')}
                                />
                            </div>
                        )}

                        {/* 
                             SIEGE is now handled in Layer 0.5 for persistence.
                             We removed the duplicate render here.
                        */}
                    </div>


                    {/* Other Tabs (Fullscreen/Full Viewport - No Map Background) */}
                    {activeTab !== 'MAP' && !isOverlayTab && (
                        <div className="max-w-4xl mx-auto w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative z-20">
                            {activeTab === 'SETTINGS' ? (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-8 animate-in fade-in duration-300">
                                    <SimulationSettings onClose={() => setActiveTab('MAP')} />
                                </div>
                            ) : activeTab === 'ACTIVITY' ? (
                                <SimulationActivity messages={room.messages} />
                            ) : null}

                        </div>
                    )}
                </React.Suspense>
            </div>

            {/* Ting Voting Notification (Optimized: Non-intrusive bottom-right toast) */}
            {
                room.activeVote && !room.activeVote.votes?.[player.id] && (
                    <div className="absolute bottom-6 right-6 z-[50] w-96 animate-in slide-in-from-right duration-500">
                        <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-indigo-500/50 p-6 shadow-2xl shadow-indigo-500/10">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-white font-bold text-lg leading-tight mb-1">Tinget er satt</h3>
                                    <p className="text-indigo-300 text-xs font-medium uppercase tracking-wider">Avgi din stemme</p>
                                </div>
                                <div className="bg-indigo-500/20 p-2 rounded-lg">
                                    <span className="text-2xl">📜</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="text-white font-medium mb-2">{room.activeVote.title}</h4>
                                <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{room.activeVote.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleVote('YES')}
                                    disabled={isVoting}
                                    className={`bg-emerald-600/80 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span>✅</span> VEDTA
                                </button>
                                <button
                                    onClick={() => handleVote('NO')}
                                    disabled={isVoting}
                                    className={`bg-rose-600/80 hover:bg-rose-500 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span>❌</span> AVSLÅ
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Music Window Overlay */}
            <AnimatePresence>
                {/* We access isMusicWindowOpen from context inside the component, but we need to pass it here? No, the component has onClose */}
                {/* Wait, we need to read the state here to render it conditionally with AnimatePresence */}
                {/* We need to destructure isMusicWindowOpen from useSimulation() hook at start of component */}
            </AnimatePresence>
            {/* ACTUALLY, I need to update the hook destructuring first. */}

            {/* Music Window Overlay */}
            <AnimatePresence>
                {isMusicWindowOpen && (
                    <SimulationMusicWindow onClose={() => setMusicWindowOpen(false)} />
                )}
            </AnimatePresence>

            {/* Notification Layer */}
            <SimulationNotificationLayer player={player} room={room} onAction={onAction} pin={pin || ''} />

            <ActionResultOverlay
                result={actionResult}
                onClear={onClearActionResult}
            />
        </div >
    );
};


