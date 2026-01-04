
import React, { useEffect } from 'react';
import type { ActionResult } from '../simulationTypes';
import { RESOURCE_DETAILS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { animationManager } from '../logic/AnimationManager';
import { X } from 'lucide-react';

interface ActionResultOverlayProps {
    result: ActionResult | null;
    onClear: () => void;
}

export const ActionResultOverlay: React.FC<ActionResultOverlayProps> = ({ result, onClear }) => {
    // Auto-clear after a few seconds
    useEffect(() => {
        if (result) {
            // Trigger flying resources if any
            if (result.success && result.utbytte && result.utbytte.length > 0) {
                result.utbytte.forEach((y, idx) => {
                    if (y.amount > 0) {
                        setTimeout(() => {
                            // Target left sidebar (Inventory)
                            animationManager.spawnFlyingResource(
                                y.resource,
                                window.innerWidth / 2,
                                window.innerHeight / 2, // Start from center
                                window.innerWidth - 150, // Target Top Right (Resources/Header)
                                60 // Target Top Header height
                            );
                        }, idx * 200);
                    }
                });
            }

            const timer = setTimeout(() => {
                onClear();
            }, 6000); // Increased to 6s because user says it "remains on screen" but now they have a close button
            return () => clearTimeout(timer);
        }
    }, [result, onClear]);

    return (
        <AnimatePresence>
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="fixed top-[5%] left-1/2 transform -translate-x-1/2 bg-slate-900/95 border-2 border-amber-500/30 p-5 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md min-w-[300px] text-center z-[300] overflow-hidden"
                >
                    {/* Progress Bar Background */}
                    <div className="absolute bottom-0 left-0 h-1 bg-amber-500/20 w-full overflow-hidden">
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 7, ease: "linear" }}
                            className="h-full bg-amber-500"
                        />
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                        }}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Message Header */}
                        <div className={`text-lg font-black mb-3 tracking-tight ${result.success ? 'text-white' : 'text-rose-400'}`}>
                            {result.message}
                        </div>

                        {/* Utbytte */}
                        {result.utbytte && result.utbytte.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mb-3">
                                {result.utbytte.map((yieldItem, idx) => {
                                    const details = RESOURCE_DETAILS[yieldItem.resource] || { label: yieldItem.resource, icon: '📦' };
                                    const label = yieldItem.name || details.label;
                                    const icon = yieldItem.icon || details.icon;
                                    const isPositive = yieldItem.amount >= 0;
                                    const isJackpot = yieldItem.jackpot;

                                    return (
                                        <motion.div
                                            key={`${yieldItem.resource}-${idx}`}
                                            initial={{ scale: 0, y: 10 }}
                                            animate={{ scale: 1, y: 0 }}
                                            transition={{ delay: 0.2 + (idx * 0.1), type: "spring" }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black border shadow-lg ${isJackpot
                                                ? 'bg-gradient-to-r from-amber-200 to-yellow-400 border-yellow-300 text-yellow-900 shadow-amber-500/50 animate-pulse'
                                                : isPositive
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                                }`}
                                        >
                                            <span className="text-lg">{icon}</span>
                                            <span>{isPositive ? '+' : ''}{yieldItem.resource === 'gold' ? yieldItem.amount.toFixed(2) : yieldItem.amount} {isJackpot && label}</span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* XP Gains */}
                        {result.xp && result.xp.length > 0 && (
                            <div className="flex flex-col gap-2 mb-2">
                                {result.xp.map((xpItem, idx) => (
                                    <motion.div
                                        key={`xp-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (idx * 0.1) }}
                                        className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/5 py-1 rounded-lg"
                                    >
                                        +{xpItem.amount} XP {xpItem.skill}
                                        {xpItem.levelUp && (
                                            <motion.div
                                                initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: 1,
                                                    rotate: [0, 5, -5, 0],
                                                    filter: ["brightness(1)", "brightness(2)", "brightness(1)"]
                                                }}
                                                transition={{
                                                    duration: 0.6,
                                                    times: [0, 0.5, 1],
                                                    repeat: Infinity,
                                                    repeatType: "reverse"
                                                }}
                                                className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black px-4 py-1.5 rounded-full text-[10px] font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300/50"
                                            >
                                                <span>⭐</span>
                                                <span className="tracking-[0.2em]">NIVÅ OPPGGRADERT!</span>
                                                <span>⭐</span>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Durability Loss */}
                        {result.durability && result.durability.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap justify-center gap-3">
                                {result.durability.map((dura, idx) => (
                                    <span key={`dura-${idx}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        🛡️ {dura.item}: <span className={dura.amount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                            {dura.amount > 0 ? '-' : '+'}{Math.abs(dura.amount)}%
                                        </span>
                                        {dura.broken && <span className="text-rose-500 font-black ml-1 animate-pulse">(ØDELAGT!)</span>}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

