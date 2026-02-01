import React from 'react';
import type { SimulationPlayer, ActiveSiege, SiegeZone } from '../../../simulationTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Skull, Zap, Shield, Sword, Flame, Coins, RefreshCw } from 'lucide-react';
import { SiegeBattleFeed } from '../SiegeBattleFeed';
import { CARD_DATABASE } from '../../../logic/handlers/siege/SiegeCourtyardHandler';

interface Props {
    player: SimulationPlayer;
    siege: ActiveSiege;
    messages?: any[];
    onAction: (action: any) => void;
}

const ZONES: SiegeZone[] = ['FLANK_LEFT', 'VANGUARD', 'FLANK_RIGHT', 'REARGUARD'];

const ZONE_NAMES_NO: Record<string, string> = {
    'VANGUARD': 'FRONTLINJEN',
    'FLANK_LEFT': 'VENSTRE FLANKE',
    'FLANK_RIGHT': 'HØYRE FLANKE',
    'REARGUARD': 'BAKRE REKKER'
};

export const SiegeCourtyard: React.FC<Props> = ({ player, siege, messages = [], onAction }) => {
    const s = siege.courtyardState;

    // --- ERROR STATE ---
    if (!s) return (
        <div className="flex flex-col items-center justify-center h-full gap-6 bg-slate-950/50 backdrop-blur-md">
            <div className="text-xl font-black text-amber-500 uppercase tracking-tighter animate-pulse">Data Synkronisering Påkrevd</div>
            <div className="text-slate-400 text-sm max-w-md text-center italic">Klikk under for å laste inn de nyeste stridsmanøvrene og fjerne duplikater fra din taktiske oversikt.</div>
            <button
                onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'INIT_COURTYARD' })}
                className="px-10 py-4 bg-amber-600 hover:bg-amber-500 text-black font-black text-lg rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95"
            >
                OPPDATER STRIDSDATA
            </button>
        </div>
    );

    // --- DATA PREP ---
    const participant = (siege.attackers || {})[player.id] || (siege.defenders || {})[player.id];
    const myHand = participant?.deck?.hand || [];
    const stamina = participant?.deck?.stamina || 0;
    const maxStamina = participant?.deck?.maxStamina || 10;
    const lootPotential = Math.floor((participant?.stats?.damageDealt || 0) * 0.15); // Mock Algorithm

    // --- RENDER HELPERS ---
    const getCardIcon = (id: string) => {
        if (id.includes('defend')) return <Shield className="text-blue-400" size={32} />;
        if (id.includes('fire')) return <Flame className="text-orange-500" size={32} />;
        return <Sword className="text-slate-300" size={32} />;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col relative overflow-hidden font-sans select-none"
        >
            {/* --- LAYER 4: BOSS ATTACK VIGNETTE (Overlay) --- */}
            {s.bossTargetZone && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 z-0 bg-red-900 pointer-events-none mix-blend-overlay"
                />
            )}

            {/* --- LAYER 1: THE STAKES (Top Bar) --- */}
            <div className="relative z-20 w-full pt-4 px-8 flex justify-between items-start">

                {/* Left: Objective */}
                <div className="flex flex-col">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                        Gjeldende Oppdrag
                    </div>
                    <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Skull size={14} className="text-red-500" />
                        BEKJEMP GARNISONSSJEFEN
                    </div>
                </div>

                {/* Center: Boss HP */}
                <div className="flex-1 max-w-2xl mx-8 flex flex-col items-center">
                    <div className="w-full h-8 bg-slate-900/80 rounded-full border border-orange-900/50 overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <motion.div
                            className="h-full bg-gradient-to-r from-red-900 via-orange-600 to-amber-500"
                            initial={{ width: '100%' }}
                            animate={{ width: `${(s.bossHp / s.maxBossHp) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 50 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-white drop-shadow-md tracking-wider">
                            {s.bossHp.toLocaleString()} / {s.maxBossHp.toLocaleString()} HP
                        </div>
                    </div>
                    {s.bossTargetZone && (
                        <div className="mt-2 text-xs font-black text-red-500 animate-pulse tracking-widest bg-black/50 px-3 py-1 rounded backdrop-blur-sm border border-red-500/30">
                            ⚠️ SIKTER PÅ: {s.bossTargetZone.replace('_', ' ')}
                        </div>
                    )}
                </div>

                {/* Right Section: Loot & Resources */}
                <div className="flex items-center gap-6">
                    {/* Loot */}
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">
                            Din Andel (Est.)
                        </div>
                        <div className="text-sm font-bold text-amber-400 flex items-center gap-2">
                            {lootPotential.toLocaleString()} Gull
                            <Coins size={14} />
                        </div>
                    </div>

                    {/* Resources HUD + Sync */}
                    <div className="flex items-center gap-6 border-l border-white/10 pl-6">
                        <div className="flex flex-col items-end">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">
                                Siegemateriell
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <Sword size={14} className="text-slate-400" />
                                    <span className="text-sm font-black text-slate-200">{player.resources?.siege_sword || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield size={14} className="text-slate-400" />
                                    <span className="text-sm font-black text-slate-200">{player.resources?.siege_armor || 0}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'INIT_COURTYARD' })}
                            className="p-2 bg-slate-900/50 hover:bg-amber-500 hover:text-black text-slate-500 rounded-md border border-white/5 transition-all group shrink-0"
                            title="Synkroniser Taktikk & Dekk"
                        >
                            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- LAYER 2: THE BATTLEFIELD (Middle) --- */}
            <div className="flex-1 relative z-10 grid grid-cols-4 gap-2 px-12 py-16 perspective-1000">
                {ZONES.map(zoneId => {
                    const zone = s.zones[zoneId];
                    const isMyZone = participant?.zone === zoneId;
                    const isTargeted = s.bossTargetZone === zoneId;
                    const hasOil = zone?.modifiers?.includes('OILY');

                    return (
                        <motion.div
                            key={zoneId}
                            onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'MOVE_ZONE', payload: { zone: zoneId } })}
                            className={`
                                relative h-full rounded-xl transition-all duration-300 cursor-pointer group
                                flex flex-col items-center justify-end pb-8
                                ${isTargeted ? 'bg-red-900/20 shadow-[0_0_50px_rgba(220,38,38,0.3)] border-red-500/50' : 'hover:bg-white/5'}
                                ${isMyZone ? 'bg-amber-900/10 border-b-4 border-amber-500' : 'border-b-4 border-transparent'}
                            `}
                        >
                            {/* Floating Label (Projected) */}
                            <div className={`
                                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                text-2xl font-black uppercase tracking-[0.2em] transform -skew-x-12
                                transition-all duration-500
                                ${isTargeted ? 'text-red-500 scale-110' : 'text-slate-800 group-hover:text-slate-600'}
                            `}>
                                {ZONE_NAMES_NO[zoneId] || zoneId}
                            </div>

                            {/* Modifiers */}
                            {hasOil && (
                                <div className="absolute top-10 animate-bounce text-4xl opacity-80" title="Oljebevokst (Tenn på for trippel skade!)">🛢️</div>
                            )}

                            {/* Presence Indicator */}
                            <div className={`
                                flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all
                                ${isMyZone ? 'bg-amber-500 text-black shadow-lg translate-y-0' : 'bg-slate-800 text-slate-500 translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0'}
                            `}>
                                <Users size={12} />
                                {zone.occupierIds?.length || 0}
                                {isMyZone && <span className="ml-1 opacity-70">(DEG)</span>}
                            </div>

                            {/* Danger Pulse if Targeted */}
                            {isTargeted && (
                                <div className="absolute inset-0 border-2 border-red-500 rounded-xl animate-ping opacity-20 pointer-events-none" />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* --- LAYER 3: COMMAND DASHBOARD (Bottom) --- */}
            <div className="relative z-30 h-64 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 flex items-stretch">

                {/* LEFT: Stamina Orb & Control */}
                <div className="w-56 border-r border-white/5 flex flex-col items-center justify-center gap-10 py-6 px-4 bg-black/40 relative">
                    {/* The Orb */}
                    <div className="relative w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        {/* Fill Animation */}
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-amber-500 transition-all duration-700 ease-out opacity-20 rounded-b-full"
                            style={{ height: `${(stamina / maxStamina) * 100}%` }}
                        />
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-amber-400 transition-all duration-700 ease-out mix-blend-overlay rounded-b-full"
                            style={{ height: `${(stamina / maxStamina) * 100}%`, filter: 'blur(16px)' }}
                        />

                        <div className="relative z-10 flex flex-col items-center">
                            <Zap size={28} className={stamina > 0 ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" : "text-slate-800"} />
                            <span className="text-5xl font-black text-white leading-none tracking-tighter">{stamina}</span>
                            <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest mt-1">Energi</span>
                        </div>
                    </div>

                    {/* Hvil Button */}
                    <div className="w-full flex flex-col items-center gap-2 group">
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(245,158,11,0.1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'REST' })}
                            className="w-full py-3 bg-slate-900/90 rounded-xl border border-amber-500/50 text-amber-500 shadow-2xl transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-[12px] font-black uppercase tracking-widest">Hvil (1 brød)</span>
                        </motion.button>
                        <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] opacity-60">
                            Rasjonsforbruk
                        </div>
                    </div>
                </div>

                {/* CENTER: The Hand */}
                <div className="flex-1 relative flex items-center justify-center">
                    <div className="flex items-end justify-center -space-x-4 pb-4">
                        <AnimatePresence>
                            {myHand.map((cardItem, idx) => {
                                const cardId = typeof cardItem === 'string' ? cardItem : cardItem.templateId;
                                const def = CARD_DATABASE[cardId] || {};
                                const cost = typeof cardItem !== 'string' ? cardItem.staminaCost : (def.staminaCost || 2);
                                const canAfford = stamina >= cost;

                                return (
                                    <motion.div
                                        key={typeof cardItem === 'object' ? cardItem.id : idx} // Stable key if possible
                                        layout
                                        initial={{ y: 200, opacity: 0, rotate: 0 }}
                                        animate={{ y: 0, opacity: 1, rotate: (idx - (myHand.length - 1) / 2) * 5 }}
                                        exit={{ y: 200, opacity: 0 }}
                                        whileHover={{ y: -40, scale: 1.1, zIndex: 50, rotate: 0 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => canAfford && onAction({ type: 'SIEGE_ACTION', subType: 'PLAY_CARD', payload: { templateId: cardId } })}
                                        className={`
                                            relative w-32 h-48 rounded-xl border-2 cursor-pointer transition-colors duration-200 group
                                            flex flex-col p-3 shadow-2xl backdrop-blur-md
                                            ${canAfford
                                                ? 'bg-gradient-to-br from-slate-800 to-black border-slate-700 hover:border-amber-400'
                                                : 'bg-slate-900 border-red-900/50 opacity-60 grayscale cursor-not-allowed'}
                                        `}
                                    >
                                        {/* Cost Badge */}
                                        <div className={`
                                            absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 flex items-center justify-center z-20 shadow-lg font-black text-sm
                                            ${canAfford ? 'bg-slate-900 border-amber-500 text-amber-400' : 'bg-slate-950 border-red-900 text-red-700'}
                                        `}>
                                            {cost}
                                        </div>

                                        {/* Redesigned Card Face */}
                                        <div className="flex flex-col h-full">
                                            {/* Header */}
                                            <div className="text-[14px] font-black text-white uppercase tracking-wider mb-2 leading-tight border-b-2 border-white/10 pb-1">
                                                {def.name || cardId.replace('_', ' ')}
                                            </div>

                                            {/* Icon Section */}
                                            <div className="h-10 flex items-center justify-center opacity-80 group-hover:scale-110 transition-transform">
                                                {getCardIcon(cardId)}
                                            </div>

                                            {/* Requirements & Stats */}
                                            <div className="mt-2 flex flex-col gap-2">
                                                {/* Weapon Cost */}
                                                {def.weaponCost && (
                                                    <div className="flex justify-between items-center bg-slate-400/10 px-3 py-1.5 rounded-lg border border-white/5">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase">Kostnad</span>
                                                        <div className="flex items-center gap-1">
                                                            {def.weaponCost.type === 'siege_sword' ? <Sword size={14} className="text-amber-500" /> : <Shield size={14} className="text-blue-500" />}
                                                            <span className="text-[13px] font-black text-slate-200">{def.weaponCost.amount}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Effect Stats */}
                                                <div className="bg-black/60 rounded-lg p-2.5 flex flex-col gap-1.5 shadow-inner border border-white/5">
                                                    {def.effectPayload?.damage && (
                                                        <div className="flex justify-between items-center text-[12px] font-black">
                                                            <span className="text-slate-500 uppercase tracking-tighter">Skade</span>
                                                            <span className="text-red-500 text-lg">{def.effectPayload.damage}</span>
                                                        </div>
                                                    )}
                                                    {def.effectPayload?.armor && (
                                                        <div className="flex justify-between items-center text-[12px] font-black">
                                                            <span className="text-slate-500 uppercase tracking-tighter">Verge</span>
                                                            <span className="text-blue-400 text-lg">+{def.effectPayload.armor}</span>
                                                        </div>
                                                    )}
                                                    {(def.effectPayload?.recoverStamina || def.effectPayload?.groupStamina) && (
                                                        <div className="flex justify-between items-center text-[12px] font-black">
                                                            <span className="text-slate-500 uppercase tracking-tighter">Energi</span>
                                                            <span className="text-amber-400 text-lg">+{def.effectPayload.recoverStamina || def.effectPayload.groupStamina}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description & Tags */}
                                            <div className="flex-1 mt-3 text-[11px] text-slate-300 leading-snug font-medium italic overflow-hidden">
                                                {def.description}
                                            </div>

                                            {def.tags && (
                                                <div className="mt-3 flex gap-1.5">
                                                    {def.tags.map(tag => (
                                                        <span key={tag} className="text-[9px] font-black bg-white/10 text-slate-400 px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* HOVER TOOLTIP */}
                                        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                            <div className="text-xs font-bold text-white mb-1 border-b border-slate-700 pb-1">
                                                {def.name || cardId}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mb-2 italic">
                                                {def.description || "Ingen beskrivelse."}
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 text-[10px] text-mono">
                                                {def.effectPayload?.damage && (
                                                    <div className="text-red-400">Skade: {def.effectPayload.damage}</div>
                                                )}
                                                {def.effectPayload?.armor && (
                                                    <div className="text-blue-400">Rustning: {def.effectPayload.armor}</div>
                                                )}
                                                {def.effectPayload?.zoneMod && (
                                                    <div className="text-purple-400">Effekt: {def.effectPayload.zoneMod}</div>
                                                )}
                                                <div className="text-slate-500">Cooldown: {(def.cooldown || 0) / 1000}s</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        {myHand.length === 0 && (
                            <div className="flex flex-col items-center gap-2 z-50 pointer-events-auto">
                                <div className="text-slate-500 text-sm font-mono">
                                    Tom for kort.
                                </div>
                                <button
                                    onClick={() => onAction({ type: 'SIEGE_ACTION', subType: 'DRAW_CARDS' })}
                                    className="px-6 py-2 text-xs font-black bg-amber-500 text-black border-2 border-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest flex items-center gap-2"
                                >
                                    <Zap size={14} className="fill-black" />
                                    HENT FORSYNINGER
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Battle Feed */}
                <div className="w-64 border-l border-white/5 bg-black/20 p-4">
                    <SiegeBattleFeed messages={messages} />
                </div>

            </div>
        </motion.div >
    );
};
