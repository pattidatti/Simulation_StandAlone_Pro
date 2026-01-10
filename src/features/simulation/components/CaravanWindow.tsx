import React, { useState } from 'react';
import { CaravanSVG } from './CaravanSVG';
import { GAME_BALANCE, ACTION_ICONS, RESOURCE_DETAILS } from '../constants';
import type { SimulationPlayer, ResourceType } from '../simulationTypes';
import { motion, AnimatePresence } from 'framer-motion';

import { CaravanCosmeticsShop } from './CaravanCosmeticsShop';

interface CaravanWindowProps {
    player: SimulationPlayer;
    onAction: (action: any) => void;
    onClose: () => void;
    preselectedTarget?: string;
}

export const CaravanWindow: React.FC<CaravanWindowProps> = ({ player, onAction, onClose, preselectedTarget }) => {
    const [selectedTab, setSelectedTab] = useState<'CARGO' | 'UPGRADES' | 'STYLE' | 'TRAVEL'>(() => {
        return (sessionStorage.getItem('caravan_tab') as any) || (preselectedTarget ? 'TRAVEL' : 'CARGO');
    });

    React.useEffect(() => {
        sessionStorage.setItem('caravan_tab', selectedTab);
    }, [selectedTab]);
    const caravan = React.useMemo(() => {
        const raw = (player.caravan || {}) as any;
        return {
            level: raw.level || 1,
            inventory: (raw.inventory || {}) as Record<string, number>,
            durability: raw.durability ?? 100,
            upgrades: (raw.upgrades || []) as string[],
            customization: raw.customization
        };
    }, [player.caravan]);

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

    const handleRepair = () => {
        onAction({ type: 'REPAIR_CARAVAN' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
            <div className="relative w-full max-w-5xl h-[750px] bg-[#0B0F19] rounded-[2rem] overflow-hidden flex shadow-2xl border border-white/5">

                {/* --- LEFT PANEL: THE SHOWROOM --- */}
                <div className="w-[38%] relative flex flex-col pointer-events-none">
                    {/* Background Environment */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-[#05080f]">
                        {/* Spotlight */}
                        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[80%] bg-blue-500/10 blur-[100px] rounded-full" />
                        <div className="absolute bottom-[0%] right-[0%] w-[80%] h-[60%] bg-amber-500/5 blur-[80px] rounded-full" />
                    </div>

                    {/* Stats HUD (Floating) */}
                    <div className="relative z-10 px-8 pt-8 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg">
                                    Karavane
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-black uppercase rounded">
                                        Nivå {caravan.level}
                                    </span>
                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                        {levelConfig.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bars Container */}
                        <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm pointer-events-auto">
                            {/* Capacity */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <span>Lastkapasitet</span>
                                    <span className={currentCargoAmount >= capacity ? 'text-rose-400' : 'text-white'}>
                                        {currentCargoAmount} / {capacity}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(currentCargoAmount / capacity) * 100}%` }}
                                        className="h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                    />
                                </div>
                            </div>

                            {/* Durability */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <span>Tilstand</span>
                                    <span className={caravan.durability < levelConfig.durability * 0.3 ? 'text-rose-500' : 'text-emerald-400'}>
                                        {Math.round(caravan.durability)} / {levelConfig.durability}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(caravan.durability / levelConfig.durability) * 100}%` }}
                                        className={`h-full shadow-[0_0_10px_rgba(16,185,129,0.5)] ${caravan.durability < levelConfig.durability * 0.3 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    />
                                </div>
                            </div>

                            {/* Repair Button */}
                            {caravan.durability < levelConfig.durability && (
                                <button
                                    onClick={handleRepair}
                                    className="w-full mt-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span>🔧 Reparer</span>
                                    <span className="opacity-50 group-hover:opacity-100">
                                        ({Math.round((levelConfig.durability - (caravan.durability || 0)) * 2)}g)
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* The Hero Visualization */}
                    <div className="flex-1 flex items-center justify-center relative translate-y-[-20px] pointer-events-auto">
                        <CaravanSVG
                            level={caravan.level}
                            upgrades={caravan.upgrades}
                            customization={player.caravan?.customization}
                            resolvedHorseSkin={player.horseCustomization?.skinId}
                            className="w-full max-w-[340px] drop-shadow-[0_50px_60px_rgba(0,0,0,0.6)] z-10"
                        />
                        {/* Ground Reflection/Shadow */}
                        <div className="absolute bottom-[20%] w-[60%] h-[20px] bg-black/40 blur-xl rounded-[100%]" />
                    </div>
                </div>

                {/* --- RIGHT PANEL: THE WORKSHOP --- */}
                <div className="flex-1 flex flex-col bg-[#111624] border-l border-white/5 relative z-20">
                    {/* Header Controls */}
                    <div className="h-20 flex items-center justify-between px-8 border-b border-white/5">
                        {/* Tab Navigation */}
                        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                            {(['CARGO', 'UPGRADES', 'STYLE', 'TRAVEL'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setSelectedTab(tab)}
                                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selectedTab === tab
                                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab === 'CARGO' ? 'Last' : tab === 'UPGRADES' ? 'Outfitter' : tab === 'STYLE' ? 'Style' : 'Reise'}
                                </button>
                            ))}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center text-slate-400 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden relative">
                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-8">
                            <AnimatePresence mode="wait">
                                {/* CARGO TAB */}
                                {selectedTab === 'CARGO' && (
                                    <motion.div
                                        key="cargo"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Inventory to Caravan */}
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <span>Ditt Lager</span>
                                                    <div className="h-px bg-slate-800 flex-1" />
                                                </h3>
                                                <div className="space-y-2">
                                                    {Object.entries(player.resources).map(([res, amt]) => {
                                                        if (res === 'gold' || (amt as number) <= 0) return null;
                                                        const details = (RESOURCE_DETAILS as any)[res];
                                                        return (
                                                            <div key={res} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5 hover:border-amber-400/30 transition-colors group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg shadow-inner">
                                                                        {ACTION_ICONS[res.toUpperCase()] || '📦'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs font-bold text-white uppercase group-hover:text-amber-400 transition-colors">{details?.label || res}</div>
                                                                        <div className="text-[10px] text-slate-500 font-bold">Antall: {amt}</div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleLoad(res as ResourceType)}
                                                                    className="px-3 py-1.5 bg-slate-800 text-white hover:bg-amber-400 hover:text-black text-[10px] font-black uppercase rounded-lg transition-all"
                                                                >
                                                                    ➔
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Caravan to Inventory */}
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <span>Karavane-Lass</span>
                                                    <div className="h-px bg-slate-800 flex-1" />
                                                </h3>
                                                <div className="space-y-2">
                                                    {Object.entries(caravan.inventory).map(([res, amt]) => {
                                                        if ((amt as number) <= 0) return null;
                                                        const details = (RESOURCE_DETAILS as any)[res];
                                                        return (
                                                            <div key={res} className="flex items-center justify-between p-3 bg-amber-400/5 rounded-xl border border-amber-400/20 hover:bg-amber-400/10 transition-colors group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-lg border border-amber-400/20">
                                                                        {ACTION_ICONS[res.toUpperCase()] || '📦'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs font-bold text-amber-200 uppercase">{details?.label || res}</div>
                                                                        <div className="text-[10px] text-amber-400/60 font-bold">Lastet: {amt}</div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUnload(res as ResourceType)}
                                                                    className="px-3 py-1.5 bg-slate-900 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 text-[10px] font-black uppercase rounded-lg transition-all"
                                                                >
                                                                    Loss
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {Object.values(caravan.inventory).every(v => !v || v <= 0) && (
                                                        <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                                                            <div className="text-center">
                                                                <div className="text-2xl opacity-20 mb-1">📦</div>
                                                                <div className="text-slate-600 text-[10px] font-bold uppercase">Tomt Lasterom</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* UPGRADES TAB */}
                                {selectedTab === 'UPGRADES' && (
                                    <motion.div
                                        key="upgrades"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neste Nivå</h3>
                                            {(() => {
                                                const next = GAME_BALANCE.CARAVAN.LEVELS.find(l => l.level === caravan.level + 1);
                                                if (!next) return <p className="text-xs text-emerald-400 font-bold uppercase italic bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">Maks nivå nådd!</p>;
                                                return (
                                                    <div className="p-6 bg-gradient-to-br from-indigo-900/20 to-slate-900/50 rounded-2xl border border-indigo-500/30 flex justify-between items-center group hover:border-indigo-400/50 transition-colors">
                                                        <div className="flex gap-4 items-center">
                                                            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-2xl border border-indigo-500/30">
                                                                🚀
                                                            </div>
                                                            <div>
                                                                <h4 className="text-white font-black uppercase italic text-lg group-hover:text-indigo-300 transition-colors">{next.name}</h4>
                                                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                                    Kapasitet: <span className="text-indigo-400">{next.capacity}</span> • Fart: <span className="text-indigo-400">{next.speed}x</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUpgrade('LEVEL')}
                                                            className="px-6 py-3 bg-white text-slate-950 font-black uppercase italic rounded-xl hover:bg-indigo-400 hover:scale-105 transition-all shadow-lg shadow-indigo-900/20"
                                                        >
                                                            Kjøp {next.cost}g
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spesialmoduler</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(GAME_BALANCE.CARAVAN.UPGRADES).map(([key, up]: [string, any]) => {
                                                    const owned = (caravan.upgrades || []).includes(up.id);
                                                    return (
                                                        <div key={key} className={`p-5 rounded-2xl border transition-all ${owned
                                                            ? 'bg-emerald-900/10 border-emerald-500/20'
                                                            : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                                                            }`}>
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${owned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                                                        ⚡
                                                                    </div>
                                                                    <h4 className={`font-black text-xs uppercase ${owned ? 'text-emerald-400' : 'text-white'}`}>{up.name}</h4>
                                                                </div>
                                                                {owned && <span className="text-[9px] font-black text-emerald-950 bg-emerald-400 px-2 py-0.5 rounded uppercase">Eies</span>}
                                                            </div>
                                                            <p className="text-slate-500 text-[10px] font-bold uppercase leading-relaxed mb-4 h-8">{up.benefit}</p>
                                                            {!owned && (
                                                                <button
                                                                    onClick={() => handleUpgrade('MODULE', key.toLowerCase())}
                                                                    className="w-full py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors"
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

                                {/* STYLE TAB */}
                                {selectedTab === 'STYLE' && (
                                    <motion.div
                                        key="style"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="h-full -m-8" // Negative margin to fill padding
                                    >
                                        <CaravanCosmeticsShop
                                            player={player}
                                            onBuy={(id) => onAction({ type: 'BUY_CARAVAN_COSMETIC', cosmeticId: id })}
                                            onEquip={(id) => onAction({ type: 'EQUIP_CARAVAN_COSMETIC', cosmeticId: id })}
                                        />
                                    </motion.div>
                                )}

                                {/* TRAVEL TAB */}
                                {selectedTab === 'TRAVEL' && (
                                    <motion.div
                                        key="travel"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-amber-400/10 p-4 border border-amber-400/20 rounded-xl">
                                            <p className="text-[10px] text-amber-200 font-bold uppercase flex items-center gap-2">
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
                                                        className={`group p-6 rounded-2xl border transition-all text-left flex justify-between items-center ${isTarget
                                                            ? 'bg-indigo-600/20 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]'
                                                            : 'bg-slate-900/40 border-white/5 hover:border-amber-400/50 hover:bg-amber-400/5'
                                                            }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h4 className={`font-black uppercase italic text-xl transition-colors ${isTarget ? 'text-indigo-300' : 'text-white group-hover:text-amber-400'}`}>{regName}</h4>
                                                                {isTarget && <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase animate-pulse">Destinasjon</span>}
                                                            </div>
                                                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 group-hover:text-slate-400">Klikk for å starte reisen</p>
                                                        </div>
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${isTarget ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-amber-400 group-hover:text-black'}`}>
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
