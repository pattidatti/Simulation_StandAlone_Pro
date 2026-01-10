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
        <div className="flex h-full p-6 pt-0 gap-8 relative">
            {/* Category Navigation Rail - Vertical List with Large Text */}
            <div className="w-56 flex flex-col relative z-10 h-full border-r border-white/5 pr-6">
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar mask-scroll pb-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`relative group shrink-0 h-14 flex items-center px-4 gap-4 rounded-xl transition-all duration-200 ${selectedCategory === cat.id
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/20 z-10 scale-[1.02]'
                                : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className={`text-2xl filter transition-all ${selectedCategory === cat.id ? 'scale-110 drop-shadow-sm' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                                {cat.icon}
                            </span>
                            <span className={`text-xs uppercase font-black tracking-widest leading-none ${selectedCategory === cat.id ? 'opacity-100' : 'opacity-70'}`}>{cat.label}</span>

                            {/* Active Indicator Pulse */}
                            {selectedCategory === cat.id && (
                                <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Item List - Vertical Layout */}
            <div className="flex-1 pt-0 pb-6 overflow-y-auto no-scrollbar mask-scroll-content">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={selectedCategory}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col gap-2.5"
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
                                if (!levelOk) disabledReason = `Lvl ${item.reqLevel}`;
                                else if (!canAfford) disabledReason = 'Mangler Gull';
                            }
                            if (isLinkedHorse && !hasLinkedHorse) {
                                disabledReason = 'Ingen Hest';
                            }

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`relative p-[1px] rounded-xl transition-all group overflow-hidden ${isEquipped
                                        ? 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-md shadow-amber-500/10'
                                        : 'bg-slate-800'
                                        }`}
                                >
                                    <div className="bg-[#0B0F19] rounded-[11px] h-16 pr-4 flex items-center gap-5 relative z-10 pl-3">

                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl bg-slate-900 border border-white/5 ${isEquipped ? 'shadow-[0_0_10px_rgba(251,191,36,0.1)]' : ''}`}>
                                            {CATEGORIES.find(c => c.id === selectedCategory)?.icon}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4 className={`font-black uppercase text-sm truncate leading-none mb-1.5 ${isEquipped ? 'text-white' : 'text-slate-300'}`}>{item.name.replace('Vogn: ', '')}</h4>

                                            {/* Requirements / Price */}
                                            <div className="flex items-center gap-2">
                                                {item.reqLevel && !isUnlocked && (
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ">Lvl {item.reqLevel}</span>
                                                )}
                                                {!isUnlocked && (
                                                    <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{item.cost}g</span>
                                                )}
                                                {isUnlocked && !isEquipped && (
                                                    <span className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Eies</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0 w-28">
                                            {isUnlocked ? (
                                                <button
                                                    onClick={() => onEquip(item.id)}
                                                    disabled={isEquipped || (isLinkedHorse && !hasLinkedHorse)}
                                                    className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isEquipped
                                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-default shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                                                        : (isLinkedHorse && !hasLinkedHorse)
                                                            ? 'bg-slate-800 text-red-500 cursor-not-allowed'
                                                            : 'bg-white text-black hover:bg-amber-400 hover:scale-[1.02]'
                                                        }`}
                                                >
                                                    {isEquipped ? 'VALGT' : (isLinkedHorse && !hasLinkedHorse ? 'MANGLER HEST' : 'VELG')}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBuyClick(item)}
                                                    disabled={!!disabledReason}
                                                    className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${disabledReason
                                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                        : 'bg-amber-400 text-black hover:bg-amber-300 hover:scale-[1.02] shadow-lg shadow-amber-900/10'
                                                        }`}
                                                >
                                                    {disabledReason || 'KJØP'}
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
                .mask-scroll {
                     mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
                }
                .mask-scroll-content {
                    mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to bottom, black 95%, transparent 100%);
                }
            `}</style>
        </div>
    );
};
