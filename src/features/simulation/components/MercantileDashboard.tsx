import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SimulationPlayer } from '../simulationTypes';
import { RESOURCE_DETAILS } from '../data/resources';
import { ACTION_ICONS, GAME_BALANCE } from '../constants';
import { simulationDb as db } from '../simulationFirebase';
import { ref, update } from 'firebase/database';
import { getDynamicPrice, calculateBulkPrice } from '../logic/handlers/MarketHandlers';
import { MarketItem } from '../types/world';


interface MercantileDashboardProps {
    player: SimulationPlayer;
    market: Record<string, { price: number; stock: number }>;
    onAction: (action: any) => void;
    onClose: () => void;
    viewingRegionId?: string;
    pin: string;
}

export const MercantileDashboard: React.FC<MercantileDashboardProps> = ({ player, market, onAction, onClose, viewingRegionId, pin }) => {
    const isRemote = viewingRegionId && viewingRegionId !== player.regionId;
    const [selectedResource, setSelectedResource] = useState<string | null>(null);
    const [transactionMode, setTransactionMode] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState(1);
    const [targetStorage, setTargetStorage] = useState<'BACKPACK' | 'CARAVAN'>('CARAVAN');
    const [autoSwitchFlash, setAutoSwitchFlash] = useState<string | null>(null);

    const caravan = player.caravan || { level: 1, inventory: {}, durability: 100, upgrades: [] };
    const levelConfig = GAME_BALANCE.CARAVAN.LEVELS.find(l => l.level === caravan.level) || GAME_BALANCE.CARAVAN.LEVELS[0];
    const currentLoad = Object.values(caravan.inventory).reduce((a, b) => a + (b || 0), 0);
    const maxCapacity = levelConfig.capacity;

    const resourceInfo = selectedResource ? RESOURCE_DETAILS[selectedResource] : null;
    const isCommodity = resourceInfo?.isCommodity;

    const marketItem = selectedResource ? market[selectedResource] : null;

    // SCARCITY-BASED PRICING LOGIC
    const totalCost = marketItem && quantity > 0 ? calculateBulkPrice(marketItem as unknown as MarketItem, quantity, transactionMode === 'BUY') : 0;

    // Lazy Initialization for Legacy Players
    React.useEffect(() => {
        if (!player.homeRegionId && pin) {
            // Self-heal: If homeRegionId is missing, assume current region is home (lock-in)
            const playerRef = ref(db, `simulation_rooms/${pin}/players/${player.id}`);
            // We use 'update' from firebase/database to persist this change
            update(playerRef, { homeRegionId: player.regionId }).catch(console.error);
        }
    }, [player.homeRegionId, player.id, player.regionId, pin]);

    // Derived State for Market Restrictions
    const homeRegion = player.homeRegionId || player.regionId; // Fallback to current if missing (Lazy Init logic in-memory)
    const currentMarketRegion = viewingRegionId || player.regionId;
    const isForeignMarket = currentMarketRegion !== homeRegion;

    // Smart Purchasing Logic: Auto-target storage based on item type
    React.useEffect(() => {
        if (selectedResource) {
            // CONSTRAINT: If foreign market, ALWAYS Caravan.
            if (isForeignMarket) {
                if (targetStorage !== 'CARAVAN') {
                    setTargetStorage('CARAVAN');
                    // No flash needed if forced, or maybe a red flash?
                }
                return;
            }

            const desired = isCommodity ? 'CARAVAN' : 'BACKPACK';
            if (targetStorage !== desired) {
                setTargetStorage(desired);
                setAutoSwitchFlash(desired);
                setTimeout(() => setAutoSwitchFlash(null), 600);
            }
        }
    }, [selectedResource, isCommodity, isForeignMarket]);  // Intentionally excludes targetStorage to avoid loops

    const handleTransaction = () => {
        if (!selectedResource) return;

        if (transactionMode === 'BUY') {
            if (player.resources.gold < totalCost) return;
            onAction({
                type: 'MARKET_BUY',
                resource: selectedResource,
                amount: quantity,
                target: targetStorage
            });
        } else {
            onAction({
                type: 'MARKET_SELL',
                resource: selectedResource,
                amount: quantity,
                source: targetStorage
            });
        }
    };

    // Logistics Handlers
    const handleLoad = (res: string, amount: number = 1) => {
        onAction({ type: 'LOAD_CARAVAN', resource: res, amount });
    };

    const handleUnload = (res: string, amount: number = 1) => {
        onAction({ type: 'UNLOAD_CARAVAN', resource: res, amount });
    };

    const handleLoadAllCommodities = () => {
        Object.entries(player.resources).forEach(([res, amt]) => {
            if (amt && amt > 0 && RESOURCE_DETAILS[res]?.isCommodity) {
                onAction({ type: 'LOAD_CARAVAN', resource: res, amount: amt });
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-7xl h-[85vh] bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="h-20 bg-slate-950 px-8 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-2xl border border-amber-500/20">
                            ⚖️
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Handelskammeret</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Grossist-oversikt</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="px-6 py-2 bg-slate-900 rounded-lg border border-slate-800">
                            <span className="text-slate-400 text-xs font-bold uppercase mr-2">Din Formue:</span>
                            <span className="text-amber-400 font-black text-lg">
                                {Number(player.resources.gold).toLocaleString('nb-NO', { maximumFractionDigits: 2 })} gull
                            </span>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center">✕</button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">

                    {/* Left Column: The Market */}
                    <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/50">
                        <div className="p-6 border-b border-slate-800 bg-slate-950/20">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Markedstilbud</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                            {Object.entries(market).map(([res, data]) => {
                                const info = RESOURCE_DETAILS[res];
                                if (!info) return null;
                                const isSelected = selectedResource === res;

                                return (
                                    <button
                                        key={res}
                                        onClick={() => { setSelectedResource(res); setQuantity(1); }}
                                        className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between group ${isSelected
                                            ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                                            : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-3xl filter drop-shadow-lg">{ACTION_ICONS[res.toUpperCase()] || info.icon}</div>
                                            <div className="text-left">
                                                <div className="text-white font-bold uppercase text-sm group-hover:text-amber-300 transition-colors">{info.label}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {info.isCommodity && <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">Vare</span>}
                                                    <span className="text-[10px] text-slate-500">Lager: {data.stock}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-black text-lg transition-all duration-700 ease-[cubic-bezier(0.17,0.89,0.32,1.49)] ${(() => {
                                                const currentItemPrice = getDynamicPrice(data as unknown as MarketItem);
                                                const basePrice = (data as any).basePrice;
                                                if (!basePrice) return 'text-amber-400';
                                                const ratio = currentItemPrice / basePrice;
                                                if (ratio < 0.8) return 'text-[hsl(150,60%,55%)]'; // Bullish Green
                                                if (ratio > 1.5) return 'text-[hsl(355,75%,60%)]'; // Bearish Red
                                                return 'text-amber-400';
                                            })()}`}>
                                                {Number(getDynamicPrice(data as unknown as MarketItem)).toLocaleString('nb-NO', { maximumFractionDigits: 2 })}g
                                            </div>
                                            <div className="text-[10px] text-emerald-500/50 font-bold uppercase tracking-wider">pr. stk</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Middle Column: Transaction Desk */}
                    <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-950 relative">
                        {/* Background detail */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center text-9xl">⚖️</div>

                        {selectedResource ? (
                            <div className="flex-1 flex flex-col p-8 relative z-10">
                                <div className="flex-1 flex flex-col items-center justify-center space-y-8">

                                    {/* Item Preview */}
                                    <div className="text-center space-y-2">
                                        <motion.div
                                            key={selectedResource}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-8xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                        >
                                            {RESOURCE_DETAILS[selectedResource].icon}
                                        </motion.div>
                                        <h3 className="text-3xl font-black text-white italic uppercase">{RESOURCE_DETAILS[selectedResource].label}</h3>
                                        {isCommodity ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-xs font-bold uppercase">
                                                <span>📦</span> Tung Handelsvare
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-xs font-bold uppercase">
                                                <span>🎒</span> Forbruksvare
                                            </div>
                                        )}
                                    </div>

                                    {/* REMOTE VIEW: Travel Button */}
                                    {isRemote ? (
                                        <div className="flex-1 w-full flex flex-col items-center justify-center space-y-6 animate-in slide-in-from-bottom-4">
                                            <div className="text-center space-y-2">
                                                <h4 className="text-amber-500 font-bold uppercase tracking-widest text-xs">Dette markedet er langt unna</h4>
                                                <p className="text-slate-400 text-sm max-w-[200px] mx-auto">Du må reise hit med karavanen for å handle varer.</p>
                                            </div>
                                            <button
                                                onClick={() => onAction({ type: 'OPEN_CARAVAN', targetRegionId: viewingRegionId })}
                                                className="w-full max-w-xs py-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 transition-all active:scale-95 flex flex-col items-center group"
                                            >
                                                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🐴</span>
                                                Reis Hit
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Buy/Sell Toggle */}
                                            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full max-w-xs">
                                                {(['BUY', 'SELL'] as const).map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setTransactionMode(mode)}
                                                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${transactionMode === mode
                                                            ? (mode === 'BUY' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-rose-600 text-white shadow-lg')
                                                            : 'text-slate-500 hover:text-slate-300'
                                                            }`}
                                                    >
                                                        {mode === 'BUY' ? 'Kjøp' : 'Selg'}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Storage Routing */}
                                            <div className="w-full max-w-xs space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                                                        {transactionMode === 'BUY' ? 'Leveres til:' : 'Hentes fra:'}
                                                    </label>
                                                    {isForeignMarket && (
                                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-wide flex items-center gap-1 animate-pulse">
                                                            ⚠️ Fremmed Marked
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => !isForeignMarket && setTargetStorage('BACKPACK')}
                                                        disabled={isForeignMarket}
                                                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${targetStorage === 'BACKPACK'
                                                            ? 'bg-slate-800 border-white/20 ring-2 ring-white/10'
                                                            : 'bg-slate-900/50 border-slate-800 text-slate-600'
                                                            } ${autoSwitchFlash === 'BACKPACK' ? 'ring-4 ring-emerald-500/50 scale-[1.02]' : ''} 
                                                            ${isForeignMarket ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                                                    >
                                                        <div className="text-xl mb-1">🎒</div>
                                                        <div className="text-[10px] font-black uppercase">Sekk</div>
                                                        {autoSwitchFlash === 'BACKPACK' && <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />}
                                                    </button>

                                                    <button
                                                        onClick={() => setTargetStorage('CARAVAN')}
                                                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${targetStorage === 'CARAVAN'
                                                            ? 'bg-amber-900/40 border-amber-500/50 ring-2 ring-amber-500/20'
                                                            : 'bg-slate-900/50 border-slate-800 text-slate-600'
                                                            } ${autoSwitchFlash === 'CARAVAN' ? 'ring-4 ring-amber-500/50 scale-[1.02]' : ''}`}
                                                    >
                                                        <div className="text-xl mb-1">🛒</div>
                                                        <div className="text-[10px] font-black uppercase text-amber-500">Vogn</div>
                                                        {autoSwitchFlash === 'CARAVAN' && <div className="absolute inset-0 bg-amber-500/20 animate-pulse" />}
                                                    </button>
                                                </div>
                                                {isForeignMarket && (
                                                    <p className="text-[9px] text-amber-500/80 text-center font-medium leading-tight px-2">
                                                        Handel fra ryggsekk er kun tillatt i din hjemregion.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Slider / Calculation */}
                                            <div className="w-full max-w-xs p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs font-bold text-slate-400">Antall</span>
                                                    <input
                                                        type="number"
                                                        value={quantity}
                                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg py-1 px-2 text-right text-white font-bold"
                                                    />
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="100"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                                    className="w-full accent-amber-500"
                                                />
                                                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Totalsum</span>
                                                    <span className={`text-xl font-black transition-all duration-500 ease-[cubic-bezier(0.17,0.89,0.32,1.49)] ${player.resources.gold < totalCost && transactionMode === 'BUY' ? 'text-rose-500' : 'text-white'}`}>
                                                        {Number(totalCost).toLocaleString('nb-NO', { maximumFractionDigits: 2 })}g
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={handleTransaction}
                                                disabled={transactionMode === 'BUY' && player.resources.gold < totalCost}
                                                className={`w-full max-w-xs py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${transactionMode === 'BUY'
                                                    ? (player.resources.gold < totalCost ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400')
                                                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                                    }`}
                                            >
                                                {transactionMode === 'BUY' ? 'Bekreft Kjøp' : 'Bekreft Salg'}
                                            </button>
                                        </>
                                    )}

                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
                                <div className="text-6xl opacity-20">🛒</div>
                                <p className="text-xs font-bold uppercase tracking-widest">Velg en vare fra markedet</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Inventory Overview */}
                    <div className="w-1/3 flex flex-col bg-slate-900/50">
                        <div className="p-6 border-b border-slate-800 bg-slate-950/20">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Dine Lager</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                            {/* CARAVAN SECTION */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-amber-500 uppercase flex items-center gap-2">
                                        🛒 Karavane (Lvl {caravan.level})
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onAction({ type: 'OPEN_CARAVAN' })}
                                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded border border-slate-700 transition-colors uppercase font-bold"
                                        >
                                            Åpne
                                        </button>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${currentLoad >= maxCapacity ? 'text-rose-400' : 'text-slate-500'}`}>
                                            {currentLoad} / {maxCapacity}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-2 min-h-[100px]">
                                    {Object.entries(caravan.inventory).length === 0 && <p className="text-[10px] text-slate-700 font-bold uppercase text-center mt-8">Tomt lasterom</p>}
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.entries(caravan.inventory).map(([res, amt]) => (
                                            (amt && amt > 0 && RESOURCE_DETAILS[res]) ? (
                                                <div key={res} className="relative group bg-slate-900 p-2 rounded-lg border border-slate-800 flex flex-col items-center gap-1 hover:border-slate-600 transition-colors" title={RESOURCE_DETAILS[res]?.label}>
                                                    <span className="text-lg">{RESOURCE_DETAILS[res]?.icon}</span>
                                                    <span className="text-[10px] font-bold text-amber-400">{amt}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); !isForeignMarket && handleUnload(res); }}
                                                        disabled={isForeignMarket}
                                                        className={`absolute -top-1 -right-1 w-5 h-5 ${isForeignMarket ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-rose-500'} rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10`}
                                                        title={isForeignMarket ? "Kun tillatt i hjemregion" : "Last av (til ryggsekk)"}
                                                    >
                                                        ⬇️
                                                    </button>
                                                </div>
                                            ) : null
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* BACKPACK SECTION */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-emerald-500 uppercase flex items-center gap-2">
                                        🎒 Ryggsekk
                                    </h3>
                                    <button
                                        onClick={!isForeignMarket ? handleLoadAllCommodities : undefined}
                                        disabled={isForeignMarket}
                                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${isForeignMarket
                                            ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                                            : 'text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 hover:text-slate-900'}`}
                                        title={isForeignMarket ? "Kun tillatt i hjemregion" : "Flytt alle handelsvarer til vognen"}
                                    >
                                        <span>📦</span> Last Alt
                                    </button>
                                </div>
                                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-2">
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.entries(player.resources).map(([res, amt]) => (
                                            (amt && amt > 0 && res !== 'gold' && RESOURCE_DETAILS[res]) ? (
                                                <div key={res} className="relative group bg-slate-900 p-2 rounded-lg border border-slate-800 flex flex-col items-center gap-1 hover:border-slate-600 transition-colors" title={RESOURCE_DETAILS[res]?.label}>
                                                    <span className="text-lg">{RESOURCE_DETAILS[res]?.icon}</span>
                                                    <span className="text-[10px] font-bold text-slate-300">{amt}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleLoad(res); }}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-amber-400"
                                                        title="Last på vogn"
                                                    >

                                                        ⬆️
                                                    </button>
                                                </div>
                                            ) : null
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* TRAVEL SECTION */}
                            <div className="space-y-4 pt-4 border-t border-slate-800 opacity-75 hover:opacity-100 transition-opacity">
                                <h3 className="text-xs font-black text-indigo-400 uppercase flex items-center gap-2">
                                    🗺️ Vegvalg
                                </h3>
                                <div className="space-y-2">
                                    {(['region_ost', 'region_vest', 'capital'] as const).map(reg => {
                                        if (reg === player.regionId) return null;
                                        const regName = reg === 'capital' ? 'Hovedstaden' : (reg === 'region_vest' ? 'Vestfjella' : 'Østlandet');
                                        return (
                                            <button
                                                key={reg}
                                                onClick={() => {
                                                    onAction({ type: 'TRAVEL_START', targetRegionId: reg });
                                                    onClose();
                                                }}
                                                className="w-full p-3 bg-indigo-900/10 hover:bg-indigo-900/30 border border-indigo-500/20 hover:border-indigo-400/50 rounded-xl flex items-center justify-between group transition-all"
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Reis til</span>
                                                    <span className="text-sm font-black text-white italic">{regName}</span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                    ➔
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
