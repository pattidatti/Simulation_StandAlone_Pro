import React from 'react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import type { SimulationPlayer } from '../simulationTypes';
import { Lock, ChevronRight, CheckCircle2, Sparkles, Trophy, Navigation } from 'lucide-react';

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
        difficultly: 'Lett',
        color: 'from-emerald-600 to-emerald-800'
    },
    {
        id: 'ride_medium',
        label: 'Fjellpasset',
        icon: '🏔️',
        desc: 'Høyere fart og flere klipper.',
        difficultly: 'Medium',
        color: 'from-amber-600 to-amber-800'
    },
    {
        id: 'ride_hard',
        label: 'Ulvestien',
        icon: '🐺',
        desc: 'Livsfarlig galopp gjennom tett mørke.',
        difficultly: 'Hard',
        color: 'from-rose-600 to-rose-800'
    }
];

const COSMETICS = {
    skins: [
        { id: 'brown', label: 'Rust', color: '#8B4513', price: 0 },
        { id: 'white', label: 'Pearl', color: '#E2E8F0', price: 1000 },
        { id: 'black', label: 'Void', color: '#1A202C', price: 2500 },
        { id: 'golden', label: 'Gold', color: '#F6E05E', price: 5000 },
        { id: 'chestnut', label: 'Red', color: '#7C2D12', price: 750 },
        { id: 'grey', label: 'Mist', color: '#94A3B8', price: 1200 },
    ],
    manes: [
        { id: '#1e1b4b', label: 'Shadow', price: 0 },
        { id: '#f1f5f9', label: 'Snow', price: 400 },
        { id: '#ea580c', label: 'Flame', price: 800 },
        { id: 'rainbow', label: 'Mythic', price: 1500 },
        { id: '#FCD34D', label: 'Blonde', price: 600 },
    ],
    hats: [
        { id: 'none', label: 'Ingen', icon: '❌', price: 0 },
        { id: 'straw_hat', label: 'Stråhatt', icon: '👒', price: 500 },
        { id: 'cowboy_hat', label: 'Sheriff', icon: '🤠', price: 1000 },
        { id: 'crown', label: 'Konge', icon: '👑', price: 1500 },
        { id: 'viking', label: 'Viking', icon: '🪖', price: 2000 },
        { id: 'tophat', label: 'Grev', icon: '🎩', price: 3000 },
    ]
};

const getGrainCost = (trackId: string, level: number) => {
    let trackMult = 1.0;
    if (trackId === 'ride_medium') trackMult = 1.6;
    if (trackId === 'ride_hard') trackMult = 2.5;

    const levelMult = 1 + (level - 1) * 0.5;
    return Math.ceil(10 * trackMult * levelMult);
};

// --- SOPHISTICATED HORSE SVG COMPONENT ---
const NobleHorse = ({ skinColor, maneColor, hatId }: { skinColor: string; maneColor: string; hatId: string }) => {
    const isRainbow = maneColor === 'rainbow';

    return (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
            {/* Defs for gradients */}
            <defs>
                <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff0000" />
                    <stop offset="20%" stopColor="#ffff00" />
                    <stop offset="40%" stopColor="#00ff00" />
                    <stop offset="60%" stopColor="#00ffff" />
                    <stop offset="80%" stopColor="#0000ff" />
                    <stop offset="100%" stopColor="#ff00ff" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Back Legs */}
            <path d="M70,160 L70,190 L85,190 L85,150 Z" fill={skinColor} filter="brightness(0.7)" />
            <path d="M140,160 L140,190 L155,190 L155,150 Z" fill={skinColor} filter="brightness(0.7)" />

            {/* Body */}
            <path
                d="M50,100 Q40,60 90,60 L140,60 Q180,60 170,110 Q160,160 120,150 L80,150 Q50,150 50,100 Z"
                fill={skinColor}
            />

            {/* Front Legs */}
            <path d="M60,150 L60,195 L75,195 L75,150 Z" fill={skinColor} />
            <path d="M130,150 L130,195 L145,195 L145,150 Z" fill={skinColor} />

            {/* Neck & Head */}
            <path
                d="M130,65 Q130,30 160,20 L165,25 Q185,25 185,50 L175,70 Q160,85 145,65 Z"
                fill={skinColor}
            />
            {/* Snout */}
            <path d="M185,50 L195,55 L190,65 L175,70 Z" fill={skinColor} filter="brightness(0.9)" />

            {/* Mane */}
            <path
                d="M160,20 Q120,20 120,80 L130,90 Q140,30 165,25 Z"
                fill={isRainbow ? "url(#rainbowGradient)" : maneColor}
                className={isRainbow ? "animate-pulse" : ""}
            />

            {/* Tail */}
            <path
                d="M50,80 Q20,80 20,140"
                fill="none"
                stroke={isRainbow ? "url(#rainbowGradient)" : maneColor}
                strokeWidth="8"
                strokeLinecap="round"
            />

            {/* Eye */}
            <circle cx="170" cy="40" r="2" fill="white" />
            <circle cx="170.5" cy="39.5" r="0.5" fill="black" />

            {/* Hat Rendering */}
            {hatId === 'straw_hat' && (
                <text x="160" y="25" fontSize="40" transform="rotate(10, 160, 25)">👒</text>
            )}
            {hatId === 'cowboy_hat' && (
                <text x="155" y="25" fontSize="40" transform="rotate(-5, 155, 25)">🤠</text>
            )}
            {hatId === 'crown' && (
                <text x="155" y="20" fontSize="40" transform="rotate(-10, 155, 20)">👑</text>
            )}
            {hatId === 'viking' && (
                <text x="155" y="20" fontSize="40" transform="rotate(0, 155, 20)">🪖</text>
            )}
            {hatId === 'tophat' && (
                <text x="152" y="15" fontSize="45" transform="rotate(-10, 155, 20)">🎩</text>
            )}
        </svg>
    );
};


export const StablesWindow: React.FC<StablesWindowProps> = ({ player, onAction, onClose }) => {
    const [activeTab, setActiveTab] = React.useState<'ride' | 'horse'>('ride');
    const [cosmeticTab, setCosmeticTab] = React.useState<'skin' | 'mane' | 'hat'>('skin');

    const [confirmData, setConfirmData] = React.useState<{ id: string, type: 'skin' | 'mane' | 'hat', price: number } | null>(null);

    // Derived state
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

    // Find current objects for display
    const currentSkin = COSMETICS.skins.find(s => s.id === horse.skinId) || COSMETICS.skins[0];
    const currentMane = COSMETICS.manes.find(m => m.id === horse.maneColor) || COSMETICS.manes[0];

    // Actions
    const handleStartLevel = (trackId: string, level: number) => {
        onAction({ type: 'MOUNT_HORSE', method: trackId, level: level });
        onClose();
    };

    const handleBuyCosmetic = (cosmeticId: string, cosmeticType: 'skin' | 'mane' | 'hat', price: number) => {
        setConfirmData({ id: cosmeticId, type: cosmeticType, price });
    };

    const handleConfirmPurchase = () => {
        if (!confirmData) return;
        onAction({ type: 'BUY_HORSE_COSMETIC', cosmeticId: confirmData.id, cosmeticType: confirmData.type, price: confirmData.price });
        setConfirmData(null);
    };

    const handleSelectCosmetic = (cosmeticId: string, cosmeticType: 'skin' | 'mane' | 'hat') => {
        onAction({ type: 'SELECT_HORSE_COSMETIC', cosmeticId, cosmeticType });
    };

    return (
        <SimulationMapWindow
            title="KONGELIG STALL"
            subtitle="Equestrian Center"
            icon={<Trophy className="text-amber-500" size={24} />}
            onClose={onClose}
        >
            {confirmData && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                            <Sparkles size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase mb-2">Bekreft Kjøp</h3>
                            <p className="text-slate-400 text-sm">
                                Er du sikker på at du vil kjøpe dette for <span className="text-amber-400 font-bold">{confirmData.price}g</span>?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmData(null)}
                                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs uppercase hover:bg-slate-700 transition-colors"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={handleConfirmPurchase}
                                className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-bold text-xs uppercase hover:bg-amber-500 shadow-lg shadow-amber-900/20 transition-all"
                            >
                                Kjøp
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col h-[650px] select-none text-slate-200">
                {/* --- NAVIGATION BAR --- */}
                <div className="flex items-center gap-4 p-6 pb-2">
                    <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('ride')}
                            className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ride'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Navigation size={14} /> Turer
                        </button>
                        <button
                            onClick={() => setActiveTab('horse')}
                            className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'horse'
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Sparkles size={14} /> Min Hest
                        </button>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-3 px-5 py-2 bg-slate-950/50 rounded-2xl border border-amber-500/20 shadow-inner">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Saldo</span>
                        <span className="text-base font-black text-amber-400 font-mono tracking-tight">
                            {(player.resources?.gold || 0).toLocaleString()}
                            <span className="text-xs ml-1 text-amber-600">G</span>
                        </span>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-hidden">
                    {activeTab === 'ride' ? (
                        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
                                {TRACKS.map((track) => {
                                    const currentMax = progress[track.id] || 1;
                                    return (
                                        <div
                                            key={track.id}
                                            className="group relative bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/50 border border-white/5 rounded-[2rem] p-1 overflow-hidden hover:border-white/10 transition-all"
                                        >
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${track.color}`} />

                                            <div className="flex flex-col md:flex-row items-stretch gap-6 pl-6 p-5">
                                                {/* Header & Icon */}
                                                <div className="flex items-center gap-5 min-w-[200px]">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-4xl shadow-inner border border-white/5 group-hover:scale-105 transition-transform duration-500">
                                                        {track.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                                                            {track.label}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                {track.difficultly}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Levels Grid */}
                                                <div className="flex-1 flex flex-wrap items-center gap-3">
                                                    {[1, 2, 3, 4, 5].map((level) => {
                                                        const isUnlocked = level <= currentMax;
                                                        const isFinished = level < currentMax;
                                                        const cost = getGrainCost(track.id, level);
                                                        const hasGrain = (player.resources?.grain || 0) >= cost;

                                                        return (
                                                            <button
                                                                key={level}
                                                                disabled={!isUnlocked || (!isFinished && !hasGrain)}
                                                                onClick={() => handleStartLevel(track.id, level)}
                                                                className={`
                                                                    relative h-12 flex-1 min-w-[60px] max-w-[80px] rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all duration-300
                                                                    ${isFinished
                                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                                        : isUnlocked
                                                                            ? hasGrain
                                                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:-translate-y-1'
                                                                                : 'bg-slate-800 border-slate-700 text-slate-500 saturate-0'
                                                                            : 'bg-transparent border-slate-800/50 text-slate-800'
                                                                    }
                                                                `}
                                                            >
                                                                {isFinished ? (
                                                                    <CheckCircle2 size={20} />
                                                                ) : !isUnlocked ? (
                                                                    <Lock size={16} />
                                                                ) : (
                                                                    <>
                                                                        <span className="text-sm font-black leading-none">{level}</span>
                                                                        <span className="text-[9px] font-medium opacity-80 leading-none">{cost} 🌾</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Quick Action */}
                                                <button
                                                    onClick={() => handleStartLevel(track.id, currentMax)}
                                                    className="w-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                                                >
                                                    <ChevronRight size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full grid grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-500">
                            {/* --- LEFT COL: PREVIEW --- */}
                            <div className="col-span-5 flex flex-col">
                                <div className="flex-1 relative bg-gradient-to-b from-slate-800/50 to-slate-900/90 rounded-[3rem] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                                    {/* Ambient Background */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full" />

                                    <div className="relative z-10 w-full h-full p-8 transition-all hover:scale-105 duration-700 ease-out">
                                        <NobleHorse
                                            skinColor={currentSkin.color}
                                            maneColor={currentMane.id}
                                            hatId={horse.hatId}
                                        />
                                    </div>

                                    {/* Name Plate */}
                                    <div className="absolute bottom-6 inset-x-8 text-center">
                                        <div className="inline-block px-6 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
                                            <span className="text-xs font-black uppercase tracking-[0.3em] text-white/80">
                                                {currentSkin.label} Stalon
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- RIGHT COL: CUSTOMIZATION --- */}
                            <div className="col-span-7 flex flex-col gap-6">
                                {/* Sub-Tabs */}
                                <div className="flex p-1 bg-slate-950/50 rounded-xl border border-white/5 w-fit">
                                    {(['skin', 'mane', 'hat'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setCosmeticTab(tab)}
                                            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${cosmeticTab === tab
                                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                                }`}
                                        >
                                            {tab === 'skin' ? 'Pels' : tab === 'mane' ? 'Manke' : 'Hodeplagg'}
                                        </button>
                                    ))}
                                </div>

                                {/* Customization Grid */}
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-3 gap-3">
                                        {cosmeticTab === 'skin' && COSMETICS.skins.map(s => {
                                            const isUnlocked = horse.unlockedSkins.includes(s.id);
                                            const isSelected = horse.skinId === s.id;
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => isUnlocked ? handleSelectCosmetic(s.id, 'skin') : handleBuyCosmetic(s.id, 'skin', s.price)}
                                                    className={`
                                                        aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all group
                                                        ${isSelected
                                                            ? 'bg-indigo-600 border-indigo-400 ring-2 ring-indigo-500/30'
                                                            : isUnlocked
                                                                ? 'bg-slate-800 border-white/5 hover:bg-slate-700 hover:border-white/20'
                                                                : 'bg-slate-900/50 border-white/5 opacity-70 hover:opacity-100 hover:border-amber-500/50'
                                                        }
                                                    `}
                                                >
                                                    <div className="w-8 h-8 rounded-full border border-white/10 shadow-lg" style={{ backgroundColor: s.color }} />
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-400'}`}>{s.label}</span>
                                                        {!isUnlocked && <span className="text-[10px] font-bold text-amber-500">{s.price}g</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {cosmeticTab === 'mane' && COSMETICS.manes.map(m => {
                                            const isUnlocked = horse.unlockedManeColors.includes(m.id);
                                            const isSelected = horse.maneColor === m.id;
                                            return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => isUnlocked ? handleSelectCosmetic(m.id, 'mane') : handleBuyCosmetic(m.id, 'mane', m.price)}
                                                    className={`
                                                        aspect-square rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all
                                                        ${isSelected ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-800 border-white/5 hover:bg-slate-700'}
                                                    `}
                                                >
                                                    <div
                                                        className="w-12 h-4 rounded-full border border-white/10 shadow-sm"
                                                        style={{ background: m.id === 'rainbow' ? 'linear-gradient(90deg, #f43f5e, #fbbf24, #10b981, #6366f1)' : m.id }}
                                                    />
                                                    {!isUnlocked ? (
                                                        <span className="text-xs font-bold text-amber-500">{m.price}g</span>
                                                    ) : (
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-400'}`}>{m.label}</span>
                                                    )}
                                                </button>
                                            );
                                        })}

                                        {cosmeticTab === 'hat' && COSMETICS.hats.map(h => {
                                            const isUnlocked = horse.unlockedHats.includes(h.id) || h.id === 'none';
                                            const isSelected = horse.hatId === h.id || (!horse.hatId && h.id === 'none');
                                            return (
                                                <button
                                                    key={h.id}
                                                    onClick={() => isUnlocked ? handleSelectCosmetic(h.id, 'hat') : handleBuyCosmetic(h.id, 'hat', h.price)}
                                                    className={`
                                                        aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all
                                                        ${isSelected ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-800 border-white/5 hover:bg-slate-700'}
                                                    `}
                                                >
                                                    <span className="text-4xl drop-shadow-lg">{h.icon}</span>
                                                    {!isUnlocked && <span className="text-xs font-bold text-amber-500">{h.price}g</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SimulationMapWindow>
    );
};
