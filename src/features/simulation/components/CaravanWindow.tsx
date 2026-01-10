import React, { useState } from 'react';
import { CaravanSVG } from './CaravanSVG';
import { GAME_BALANCE, ACTION_ICONS, RESOURCE_DETAILS } from '../constants';
import type { SimulationPlayer, ResourceType } from '../simulationTypes';
import { motion, AnimatePresence } from 'framer-motion';

interface CaravanWindowProps {
    player: SimulationPlayer;
    onAction: (action: any) => void;
    onClose: () => void;
    preselectedTarget?: string;
}

export const CaravanWindow: React.FC<CaravanWindowProps> = ({ player, onAction, onClose, preselectedTarget }) => {
    const [selectedTab, setSelectedTab] = useState<'CARGO' | 'UPGRADES' | 'TRAVEL'>(preselectedTarget ? 'TRAVEL' : 'CARGO');
    const caravan = player.caravan || { level: 1, inventory: {}, durability: 100, upgrades: [] };
    const levelConfig = GAME_BALANCE.CARAVAN.LEVELS.find(l => l.level === caravan.level) || GAME_BALANCE.CARAVAN.LEVELS[0];

    const currentCargoAmount = Object.values(caravan.inventory).reduce((sum, amt) => sum + (amt || 0), 0);
    const capacity = levelConfig.capacity;

    const handleLoad = (res: ResourceType) => {
        onAction({ type: 'LOAD_CARAVAN', resource: res, amount: 1 });
    };

    const handleUnload = (res: ResourceType) => {
        onAction({ type: 'UNLOAD_CARAVAN', resource: res, amount: 1 });
    };

    const handleUpgrade = (type: 'LEVEL' | 'MODULE', id?: string) => {
        onAction({ type: 'UPGRADE_CARAVAN', upgradeType: type, upgradeId: id });
    };

    const handleTravel = (targetRegion: string) => {
        onAction({ type: 'TRAVEL_START', targetRegionId: targetRegion });
        onClose(); // Close to start game? Or game component handles it.
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
        >
            <div className="bg-slate-900 border border-slate-700/50 w-full max-w-4xl h-[700px] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Karavane</h2>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                            Level {caravan.level} • {levelConfig.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar / Visuals */}
                    <div className="w-1/3 p-8 border-r border-slate-800 flex flex-col items-center justify-center bg-slate-950/50">
                        <CaravanSVG level={caravan.level} upgrades={caravan.upgrades} className="w-full max-w-[240px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />

                        <div className="mt-12 w-full space-y-4">
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                                <div className="flex justify-between text-xs font-black uppercase text-slate-500 mb-2">
                                    <span>Lastkapasitet</span>
                                    <span className={currentCargoAmount >= capacity ? 'text-rose-500' : 'text-amber-400'}>
                                        {currentCargoAmount} / {capacity}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(currentCargoAmount / capacity) * 100}%` }}
                                        className="h-full bg-amber-400 rounded-full"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                                <div className="flex justify-between text-xs font-black uppercase text-slate-500 mb-2">
                                    <span>Tilstand</span>
                                    <span className="text-emerald-400">{caravan.durability}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400 opacity-50 w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        {/* Tabs */}
                        <div className="flex gap-8 p-8 pb-0 border-b border-slate-800">
                            {(['CARGO', 'UPGRADES', 'TRAVEL'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setSelectedTab(tab)}
                                    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${selectedTab === tab
                                        ? 'text-white border-b-2 border-amber-400'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {tab === 'CARGO' ? 'Last' : tab === 'UPGRADES' ? 'Utrustning' : 'Vegval'}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {selectedTab === 'CARGO' && (
                                    <motion.div
                                        key="cargo"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Inventory to Caravan */}
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Ditt Lager</h3>
                                                <div className="space-y-2">
                                                    {Object.entries(player.resources).map(([res, amt]) => {
                                                        if (res === 'gold' || (amt as number) <= 0) return null;
                                                        const details = (RESOURCE_DETAILS as any)[res];
                                                        return (
                                                            <div key={res} className="flex items-center justify-between p-3 bg-slate-950/20 rounded-xl border border-slate-800/30">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xl">{ACTION_ICONS[res.toUpperCase()] || '📦'}</span>
                                                                    <span className="text-xs font-bold text-white uppercase">{details?.label || res} ({amt})</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleLoad(res as ResourceType)}
                                                                    className="px-3 py-1 bg-amber-400 text-slate-950 text-[10px] font-black uppercase rounded-lg hover:bg-amber-300"
                                                                >
                                                                    Last
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Caravan to Inventory */}
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Karavane-Lass</h3>
                                                <div className="space-y-2">
                                                    {Object.entries(caravan.inventory).map(([res, amt]) => {
                                                        if ((amt as number) <= 0) return null;
                                                        const details = (RESOURCE_DETAILS as any)[res];
                                                        return (
                                                            <div key={res} className="flex items-center justify-between p-3 bg-slate-950/20 rounded-xl border border-amber-400/20">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xl">{ACTION_ICONS[res.toUpperCase()] || '📦'}</span>
                                                                    <span className="text-xs font-bold text-white uppercase">{details?.label || res} ({amt})</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUnload(res as ResourceType)}
                                                                    className="px-3 py-1 bg-slate-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-slate-700"
                                                                >
                                                                    Loss
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {Object.values(caravan.inventory).every(v => !v || v <= 0) && (
                                                        <div className="text-center py-8 text-slate-600 italic text-xs uppercase font-bold">Tom vogn</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {selectedTab === 'UPGRADES' && (
                                    <motion.div
                                        key="upgrades"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-8"
                                    >
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Neste Nivå</h3>
                                            {(() => {
                                                const next = GAME_BALANCE.CARAVAN.LEVELS.find(l => l.level === caravan.level + 1);
                                                if (!next) return <p className="text-xs text-emerald-400 font-bold uppercase italic">Maks nivå nådd!</p>;
                                                return (
                                                    <div className="p-6 bg-slate-950/30 rounded-3xl border border-slate-800 flex justify-between items-center">
                                                        <div>
                                                            <h4 className="text-white font-black uppercase italic text-lg">{next.name}</h4>
                                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                                                                Kapasitet: {next.capacity} • Fart: {next.speed}x
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUpgrade('LEVEL')}
                                                            className="px-6 py-3 bg-white text-slate-950 font-black uppercase italic rounded-2xl hover:scale-105 transition-transform"
                                                        >
                                                            Kjøp for {next.cost}g
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Moduler</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(GAME_BALANCE.CARAVAN.UPGRADES).map(([key, up]: [string, any]) => {
                                                    const owned = (caravan.upgrades || []).includes(up.id);
                                                    return (
                                                        <div key={key} className={`p-4 bg-slate-950/30 rounded-2xl border ${owned ? 'border-emerald-500/30' : 'border-slate-800'}`}>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="text-white font-black text-xs uppercase">{up.name}</h4>
                                                                {owned && <span className="text-[8px] font-black text-emerald-400 border border-emerald-400/50 px-2 py-0.5 rounded-full uppercase">Kjøpt</span>}
                                                            </div>
                                                            <p className="text-slate-500 text-[10px] font-bold uppercase mb-4 h-8">{up.benefit}</p>
                                                            {!owned && (
                                                                <button
                                                                    onClick={() => handleUpgrade('MODULE', key.toLowerCase())}
                                                                    className="w-full py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-xl hover:bg-slate-700"
                                                                >
                                                                    Kjøp for {up.cost}g
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {selectedTab === 'TRAVEL' && (
                                    <motion.div
                                        key="travel"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-amber-400/10 p-4 border border-amber-400/20 rounded-2xl">
                                            <p className="text-xs text-amber-200 font-bold uppercase flex items-center gap-2">
                                                <span>🗺️</span> Reisen krever 20⚡ Stamina og 1🍞 Brød-niste.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {(['region_ost', 'region_vest', 'capital'] as const).map(reg => {
                                                if (reg === player.regionId) return null;
                                                const regName = reg === 'capital' ? 'Hovedstaden' : (reg === 'region_vest' ? 'Vestfjella' : 'Østlandet');
                                                const isTarget = reg === preselectedTarget;
                                                return (
                                                    <button
                                                        key={reg}
                                                        onClick={() => handleTravel(reg)}
                                                        className={`group p-6 rounded-3xl border transition-all text-left flex justify-between items-center ${isTarget
                                                                ? 'bg-indigo-600/20 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]'
                                                                : 'bg-slate-950/40 border-slate-800 hover:border-amber-400'
                                                            }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h4 className={`font-black uppercase italic text-xl transition-colors ${isTarget ? 'text-indigo-300' : 'text-white group-hover:text-amber-400'}`}>{regName}</h4>
                                                                {isTarget && <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase animate-pulse">Destinasjon</span>}
                                                            </div>
                                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Legg ut på veg til {regName}</p>
                                                        </div>
                                                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                            ➔
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
