import React from 'react';
import type { SimulationPlayer } from '../simulationTypes';
import { RESOURCE_DETAILS, INITIAL_MARKET } from '../constants';
import { useSimulation } from '../SimulationContext';
import { GameButton } from '../ui/GameButton';
import { ResourceIcon } from '../ui/ResourceIcon';
import { Badge } from '../ui/Badge';
import { ShoppingBag } from 'lucide-react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { handleCareerChange } from '../globalActions';
import { GAME_BALANCE } from '../data/gameBalance';
import { SimulationRoleWarningModal } from './SimulationRoleWarningModal';
import { MercantileDashboard } from './MercantileDashboard';
import { calculateBulkPrice, getDynamicPrice } from '../logic/handlers/MarketHandlers';

interface SimulationMarketProps {
    player: SimulationPlayer;
    market: any;
    regions?: Record<string, any>;
    allMarkets?: Record<string, any>;
    onAction: (action: any) => void;
    pin: string;
}

export const SimulationMarket: React.FC<SimulationMarketProps> = React.memo(({ player, market, regions, onAction, pin }) => {

    const { actionLoading, setActiveTab, viewingRegionId } = useSimulation();
    const [isWarningOpen, setIsWarningOpen] = React.useState(false);

    // MERCHANTS: Use specialized Dashboard
    if (player.role === 'MERCHANT') {
        return (
            <MercantileDashboard
                player={player}
                market={market || {}}
                onAction={onAction}
                onClose={() => setActiveTab('MAP')}
                viewingRegionId={viewingRegionId || player.regionId}
                pin={pin}
            />
        );
    }

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

                {/* THE EXCHANGE BOARD - Overflow handling for narrow viewports */}
                <div className="bg-black/20 border border-white/10 rounded-2xl overflow-x-auto backdrop-blur-md shadow-2xl">
                    <div className="min-w-[800px]"> {/* Ensure minimum width to prevent grid collapse */}
                        {/* TABLE HEADERS - Expanded grid distribution to avoid overlaps */}
                        <div className="grid grid-cols-12 gap-1 px-6 py-3 border-b border-white/10 bg-white/[0.03]">
                            <div className="col-span-3 text-xs font-black text-game-stone_light uppercase tracking-[0.2em]">Ressurs</div>
                            <div className="col-span-1 text-xs font-black text-game-stone_light uppercase tracking-[0.2em] text-center">Pris</div>
                            <div className="col-span-1 text-xs font-black text-game-stone_light uppercase tracking-[0.2em] text-center">Lager</div>
                            <div className="col-span-1 text-xs font-black text-game-stone_light uppercase tracking-[0.2em] text-center">Eier</div>
                            <div className="col-span-6 text-xs font-black text-game-stone_light uppercase tracking-[0.2em] text-right pr-4">Kontroller</div>
                        </div>

                        <div className="divide-y divide-white/10">
                            {Array.from(new Set([
                                ...Object.keys(INITIAL_MARKET),
                                ...Object.keys(market || {})
                            ]))
                                .filter(key => !['iron', 'swords', 'armor'].includes(key))
                                .map((resId) => {
                                    const item = (market || {})[resId] || (INITIAL_MARKET as any)[resId];
                                    const details = (RESOURCE_DETAILS as any)[resId];
                                    if (!item || !details) return null;
                                    const stock = item.stock || 0;
                                    const playerStock = (player.resources as any)?.[resId] || 0;

                                    // Per-item local state
                                    const [qty, setQty] = React.useState(1);

                                    // Dynamic Price Logic
                                    const currentUnitPrice = getDynamicPrice(item);
                                    const totalCost = calculateBulkPrice(item, qty, true);
                                    const totalGain = calculateBulkPrice(item, qty, false);

                                    // High-Slippage Detection (15%+)
                                    const isHighBuySlippage = totalCost > currentUnitPrice * qty * 1.15;
                                    const isHighSellSlippage = totalGain < (currentUnitPrice * (GAME_BALANCE.MARKET.SELL_RATIO || 0.8)) * qty * 0.85;

                                    // Sentiment Colors (Avant-Garde HSL)
                                    let priceColor = 'text-game-gold'; // Default
                                    if (item.basePrice) {
                                        if (currentUnitPrice < item.basePrice * 0.8) priceColor = 'text-[hsl(150,60%,55%)]'; // Bullish Green
                                        if (currentUnitPrice > item.basePrice * 1.5) priceColor = 'text-[hsl(355,75%,60%)]'; // Bearish Red
                                    }

                                    const maxBuy = Math.min(stock, Math.floor((player.resources?.gold || 0) / currentUnitPrice));
                                    const maxSell = playerStock;

                                    const updateQty = (val: number) => {
                                        setQty(Math.max(1, isNaN(val) ? 1 : val));
                                    };


                                    return (
                                        <div key={resId} className="grid grid-cols-12 gap-1 px-6 py-2 items-center group hover:bg-white/[0.02] transition-colors relative">
                                            {/* RESOURCE IDENTITY - col-span-3 to reclaim space */}
                                            <div className="col-span-3 flex items-center gap-4">
                                                <div className="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center text-4xl shadow-inner border border-white/5 group-hover:scale-105 transition-transform duration-500">
                                                    {details.icon}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="text-white font-black uppercase text-2xl truncate tracking-tight leading-none group-hover:text-game-gold transition-colors">{details.label}</h4>
                                                </div>
                                            </div>

                                            {/* PRICE COLUMN */}
                                            <div className="col-span-1 flex flex-col items-center">
                                                <div className={`text-xl font-black tabular-nums tracking-tight transition-all duration-700 ease-[cubic-bezier(0.17,0.89,0.32,1.49)] ${priceColor}`}>
                                                    {currentUnitPrice.toFixed(1)}g
                                                </div>
                                            </div>

                                            {/* MARKET DEPTH (STOCK) - With Liquidity Bar */}
                                            <div className="col-span-1 flex flex-col items-center relative group">
                                                <span className={`text-xl font-black tabular-nums tracking-tighter z-10 ${stock > 0 ? 'text-white' : 'text-rose-500/50'}`}>
                                                    {stock.toLocaleString()}
                                                </span>
                                                {item.baseStock && (
                                                    <div className="absolute inset-x-2 bottom-0 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-game-gold/30 transition-all duration-700"
                                                            style={{ width: `${Math.min(100, (stock / item.baseStock) * 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* PLAYER OWNERSHIP */}
                                            <div className="col-span-1 flex flex-col items-center">
                                                <span className={`text-xl font-black tabular-nums tracking-tighter ${playerStock > 0 ? 'text-white border-b border-game-gold/50' : 'text-white/40'}`}>
                                                    {playerStock.toLocaleString()}
                                                </span>
                                            </div>

                                            {/* TRADE CONSOLE - Expanded to col-span-6 */}
                                            <div className="col-span-6 flex items-center justify-end gap-3 p-1 pl-4 bg-black/20 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors h-14">
                                                {/* Quantity Engine - Glassmorphism Polish */}
                                                <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1">
                                                    <button onClick={() => updateQty(qty - 1)} className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 rounded font-bold transition-colors" type="button">−</button>
                                                    <input
                                                        type="number"
                                                        value={qty}
                                                        onChange={(e) => updateQty(parseInt(e.target.value))}
                                                        className="w-16 bg-transparent text-center font-black text-game-gold border-none outline-none focus:ring-0 tabular-nums text-base p-0"
                                                    />
                                                    <button onClick={() => updateQty(qty + 1)} className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 rounded font-bold transition-colors" type="button">+</button>
                                                </div>

                                                {/* Quick Actions */}
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => updateQty(qty + 10)} className="px-3 h-8 text-xs font-black bg-white/5 border border-white/10 rounded uppercase hover:bg-white/15 transition-colors whitespace-nowrap" type="button">+10</button>
                                                    <button onClick={() => updateQty(Math.max(maxBuy, maxSell, 1))} className="px-3 h-8 text-xs font-black bg-game-gold/10 border border-game-gold/30 text-game-gold rounded uppercase hover:bg-game-gold/30 transition-colors whitespace-nowrap" type="button">Max</button>
                                                </div>

                                                <div className="w-px h-5 bg-white/10 mx-0.5" />

                                                {/* Final Actions */}
                                                <div className="flex gap-2 flex-1 max-w-[200px]">
                                                    <GameButton
                                                        variant="primary"
                                                        onClick={() => {
                                                            import('../logic/AudioManager').then(({ audioManager }) => audioManager.playSfx('coin'));
                                                            onAction({ type: 'BUY', resource: resId, amount: qty });
                                                        }}
                                                        disabled={(player.resources?.gold || 0) < totalCost || stock < qty || !!actionLoading}
                                                        className={`flex-1 py-0 h-10 font-black text-[11px] whitespace-nowrap tracking-tight transition-all duration-300 ${isHighBuySlippage ? 'ring-2 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : ''}`}
                                                    >
                                                        KJØP | {totalCost.toFixed(1)}g
                                                    </GameButton>
                                                    <GameButton
                                                        variant="wood"
                                                        onClick={() => {
                                                            import('../logic/AudioManager').then(({ audioManager }) => audioManager.playSfx('coin'));
                                                            onAction({ type: 'SELL', resource: resId, amount: qty });
                                                        }}
                                                        disabled={playerStock < qty || !!actionLoading}
                                                        className={`flex-1 py-0 h-10 font-black text-[11px] whitespace-nowrap tracking-tight transition-all duration-300 ${isHighSellSlippage ? 'ring-2 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : ''}`}
                                                    >
                                                        SELG | {totalGain.toFixed(1)}g
                                                    </GameButton>
                                                </div>
                                            </div>

                                        </div>
                                    );
                                })}
                        </div>
                    </div>


                </div>

                <SimulationRoleWarningModal
                    isOpen={isWarningOpen}
                    onClose={() => setIsWarningOpen(false)}
                    onConfirm={() => {
                        handleCareerChange(pin, player.id, 'MERCHANT');
                        setIsWarningOpen(false);
                    }}
                    roleId="MERCHANT"
                    cost={`${GAME_BALANCE.CAREERS.MERCHANT.COST}g`}
                />
            </div>
        </SimulationMapWindow>
    );
});

SimulationMarket.displayName = 'SimulationMarket';
