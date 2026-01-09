import React from 'react';
import type { SimulationRoom } from '../../simulationTypes';
import { AdminSidebar } from './AdminSidebar';
import { PlayerGrid } from './PlayerGrid';
import { RoomFeed } from './RoomFeed';
import { VILLAGE_BUILDINGS } from '../../constants';
import { AITrainingLab } from '../../logic/bots/AITrainingLab';

interface WorldActions {
    onStartGame: () => void;
    onTogglePublic: () => void;
    onRepairData: () => void;
    onResetGame: () => void;
    onNextSeason: () => void;
    onChangeWeather: () => void;
    onSpawnEvent: () => void;
    onStartTing: () => void;
    onTaxationBase: () => void;
    onExportLog: () => void;
    initializeSettlement: () => void;
    handleBuildingLevelChange: (id: string, delta: number) => void;
}

interface PlayerActions {
    onRegenStamina: () => void;
    onResetUnrest: () => void;
    onKickAll: () => void;
    onSpawnCharacter: (form: { name: string; role: any; level: number }) => void;
    kickPlayer: (id: string, name: string) => void;
    handlePlayerLevelChange: (id: string, lvl: number) => void;
    handleRoleChange: (id: string, role: any) => void;
    handleRegionChange: (id: string, region: string) => void;
    controlPlayer: (id: string) => void;
    onGiveGold: (id: string, amt: number) => void;
    onGiveResource: (id: string, resId: string, amt: number) => void;
    onGiveItem: (id: string, itemId: string, amt: number) => void;
}

interface ActiveRoomViewProps {
    pin: string;
    roomData: SimulationRoom;
    view: 'MANAGE' | 'ECONOMY' | 'AI_LAB';
    setView: (view: 'MANAGE' | 'ECONOMY' | 'AI_LAB') => void;
    isLoading: boolean;
    onBack: () => void;
    worldActions: WorldActions;
    playerActions: PlayerActions;
    SimulationEconomyBlueprint: any;
}

export const ActiveRoomView: React.FC<ActiveRoomViewProps> = React.memo(({
    pin,
    roomData,
    view,
    setView,
    isLoading,
    onBack,
    worldActions,
    playerActions,
    SimulationEconomyBlueprint
}) => {
    return (
        <div className="fixed inset-0 top-0 bg-slate-950 text-slate-200 flex overflow-hidden font-sans selection:bg-indigo-500/30 z-20">
            {/* Atmosphere */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />
            </div>

            <AdminSidebar
                pin={pin}
                roomData={roomData}
                isLoading={isLoading}
                onBack={onBack}
                {...worldActions}
                {...playerActions}
            />

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
                            <PlayerGrid
                                players={roomData.players}
                                onKick={playerActions.kickPlayer}
                                onLevelChange={playerActions.handlePlayerLevelChange}
                                onRoleChange={playerActions.handleRoleChange}
                                onRegionChange={playerActions.handleRegionChange}
                                onControl={playerActions.controlPlayer}
                                onGiveGold={playerActions.onGiveGold}
                                onGiveResource={playerActions.onGiveResource}
                                onGiveItem={playerActions.onGiveItem}
                            />

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
                                                                    onClick={(e) => { e.stopPropagation(); worldActions.handleBuildingLevelChange(building.id, -1); }}
                                                                    className="w-5 h-5 bg-white/10 hover:bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black pointer-events-auto transition-all"
                                                                >
                                                                    -
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); worldActions.handleBuildingLevelChange(building.id, 1); }}
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
            </main>

            <RoomFeed roomData={roomData} />

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
        </div>
    );
});
