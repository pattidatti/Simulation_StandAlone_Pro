import React, { useState, useMemo } from 'react';
import { CARAVAN_COSMETICS } from '../logic/handlers/CaravanHandlers';

import type { SimulationPlayer } from '../simulationTypes';
import { motion, AnimatePresence } from 'framer-motion';

interface CaravanCosmeticsShopProps {
    player: SimulationPlayer;
    onBuy: (id: string) => void;
    onEquip: (id: string) => void;
}

const CATEGORIES = [
    { id: 'CHASSIS', label: 'Vogn', icon: '🛒' },
    { id: 'WHEELS', label: 'Hjul', icon: '⚙️' },
    { id: 'COVER', label: 'Kalesje', icon: '⛺' },
    { id: 'LANTERNS', label: 'Lykter', icon: '🏮' },
    { id: 'SKIN', label: 'Trekkdyr', icon: '🐂' },
    { id: 'FLAG', label: 'Flagg', icon: '🏴' },
    { id: 'COMPANION', label: 'Passasjer', icon: '🐶' },
    { id: 'TRAIL', label: 'Spor', icon: '✨' },
    { id: 'DECOR', label: 'Dekor', icon: '💐' },
];

export const CaravanCosmeticsShop: React.FC<CaravanCosmeticsShopProps> = ({ player, onBuy, onEquip }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>(() => sessionStorage.getItem('caravan_shop_cat') || 'CHASSIS');

    React.useEffect(() => {
        sessionStorage.setItem('caravan_shop_cat', selectedCategory);
    }, [selectedCategory]);


    const unlocked = player.caravan?.customization?.unlocked || [];
    const current = player.caravan?.customization || {} as any;

    const items = useMemo(() => {
        return Object.values(CARAVAN_COSMETICS).filter(c => c.category === selectedCategory);
    }, [selectedCategory]);

    const handleBuyClick = (item: typeof CARAVAN_COSMETICS[string]) => {
        if ((player.resources.gold || 0) < item.cost) return;
        if (item.reqLevel && (player.caravan?.level || 1) < item.reqLevel) return;
        onBuy(item.id);
    };

    return (
        <div className="flex h-full p-8 pt-0 gap-8">
            {/* Category Navigation Rail */}
            <div className="w-20 pt-4 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-8">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`relative group flex flex-col items-center justify-center p-3 rounded-xl transition-all ${selectedCategory === cat.id
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                            : 'bg-slate-900 border border-white/5 text-slate-500 hover:text-white hover:border-white/10'
                            }`}
                    >
                        <span className="text-2xl mb-1 filter drop-shadow-sm">{cat.icon}</span>
                        <span className="text-[8px] uppercase font-black tracking-widest opacity-80">{cat.label}</span>

                        {/* Active Indicator */}
                        {selectedCategory === cat.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Item Grid */}
            <div className="flex-1 pt-4 pb-8 overflow-y-auto no-scrollbar">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={selectedCategory}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {items.map(item => {
                            const isUnlocked = unlocked.includes(item.id);
                            const isEquipped = Object.values(current).includes(item.id);
                            const canAfford = (player.resources.gold || 0) >= item.cost;
                            const levelOk = (player.caravan?.level || 1) >= (item.reqLevel || 0);

                            // Special Linked Horse Logic
                            const isLinkedHorse = item.id === 'skin_horse_linked';
                            const hasLinkedHorse = player.horseCustomization?.skinId;

                            let disabledReason = '';
                            if (!isUnlocked) {
                                if (!levelOk) disabledReason = `Krever Nivå ${item.reqLevel}`;
                                else if (!canAfford) disabledReason = 'Ikke nok gull';
                            }
                            if (isLinkedHorse && !hasLinkedHorse) {
                                disabledReason = 'Krever hest i stall';
                            }

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`relative p-1 rounded-2xl transition-all group overflow-hidden ${isEquipped
                                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                                        : 'bg-slate-800'
                                        }`}
                                >
                                    <div className="bg-[#0B0F19] rounded-xl h-full p-4 flex flex-col gap-4 relative z-10">

                                        {/* Tag / Status */}
                                        <div className="flex justify-between items-start">
                                            {isEquipped ? (
                                                <span className="bg-amber-400/10 text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-400/20">Utstyrt</span>
                                            ) : isUnlocked ? (
                                                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20">Eies</span>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                                                    <span className="text-[10px] text-amber-400">💰</span>
                                                    <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide">{item.cost}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex items-center gap-4">
                                            {/* Icon Placeholder (Better than nothing) */}
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-slate-900 border border-white/5 ${isEquipped ? 'shadow-[0_0_15px_rgba(251,191,36,0.1)]' : ''}`}>
                                                {/* Using category icon as fallback for item preview for now */}
                                                {CATEGORIES.find(c => c.id === selectedCategory)?.icon}
                                            </div>

                                            <div>
                                                <h4 className={`font-black uppercase text-sm leading-tight ${isEquipped ? 'text-white' : 'text-slate-200'}`}>{item.name}</h4>
                                                {item.reqLevel && <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Låses opp på Nivå {item.reqLevel}</p>}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto pt-2">
                                            {isUnlocked ? (
                                                <button
                                                    onClick={() => onEquip(item.id)}
                                                    disabled={isEquipped || (isLinkedHorse && !hasLinkedHorse)}
                                                    className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isEquipped
                                                        ? 'bg-white/5 text-slate-500 cursor-default'
                                                        : (isLinkedHorse && !hasLinkedHorse)
                                                            ? 'bg-slate-800 text-red-500 cursor-not-allowed'
                                                            : 'bg-white text-black hover:bg-amber-400 hover:scale-[1.02]'
                                                        }`}
                                                >
                                                    {isEquipped ? 'Aktiv' : (isLinkedHorse && !hasLinkedHorse ? 'Mangler Hest' : 'Velg')}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBuyClick(item)}
                                                    disabled={!!disabledReason}
                                                    className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${disabledReason
                                                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                                        : 'bg-amber-400 text-black hover:bg-amber-300 hover:scale-[1.02] shadow-lg shadow-amber-900/20'
                                                        }`}
                                                >
                                                    {disabledReason || 'Kjøp'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
