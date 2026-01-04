import React, { useMemo, useState } from 'react';
import { Users, Search, Circle, Crown, Shield, Sword, Coins, User as UserIcon } from 'lucide-react';
import type { SimulationPlayer } from '../simulationTypes';

interface FolkeregisterProps {
    players: Record<string, SimulationPlayer>;
    myId: string;
    onOpenProfile: (player: SimulationPlayer) => void;
}

export const Folkeregister: React.FC<FolkeregisterProps> = ({ players, myId, onOpenProfile }) => {
    const [search, setSearch] = useState('');


    const list = useMemo(() => {
        return Object.values(players)
            .filter(p => !p.uid) // Filter out pure data placeholders if any, or non-active? No, keep all.
            .filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
    }, [players, search]);

    const isOnline = (lastActive: number) => {
        return Date.now() - lastActive < 1000 * 60 * 5; // 5 mins
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'KING': return <Crown size={14} className="text-yellow-400" />;
            case 'BARON': return <Shield size={14} className="text-purple-400" />;
            case 'SOLDIER': return <Sword size={14} className="text-red-400" />;
            case 'MERCHANT': return <Coins size={14} className="text-emerald-400" />;
            default: return <UserIcon size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black italic text-white flex items-center gap-2">
                        <Users className="text-indigo-400" size={20} />
                        FOLKEREGISTER
                    </h3>
                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                        {list.length} Borgere
                    </span>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Søk etter navn..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {list.map(player => {
                    const online = isOnline(player.lastActive);
                    const isMe = player.id === myId;

                    return (
                        <button
                            key={player.id}
                            onClick={() => onOpenProfile(player)}
                            className={`w-full text-left p-3 rounded-xl border border-transparent hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all group flex items-center gap-3 ${isMe ? 'opacity-50' : ''}`}
                        >
                            {/* Avatar/Initial */}
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-slate-400 group-hover:text-white group-hover:scale-105 transition-all">
                                    {player.avatar ? <img src={player.avatar} className="w-full h-full rounded-full object-cover" /> : player.name[0]}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${online ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                                        {player.name} {isMe && '(Deg)'}
                                    </span>
                                    {player.role === 'KING' && <Crown size={12} className="text-yellow-500 animate-pulse" />}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 text-slate-400 capitalize">
                                        {getRoleIcon(player.role)}
                                        {player.role.toLowerCase()}
                                    </span>
                                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                    <span>Lvl {player.stats.level}</span>
                                </div>
                            </div>

                            <Circle size={10} className="text-indigo-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" fill="currentColor" />
                        </button>
                    );
                })}

                {list.length === 0 && (
                    <div className="p-8 text-center text-slate-500 italic text-sm">
                        Ingen borgere funnet.
                    </div>
                )}
            </div>
        </div>
    );
};
