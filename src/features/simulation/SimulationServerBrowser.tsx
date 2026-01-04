import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';
import { Users, Shield, Search } from 'lucide-react';

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
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                    type="text"
                    placeholder="Søk i riker..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none transition-all"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3 opacity-50">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-[10px] uppercase tracking-widest text-white/50">Laster verdener...</span>
                </div>
            ) : filteredServers.length === 0 ? (
                <div className="p-8 text-center border border-white/5 border-dashed rounded-xl">
                    <p className="text-sm text-white/40 font-medium">Ingen riker funnet.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredServers.map(server => (
                        <button
                            key={server.pin}
                            onClick={() => navigate(`/sim/play/${server.pin}`)}
                            className="group w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                {/* Compact Status Indicator */}
                                <div className={`w-1.5 h-10 rounded-full ${server.status === 'LOBBY' ? 'bg-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500/50'}`} />

                                <div className="flex flex-col">
                                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                                        {(server as any).name || `Rike #${server.pin}`}
                                    </h3>
                                    <div className="flex items-center gap-3 text-[10px] font-medium text-white/40 uppercase tracking-widest">
                                        <span>{server.hostName}</span>
                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                        <span>PIN: {server.pin}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pr-2">
                                <div className="flex items-center gap-2 text-white/60">
                                    <Users size={14} />
                                    <span className="text-xs font-medium tabular-nums">{server.playerCount}</span>
                                </div>

                                <div className="text-right hidden sm:block">
                                    <div className="text-[10px] text-white/30 uppercase tracking-wider">År {server.worldYear}</div>
                                    <div className="text-[10px] text-white/50">{server.season}</div>
                                </div>

                                <div className="p-2 bg-white/5 rounded-lg text-white/40 group-hover:text-white group-hover:bg-emerald-500/20 transition-all">
                                    <Shield size={14} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
