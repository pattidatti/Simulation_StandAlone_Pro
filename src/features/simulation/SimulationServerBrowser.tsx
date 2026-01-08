import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';
import { Users, Search, Calendar, Wind, Sun, Leaf, Snowflake, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const SkeletonLoader = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-white/5 rounded-2xl animate-pulse border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
        ))}
    </div>
);

const WorldCard = ({ server, onClick }: { server: ServerMetadata, onClick: () => void }) => {
    const seasonConfig: Record<string, { color: string, icon: any, label: string, bg: string }> = {
        'Spring': { color: 'text-emerald-400', icon: Leaf, label: 'Vår', bg: 'group-hover:bg-emerald-500/10' },
        'Summer': { color: 'text-amber-400', icon: Sun, label: 'Sommer', bg: 'group-hover:bg-amber-500/10' },
        'Autumn': { color: 'text-orange-400', icon: Wind, label: 'Høst', bg: 'group-hover:bg-orange-500/10' },
        'Winter': { color: 'text-blue-400', icon: Snowflake, label: 'Vinter', bg: 'group-hover:bg-blue-500/10' }
    };

    const config = seasonConfig[server.season] || seasonConfig['Spring'];

    return (
        <motion.button
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className={`group relative overflow-hidden flex flex-col p-6 bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl transition-all text-left shadow-xl ${config.bg}`}
        >
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-col">
                    <h3 className="text-lg font-black text-white group-hover:text-white transition-colors leading-tight truncate max-w-[200px]">
                        {(server as any).name || `Rike #${server.pin}`}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">
                        <span className="px-1.5 py-0.5 bg-white/5 rounded">PIN: {server.pin}</span>
                        <span className="opacity-50">BY: {server.hostName}</span>
                    </div>
                </div>
                <div className={`p-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 ${config.color} group-hover:scale-110 transition-transform`}>
                    <config.icon size={20} />
                </div>
            </div>

            <div className="mt-auto flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-[0.15em] text-white/20 font-black mb-1">Live Nå</span>
                        <div className="flex items-center gap-1.5 text-white/80 font-black">
                            <Users size={14} className="text-indigo-400" />
                            <span className="text-sm tabular-nums">{server.playerCount || 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-[0.15em] text-white/20 font-black mb-1">Tidsalder</span>
                        <div className="flex items-center gap-1.5 text-white/80 font-black">
                            <Calendar size={14} className="text-amber-500" />
                            <span className="text-sm italic">{config.label} {server.worldYear}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/10 group-hover:text-white transition-colors">
                    Join <ArrowRight size={14} />
                </div>
            </div>

            {/* Background pattern */}
            <div className="absolute -bottom-6 -right-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <config.icon size={120} />
            </div>

            {/* Interaction ring */}
            <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/20 rounded-2xl transition-all" />
        </motion.button>
    );
};

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
            <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                    type="text"
                    placeholder="Søk etter en verden å erobre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="relative w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 outline-none transition-all shadow-inner"
                />
            </div>

            <AnimatePresence mode="popLayout">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <SkeletonLoader />
                    </motion.div>
                ) : filteredServers.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-16 text-center border-2 border-white/5 border-dashed rounded-[2rem] bg-white/[0.02]"
                    >
                        <p className="text-lg text-white/20 font-black italic uppercase tracking-widest">Ingen riker funnet for søket.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        initial="hidden"
                        animate="show"
                        variants={{
                            show: {
                                transition: {
                                    staggerChildren: 0.05
                                }
                            }
                        }}
                    >
                        {filteredServers.map(server => (
                            <WorldCard
                                key={server.pin}
                                server={server}
                                onClick={() => navigate(`/play/${server.pin}`)}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
