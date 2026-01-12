import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User as UserIcon,
    ArrowLeft,
    Trophy,
    Star,
    History,
    Check,
    Award,
    ShieldAlert,
    LogOut,
    Crown,
    Play
} from 'lucide-react';
import { useSimulationAuth } from '../SimulationAuthContext';
import { ACHIEVEMENTS } from '../data/achievements';

interface GlobalProfileContentProps {
    onClose?: () => void;
    isModal?: boolean;
    currentRoomPin?: string;
}

export const GlobalProfileContent: React.FC<GlobalProfileContentProps> = ({ onClose, isModal, currentRoomPin }) => {
    const { account, logout, isAnonymous } = useSimulationAuth();
    const navigate = useNavigate();

    // Sort active sessions (Active Vessels)
    const activeSessions = useMemo(() => {
        if (!account?.activeSessions) return [];
        // Handle both Map (new) and Array (legacy) forms
        const sessions = Array.isArray(account.activeSessions)
            ? account.activeSessions
            : Object.values(account.activeSessions);

        return sessions.sort((a, b) => b.lastPlayed - a.lastPlayed);
    }, [account]);

    // Calculate global stats
    const totalAchievements = ACHIEVEMENTS.length;
    const unlockedCount = account?.unlockedAchievements?.length || 0;
    const completionPercentage = Math.round((unlockedCount / totalAchievements) * 100);

    // Calculate Potential XP (Harvestable) from all active sessions
    const potentialXp = useMemo(() => {
        return activeSessions.reduce((acc, session) => acc + (session.xp || 0), 0);
    }, [activeSessions]);

    const totalXp = (account?.globalXp || 0);
    const combinedXp = totalXp + potentialXp;

    const currentGlobalLevel = account?.globalLevel || 1;
    // Formula: Lvl = Math.floor(Math.sqrt(GlobalXP / 100)) + 1
    // Next Level XP Requirement: (lvl)^2 * 100
    const nextLevelXp = Math.pow(currentGlobalLevel, 2) * 100;
    const prevLevelXp = Math.pow(currentGlobalLevel - 1, 2) * 100;
    const progressToNext = Math.min(100, Math.max(0, ((combinedXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

    return (
        <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-12">

            {/* Header (Only show if NOT modal, or if modal needs specific header) */}
            {!isModal && (
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => navigate('/sim')}
                        className="group flex items-center gap-3 text-slate-500 hover:text-white transition-colors pl-2"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <span className="font-black uppercase tracking-[0.2em] text-xs">Tilbake til Lobby</span>
                    </button>

                    {/* Logout / Secure Account actions */}
                    <div className="flex items-center gap-4">
                        {isAnonymous ? (
                            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                                <ShieldAlert size={14} /> Sikre Profil
                            </button>
                        ) : (
                            <button onClick={async () => {
                                await logout();
                                navigate('/sim');
                            }} className="px-5 py-2.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5 transition-all flex items-center gap-2">
                                <LogOut size={14} /> Logg Ut
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-16">

                {/* Identity Hero */}
                <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                        <div className="w-32 h-32 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center relative overflow-hidden shadow-2xl">
                            <UserIcon size={64} className="text-slate-200" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-900 uppercase tracking-wider">
                            Operator
                        </div>
                    </div>

                    <div className="flex-1 space-y-6 pt-2">
                        <div>
                            <h1 className="text-sm font-bold text-indigo-400 uppercase tracking-[0.4em] mb-2">Global Profil</h1>
                            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-tighter">
                                {account?.displayName || 'Ukjent Identitet'}
                            </h2>
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 relative overflow-hidden group/lvl">
                                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><Award size={18} /></div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mb-0.5">Sjelsnivå</p>
                                    <p className="text-2xl font-black text-white italic">{currentGlobalLevel}</p>
                                </div>
                                {/* Mini Progress Bar */}
                                <div className="absolute bottom-0 left-0 h-1 bg-indigo-600/30 w-full">
                                    <div
                                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                        style={{ width: `${progressToNext}%` }}
                                    />
                                </div>
                            </div>

                            <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400"><Star size={18} /></div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mb-0.5">Total Erfaring</p>
                                    <p className="text-2xl font-black text-white italic flex items-baseline gap-2">
                                        {totalXp}
                                        {potentialXp > 0 && (
                                            <span className="text-indigo-400 text-sm opacity-60 font-bold" title="Høstbar XP fra levende karakterer">
                                                (+{potentialXp})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* ACTIVE VESSELS LIST */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400"><UserIcon size={16} /></div>
                        Active Vessels
                    </h3>

                    {activeSessions.length === 0 ? (
                        <div className="p-8 border border-white/5 border-dashed rounded-3xl text-center text-slate-500">
                            <p className="text-xs font-black uppercase tracking-widest">Ingen aktive spill</p>
                            <p className="text-sm mt-2">Start et nytt spill i lobbyen for å se karakteren din her.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeSessions.map((session, i) => (
                                <div key={i} className="group bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-indigo-500/30 p-6 rounded-2xl transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        {session.role === 'KING' ? <Crown size={64} /> : <UserIcon size={64} />}
                                    </div>

                                    <div className="relative z-10 space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{session.role}</span>
                                                <span className="text-[10px] font-mono text-slate-500">{session.roomPin}</span>
                                            </div>
                                            <h4 className="text-2xl font-black text-white">{session.name}</h4>
                                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><History size={10} /> {new Date(session.lastPlayed).toLocaleDateString()}</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (isModal) {
                                                    // If we are already playing this session, just close the modal
                                                    if (currentRoomPin && session.roomPin === currentRoomPin) {
                                                        onClose?.();
                                                        return;
                                                    }

                                                    // Switching to a different character/room
                                                    if (confirm(`Vil du fortlate nåværende spill for å bytte til ${session.name}?`)) {
                                                        window.location.href = `/play/${session.roomPin}`;
                                                    }
                                                } else {
                                                    navigate(`/play/${session.roomPin}`);
                                                }
                                            }}
                                            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg transition-all
                                                ${(currentRoomPin && session.roomPin === currentRoomPin)
                                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-95'
                                                }`}
                                        >
                                            {currentRoomPin && session.roomPin === currentRoomPin ? (
                                                <><Check size={12} fill="currentColor" /> Du spiller denne</>
                                            ) : (
                                                <><Play size={12} fill="currentColor" /> Fortsett</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Legacy & Achievements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* ACHIEVEMENTS */}
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Trophy size={14} /> Achievements
                            </h4>
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{completionPercentage}%</span>
                        </div>

                        <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {ACHIEVEMENTS.map((ach) => {
                                const isUnlocked = account?.unlockedAchievements?.includes(ach.id);
                                return (
                                    <div
                                        key={ach.id}
                                        title={`${ach.name}: ${ach.description}`}
                                        className={`aspect-square rounded-xl border flex items-center justify-center transition-all relative group cursor-help
                                            ${isUnlocked
                                                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                                : 'bg-black/20 text-slate-800 border-white/5 grayscale opacity-50'
                                            }`}
                                    >
                                        <span className="text-xl">{ach.icon}</span>
                                        {isUnlocked && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* HALL OF FAME */}
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <History size={14} /> Hall of Fame
                        </h4>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {(!account?.characterHistory || account.characterHistory.length === 0) ? (
                                <div className="text-center py-12 opacity-30 border-2 border-dashed border-white/10 rounded-xl">
                                    <p className="text-xs font-bold uppercase">Ingen falne helter</p>
                                </div>
                            ) : (
                                account.characterHistory.slice().reverse().map((history, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                                                {history.role === 'KING' ? '👑' : history.role === 'BARON' ? '🏰' : '💀'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase tracking-wide group-hover:text-indigo-400 transition-colors">{history.name}</p>
                                                <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase font-bold">
                                                    <span>{history.role}</span>
                                                    <span>•</span>
                                                    <span>Lvl {history.level}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-mono text-slate-600 block">{new Date(history.timestamp).toLocaleDateString()}</p>
                                            <p className="text-[9px] font-black text-indigo-900 group-hover:text-indigo-500 transition-colors uppercase pt-1">{history.roomPin}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
