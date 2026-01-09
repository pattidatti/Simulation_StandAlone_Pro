import React from 'react';
import type { SimulationRoom } from '../../simulationTypes';
import { INITIAL_MARKET } from '../../constants';

interface HostRoomListProps {
    allRooms: SimulationRoom[];
    isLoading: boolean;
    onCreateRoom: () => void;
    onDeleteRoom: (pin: string) => void;
    onManageRoom: (pin: string) => void;
    onCleanupMetadata: () => void;
}

export const HostRoomList: React.FC<HostRoomListProps> = ({
    allRooms,
    isLoading,
    onCreateRoom,
    onDeleteRoom,
    onManageRoom,
    onCleanupMetadata
}) => {
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
                            onClick={onCleanupMetadata}
                            disabled={isLoading}
                            className="bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            🧹 Vask Serverlisten
                        </button>
                        <button
                            onClick={onCreateRoom}
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
                                    onClick={() => onManageRoom(r.pin)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/5"
                                >
                                    Administrer &rarr;
                                </button>
                                <button
                                    onClick={() => onDeleteRoom(r.pin)}
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
        </div>
    );
};
