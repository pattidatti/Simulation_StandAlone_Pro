import React from 'react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import type { SimulationPlayer, SimulationRoom } from '../simulationTypes';
import { Utensils, Bed, Crown, Coffee, Info, ChevronRight } from 'lucide-react';

interface TavernWindowProps {
    player: SimulationPlayer;
    room: SimulationRoom;
    onAction: (action: any) => void;
    onClose: () => void;
}

export const TavernWindow: React.FC<TavernWindowProps> = ({ player, room, onAction, onClose }) => {

    // --- DYNAMIC PRICING CALCULATION (Client-Side Preview) ---
    // Note: This duplicates logic from SocialRestHandlers.ts. 
    // Ideally, this should be a shared utility or passed from backend state.
    // For now, we replicate it to show the user accurate prices before they click.

    const metadata = room.metadata || {};
    const now = Date.now();
    const lastRest = metadata.lastTavernRest || now;
    // 5 mins = 300,000 ms decay interval
    const intervalsPassed = (now - lastRest) / 300000;

    let currentDemand = metadata.tavernDemand || 1.0;
    if (intervalsPassed > 0) {
        currentDemand = Math.max(1.0, currentDemand - (intervalsPassed * 0.05));
    }

    const getPrice = (base: number) => Math.ceil(base * currentDemand);

    // Get Bread Price
    const marketKey = player.regionId || 'capital';
    const market = room.markets?.[marketKey] || room.market;
    const breadPrice = (market as any)?.bread?.price || 5;
    const mealPrice = Math.ceil(breadPrice * 1.2);


    return (
        <SimulationMapWindow
            title="Vertshuset: Den Glade Gris"
            subtitle="Mat & Losji"
            icon={<Utensils className="text-amber-400" />}
            onClose={onClose}
            maxWidth="max-w-4xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* COLUMN 1: FOOD & DRINK */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                            <Coffee size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Mat & Drikke</h3>
                    </div>

                    {/* Meal Item */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-lg text-amber-100">Dagens Husmannskost</h4>
                                <p className="text-xs text-amber-400/60 uppercase tracking-widest font-bold mt-1">
                                    Markedspris + Servering
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-amber-400">{mealPrice}g</div>
                                <div className="text-[10px] text-slate-400">oppr. {breadPrice.toFixed(1)}g</div>
                            </div>
                        </div>

                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                            En varm tallerken med brød, litt kjøttrester og dagens suppe. Ikke noe fancy, men det metter.
                        </p>

                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mb-5">
                            <div className="flex items-center gap-1.5 bg-slate-950/50 px-2.5 py-1 rounded-md border border-white/5">
                                <span className="text-emerald-400">⚡</span>
                                <span>+10 Stamina</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                onAction({ type: 'BUY_MEAL', locationId: 'tavern_bar' });
                            }}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-900/20"
                        >
                            <span>Kjøp Måltid</span>
                        </button>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm text-blue-200">
                        <Info className="shrink-0 mt-0.5" size={16} />
                        <p>
                            Prisene justeres automatisk basert på råvarepriser i markedet.
                        </p>
                    </div>
                </div>


                {/* COLUMN 2: ACCOMMODATION */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Bed size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Overnatting</h3>
                        {currentDemand > 1.1 && (
                            <span className="ml-auto text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                HØY ETTERSPØRSEL (x{currentDemand.toFixed(2)})
                            </span>
                        )}
                    </div>

                    {/* Tier 1: Basic */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-indigo-500/30 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-slate-200">Sovesal (Hengekøye)</h4>
                            <span className="font-bold text-amber-400">{getPrice(150)}g</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                            <span className="text-emerald-400 font-bold">+30 Stamina</span>
                            <span>•</span>
                            <span>Ingen buffs</span>
                        </div>
                        <button
                            onClick={() => onAction({ type: 'REST_BASIC', locationId: 'tavern_bar' })}
                            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors"
                        >
                            Lei Køye
                        </button>
                    </div>

                    {/* Tier 2: Comfy */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 border border-indigo-500/30 rounded-2xl p-4 hover:border-indigo-400/50 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 group-hover:scale-110 transition-transform">
                            <Bed size={64} />
                        </div>

                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-indigo-200">Komfortabelt Rom</h4>
                                <span className="font-bold text-amber-400">{getPrice(500)}g</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-3">
                                <span className="text-emerald-400 font-bold">+80 Stamina</span>
                                <span className="text-rose-400 font-bold">+10 HP</span>
                                <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                                    Buff: Utvilt
                                </span>
                            </div>
                            <button
                                onClick={() => onAction({ type: 'REST_COMFY', locationId: 'tavern_bar' })}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
                            >
                                Lei Rom
                            </button>
                        </div>
                    </div>

                    {/* Tier 3: Royal */}
                    <div className="bg-gradient-to-br from-amber-900/20 to-slate-900/40 border border-amber-500/30 rounded-2xl p-4 hover:border-amber-400/50 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 group-hover:scale-110 transition-transform">
                            <Crown size={64} />
                        </div>

                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-amber-200">Kongesuite</h4>
                                <span className="font-bold text-amber-400">{getPrice(1500)}g</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-3">
                                <span className="text-emerald-400 font-bold">FULL Stamina</span>
                                <span className="text-rose-400 font-bold">+50 HP</span>
                                <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    Buff: Luksusliv
                                </span>
                            </div>
                            <button
                                onClick={() => onAction({ type: 'REST_ROYAL', locationId: 'tavern_bar' })}
                                className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-amber-900/20"
                            >
                                Lei Suite
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </SimulationMapWindow>
    );
};
