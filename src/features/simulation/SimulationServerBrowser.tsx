import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';
import { Users, Shield, Clock, Search, Globe } from 'lucide-react';

interface ServerMetadata {
    pin: string;
    status: 'LOBBY' | 'PLAYING' | 'FINISHED';
    playerCount: number;
    worldYear: number;
    season: string;
    isPublic: boolean;
    hostName: string;
    lastUpdated: number;
}

export const SimulationServerBrowser: React.FC = () => {
    const [servers, setServers] = useState<ServerMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const metadataRef = ref(db, 'simulation_server_metadata');
        const unsubscribe = onValue(metadataRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const serverList = Object.values(data) as ServerMetadata[];
                // Only show public and active servers, sorted by lastUpdated
                setServers(serverList
                    .filter(s => s.isPublic && (s.status === 'LOBBY' || s.status === 'PLAYING'))
                    .sort((a, b) => b.lastUpdated - a.lastUpdated)
                );
            } else {
                setServers([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredServers = servers.filter(s =>
        s.pin.includes(searchTerm) ||
        (s as any).name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.hostName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <Search className="text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Søk etter servere eller host..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-white w-full font-medium placeholder:text-slate-600"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Søker etter verdener...</p>
                </div>
            ) : filteredServers.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-white/5 border-dashed">
                    <Globe className="mx-auto text-slate-700 mb-4" size={48} />
                    <p className="text-slate-400 font-medium">Ingen åpne verdener funnet akkurat nå.</p>
                    <p className="text-slate-600 text-sm mt-1">Vurder å hoste din egen eller bruke en PIN-kode.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredServers.map(server => (
                        <button
                            key={server.pin}
                            onClick={() => navigate(`/sim/play/${server.pin}`)}
                            className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-900/60 hover:bg-slate-800/80 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all text-left shadow-lg hover:shadow-indigo-500/10"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                    <Shield className="text-indigo-400" size={32} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors">{(server as any).name || `Rike #${server.pin}`}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${server.status === 'LOBBY' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {server.status === 'LOBBY' ? 'Lobby' : 'I Spill'}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium mt-1">
                                        <span className="font-mono text-xs opacity-50 mr-2 bg-black/30 px-2 py-1 rounded">PIN: {server.pin}</span>
                                        Hostet av <span className="text-slate-300">{server.hostName}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-6 md:mt-0 text-slate-400 font-bold text-sm">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-slate-600" />
                                    <span>{server.playerCount} spillere</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-slate-600" />
                                    <span>År {server.worldYear} ({server.season})</span>
                                </div>
                                <div className="ml-4 h-10 w-10 md:h-12 md:w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/40 group-hover:bg-indigo-500 transition-colors">
                                    ⚔️
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
