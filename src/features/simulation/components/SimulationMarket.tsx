import React from 'react';
import type { SimulationPlayer } from '../simulationTypes';
import { RESOURCE_DETAILS, INITIAL_MARKET } from '../constants';
import { useSimulation } from '../SimulationContext';
import { GameButton } from '../ui/GameButton';
import { ResourceIcon } from '../ui/ResourceIcon';
import { Badge } from '../ui/Badge';
import { ShoppingBag, Ship } from 'lucide-react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { handleCareerChange } from '../globalActions';
import { GAME_BALANCE } from '../data/gameBalance';
import { SimulationRoleWarningModal } from './SimulationRoleWarningModal';

interface SimulationMarketProps {
    player: SimulationPlayer;
    market: any;
    regions?: Record<string, any>;
    allMarkets?: Record<string, any>;
    onAction: (action: any) => void;
    pin: string;
}

export const SimulationMarket: React.FC<SimulationMarketProps> = React.memo(({ player, market, regions, allMarkets, onAction, pin }) => {

    const { actionLoading, setActiveTab } = useSimulation();
    const [isWarningOpen, setIsWarningOpen] = React.useState(false);

    // Dynamic Title based on region
    const regionName = player.regionId === 'capital'
        ? 'Hovedstaden'
        : regions?.[player.regionId]?.name || player.regionId;

    return (
        <SimulationMapWindow
            title={`Marked ${regionName}`}
            subtitle="Handel & Handelsruter"
            icon={<ShoppingBag className="w-8 h-8" />}
            onClose={() => setActiveTab('MAP')}
            headerRight={
                <div className="flex items-center gap-3 bg-black/40 px-5 py-2 rounded-xl border border-game-gold/30 shadow-inner mr-4">
                    <span className="text-xs font-black text-game-stone_light uppercase tracking-wider">Saldo:</span>
                    <ResourceIcon resource="gold" amount={player.resources?.gold} size="sm" />
                </div>
            }
            maxWidth="max-w-7xl"
        >
            <div className="space-y-3">
                {/* MERCHANT CAREER PUSH */}
                {player.role === 'PEASANT' && (
                    <div className="bg-gradient-to-r from-emerald-950/40 via-blue-950/40 to-indigo-950/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between gap-6 relative overflow-hidden group shadow-lg">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-900/60 rounded-lg flex items-center justify-center border border-emerald-500/30">
                                <span className="text-xl">📜</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1">Handelslisens</h3>
                                <p className="text-emerald-100/60 text-[9px] font-medium uppercase tracking-widest">Nasjonale handelsruter</p>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[9px]">
                                Lvl {GAME_BALANCE.CAREERS.MERCHANT.LEVEL_REQ} + {GAME_BALANCE.CAREERS.MERCHANT.COST}g
                            </Badge>
                            <GameButton
                                variant="primary"
                                onClick={() => setIsWarningOpen(true)}
                                disabled={player.resources?.gold < GAME_BALANCE.CAREERS.MERCHANT.COST || (player.stats.level || 1) < GAME_BALANCE.CAREERS.MERCHANT.LEVEL_REQ || !!actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-500 border-emerald-400/50 px-4 h-8 text-[9px]"
                            >
                                AKTIVER
                            </GameButton>
                        </div>
                    </div>
                )}

                {/* THE EXCHANGE BOARD */}
                <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                    {/* TABLE HEADERS - Optimized grid distribution to avoid overlaps */}
                    <div className="grid grid-cols-12 gap-1 px-6 py-2 border-b border-white/10 bg-white/[0.03]">
                        <div className="col-span-4 text-[10px] font-black text-game-stone_light uppercase tracking-[0.2em]">Ressurs</div>
                        <div className="col-span-1 text-[10px] font-black text-game-stone_light uppercase tracking-[0.2em] text-center">Pris</div>
                        <div className="col-span-1 text-[10px] font-black text-game-stone_light uppercase tracking-[0.2em] text-center">Lager</div>
                        <div className="col-span-1 text-[10px] font-black text-game-stone_light uppercase tracking-[0.2em] text-center">Eier</div>
                        <div className="col-span-5 text-[10px] font-black text-game-stone_light uppercase tracking-[0.2em] text-right pr-4">Kontroller</div>
                    </div>

                    <div className="divide-y divide-white/10">
                        {Array.from(new Set([
                            ...Object.keys(INITIAL_MARKET),
                            ...Object.keys(market || {})
                        ]))
                            .filter(key => !['iron', 'swords', 'armor'].includes(key))
                            .map((resId) => {
                                const item = (market || {})[resId] || (INITIAL_MARKET as any)[resId];
                                if (!item) return null;

                                const details = (RESOURCE_DETAILS as any)[resId] || { label: resId, icon: '📦' };
                                const price = item.price || 0;
                                const stock = item.stock || 0;
                                const playerStock = (player.resources as any)?.[resId] || 0;

                                // Per-item local state
                                const [qty, setQty] = React.useState(1);

                                const maxBuy = Math.min(stock, Math.floor((player.resources?.gold || 0) / price));
                                const maxSell = playerStock;

                                const updateQty = (val: number) => {
                                    setQty(Math.max(1, isNaN(val) ? 1 : val));
                                };

                                const totalVal = (price * qty).toFixed(1);

                                return (
                                    <div key={resId} className="grid grid-cols-12 gap-1 px-6 py-1.5 items-center group hover:bg-white/[0.02] transition-colors relative">
                                        {/* RESOURCE IDENTITY - col-span-4 to avoid overlap */}
                                        <div className="col-span-4 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-white/5 group-hover:scale-105 transition-transform duration-500">
                                                {details.icon}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="text-white font-black uppercase text-xl truncate tracking-tight leading-none">{details.label}</h4>
                                            </div>
                                        </div>

                                        {/* PRICE COLUMN */}
                                        <div className="col-span-1 flex flex-col items-center">
                                            <div className="text-lg font-black text-game-gold tabular-nums tracking-tight">
                                                {price.toFixed(1)}g
                                            </div>
                                        </div>

                                        {/* MARKET DEPTH (STOCK) - No bar, just number */}
                                        <div className="col-span-1 flex flex-col items-center">
                                            <span className={`text-xl font-black tabular-nums tracking-tighter ${stock > 0 ? 'text-white' : 'text-rose-500/50'}`}>
                                                {stock.toLocaleString()}
                                            </span>
                                        </div>

                                        {/* PLAYER OWNERSHIP */}
                                        <div className="col-span-1 flex flex-col items-center">
                                            <span className={`text-xl font-black tabular-nums tracking-tighter ${playerStock > 0 ? 'text-white border-b border-game-gold/50' : 'text-white/10'}`}>
                                                {playerStock.toLocaleString()}
                                            </span>
                                        </div>

                                        {/* TRADE CONSOLE - Horizontal and compressed */}
                                        <div className="col-span-5 flex items-center justify-end gap-2 p-1 pl-4 bg-black/20 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors h-12">
                                            {/* Quantity Engine */}
                                            <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-1 py-0.5">
                                                <button onClick={() => updateQty(qty - 1)} className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white font-bold" type="button">−</button>
                                                <input
                                                    type="number"
                                                    value={qty}
                                                    onChange={(e) => updateQty(parseInt(e.target.value))}
                                                    className="w-14 bg-transparent text-center font-black text-game-gold border-none outline-none focus:ring-0 tabular-nums text-sm p-0"
                                                />
                                                <button onClick={() => updateQty(qty + 1)} className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white font-bold" type="button">+</button>
                                            </div>

                                            {/* Quick Actions - Scaled UP text */}
                                            <div className="flex gap-1">
                                                <button onClick={() => updateQty(qty + 10)} className="px-2 h-7 text-xs font-black bg-white/5 border border-white/10 rounded uppercase hover:bg-white/10 transition-colors" type="button">+10</button>
                                                <button onClick={() => updateQty(Math.max(maxBuy, maxSell, 1))} className="px-2 h-7 text-xs font-black bg-game-gold/10 border border-game-gold/30 text-game-gold rounded uppercase hover:bg-game-gold/30 transition-colors" type="button">Max</button>
                                            </div>

                                            <div className="w-px h-5 bg-white/10 mx-0.5" />

                                            {/* Final Actions */}
                                            <div className="flex gap-1 flex-1 max-w-[150px]">
                                                <GameButton
                                                    variant="primary"
                                                    onClick={() => onAction({ type: 'BUY', resource: resId, amount: qty })}
                                                    disabled={(player.resources?.gold || 0) < (price * qty) || stock < qty || !!actionLoading}
                                                    className="flex-1 py-0 h-8 font-black text-[10px] tracking-widest"
                                                >
                                                    KJØP
                                                </GameButton>
                                                <GameButton
                                                    variant="wood"
                                                    onClick={() => onAction({ type: 'SELL', resource: resId, amount: qty })}
                                                    disabled={playerStock < qty || !!actionLoading}
                                                    className="flex-1 py-0 h-8 font-black text-[10px] tracking-widest"
                                                >
                                                    SELG
                                                </GameButton>
                                            </div>
                                        </div>

                                        {/* DYNAMIC TOTAL OVERLAY - Very compact */}
                                        {qty > 1 && (
                                            <div className="absolute right-6 -top-1 animate-in fade-in slide-in-from-top-1 duration-300 pointer-events-none">
                                                <div className="bg-game-gold text-black px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight shadow-sm">
                                                    {totalVal}g
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* MERCHANT: FOREIGN TRADE NETWORK */}
                {player.role === 'MERCHANT' && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-500/5 rounded-lg w-fit">
                            <Ship className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-tighter">Handelsnettverk</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {Object.values(regions || {})
                                .concat([{ id: 'capital', name: 'Kongeriket' } as any])
                                .filter((r: any) => r.id !== player.regionId && r.id !== undefined)
                                .map((region: any) => {
                                    const targetMarket = allMarkets?.[region.id];
                                    if (!targetMarket) return null;

                                    return (
                                        <div key={region.id} className="bg-slate-900/40 border border-white/5 rounded-xl p-3 backdrop-blur-md hover:border-blue-500/30 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-black text-white uppercase tracking-tight truncate">{region.name}</h4>
                                            </div>
                                            <div className="space-y-1.5">
                                                {['grain', 'wood', 'iron_ore', 'iron_ingot', 'siege_sword', 'siege_armor'].map(res => {
                                                    const item = (targetMarket as any)[res];
                                                    if (!item) return null;
                                                    const foreignPrice = item.price;
                                                    const details = (RESOURCE_DETAILS as any)[res] || { label: res, icon: '📦' };

                                                    return (
                                                        <div key={res} className="flex justify-between items-center bg-black/40 p-1.5 rounded-lg border border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">{details.icon}</span>
                                                                <span className="text-[9px] font-black text-white uppercase truncate max-w-[40px]">{details.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-game-gold font-black text-[10px]">{foreignPrice.toFixed(0)}g</span>
                                                                <div className="flex gap-0.5">
                                                                    <button
                                                                        onClick={() => onAction({ type: 'TRADE_ROUTE', targetRegionId: region.id, resource: res, action: 'IMPORT' })}
                                                                        disabled={!!actionLoading}
                                                                        className="px-1 py-0.5 bg-emerald-600/20 text-emerald-400 text-[8px] font-black rounded"
                                                                    >
                                                                        I
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onAction({ type: 'TRADE_ROUTE', targetRegionId: region.id, resource: res, action: 'EXPORT' })}
                                                                        disabled={!!actionLoading}
                                                                        className="px-1 py-0.5 bg-rose-600/20 text-rose-400 text-[8px] font-black rounded"
                                                                    >
                                                                        E
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            <SimulationRoleWarningModal
                isOpen={isWarningOpen}
                onClose={() => setIsWarningOpen(false)}
                onConfirm={() => {
                    handleCareerChange(pin, player.id, 'MERCHANT');
                    setIsWarningOpen(false);
                }}
                roleName="Kjøpmann"
            />
        </SimulationMapWindow>
    );
});

SimulationMarket.displayName = 'SimulationMarket';
