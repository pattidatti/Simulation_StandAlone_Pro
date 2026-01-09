import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SimulationRoom, SimulationMessage } from '../../simulationTypes';
import { RESOURCE_DETAILS } from '../../constants';

interface RoomFeedProps {
    roomData: SimulationRoom;
}

export const RoomFeed: React.FC<RoomFeedProps> = React.memo(({ roomData }) => {

    const getMessagesList = (msgs: SimulationMessage[] | Record<string, SimulationMessage> | undefined): SimulationMessage[] => {
        if (!msgs) return [];
        if (Array.isArray(msgs)) return msgs;
        return Object.values(msgs).sort((a, b) => a.timestamp - b.timestamp);
    };

    return (
        <aside className="w-80 border-l border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col z-20 shadow-2xl overflow-hidden">
            {/* LEADERBOARD */}
            <div className="p-8 border-b border-white/5 bg-black/20 shrink-0">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-6 flex items-center justify-between">
                    Rikets Formue
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </h3>
                <div className="space-y-4">
                    {Object.values(roomData.players || {})
                        .sort((a: any, b: any) => (b.resources.gold || 0) - (a.resources.gold || 0))
                        .slice(0, 5)
                        .map((p: any, i) => (
                            <div key={p.id} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-slate-600 font-mono">#{i + 1}</span>
                                    <span className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">{p.name}</span>
                                </div>
                                <span className="text-sm font-black text-amber-400">{p.resources.gold}💰</span>
                            </div>
                        ))}
                    {Object.keys(roomData.players || {}).length === 0 && <p className="text-[10px] text-slate-600 font-bold italic text-center py-4">Ingen data tilgjengelig...</p>}
                </div>
            </div>

            {/* MARKET ANALYTICS */}
            <div className="p-8 border-b border-white/5 shrink-0">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6">Markedsanalyse</h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(roomData.market || {}).slice(0, 4).map(([res, data]: [string, any]) => {
                        const details = (RESOURCE_DETAILS as any)[res] || { label: res };
                        return (
                            <div key={res} className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="text-[8px] font-black uppercase text-slate-500 mb-1">{details.label}</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-white">{data.stock}</span>
                                    <span className="text-[10px] font-mono text-emerald-400">{data.price.toFixed(1)}g</span>
                                </div>
                            </div>
                        );
                    })}
                    {Object.entries(roomData.market || {}).slice(0, 4).length === 0 && (
                        <div className="col-span-2 text-[10px] text-slate-600 font-bold italic text-center py-4">Ingen markedsdata...</div>
                    )}
                </div>
            </div>

            {/* GLOBAL LOG */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 pb-4 shrink-0">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                        <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
                        Global Logg
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-8 custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {getMessagesList(roomData.messages).slice().reverse().map((msg: any, idx: number) => {
                            const id = typeof msg === 'object' ? msg.id || idx : idx;
                            return (
                                <motion.div
                                    key={id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-indigo-950/20 border-l-2 border-indigo-500/50 p-4 rounded-r-2xl"
                                >
                                    <p className="text-[10px] font-medium leading-relaxed text-slate-400 antialiased italic font-serif opacity-80">
                                        {typeof msg === 'object' ? msg.text || JSON.stringify(msg) : msg}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {getMessagesList(roomData.messages).length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                            <span className="text-4xl mb-4">📜</span>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em]">Arkivet er tomt</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
});
