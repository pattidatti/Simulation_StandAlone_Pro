import React from 'react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import type { SimulationPlayer } from '../simulationTypes';
import { Lock, ChevronRight, CheckCircle2 } from 'lucide-react';

interface StablesWindowProps {
    player: SimulationPlayer;
    onAction: (action: any) => void;
    onClose: () => void;
}

const TRACKS = [
    {
        id: 'ride_easy',
        label: 'Engelskogen',
        icon: '🌲',
        desc: 'En rolig tur i vakkert terreng.',
        color: 'emerald'
    },
    {
        id: 'ride_medium',
        label: 'Fjellpasset',
        icon: '🏔️',
        desc: 'Høyere fart og flere klipper.',
        color: 'amber'
    },
    {
        id: 'ride_hard',
        label: 'Ulvestien',
        icon: '🐺',
        desc: 'Livsfarlig galopp gjennom tett mørke.',
        color: 'rose'
    }
];

const COSMETICS = {
    skins: [
        { id: 'brown', label: 'Brun', color: '#78350f', price: 0 },
        { id: 'white', label: 'Hvit', color: '#f8fafc', price: 1000 },
        { id: 'black', label: 'Svart', color: '#0f172a', price: 2500 },
        { id: 'golden', label: 'Gull', color: '#fbbf24', price: 5000 },
    ],
    manes: [
        { id: '#1e1b4b', label: 'Mørk', price: 0 },
        { id: '#f1f5f9', label: 'Hvit', price: 400 },
        { id: '#ea580c', label: 'Ild', price: 800 },
        { id: 'rainbow', label: 'Regnbue', price: 1500 },
    ],
    hats: [
        { id: 'none', label: 'Ingen', icon: '❌', price: 0 },
        { id: 'straw_hat', label: 'Stråhatt', icon: '👒', price: 500 },
        { id: 'cowboy_hat', label: 'Cowboyhatt', icon: '🤠', price: 1000 },
        { id: 'crown', label: 'Krone', icon: '👑', price: 1500 },
    ]
};

const getGrainCost = (trackId: string, level: number) => {
    let trackMult = 1.0;
    if (trackId === 'ride_medium') trackMult = 1.6;
    if (trackId === 'ride_hard') trackMult = 2.5;

    const levelMult = 1 + (level - 1) * 0.5; // 3x at level 5
    return Math.ceil(10 * trackMult * levelMult);
};

export const StablesWindow: React.FC<StablesWindowProps> = ({ player, onAction, onClose }) => {
    const [activeTab, setActiveTab] = React.useState<'ride' | 'horse'>('ride');
    const progress = player.minigameProgress || {};
    const hc = (player.horseCustomization || {}) as any;
    const horse = {
        skinId: hc.skinId || 'brown',
        maneColor: hc.maneColor || '#1e1b4b',
        hatId: hc.hatId || 'none',
        unlockedSkins: hc.unlockedSkins || ['brown'],
        unlockedManeColors: hc.unlockedManeColors || ['#1e1b4b'],
        unlockedHats: hc.unlockedHats || []
    };

    const handleStartLevel = (trackId: string, level: number) => {
        onAction({
            type: 'MOUNT_HORSE',
            method: trackId,
            level: level
        });
        onClose();
    };

    const handleBuyCosmetic = (cosmeticId: string, cosmeticType: 'skin' | 'mane' | 'hat', price: number) => {
        onAction({
            type: 'BUY_HORSE_COSMETIC',
            cosmeticId,
            cosmeticType,
            price
        });
    };

    const handleSelectCosmetic = (cosmeticId: string, cosmeticType: 'skin' | 'mane' | 'hat') => {
        onAction({
            type: 'SELECT_HORSE_COSMETIC',
            cosmeticId,
            cosmeticType
        });
    };

    return (
        <SimulationMapWindow
            title="Stallplass"
            subtitle="Landemerke"
            icon={<span className="text-2xl">🐴</span>}
            onClose={onClose}
        >
            <div className="flex flex-col h-[600px] select-none">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-4 border-b border-white/5 bg-slate-900/50">
                    <button
                        onClick={() => setActiveTab('ride')}
                        className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'ride' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5'
                            }`}
                    >
                        Ri ut
                    </button>
                    <button
                        onClick={() => setActiveTab('horse')}
                        className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'horse' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5'
                            }`}
                    >
                        Din Hest
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <span className="text-xs font-black text-amber-500 uppercase">Ditt Gull</span>
                        <span className="text-sm font-black text-amber-400">{(player.resources?.gold || 0).toLocaleString()}g</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'ride' ? (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Tilgjengelige ruter</h3>
                                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                    <span className="text-xs font-black text-indigo-400">-5 ⚡</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {TRACKS.map((track) => {
                                    const currentMax = progress[track.id] || 1;

                                    return (
                                        <div
                                            key={track.id}
                                            className="group relative bg-slate-900/50 border border-white/5 rounded-[2rem] p-5 hover:bg-slate-900/80 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-5">
                                                {/* Icon */}
                                                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                                                    {track.icon}
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-indigo-400 transition-colors">
                                                            {track.label}
                                                        </h4>
                                                        <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5 shadow-sm">
                                                            <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest leading-none">Pris</span>
                                                            <span className="text-sm font-black text-amber-400 leading-none">{getGrainCost(track.id, currentMax)} 🌾</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-400 line-clamp-1">
                                                        {track.desc}
                                                    </p>
                                                </div>

                                                {/* Level Dots */}
                                                <div className="flex items-center gap-2.5 px-4">
                                                    {[1, 2, 3, 4, 5].map((level) => {
                                                        const isUnlocked = level <= currentMax;
                                                        const isFinished = level < currentMax;
                                                        const cost = getGrainCost(track.id, level);
                                                        const hasGrain = (player.resources?.grain || 0) >= cost;

                                                        return (
                                                            <button
                                                                key={level}
                                                                disabled={!isUnlocked || (!isFinished && !hasGrain)}
                                                                title={isUnlocked ? (isFinished ? 'Fullført' : `Nivå ${level}: Koster ${cost} korn`) : 'Låst'}
                                                                onClick={() => handleStartLevel(track.id, level)}
                                                                className={`
                                                                    w-10 h-10 rounded-full flex items-center justify-center font-black transition-all relative
                                                                    ${isFinished ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                                        isUnlocked ? (hasGrain ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-110 active:scale-95' : 'bg-rose-900/40 text-rose-300 border border-rose-500/40 opacity-80 cursor-not-allowed') :
                                                                            'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}
                                                                `}
                                                            >
                                                                <span className="text-sm">{isFinished ? <CheckCircle2 size={18} /> : level}</span>
                                                                {!isUnlocked && (
                                                                    <div className="absolute -top-1 -right-1 bg-slate-950 p-0.5 rounded-full border border-white/5 shadow-sm">
                                                                        <Lock size={10} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Play Button Shortcut */}
                                                <button
                                                    onClick={() => handleStartLevel(track.id, currentMax)}
                                                    className="w-12 h-12 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white flex items-center justify-center transition-all group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                                >
                                                    <ChevronRight size={24} />
                                                </button>
                                            </div>

                                            {/* Track Progress Bar */}
                                            <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500/50"
                                                    style={{ width: `${(Math.min(5, currentMax - 1) / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8">
                            {/* Horse Preview */}
                            <div className="relative h-64 bg-slate-900/80 rounded-[3rem] border border-white/5 flex items-center justify-center overflow-hidden group/horse">
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent" />

                                <div className="relative scale-150 transition-transform group-hover/horse:scale-[1.6]">
                                    {/* Horse Head Rendering Style in UI */}
                                    <div className="w-40 h-40 relative flex items-center justify-center">
                                        {/* Simplified Horse Preview SVG/Divs */}
                                        <div className="absolute w-24 h-40 rounded-[3rem] rotate-[15deg] translate-y-12" style={{ backgroundColor: COSMETICS.skins.find(s => s.id === horse.skinId)?.color || '#78350f' }} />
                                        <div className="absolute w-16 h-28 rounded-[2rem] -translate-y-4" style={{ backgroundColor: COSMETICS.skins.find(s => s.id === horse.skinId)?.color || '#78350f' }} />
                                        <div className="absolute w-12 h-16 rounded-[1rem] translate-y-20 bg-black/30" />

                                        {/* Mane */}
                                        <div className="absolute w-4 h-32 -translate-x-8 -translate-y-8 rounded-full" style={{ backgroundColor: horse.maneColor === 'rainbow' ? '#6366f1' : horse.maneColor }} />

                                        {/* Hat */}
                                        {horse.hatId && horse.hatId !== 'none' && (
                                            <div className="absolute -top-16 text-4xl transform -rotate-12">
                                                {COSMETICS.hats.find(h => h.id === horse.hatId)?.icon}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 rounded-full text-xs font-black uppercase tracking-[0.2em] text-white">
                                    Din Hest
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Skins & Mane Group */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 pl-2">Hestefarge</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {COSMETICS.skins.map(s => {
                                                const isUnlocked = horse.unlockedSkins.includes(s.id);
                                                const isSelected = horse.skinId === s.id;
                                                return (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => isUnlocked ? handleSelectCosmetic(s.id, 'skin') : handleBuyCosmetic(s.id, 'skin', s.price)}
                                                        className={`h-16 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${isSelected ? 'border-indigo-500 bg-indigo-500/20' :
                                                            isUnlocked ? 'border-white/10 bg-white/5 hover:border-white/20' :
                                                                'border-white/5 bg-slate-950/50 hover:border-amber-500/50'
                                                            }`}
                                                    >
                                                        <div className="w-6 h-6 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: s.color }} />
                                                        {!isUnlocked ? (
                                                            <span className="text-[10px] font-black text-amber-500">{s.price}g</span>
                                                        ) : (
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{s.label}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 pl-2">Hårfarge (Manke)</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {COSMETICS.manes.map(m => {
                                                const isUnlocked = horse.unlockedManeColors.includes(m.id);
                                                const isSelected = horse.maneColor === m.id;
                                                return (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => isUnlocked ? handleSelectCosmetic(m.id, 'mane') : handleBuyCosmetic(m.id, 'mane', m.price)}
                                                        className={`h-14 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${isSelected ? 'border-indigo-500 bg-indigo-500/20' :
                                                            isUnlocked ? 'border-white/10 bg-white/5 hover:border-white/20' :
                                                                'border-white/5 bg-slate-950/50 hover:border-amber-500/50'
                                                            }`}
                                                    >
                                                        <div className="w-8 h-2 rounded-full border border-white/10" style={{ background: m.id === 'rainbow' ? 'linear-gradient(90deg, #f43f5e, #fbbf24, #10b981, #6366f1)' : m.id }} />
                                                        {!isUnlocked ? (
                                                            <span className="text-[10px] font-black text-amber-500">{m.price}g</span>
                                                        ) : (
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{m.label}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Hats Group */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 pl-2">Hodeplagg</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {COSMETICS.hats.map(h => {
                                            const isUnlocked = horse.unlockedHats.includes(h.id) || h.id === 'none';
                                            const isSelected = horse.hatId === h.id || (!horse.hatId && h.id === 'none');
                                            return (
                                                <button
                                                    key={h.id}
                                                    onClick={() => isUnlocked ? handleSelectCosmetic(h.id, 'hat') : handleBuyCosmetic(h.id, 'hat', h.price)}
                                                    className={`p-4 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-2 ${isSelected ? 'border-indigo-500 bg-indigo-500/20' :
                                                        isUnlocked ? 'border-white/10 bg-white/5 hover:border-white/20' :
                                                            'border-white/5 bg-slate-950/50 hover:border-amber-500/50'
                                                        }`}
                                                >
                                                    <span className="text-3xl">{h.icon}</span>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{h.label}</p>
                                                        {!isUnlocked && (
                                                            <p className="text-xs font-black text-amber-500">{h.price}g</p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="p-8 border-t border-white/5 bg-slate-900/30">
                    <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-start gap-4">
                        <div className="text-2xl">💡</div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-300">Tips for ryttere</p>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                {activeTab === 'ride'
                                    ? "Jo høyere nivå, desto raskere galopperer hesten. Ulvestien på nivå 5 krever lynraske reflekser, men gir enorme mengde XP!"
                                    : "Alle hestekosmetikker beholdes for alltid. Du kan bytte mellom dem når som helst her inne på Stallplassen."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </SimulationMapWindow>
    );
};
