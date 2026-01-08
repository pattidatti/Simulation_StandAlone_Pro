import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressiveImage } from './components/ui/ProgressiveImage'; // Import the new component
// Modular World Map Components
import type { SimulationPlayer } from './simulationTypes';
import { getDayPart } from './utils/timeUtils';

import { useWorldMapLogic } from './hooks/useWorldMapLogic';
import { POINTS_OF_INTEREST } from './data/WorldMapData';

import { TavernDiceGame } from './TavernDiceGame';
import { TavernResourceGame } from './TavernResourceGame';
import { FloatingActionTooltip } from './components/FloatingActionTooltip';
import { SimulationAtmosphereLayer } from './components/SimulationAtmosphereLayer';
import { SimulationProcessHUD } from './components/SimulationProcessHUD';
import { SimulationMapWindow } from './components/ui/SimulationMapWindow';
import { TaxationWindow } from './components/TaxationWindow';
import { ChickenCoopWindow } from './components/ChickenCoopWindow';
import { BuildingUpgradeWindow } from './components/BuildingUpgradeWindow';
import { TavernDialog } from './components/TavernDialog';
import { WorldMapPOI } from './components/WorldMap/WorldMapPOI';
import { WorldMapEvents } from './components/WorldMap/WorldMapEvents';
import { WorldMapKingdomPins } from './components/WorldMap/WorldMapKingdomPins';
import { SimulationContributionModal } from './components/SimulationContributionModal';
import { RackSvg } from './components/WeaponRackWindow';

interface WorldMapProps {
    player: SimulationPlayer;
    world: any;
    worldEvents?: any;
    players?: Record<string, SimulationPlayer>;
    onAction: (action: any) => void;
    onOpenMarket: () => void;
    room: any;
}

export const GameMap: React.FC<WorldMapProps> = React.memo(({ player, room, world, worldEvents, players, onAction, onOpenMarket }) => {
    // Explicitly destructure season to ensure usage in hooks if needed, 
    // although the main fix is in the React.memo comparison or just passing it safely.
    // The previous implementation relied on 'world' reference change. 
    // If 'world' mutates without ref change, React.memo returns true (no update).
    // But 'room.world' should be fresh from Firebase hook? typically yes.
    // However, let's look at the usage.
    const season = world?.season || 'Spring';

    const {
        viewMode,
        setViewMode,
        viewingRegionId,
        setViewingRegionId,
        selectedPOI,
        setSelectedPOI,
        selectedEvent,
        setSelectedEvent,
        upgradingBuildingId,
        setUpgradingBuildingId,
        dialogNPC,
        setDialogNPC,
        dialogStep,
        setDialogStep,
        isDiceGameOpen,
        setIsDiceGameOpen,
        isChickenCoopOpen,
        setIsChickenCoopOpen,
        isConstructionOpen,
        setIsConstructionOpen,
        isTaxationOpen,
        setIsTaxationOpen,
        isResourceGameOpen,
        setIsResourceGameOpen,
        direction,
        handlePOIAction
    } = useWorldMapLogic(player, onAction, onOpenMarket);

    const weather = world?.weather || 'Clear';

    // ULTRATHINK: Optimize paths to use generated WebP assets and their tiny placeholders
    const getBackgroundPaths = () => {
        const isNight = getDayPart(room.world?.gameTick || 0) === 'NIGHT';
        const isWinter = season === 'Winter';
        let baseName = '';

        switch (viewMode) {
            case 'kingdom':
                baseName = isWinter
                    ? (isNight ? 'map_kingdom_169_winter_night' : 'map_kingdom_169_winter')
                    : (isNight ? 'map_kingdom_169_night' : 'map_kingdom_169');
                break;
            case 'village':
                baseName = isWinter
                    ? (isNight ? 'map_village_hub_1610_winter_night' : 'map_village_hub_1610_winter')
                    : (isNight ? 'map_village_hub_1610_night' : 'map_village_hub_1610');
                break;
            case 'castle': baseName = 'map_castle_interior'; break;
            case 'fields':
                baseName = isWinter
                    ? (isNight ? 'map_farm_fields_winter_night' : 'map_farm_fields_winter')
                    : (isNight ? 'map_farm_fields_night' : 'map_farm_fields');
                break;
            case 'peasant_farm': {
                const level = world?.settlement?.buildings?.farm_house?.level || 1;
                baseName = level > 1 ? `map_peasant_farm_lvl${level}` : 'map_peasant_farm';
                break;
            }
            case 'farm_house': {
                const level = world?.settlement?.buildings?.farm_house?.level || 1;
                baseName = level > 1 ? `map_stugo_interior_lvl${level}` : 'map_stugo_interior';
                break;
            }
            case 'mine':
                baseName = isWinter
                    ? (isNight ? 'map_mountain_pass_winter_night' : 'map_mountain_pass_winter')
                    : (isNight ? 'map_mountain_pass_night' : 'map_mountain_pass');
                break;
            case 'forest':
                baseName = isWinter
                    ? (isNight ? 'map_forest_winter_night' : 'map_forest_winter')
                    : (isNight ? 'map_forest_night' : 'map_forest');
                break;
            case 'monastery':
                baseName = isWinter
                    ? (isNight ? 'map_monastery_winter_night' : 'map_monastery_winter')
                    : (isNight ? 'map_monastery_night' : 'map_monastery');
                break;
            case 'tavern': baseName = 'map_tavern_interior'; break;
            case 'great_forge': baseName = 'map_forge_interior'; break;
            case 'bakery': baseName = 'map_bakery_interior'; break;
            case 'windmill': baseName = 'map_windmill_interior'; break;
            case 'sawmill': baseName = 'map_sawmill_interior'; break;
            case 'smeltery': baseName = 'map_smeltery_interior'; break;
            case 'weavery': baseName = 'map_weavery_interior'; break;
            case 'stables': baseName = 'map_stables_interior'; break;
            case 'watchtower': baseName = 'map_watchtower_interior'; break;
            case 'well':
                baseName = isWinter
                    ? (isNight ? 'map_well_interior_winter_night' : 'map_well_interior_winter')
                    : (isNight ? 'map_well_interior_night' : 'map_well_interior');
                break;
            case 'apothecary': baseName = 'map_apothecary_interior'; break;
            case 'global':
                if (viewingRegionId === 'region_ost') {
                    baseName = isWinter
                        ? (isNight ? 'map_barony_ost_169_winter_night' : 'map_barony_ost_169_winter')
                        : (isNight ? 'map_barony_ost_169_night' : 'map_barony_ost_169');
                } else if (viewingRegionId === 'capital') {
                    baseName = isWinter
                        ? (isNight ? 'map_hovedstad_169_winter_night' : 'map_hovedstad_169_winter')
                        : (isNight ? 'map_hovedstad_169_night' : 'map_hovedstad_169');
                } else {
                    baseName = isWinter
                        ? (isNight ? 'map_barony_vest_v2_1610_winter_night' : 'map_barony_vest_v2_1610_winter')
                        : (isNight ? 'map_barony_vest_v2_1610_night' : 'map_barony_vest_v2_1610');
                }
                break;
            default:
                baseName = 'map_barony_vest_v2_1610';
        }

        // Return the tuple of [FullRes, TinyPlaceholder]
        // Note: The script generates .webp and _tiny.webp
        const baseUrl = import.meta.env.BASE_URL;
        return {
            src: `${baseUrl}${baseName}.webp`,
            placeholder: `${baseUrl}${baseName}_tiny.webp`,
            original: `${baseUrl}${baseName}.png` // Fallback if needed, but we prefer WebP
        };
    };

    const bgPaths = getBackgroundPaths();

    const isWidescreen = viewMode === 'kingdom' || (viewMode === 'global' && (viewingRegionId === 'region_ost' || viewingRegionId === 'capital'));
    const aspectRatioClass = isWidescreen ? 'aspect-video' : 'aspect-[16/10]';

    const containerVariants = {
        initial: (dir: 'in' | 'out') => ({ opacity: 0, scale: dir === 'in' ? 0.9 : 1.1, filter: 'blur(10px)' }),
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any, staggerChildren: 0.05 } },
        exit: (dir: 'in' | 'out') => ({ opacity: 0, scale: dir === 'in' ? 1.1 : 0.9, filter: 'blur(10px)', transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] as any } })
    };

    const mapKey = `${viewMode}-${viewingRegionId}`;
    const currentPOI = useMemo(() => POINTS_OF_INTEREST.find(p => p.id === viewMode), [viewMode]);
    const isInterior = !!currentPOI?.isInterior;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-0">
            {/* ... (rest of render is fine) ... */}
            <div className={`relative w-full max-w-full max-h-full mx-auto ${aspectRatioClass} rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border-4 border-white/5 bg-slate-950 transition-all duration-1000`}>
                <AnimatePresence mode="popLayout" custom={direction}>
                    <motion.div key={mapKey} custom={direction} variants={containerVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full">
                        {/* ULTRATHINK: Progressive Image Loading */}
                        <div className="w-full h-full relative">
                            <ProgressiveImage
                                src={bgPaths.src}
                                placeholderSrc={bgPaths.placeholder}
                                alt="Map View"
                                className="w-full h-full"
                                disableMotion={true}
                            />
                            {/* Weather Overlay */}
                            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${weather === 'Fog' ? 'opacity-100 backdrop-blur-sm bg-white/10' : 'opacity-0'}`} />
                        </div>

                        {/* In-World Elements (Projected into scene) */}
                        {viewMode === 'farm_house' && (
                            <div
                                className="absolute bottom-[70%] left-[10%] w-[18%] h-auto z-20 cursor-pointer hover:scale-105 hover:brightness-110 transition-all drop-shadow-2xl opacity-90 hover:opacity-100"
                                onClick={() => onAction('OPEN_WEAPON_RACK')}
                                title="Åpne Våpenstativet"
                            >
                                <div className="absolute -inset-4 bg-black/40 blur-xl rounded-full" />
                                <div className="relative">
                                    <RackSvg level={player.weaponRack?.level || 0} slots={player.weaponRack?.slots || []} />
                                </div>
                            </div>
                        )}

                        <SimulationAtmosphereLayer weather={weather} season={season} isInterior={isInterior} />

                        <div className="absolute inset-0 pointer-events-none">
                            {viewMode === 'kingdom' && (
                                <WorldMapKingdomPins players={players || {}} setViewingRegionId={setViewingRegionId} setViewMode={setViewMode} />
                            )}
                            <WorldMapPOI viewMode={viewMode} viewingRegionId={viewingRegionId} player={player} room={room} onSelect={setSelectedPOI} onEnterHub={setViewMode} onPOIAction={handlePOIAction} />
                            <WorldMapEvents viewMode={viewMode} viewingRegionId={viewingRegionId} worldEvents={worldEvents} onSelect={setSelectedEvent} />
                        </div>
                    </motion.div>
                </AnimatePresence>

                <SimulationProcessHUD player={player} room={room} />

                {/* Back Button */}
                {viewMode !== 'kingdom' && (
                    <button
                        onClick={() => {
                            if (viewMode === 'global') setViewMode('kingdom');
                            else {
                                const hub = POINTS_OF_INTEREST.find(p => p.id === viewMode);
                                if (hub?.parentId) setViewMode(hub.parentId);
                                else setViewMode('global');
                            }
                        }}
                        className="absolute top-6 left-6 z-50 px-6 py-3 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-95 flex items-center gap-2 group"
                    >
                        <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                        Tilbake
                    </button>
                )}

                {/* Selected Event Modal */}
                {selectedEvent && (
                    <div className="absolute inset-x-6 bottom-6 z-40 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/10 p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${selectedEvent.type === 'RAID' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-500'}`}>
                                        {selectedEvent.type === 'RAID' ? '🚨 Akutt Trussel' : '📜 Spesielt Oppdrag'}
                                    </span>
                                    <h3 className="text-3xl font-black text-white mt-4 tracking-tighter">{selectedEvent.title}</h3>
                                </div>
                                <button onClick={() => setSelectedEvent(null)} className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-colors">×</button>
                            </div>
                            <p className="text-sm font-medium text-slate-400 mb-8 leading-relaxed italic opacity-80">"{selectedEvent.description}"</p>
                            <button
                                onClick={() => {
                                    onAction({ type: selectedEvent.type === 'RAID' ? 'DEFEND' : 'EXPLORE', eventId: selectedEvent.id });
                                    setSelectedEvent(null);
                                }}
                                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 ${selectedEvent.type === 'RAID' ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-amber-500 text-slate-950 shadow-amber-500/20'}`}
                            >
                                {selectedEvent.type === 'RAID' ? 'TIL VÅPEN! 🗡️' : 'UTFORSK OMRÅDET! 🧭'}
                            </button>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {selectedPOI && (
                        <FloatingActionTooltip poi={selectedPOI} player={player} room={room} onAction={(act) => handlePOIAction(selectedPOI.id, act)} onClose={() => setSelectedPOI(null)} viewingRegionId={viewingRegionId} />
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {upgradingBuildingId && (
                    <SimulationMapWindow title="Bygg & Oppgrader" onClose={() => setUpgradingBuildingId(null)}>
                        <BuildingUpgradeWindow buildingId={upgradingBuildingId} player={player} room={room} onAction={onAction} />
                    </SimulationMapWindow>
                )}
                {isDiceGameOpen && (
                    <TavernDiceGame playerGold={player.resources?.gold || 0} onClose={() => setIsDiceGameOpen(false)} onPlay={(res: any) => onAction({ type: 'PLAY_DICE', ...res })} />
                )}
                {isResourceGameOpen && (
                    <TavernResourceGame player={player} onClose={() => setIsResourceGameOpen(false)} onPlay={(res: any) => onAction({ type: 'PLAY_RESOURCE_GAME', ...res })} />
                )}
                {isChickenCoopOpen && (
                    <ChickenCoopWindow player={player} activeProcesses={player.activeProcesses || []} onAction={onAction} onClose={() => setIsChickenCoopOpen(false)} />
                )}
                {dialogNPC && (
                    <TavernDialog npc={dialogNPC} step={dialogStep} setStep={setDialogStep} onClose={() => setDialogNPC(null)} />
                )}
                {isConstructionOpen && (
                    <SimulationContributionModal
                        player={player}
                        room={room}
                        onAction={onAction}
                        onClose={() => setIsConstructionOpen(false)}
                        viewingRegionId={viewingRegionId}
                    />
                )}
                {isTaxationOpen && (
                    <TaxationWindow
                        player={player}
                        room={room}
                        onAction={onAction}
                        onClose={() => setIsTaxationOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}, (prev, next) => {
    // Custom check: If Season changed, we MUST re-render
    if (prev.world?.season !== next.world?.season) return false;
    if (prev.world?.weather !== next.world?.weather) return false;

    // Default strict equality for others (approximate)
    // We generally want to avoid re-rendering entire map on TICK updates unless needed (like time of day change?)
    // Time of day (Day/Night) depends on gameTick.
    const prevDayPart = getDayPart(prev.world?.gameTick || 0);
    const nextDayPart = getDayPart(next.world?.gameTick || 0);
    if (prevDayPart !== nextDayPart) return false;

    // Check Player processes changes (for HUD)
    if (prev.player.activeProcesses !== next.player.activeProcesses) return false;

    // If active modal states changed ? This logic is inside the hook, which is inside the component. 
    // Wait, useWorldMapLogic is called INSIDE the component. Changes to logic refs won't trigger re-render if props are equal.
    // So we just rely on the fact that if 'player' or 'room' object refs change, we re-render?
    // The issue might be that React.memo was TOO aggressive or 'world' ref wasn't changing.
    // By adding the checks above, we ensure season changes break the memo.

    // For now, let's trust React's default shallow compare EXCEPT for these specific deep checks we just added 
    // OR we revert to default behavior if we aren't sure. 
    // Actually, simply removing React.memo or making the deps explicit is safer.
    // But since the user complained, let's keep React.memo but return FALSE (trigger update) on Season mismatch.

    return prev.player === next.player && prev.room === next.room && prev.world === next.world && prev.worldEvents === next.worldEvents;
});

GameMap.displayName = 'GameMap';
