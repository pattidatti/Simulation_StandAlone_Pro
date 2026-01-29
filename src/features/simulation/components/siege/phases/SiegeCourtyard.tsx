import React from 'react';
import type { SimulationPlayer, ActiveSiege, SiegeZone } from '../../../simulationTypes';
import { motion } from 'framer-motion';
import { Users, Shield, Zap, Skull } from 'lucide-react';

interface Props {
    player: SimulationPlayer;
    siege: ActiveSiege;
    onAction: (action: any) => void;
}

const ZONES: SiegeZone[] = ['FLANK_LEFT', 'VANGUARD', 'FLANK_RIGHT', 'REARGUARD'];

export const SiegeCourtyard: React.FC<Props> = ({ player, siege, onAction }) => {
    const s = siege.courtyardState;
    if (!s) return <div className="text-white">Loading Tactics...</div>;

    const participant = (siege.attackers || {})[player.id] || (siege.defenders || {})[player.id];
    const myHand = participant?.deck?.hand || ['basic_attack', 'defend', 'charge', 'fire_pot']; // Mock Hand if empty logic

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col relative"
        >
            {/* BOSS BAR (Magma Style) */}
            <div className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center">
                <div className="text-orange-500 font-black text-4xl uppercase tracking-tighter drop-shadow-lg mb-2 flex items-center gap-4">
                    <Skull className="w-8 h-8 animate-bounce" />
                    GARNISONSSJEFEN
                    <Skull className="w-8 h-8 animate-bounce" />
                </div>
                <div className="w-full max-w-4xl h-12 bg-slate-900 rounded-full border-2 border-orange-900 overflow-hidden shadow-[0_0_30px_rgba(234,88,12,0.4)] relative">
                    <motion.div
                        className="h-full bg-gradient-to-r from-orange-900 via-orange-600 to-yellow-500"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(s.bossHp / s.maxBossHp) * 100}%` }}
                    >
                        {/* Molten Texture Overlay */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white drop-shadow-md">
                        {s.bossHp} HP
                    </div>
                </div>
            </div>

            {/* BATTLEFIELD ZONES */}
            <div className="flex-1 grid grid-cols-4 gap-4 pt-32 pb-40 px-8">
                {ZONES.map(zoneId => {
                    const zone = s.zones[zoneId];
                    const isMyZone = participant?.zone === zoneId;
                    const occupierCount = zone?.occupierIds?.length || 0;
                    const hasOil = zone?.modifiers?.includes('OILY');

                    return (
                        <div
                            key={zoneId}
                            onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'MOVE_ZONE', payload: { zone: zoneId } })}
                            className={`
                                relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden group
                                ${isMyZone ? 'border-amber-400 bg-amber-900/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-white/10 bg-black/40 hover:bg-white/5'}
                                ${hasOil ? 'ring-2 ring-purple-500' : ''}
                            `}
                        >
                            {/* Zone Label */}
                            <div className="absolute top-4 left-0 right-0 text-center font-black uppercase text-slate-500 tracking-widest group-hover:text-white transition-colors">
                                {zoneId.replace('_', ' ')}
                            </div>

                            {/* Modifiers */}
                            {hasOil && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-5xl opacity-50 select-none">🛢️</div>
                            )}

                            {/* Occupiers Cluster */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-2 text-slate-400">
                                <Users size={16} />
                                <span className="font-bold text-sm">{occupierCount}</span>
                                {isMyZone && <span className="text-[10px] bg-amber-500 text-black px-1 rounded font-bold">DEG</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CARD HAND (Fixed Bottom) */}
            <div className="absolute bottom-4 left-0 right-0 h-48 flex items-end justify-center gap-[-20px] pointer-events-none">
                <div className="flex items-end -space-x-4 pointer-events-auto pb-4">
                    {/* Simplified Hand Render map */}
                    {myHand.map((cardId, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -40, scale: 1.1, zIndex: 10 }}
                            onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'PLAY_CARD', payload: { templateId: cardId } })} // Mock ID logic
                            className={`
                                w-32 h-48 rounded-xl border-2 shadow-2xl cursor-pointer relative flex flex-col p-3 transition-all
                                ${cardId === 'charge' ? 'bg-slate-900 border-red-500' : 'bg-slate-900 border-indigo-400'}
                                bg-gradient-to-b from-slate-800 to-black
                            `}
                            style={{ rotate: (idx - 1.5) * 5 }} // Fan effect
                        >
                            {/* Card Content Mockup */}
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{cardId}</div>
                            <div className="flex-1 flex items-center justify-center text-4xl">
                                {cardId === 'fire_pot' ? '🔥' : cardId === 'defend' ? '🛡️' : '⚔️'}
                            </div>
                            <div className="text-[10px] text-center text-slate-500 leading-tight mt-2">
                                {cardId === 'fire_pot' ? 'Dekk sonen i olje' : 'Gjør skade'}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Boss Attack Telegraph Overlay */}
            {s.bossTargetZone && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/20 px-8 py-4 rounded-full border border-red-500 text-red-200 font-bold animate-pulse pointer-events-none">
                    ⚠️ BOSS SIKTER PÅ {s.bossTargetZone}!
                </div>
            )}
        </motion.div>
    );
};
