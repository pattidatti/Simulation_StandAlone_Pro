import React, { useMemo, useState } from 'react';
import {
    User as UserIcon,
    Star,
    History,
    Check,
    Award,
    ShieldAlert,
    LogOut,
    Crown,
    Play,
    LayoutGrid,
    ScrollText
} from 'lucide-react';
import { useSimulationAuth } from '../SimulationAuthContext';
import { AchievementGallery } from './AchievementGallery';

interface GlobalProfileContentProps {
    onClose?: () => void;
    currentRoomPin?: string;
}

type ProfileTab = 'overview' | 'vessels' | 'achievements' | 'history';

export const GlobalProfileContent: React.FC<GlobalProfileContentProps> = ({ onClose, currentRoomPin }) => {
    const { account, logout, isAnonymous } = useSimulationAuth();
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

    // Sort active sessions (Active Vessels)
    const activeSessions = useMemo(() => {
        if (!account?.activeSessions) return [];
        const sessions = Array.isArray(account.activeSessions)
            ? account.activeSessions
            : Object.values(account.activeSessions);

        return sessions.sort((a, b) => b.lastPlayed - a.lastPlayed);
    }, [account]);

    // Calculate global stats
    const potentialXp = useMemo(() => {
        return activeSessions.reduce((acc, session) => acc + (session.xp || 0), 0);
    }, [activeSessions]);

    const totalXp = (account?.globalXp || 0);
    const combinedXp = totalXp + potentialXp;
    const currentGlobalLevel = account?.globalLevel || 1;
    const nextLevelXp = Math.pow(currentGlobalLevel, 2) * 100;
    const prevLevelXp = Math.pow(currentGlobalLevel - 1, 2) * 100;
    const progressToNext = Math.min(100, Math.max(0, ((combinedXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

    // --- SUB-COMPONENTS (RENDER FUNCTIONS) ---

    const renderOverview = () => (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Identity Hero */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-10">
                <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                    <div className="w-40 h-40 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center relative overflow-hidden shadow-2xl">
                        <UserIcon size={80} className="text-slate-200" />
                    </div>
                    <div className="absolute bottom-0 right-0 bg-indigo-500 text-white text-xs font-black px-3 py-1 rounded-full border-4 border-[#0A0A15] uppercase tracking-wider">
                        Operator
                    </div>
                </div>

                <div className="flex-1 space-y-8 pt-4 max-w-5xl">
                    <div>
                        <h1 className="text-sm font-bold text-indigo-400 uppercase tracking-[0.4em] mb-2">Global Profil</h1>
                        <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-tighter">
                            {account?.displayName || 'Ukjent Identitet'}
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                        {/* Soul Level */}
                        <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 relative overflow-hidden group/lvl min-w-[200px]">
                            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400"><Award size={24} /></div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mb-1">Sjelsnivå</p>
                                <p className="text-4xl font-black text-white italic">{currentGlobalLevel}</p>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-600/30 w-full">
                                <div
                                    className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                    style={{ width: `${progressToNext}%` }}
                                />
                            </div>
                        </div>

                        {/* Total XP */}
                        <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 min-w-[200px]">
                            <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400"><Star size={24} /></div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mb-1">Total Erfaring</p>
                                <p className="text-3xl font-black text-white italic flex items-baseline gap-2">
                                    {totalXp}
                                    {potentialXp > 0 && (
                                        <span className="text-indigo-400 text-sm opacity-60 font-bold" title="Høstbar XP">
                                            (+{potentialXp})
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/5">
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 text-center">
                    <p className="text-3xl font-black text-white">{activeSessions.length}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Aktive Spill</p>
                </div>
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 text-center">
                    <p className="text-3xl font-black text-white">{account?.characterHistory?.length || 0}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Falne Helter</p>
                </div>
            </div>
        </div>
    );

    const renderVessels = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400"><UserIcon size={20} /></div>
                Dine Vessels
            </h3>

            {activeSessions.length === 0 ? (
                <div className="p-16 border border-white/5 border-dashed rounded-[2rem] text-center text-slate-500">
                    <p className="text-sm font-black uppercase tracking-widest">Ingen aktive spill funnet</p>
                    <p className="text-base mt-2 opacity-60">Gå til lobbyen for å starte din reise.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {activeSessions.map((session, i) => (
                        <div key={i} className="group bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-indigo-500/30 p-8 rounded-[2rem] transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                {session.role === 'KING' ? <Crown size={120} /> : <UserIcon size={120} />}
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2 py-1 bg-indigo-500/10 rounded-md">{session.role}</span>
                                        <span className="text-[10px] font-mono text-slate-500">{session.roomPin}</span>
                                    </div>
                                    <h4 className="text-3xl font-black text-white tracking-tight">{session.name}</h4>
                                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2"><History size={12} /> Sist spilt: {new Date(session.lastPlayed).toLocaleDateString()}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        if (currentRoomPin && session.roomPin === currentRoomPin) {
                                            onClose?.();
                                            return;
                                        }
                                        if (confirm(`Vil du fortlate nåværende spill for å bytte til ${session.name}?`)) {
                                            window.location.href = `/play/${session.roomPin}`;
                                        }
                                    }}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg transition-all
                                        ${(currentRoomPin && session.roomPin === currentRoomPin)
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 hover:scale-[1.02] active:scale-95'
                                        }`}
                                >
                                    {(currentRoomPin && session.roomPin === currentRoomPin) ? (
                                        <><Check size={14} fill="currentColor" /> Du spiller denne</>
                                    ) : (
                                        <><Play size={14} fill="currentColor" /> Fortsett</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderHistory = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400"><History size={20} /></div>
                Hall of Fame
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(!account?.characterHistory || account.characterHistory.length === 0) ? (
                    <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-white/10 rounded-[2rem]">
                        <p className="text-sm font-bold uppercase tracking-widest">Ingen falne helter i historiebøkene</p>
                    </div>
                ) : (
                    account.characterHistory.slice().reverse().map((history, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-slate-900/60 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all shadow-inner">
                                    {history.role === 'KING' ? '👑' : history.role === 'BARON' ? '🏰' : '💀'}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-wide group-hover:text-indigo-400 transition-colors">{history.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold mt-0.5">
                                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{history.role}</span>
                                        <span>•</span>
                                        <span className="text-indigo-400">Lvl {history.level}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-mono text-slate-600 block">{new Date(history.timestamp).toLocaleDateString()}</p>
                                <p className="text-[10px] font-black text-indigo-900 group-hover:text-indigo-500 transition-colors uppercase pt-1">{history.roomPin}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="relative z-10 flex flex-col h-full bg-[#0A0A15]">

            {/* HEADER & TABS */}
            <div className="sticky top-0 z-50 bg-[#0A0A15]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all px-8 md:px-12 pt-8 pb-4">

                {/* TAB BAR */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${activeTab === 'overview' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                        <LayoutGrid size={14} />
                        <span>Oversikt</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('vessels')}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${activeTab === 'vessels' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                        <Play size={14} />
                        <span>Vessels</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('achievements')}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${activeTab === 'achievements' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                        <Award size={14} />
                        <span>Bragder</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${activeTab === 'history' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                        <ScrollText size={14} />
                        <span>Historikk</span>
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-16 pt-8">
                <div className="mx-auto w-full max-w-[95%] xl:max-w-[90%] 2xl:max-w-[2000px]">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'vessels' && renderVessels()}
                    {activeTab === 'achievements' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><AchievementGallery inGameMode={true} /></div>}
                    {activeTab === 'history' && renderHistory()}
                </div>
            </div>

            {/* FOOTER ACTIONS (Persistent) */}
            <div className="mt-auto px-8 md:px-12 py-8 flex justify-end border-t border-white/5 bg-[#0A0A15]/50 backdrop-blur-md">
                {isAnonymous ? (
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg flex items-center gap-2">
                        <ShieldAlert size={14} /> Sikre Profil
                    </button>
                ) : (
                    <button
                        onClick={async () => {
                            await logout();
                            onClose?.();
                            window.location.href = '/';
                        }}
                        className="px-6 py-3 bg-white/5 text-rose-400 hover:bg-rose-500/10 rounded-xl font-bold uppercase text-xs tracking-widest border border-white/5 flex items-center gap-2"
                    >
                        <LogOut size={14} /> Logg Ut
                    </button>
                )}
            </div>
        </div>
    );
};
