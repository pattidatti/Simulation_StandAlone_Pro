import React, { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import type { SimulationRoom } from '../../simulationTypes';
import { SEASONS, ROLE_DEFINITIONS } from '../../constants';

interface AdminSidebarProps {
    pin: string;
    roomData: SimulationRoom;
    isLoading: boolean;
    onBack: () => void;
    onStartGame: () => void;
    onTogglePublic: () => void;
    onRepairData: () => void;
    onResetGame: () => void;
    onNextSeason: () => void;
    onChangeWeather: () => void;
    onTaxationBase: () => void;
    onRegenStamina: () => void;
    onResetUnrest: () => void;
    onKickAll: () => void;
    onSpawnEvent: () => void;
    onStartTing: () => void;
    onSpawnCharacter: (form: { name: string; role: any; level: number }) => void;
    initializeSettlement: () => void;
    onExportLog: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = React.memo(({
    pin,
    roomData,
    isLoading,
    onBack,
    onStartGame,
    onTogglePublic,
    onRepairData,
    onResetGame,
    onNextSeason,
    onChangeWeather,
    onTaxationBase,
    onRegenStamina,
    onResetUnrest,
    onKickAll,
    onSpawnEvent,
    onStartTing,
    onSpawnCharacter,
    initializeSettlement,
    onExportLog
}) => {
    const [charForm, setCharForm] = useState({ name: '', role: 'PEASANT' as any, level: 1 });

    const handleSpawnChar = () => {
        if (!charForm.name) {
            alert("Vennligst oppgi et navn.");
            return;
        }
        onSpawnCharacter(charForm);
        setCharForm({ name: '', role: 'PEASANT', level: 1 });
    };

    return (
        <aside className="w-80 border-r border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col z-20 shadow-2xl overflow-y-auto no-scrollbar">
            <div className="p-8 border-b border-white/5 bg-black/20">
                <button onClick={onBack} className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-4 hover:text-white transition-colors flex items-center gap-2">
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
                        onClick={onStartGame}
                        disabled={roomData.status === 'PLAYING' || isLoading}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg ${roomData.status === 'PLAYING' ? 'bg-emerald-600/20 text-emerald-400 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'}`}
                    >
                        {roomData.status === 'PLAYING' ? '✅ SPILL AKTIVT' : '🚀 START SPILL'}
                    </button>
                    <button
                        onClick={onTogglePublic}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border flex items-center justify-center gap-2 ${roomData.isPublic ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white' : 'bg-slate-800 text-slate-500 border-white/5 hover:border-indigo-500/20'}`}
                    >
                        {roomData.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                        {roomData.isPublic ? 'OFFENTLIG SERVER' : 'PRIVAT (KUN PIN)'}
                    </button>
                    <button
                        onClick={onRepairData}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white transition-all border border-amber-500/20"
                    >
                        🛠 REPARER DATA
                    </button>
                    <button
                        onClick={onResetGame}
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
                            <button onClick={onNextSeason} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-black uppercase text-[10px] transition-all">Neste Årstid</button>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-slate-400 italic">Vær: {roomData.world?.weather || 'Klart'}</span>
                                <span className="text-2xl group-hover:scale-110 transition-transform">☁️</span>
                            </div>
                            <button onClick={onChangeWeather} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-black uppercase text-[10px] transition-all">Endre Vær</button>
                        </div>
                    </div>
                </section>

                {/* Mass Actions */}
                <section>
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Massehandlinger</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <button onClick={onTaxationBase} className="w-full bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-600/20 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2">
                            💰 Skattlegg Riket
                        </button>
                        <button onClick={onRegenStamina} className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/20 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 text-center">
                            ⚡ Gjenopprett Stamina
                        </button>
                        <button onClick={onResetUnrest} className="w-full bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white border border-indigo-600/20 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 text-center">
                            🕊️ Nullstill Politisk Uro
                        </button>
                        <button onClick={onKickAll} className="w-full bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-600/20 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2 text-center mt-2">
                            ☠️ Kast ut alle
                        </button>
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Dataanalyse</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={onExportLog}
                            disabled={isLoading}
                            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            📊 EKSPORTER FULL LOGG
                        </button>
                    </div>
                </section>

                {/* Special Actions */}
                <section>
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 text-center">Intervensjoner</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={onSpawnEvent} className="bg-rose-600/80 hover:bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-rose-600/20 transition-all active:scale-95">🎲 Event</button>
                            <button onClick={onStartTing} disabled={!!roomData.activeVote} className="bg-amber-600/80 hover:bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-amber-600/20 disabled:opacity-20 text-center transition-all active:scale-95">⚖️ Tinget</button>
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
                                    onClick={handleSpawnChar}
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
    );
});
