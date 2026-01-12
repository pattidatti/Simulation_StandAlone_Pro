import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, ChevronRight, Zap } from 'lucide-react';
import { getAchievement } from '../data/achievements';
import { useSimulation } from '../SimulationContext';
import { proceduralSound } from '../logic/ProceduralSoundGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMap } from '../data/iconMap';

const ParticleBurst = ({ color }: { color: string }) => {
    const particles = Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        angle: (i / 24) * 360,
        distance: 120 + Math.random() * 120,
        delay: Math.random() * 0.2,
        size: 4 + Math.random() * 6
    }));

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                    animate={{
                        opacity: 0,
                        x: Math.cos(p.angle * (Math.PI / 180)) * p.distance,
                        y: Math.sin(p.angle * (Math.PI / 180)) * p.distance,
                        scale: p.scale
                    }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: p.delay }}
                    className={`absolute rounded-full ${color}`}
                    style={{ width: p.size, height: p.size }}
                />
            ))}
        </div>
    );
};

export const AchievementUnlockModal: React.FC = () => {
    const { currentAchievement, dismissAchievement, setActiveTab, setProfileTab } = useSimulation();
    const [isVisible, setIsVisible] = useState(false);

    const achievement = currentAchievement ? getAchievement(currentAchievement) : null;

    useEffect(() => {
        if (currentAchievement) {
            setIsVisible(true);
            proceduralSound.playSuccess();
        } else {
            setIsVisible(false);
        }
    }, [currentAchievement]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => dismissAchievement(), 300);
    };

    const handleView = () => {
        setIsVisible(false);
        setTimeout(() => {
            dismissAchievement();
            setProfileTab('achievements');
            setActiveTab('PROFILE');
        }, 300);
    };

    if (!achievement) return null;

    const rarityConfig = {
        COMMON: {
            bg: 'bg-gradient-to-br from-slate-200 to-slate-400',
            textTitle: 'text-slate-900',
            textDesc: 'text-slate-700',
            border: 'border-white/50',
            iconBg: 'bg-slate-900',
            iconColor: 'text-slate-200',
            particle: 'bg-slate-300',
            glow: 'shadow-[0_0_100px_Infinity_rgba(148,163,184,0.3)]',
            outerGlow: 'bg-slate-400',
            buttonPrimary: 'bg-slate-900 text-white hover:bg-slate-800',
            buttonSecondary: 'text-slate-600 hover:text-slate-900'
        },
        RARE: {
            bg: 'bg-gradient-to-br from-indigo-300 via-indigo-400 to-indigo-500',
            textTitle: 'text-indigo-950',
            textDesc: 'text-indigo-900',
            border: 'border-white/40',
            iconBg: 'bg-indigo-950',
            iconColor: 'text-indigo-200',
            particle: 'bg-indigo-200',
            glow: 'shadow-[0_0_100px_Infinity_rgba(99,102,241,0.3)]',
            outerGlow: 'bg-indigo-500',
            buttonPrimary: 'bg-indigo-950 text-indigo-100 hover:bg-indigo-900',
            buttonSecondary: 'text-indigo-800 hover:text-indigo-950'
        },
        EPIC: {
            bg: 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500',
            textTitle: 'text-amber-950',
            textDesc: 'text-amber-900',
            border: 'border-amber-100/50',
            iconBg: 'bg-amber-950',
            iconColor: 'text-amber-300',
            particle: 'bg-amber-100',
            glow: 'shadow-[0_0_120px_Infinity_rgba(251,191,36,0.5)]',
            outerGlow: 'bg-amber-500',
            buttonPrimary: 'bg-amber-950 text-amber-100 hover:bg-amber-900 shadow-xl shadow-amber-900/20',
            buttonSecondary: 'text-amber-800 hover:text-amber-950'
        },
        LEGENDARY: {
            bg: 'bg-gradient-to-br from-rose-300 via-rose-500 to-rose-600',
            textTitle: 'text-rose-950',
            textDesc: 'text-rose-900',
            border: 'border-rose-200/50',
            iconBg: 'bg-rose-950',
            iconColor: 'text-rose-200',
            particle: 'bg-rose-200',
            glow: 'shadow-[0_0_150px_Infinity_rgba(244,63,94,0.5)]',
            outerGlow: 'bg-rose-500',
            buttonPrimary: 'bg-rose-950 text-rose-100 hover:bg-rose-900',
            buttonSecondary: 'text-rose-800 hover:text-rose-950'
        }
    };

    const config = rarityConfig[achievement.rarity];
    const IconComponent = IconMap[achievement.icon];

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center pointer-events-none">
                    {/* Dark Backdrop - NO CLICK HANDLER */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#020205]/95 backdrop-blur-md pointer-events-auto"
                    // onClick={handleClose}  <-- REMOVED to prevent accidental dismissal
                    />

                    {/* The Card */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 100, rotateX: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 50 }}
                        transition={{ type: "spring", damping: 12, stiffness: 100 }}
                        className={`relative w-[90vw] max-w-sm pointer-events-auto perspective-1000`}
                    >
                        {/* Outer Glow / God Rays */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[80px] opacity-40 animate-pulse-slow ${config.outerGlow}`} />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-20 bg-gradient-conic from-transparent via-${config.outerGlow.split('-')[1]}-300 to-transparent blur-3xl`}
                        />

                        {/* Card Content */}
                        <div className={`relative w-full rounded-[2.5rem] p-8 shadow-2xl overflow-hidden ${config.bg} border ${config.border}`}>

                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 translate-x-[-100%] animate-shimmer pointer-events-none" />

                            {/* Particles */}
                            <ParticleBurst color={config.particle} />

                            <div className="relative z-10 text-center">
                                {/* Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", delay: 0.1 }}
                                    className={`w-28 h-28 mx-auto mb-8 rounded-[2rem] flex items-center justify-center shadow-xl ${config.iconBg} ${config.iconColor} ring-4 ring-white/10`}
                                >
                                    {IconComponent ? React.cloneElement(IconComponent as React.ReactElement, { size: 56, strokeWidth: 1.5 }) : <Zap size={56} />}
                                </motion.div>

                                {/* Text */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-70 ${config.textTitle}`}>
                                        Bragd Låst Opp
                                    </div>
                                    <h2 className={`text-4xl font-black italic tracking-tighter mb-4 ${config.textTitle} drop-shadow-md leading-[0.9]`}>
                                        {achievement.name}
                                    </h2>
                                    <p className={`text-sm font-bold leading-relaxed mb-8 px-2 ${config.textDesc}`}>
                                        {achievement.description}
                                    </p>
                                </motion.div>

                                {/* Actions */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-col gap-3"
                                >
                                    <button
                                        onClick={handleView}
                                        className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transform active:scale-95 transition-all shadow-xl hover:-translate-y-1 ${config.buttonPrimary}`}
                                    >
                                        Se mine bragder <ChevronRight size={14} strokeWidth={3} />
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className={`py-3 text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity ${config.textTitle}`}
                                    >
                                        Lukk vindu
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
