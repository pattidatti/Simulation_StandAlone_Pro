import React, { useState } from 'react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import type { SimulationPlayer, EquipmentItem } from '../simulationTypes';
import { ShoppingBag, ChevronRight, Hammer, Wand2, Shield, Sword, Trophy, Sparkles, AlertCircle, ArrowUpCircle } from 'lucide-react';

interface WeaponRackWindowProps {
    player: SimulationPlayer;
    onAction: (action: any) => void;
    onClose: () => void;
}

// --- CONFIG ---
const RACK_LEVELS = [
    { level: 0, label: 'Gammelt Trestativ', slots: 2, cost: { wood: 50 }, visual: 'wood' },
    { level: 1, label: 'Forsterket Jernstativ', slots: 4, cost: { wood: 100, ore: 50 }, visual: 'iron' },
    { level: 2, label: 'Forgylt Kongestativ', slots: 6, cost: { wood: 200, ore: 100, gold: 500 }, visual: 'gold' }
];

const TROPHIES = [
    { id: 'trophy_rusty_sword', label: 'Rustent Sverd', desc: 'Funnet i myra.', price: 50, icon: <Sword size={24} className="text-amber-800" /> },
    { id: 'trophy_broken_shield', label: 'Knust Skjold', desc: 'Fra et glemt slag.', price: 100, icon: <Shield size={24} className="text-slate-600" /> },
    { id: 'trophy_golden_chalice', label: 'Gullbeger', desc: 'Kanskje litt uekte gull?', price: 500, icon: <Trophy size={24} className="text-yellow-400" /> },
    { id: 'trophy_dragon_skull', label: 'Dragehodeskalle', desc: 'En fryktinngytende replika.', price: 2500, icon: <div className="text-2xl">🐲</div> },
];

/**
 * Rack SVG Component
 */
export const RackSvg = ({ level, slots }: { level: number; slots: any[] }) => {
    // Rack Colors
    const woodColor = '#5D4037';
    const woodDark = '#3E2723';
    const ironColor = '#546E7A';
    const goldColor = '#FFD700';
    const goldDark = '#B7950B';

    const getRackColor = () => {
        if (level === 1) return ironColor;
        if (level === 2) return goldColor;
        return woodColor;
    };

    const getStrokeColor = () => {
        if (level === 1) return '#263238';
        if (level === 2) return goldDark;
        return woodDark;
    };

    const rackStyle = {
        filter: level === 2 ? 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.3))' : 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))'
    };

    return (
        <svg viewBox="0 0 400 300" className="w-full h-full transition-all duration-500" style={rackStyle}>
            <defs>
                <linearGradient id="woodGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={woodDark} />
                    <stop offset="50%" stopColor={woodColor} />
                    <stop offset="100%" stopColor={woodDark} />
                </linearGradient>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF9C4" />
                    <stop offset="50%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#B7950B" />
                </linearGradient>
            </defs>

            {/* Platform / Floor Shadow */}
            <ellipse cx="200" cy="270" rx="140" ry="20" fill="black" opacity="0.4" />

            {/* The Rack Structure */}
            {/* Vertical Posts */}
            <rect x="60" y="40" width="20" height="240" rx="4" fill={level === 2 ? "url(#goldGradient)" : "url(#woodGradient)"} stroke={getStrokeColor()} strokeWidth="2" />
            <rect x="320" y="40" width="20" height="240" rx="4" fill={level === 2 ? "url(#goldGradient)" : "url(#woodGradient)"} stroke={getStrokeColor()} strokeWidth="2" />

            {/* Horizontal Beams */}
            <rect x="50" y="80" width="300" height="15" rx="4" fill={level === 2 ? "url(#goldGradient)" : "url(#woodGradient)"} stroke={getStrokeColor()} strokeWidth="2" />
            <rect x="50" y="150" width="300" height="15" rx="4" fill={level === 2 ? "url(#goldGradient)" : "url(#woodGradient)"} stroke={getStrokeColor()} strokeWidth="2" />
            <rect x="50" y="220" width="300" height="15" rx="4" fill={level === 2 ? "url(#goldGradient)" : "url(#woodGradient)"} stroke={getStrokeColor()} strokeWidth="2" />

            {/* Decorations for Higher Levels */}
            {level >= 1 && (
                <>
                    <circle cx="70" cy="87.5" r="4" fill={level === 2 ? "black" : "#CFD8DC"} />
                    <circle cx="330" cy="87.5" r="4" fill={level === 2 ? "black" : "#CFD8DC"} />
                    <circle cx="70" cy="157.5" r="4" fill={level === 2 ? "black" : "#CFD8DC"} />
                    <circle cx="330" cy="157.5" r="4" fill={level === 2 ? "black" : "#CFD8DC"} />
                </>
            )}

            {/* Items on Rack */}
            {slots.map((slot, i) => {
                if (!slot || !slot.itemId) return null;

                // Simple auto-layout logic
                // Max 6 slots. 
                // Row 1 (y=80), Row 2 (y=150), Row 3 (y=220) ?
                // Actually let's hang them from the beams.

                const slotsPerRow = 2;
                const row = Math.floor(i / slotsPerRow);
                const col = i % slotsPerRow;

                // Adjust X so they are centered between posts (80 to 320 = 240 width)
                // Col 0: 160, Col 1: 240? Or spread evenly? 
                // Center is 200.
                const xOffset = col === 0 ? 140 : 260;
                const yOffset = 90 + (row * 70);

                return (
                    <g key={i} transform={`translate(${xOffset}, ${yOffset})`}>
                        {/* Shadow */}
                        <ellipse cx="0" cy="40" rx="15" ry="5" fill="black" opacity="0.3" />

                        {/* Placeholder simple item rendering */}
                        {slot.type === 'ITEM' ? (
                            <g transform="scale(1.2) rotate(15)">
                                <path d="M0,-30 L0,30" stroke="#90A4AE" strokeWidth="4" />
                                <rect x="-6" y="-10" width="12" height="4" fill="#546E7A" />
                                <circle cx="0" cy="32" r="3" fill="#FFD700" />
                            </g>
                        ) : (
                            // Trophy Logic
                            <g transform="scale(1.5)">
                                {slot.itemId === 'trophy_rusty_sword' && <text x="-10" y="10" fontSize="24">🗡️</text>}
                                {slot.itemId === 'trophy_broken_shield' && <text x="-10" y="10" fontSize="24">🛡️</text>}
                                {slot.itemId === 'trophy_golden_chalice' && <text x="-10" y="10" fontSize="24">🏆</text>}
                                {slot.itemId === 'trophy_dragon_skull' && <text x="-12" y="12" fontSize="28">🐲</text>}
                            </g>
                        )}
                    </g>
                );
            })}

        </svg>
    );
};

export const WeaponRackWindow: React.FC<WeaponRackWindowProps> = ({ player, onAction, onClose }) => {
    const [activeRightTab, setActiveRightTab] = useState<'status' | 'shop'>('status');

    // Derived State
    const rawRack = (player.weaponRack || {}) as any;
    const rack = {
        level: rawRack.level || 0,
        slots: rawRack.slots || [],
        unlockedTrophies: rawRack.unlockedTrophies || [],
        lastPolishedAt: rawRack.lastPolishedAt || 0
    };

    const currentLevel = RACK_LEVELS.find(l => l.level === rack.level) || RACK_LEVELS[0];
    const nextLevel = RACK_LEVELS.find(l => l.level === rack.level + 1);
    const maxSlots = currentLevel.slots;

    // Filter Logic
    const inventoryWeapons = (player.inventory || []).filter(item =>
        ['MAIN_HAND', 'OFF_HAND', 'BODY', 'HEAD', 'FEET', 'AXE', 'BOW', 'HAMMER'].includes(item.type)
    );

    // Sort inventory: High value/durability first? Or just name.
    inventoryWeapons.sort((a, b) => (b.value || 0) - (a.value || 0));

    // --- ACTIONS ---
    const handleMountItem = (item: EquipmentItem) => {
        onAction({ type: 'RACK_MOUNT_ITEM', itemId: item.id, instanceId: item.id });
    };

    const handleMountTrophy = (trophyId: string) => {
        onAction({ type: 'RACK_MOUNT_TROPHY', trophyId });
    };

    const handleUnmount = (slotId: string) => {
        onAction({ type: 'RACK_UNMOUNT', slotId });
    };

    const handleUpgrade = () => {
        onAction({ type: 'RACK_UPGRADE' });
    };

    const handleBuyTrophy = (trophyId: string, price: number) => {
        onAction({ type: 'RACK_BUY_TROPHY', trophyId, price });
    };

    const handlePolish = () => {
        onAction({ type: 'RACK_POLISH' });
    };

    const isRackFull = rack.slots.length >= maxSlots;

    return (
        <SimulationMapWindow
            title="VÅPENKAMMERET"
            subtitle="The Royal Armory"
            icon={<Hammer className="text-amber-500" size={24} />}
            onClose={onClose}
            maxWidth="max-w-7xl"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px] text-slate-200 select-none overflow-hidden">

                {/* --- COLUMN 1: INVENTORY (3 cols) --- */}
                <div className="lg:col-span-3 flex flex-col bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Ditt Utstyr</h3>
                        <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">{inventoryWeapons.length} gjenstander</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {inventoryWeapons.length === 0 && (
                            <div className="text-center py-10 text-slate-600 text-xs italic">
                                Tomt i sekken...
                            </div>
                        )}

                        {inventoryWeapons.map((item, idx) => (
                            <button
                                key={`inv-${idx}`}
                                disabled={isRackFull}
                                onClick={() => handleMountItem(item)}
                                className="w-full flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-left disabled:opacity-50 group"
                            >
                                <div className="w-10 h-10 flex items-center justify-center bg-slate-950 rounded-lg border border-white/5 text-lg shadow-inner group-hover:scale-105 transition-transform">
                                    ⚔️
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-base text-indigo-100 truncate group-hover:text-indigo-400 transition-colors">{item.name}</div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <span>Slitasje: {item.durability || 100}%</span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity">
                                    <ChevronRight size={14} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- COLUMN 2: THE RACK (6 cols) --- */}
                <div className="lg:col-span-6 flex flex-col relative group">
                    {/* Main Stage */}
                    <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-slate-950/50 to-slate-950 pointer-events-none" />

                        <div className="relative z-10 w-full h-full p-8">
                            <RackSvg level={rack.level} slots={rack.slots} />
                        </div>

                        {/* Polish Button Overlay */}
                        <div className="absolute bottom-8 right-8 z-20">
                            {(() => {
                                const now = Date.now();
                                const lastPolished = rack.lastPolishedAt || 0;
                                const cooldown = 60000 * 60; // 1 hour
                                const timeSince = now - lastPolished;
                                const canPolish = timeSince >= cooldown;
                                const remainingMs = cooldown - timeSince;
                                const remainingMin = Math.ceil(remainingMs / 60000);

                                return (
                                    <button
                                        onClick={handlePolish}
                                        disabled={!canPolish}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-full border transition-all backdrop-blur-sm shadow-xl 
                                            ${canPolish
                                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400 border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-500/10 cursor-pointer'
                                                : 'bg-slate-900/50 text-slate-500 border-slate-700 cursor-not-allowed grayscale'
                                            }`}
                                    >
                                        <Wand2 size={18} className={canPolish ? "animate-pulse" : ""} />
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-xs font-bold uppercase tracking-widest">
                                                {canPolish ? 'Puss Utstyr' : 'Ny-pusset'}
                                            </span>
                                            {!canPolish && (
                                                <span className="text-[10px] lowercase text-slate-400">
                                                    {remainingMin}m ventetid
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* --- COLUMN 3: MANAGEMENT (3 cols) --- */}
                <div className="lg:col-span-3 flex flex-col gap-4">

                    {/* Top Panel: Toggle Switch */}
                    <div className="bg-slate-900/80 rounded-2xl p-2 flex border border-white/10">
                        <button
                            onClick={() => setActiveRightTab('status')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeRightTab === 'status' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Oversikt
                        </button>
                        <button
                            onClick={() => setActiveRightTab('shop')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeRightTab === 'shop' ? 'bg-amber-900/30 text-amber-500 shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Troféer
                        </button>
                    </div>

                    {/* Content Panel */}
                    <div className="flex-1 bg-slate-900/50 rounded-3xl border border-white/5 p-4 overflow-y-auto custom-scrollbar">

                        {activeRightTab === 'status' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Mounted List */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex justify-between">
                                        <span>På Veggen</span>
                                        <span>{rack.slots.length} / {maxSlots}</span>
                                    </h4>

                                    <div className="space-y-2">
                                        {rack.slots.length === 0 && <div className="text-xs text-slate-600 italic">Tomt stativ...</div>}
                                        {rack.slots.map((slot: any) => (
                                            <div key={slot.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg border border-white/5">
                                                <div className="text-lg">{slot.type === 'TROPHY' ? '🏆' : '⚔️'}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-slate-300 truncate">{slot.itemId}</div>
                                                </div>
                                                <button onClick={() => handleUnmount(slot.id)} className="text-rose-500 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded">
                                                    <span className="text-xs">✕</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Upgrade Card */}
                                <div className="mt-auto pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ArrowUpCircle className="text-amber-500" size={16} />
                                        <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">Neste Nivå</h4>
                                    </div>

                                    {nextLevel ? (
                                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-white/5">
                                            <div className="text-sm font-bold text-white mb-2">{nextLevel.label}</div>
                                            <div className="text-[10px] text-slate-400 mb-4">
                                                Øker kapasiteten til <span className="text-amber-400 font-bold">{nextLevel.slots} plasser</span>.
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-4">
                                                {Object.entries(nextLevel.cost).map(([res, amt]) => (
                                                    <div key={res} className={`text-xs px-2 py-1 rounded bg-slate-950 flex justify-between ${(player.resources as any)[res] >= (amt as number) ? 'text-slate-300' : 'text-rose-400'}`}>
                                                        <span className="capitalize">{res}</span>
                                                        <span className="font-mono">{amt as number}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={handleUpgrade}
                                                // Assuming we have simple cost check in UI or backend handles it strictly. 
                                                // Disabling UI if clearly broke is nice though.
                                                disabled={false}
                                                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shadow-lg shadow-amber-900/20 transition-all uppercase tracking-wider"
                                            >
                                                Oppgrader
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-emerald-500 text-xs font-bold bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                            Maksimalt nivå nådd!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeRightTab === 'shop' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-2 mb-2 p-3 bg-amber-900/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs">
                                    <Sparkles size={14} className="text-amber-400" />
                                    <span>Kjøp unike troféer for ære og berømmelse!</span>
                                </div>

                                {TROPHIES.map(trophy => {
                                    const isOwned = rack.unlockedTrophies.includes(trophy.id);
                                    const canAfford = (player.resources.gold || 0) >= trophy.price;

                                    return (
                                        <div key={trophy.id} className="relative p-3 bg-slate-800/40 rounded-xl border border-white/5 hover:bg-slate-800/80 transition-all group">
                                            <div className="flex gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                    {trophy.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-sm text-slate-200">{trophy.label}</h4>
                                                    <p className="text-xs text-slate-500 mt-1">{trophy.desc}</p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="font-mono text-amber-500 font-bold text-xs">{trophy.price}g</span>
                                                        {isOwned ? (
                                                            rack.slots.some((s: any) => s.itemId === trophy.id) ? (
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">På veggen</span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleMountTrophy(trophy.id)}
                                                                    disabled={isRackFull}
                                                                    className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    Heng Opp
                                                                </button>
                                                            )
                                                        ) : (
                                                            <button
                                                                onClick={() => handleBuyTrophy(trophy.id, trophy.price)}
                                                                disabled={!canAfford}
                                                                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${canAfford ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                                                            >
                                                                Kjøp
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </SimulationMapWindow>
    );
};
