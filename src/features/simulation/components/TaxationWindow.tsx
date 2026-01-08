import React, { useState } from 'react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { GameButton } from '../ui/GameButton';
import { Scale, AlertTriangle, TrendingUp, History as HistoryIcon, User, Coins, Info, ShieldCheck } from 'lucide-react';
import type { SimulationPlayer, SimulationRoom } from '../simulationTypes';

interface TaxationWindowProps {
    player: SimulationPlayer;
    room: SimulationRoom;
    onAction: (action: any) => void;
    onClose: () => void;
}

/**
 * TaxationWindow - ULTRATHINK DASHBOARD
 * - Barons: Focused, symmetrical, and extremely premium centered dashboard.
 * - King: High-density global oversight dashboard.
 * - Zero-jitter, high-contrast, avant-garde aesthetics.
 */
export const TaxationWindow: React.FC<TaxationWindowProps> = ({ player, room, onAction, onClose }) => {
    const isKing = player.role === 'KING';
    const myRegionId = (player.regionId || '').trim().toLowerCase();
    const regionName = player.regionId || 'Riket';

    if (!room || !room.world) return null;

    const { world, regions } = room;
    const region = isKing ? null : regions?.[player.regionId || ''];
    const lastCollection = isKing ? world.lastRoyalTaxCollection : region?.lastTaxCollection;
    const isLocked = lastCollection && lastCollection.year === world.year && lastCollection.season === world.season;
    const historyList = isKing ? ((world as any).royalTaxHistory || []) : (region?.taxHistory || []);

    const [sliderValue, setSliderValue] = useState(isKing ? (room.world?.taxRateDetails?.kingTax || 20) : (room.regions?.[player.regionId || '']?.taxRate || 10));
    const [view, setView] = useState<'ADJUST' | 'HISTORY'>('ADJUST');
    const [showDebug, setShowDebug] = useState(false);

    // DATA CALCULATION
    const { estimates, citizenList } = React.useMemo(() => {
        let rawGold = 0;
        let rawGrain = 0;
        let citizens: any[] = [];
        const taxFactor = sliderValue / 100;

        const players = Object.values(room.players || {});
        players.forEach((p: any) => {
            if (!p || p.id === player.id) return;
            const pReg = (p.regionId || '').trim().toLowerCase();
            const isMatch = isKing ? p.role === 'BARON' : (p.role === 'PEASANT' && (pReg === myRegionId || pReg.includes(myRegionId)));

            if (isMatch) {
                const gold = Number(
                    p.resources?.gold ??
                    p.gold ??
                    p.wealth ??
                    p.stats?.gold ??
                    (p.inventory?.find((i: any) => i.id === 'gold')?.amount) ??
                    0
                );
                const grain = Number(p.resources?.grain ?? 0);

                rawGold += (gold * taxFactor);
                rawGrain += (grain * taxFactor);

                citizens.push({
                    id: p.id,
                    name: p.name,
                    gold,
                    grain,
                    role: p.role,
                    hasResources: !!p.resources,
                    raw: p
                });
            }
        });

        return {
            estimates: {
                gold: Math.floor(rawGold),
                grain: Math.floor(rawGrain),
                count: citizens.length,
                penalty: Math.max(0, Math.floor((sliderValue - 10) / 1.5))
            },
            citizenList: citizens.sort((a, b) => b.gold - a.gold)
        };
    }, [sliderValue, room.players, isKing, myRegionId, player.id]);

    const handleTaxAction = () => {
        onAction({ type: isKing ? 'TAX_ROYAL' : 'TAX', taxRate: sliderValue });
        onClose();
    };

    return (
        <SimulationMapWindow
            title={isKing ? "STATSKASSEN" : `SKATT: ${regionName.toUpperCase()}`}
            icon={<Scale size={18} className="text-game-gold" />}
            onClose={onClose}
        >
            <div className={`p-4 sm:p-6 lg:p-10 flex flex-col gap-8 w-full ${isKing ? 'max-w-6xl' : 'max-w-3xl'} mx-auto transition-all ${isLocked ? 'grayscale-[0.5] opacity-90' : ''}`}>

                {/* NAVIGATION */}
                <nav className="flex bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-2xl p-1.5 max-w-sm mx-auto w-full shadow-2xl relative z-20">
                    <button
                        onClick={() => setView('ADJUST')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${view === 'ADJUST' ? 'bg-white text-black shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <TrendingUp size={14} /> Justering
                    </button>
                    <button
                        onClick={() => setView('HISTORY')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${view === 'HISTORY' ? 'bg-white text-black shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <HistoryIcon size={14} /> Historikk
                    </button>
                </nav>

                {view === 'ADJUST' ? (
                    <div className={`grid grid-cols-1 ${isKing ? 'lg:grid-cols-12' : 'gap-6'} items-start animate-in fade-in zoom-in-95 duration-700`}>

                        {/* THE MASTER CONTROL (Always Featured) */}
                        <div className={isKing ? 'lg:col-span-4 space-y-6' : 'space-y-6'}>

                            {/* HERO CARD */}
                            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 rounded-[3rem] p-8 lg:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden group">
                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-game-gold/5 blur-[80px] rounded-full group-hover:bg-game-gold/10 transition-colors" />

                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-game-gold/10 flex items-center justify-center text-game-gold border border-game-gold/20">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-game-gold/60 uppercase tracking-[0.3em] block mb-1">Innkrevingsnivå</span>
                                            <div className="flex items-baseline gap-3">
                                                <h2 className="text-7xl font-black text-white italic tracking-tighter leading-none">{sliderValue}%</h2>
                                                <div className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-lg ${estimates.penalty > 15 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                                    {estimates.penalty === 0 ? 'Optimalt' : `-${estimates.penalty} Lojalitet`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {isKing && (
                                        <button onClick={() => setShowDebug(!showDebug)} className="p-2.5 hover:bg-white/5 rounded-full transition-all group/info">
                                            <Info size={18} className={showDebug ? 'text-game-gold' : 'text-slate-700 group-hover/info:text-slate-400'} />
                                        </button>
                                    )}
                                </div>

                                <div className="relative h-20 flex items-center mb-6 relative z-10 px-2">
                                    <div className="absolute h-2 w-full bg-slate-800/50 rounded-full" />
                                    <div
                                        className="absolute h-2 bg-gradient-to-r from-game-gold via-orange-500 to-red-600 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                                        style={{ width: `${(sliderValue / 50) * 100}%` }}
                                    />
                                    <input
                                        type="range" min="0" max="50" step="1"
                                        value={sliderValue}
                                        onChange={(e) => setSliderValue(parseInt(e.target.value))}
                                        disabled={isLocked}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                    />
                                    <div
                                        className="absolute w-12 h-12 bg-white border-[6px] border-game-gold rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all pointer-events-none flex items-center justify-center scale-110"
                                        style={{ left: `calc(${(sliderValue / 50) * 100}% - 24px)` }}
                                    >
                                        <div className="w-2.5 h-2.5 bg-game-gold rounded-full" />
                                    </div>
                                </div>

                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.25em] px-2">
                                    <span className="text-slate-600">Skånsel</span>
                                    <span className="text-slate-400">Rettferd</span>
                                    <span className="text-red-900/80 shadow-red-500/10">Tyranni</span>
                                </div>
                            </div>

                            {/* BARON'S COMPACT STATS GRID */}
                            <div className={`grid ${isKing ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'} gap-4`}>
                                <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 p-5 rounded-3xl flex items-center gap-4 transition-all hover:bg-slate-900 hover:border-white/10 group min-h-[90px]">
                                    <div className="p-3 bg-game-gold/10 text-game-gold rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><Coins size={22} /></div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">Gull</p>
                                        <p className="text-2xl font-black text-white italic tracking-tighter truncate leading-none mt-1">{estimates.gold}g</p>
                                    </div>
                                </div>
                                <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 p-5 rounded-3xl flex items-center gap-4 transition-all hover:bg-slate-900 hover:border-white/10 group min-h-[90px]">
                                    <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><TrendingUp size={22} /></div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">Korn</p>
                                        <p className="text-2xl font-black text-white italic tracking-tighter truncate leading-none mt-1">{estimates.grain}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 p-5 rounded-3xl flex items-center gap-4 transition-all hover:bg-slate-800 hover:border-white/10 group min-h-[90px]">
                                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform shadow-inner"><User size={22} /></div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">{isKing ? 'Baroner' : 'Borgere'}</p>
                                        <p className="text-2xl font-black text-white italic tracking-tighter leading-none mt-1">{estimates.count}</p>
                                    </div>
                                </div>
                            </div>

                            {/* THE COMMAND BUTTON */}
                            <GameButton
                                variant={isLocked ? "ghost" : "primary"}
                                onClick={handleTaxAction}
                                disabled={isLocked || sliderValue === 0 || estimates.count === 0}
                                className="w-full py-8 text-2xl font-black italic uppercase rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(37,99,235,0.6)] active:scale-95 transition-all h-24"
                            >
                                {isLocked ? "Du har skattlagt, vent til neste årstid" : `EKSEKVER SKATT`}
                            </GameButton>
                        </div>

                        {/* KING'S GLOBAL DASHBOARD (Subject Grid) */}
                        {isKing && (
                            <div className="lg:col-span-8 h-full">
                                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] overflow-hidden flex flex-col shadow-inner h-full min-h-[600px]">
                                    <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-black/40">
                                        <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Vasaller & Rikdom</h4>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-game-gold/10 rounded-full border border-game-gold/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-game-gold animate-pulse" />
                                            <span className="text-[10px] font-black uppercase text-game-gold tracking-widest">{citizenList.length}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                        {citizenList.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center opacity-10 italic text-center py-20">
                                                <User size={64} className="mb-6" />
                                                <p className="text-xl font-black uppercase tracking-[0.4em]">Ingen vasaller funnet</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {citizenList.map((c) => (
                                                    <div key={c.id} className="group flex items-center justify-between p-6 bg-slate-900 border border-white/[0.03] rounded-[2rem] hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-default">
                                                        <div className="flex items-center gap-5 min-w-0">
                                                            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 border border-white/5 group-hover:bg-game-gold/10 group-hover:text-game-gold transition-all duration-300">
                                                                <User size={22} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-base font-black text-white truncate leading-tight group-hover:tracking-wide transition-all">{c.name}</span>
                                                                <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest mt-1.5">{c.role}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-4 flex-shrink-0">
                                                            <p className="text-2xl font-black italic tracking-tighter text-white group-hover:text-game-gold transition-colors">{Math.floor(c.gold)}g</p>
                                                            <div className="w-24 h-1.5 bg-white/[0.03] rounded-full mt-2.5 overflow-hidden border border-white/[0.02]">
                                                                <div className="h-full bg-game-gold/30 shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all duration-700" style={{ width: `${Math.min(100, (c.gold / 500) * 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[3rem] overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700 max-w-4xl mx-auto w-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
                        <table className="w-full text-base text-left">
                            <thead className="bg-black/40 text-[11px] text-game-gold font-black uppercase tracking-[0.25em] border-b border-white/5">
                                <tr>
                                    <th className="px-10 py-8">Tidsepoke</th>
                                    <th className="px-10 py-8 text-right">Sats</th>
                                    <th className="px-10 py-8 text-right">Gull</th>
                                    <th className="px-10 py-8 text-right">Korn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-bold">
                                {(historyList.length === 0) ? (
                                    <tr><td colSpan={4} className="py-40 text-center opacity-10 font-black uppercase tracking-widest text-3xl">Portalens historie er tom</td></tr>
                                ) : (
                                    ([...historyList] as any[]).reverse().map((h, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-all group">
                                            <td className="px-10 py-7 text-slate-400 group-hover:text-white transition-colors">År {h.year}, <span className="font-black italic text-indigo-400 uppercase tracking-widest ml-3">{h.season.toUpperCase()}</span></td>
                                            <td className="px-10 py-7 text-right font-black italic text-slate-500 group-hover:text-game-gold transition-colors">{h.rate}%</td>
                                            <td className="px-10 py-7 text-right font-black italic text-game-gold text-2xl whitespace-nowrap">{h.amountGold}g</td>
                                            <td className="px-10 py-7 text-right font-black italic text-orange-400 text-2xl whitespace-nowrap">{h.amountGrain || 0}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {showDebug && isKing && (
                    <div className="p-8 bg-black/60 backdrop-blur-2xl border border-red-500/20 rounded-[2.5rem] mt-6 animate-in slide-in-from-top-6 max-w-lg mx-auto w-full shadow-2xl">
                        <div className="flex items-center gap-4 mb-5 border-b border-red-500/10 pb-4">
                            <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle size={20} /></div>
                            <p className="text-[12px] font-black text-red-400 uppercase tracking-[0.3em]">Systemisk Diagnose</p>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 space-y-2">
                            <div className="flex justify-between border-b border-white/[0.02] pb-1"><span>Region ID:</span> <span className="text-white font-bold">{myRegionId}</span></div>
                            <div className="flex justify-between border-b border-white/[0.02] pb-1"><span>Active Entities:</span> <span className="text-white font-bold">{Object.keys(room.players).length}</span></div>
                            <div className="flex justify-between"><span>Match Success:</span> <span className="text-emerald-500 font-bold">{citizenList.length > 0 ? 'YES' : 'NO'}</span></div>
                        </div>
                    </div>
                )}
            </div>
        </SimulationMapWindow>
    );
};
