import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getAchievement } from '../data/achievements';
import { useSimulation } from '../SimulationContext';
import { proceduralSound } from '../logic/ProceduralSoundGenerator';

/**
 * A premium, glassmorphic notification component for achievements.
 * Features a "Herald" slide-in effect with bouncy easing.
 */
export const AchievementToast: React.FC = () => {
    const { currentAchievement } = useSimulation();
    const [isVisible, setIsVisible] = useState(false);

    const achievement = currentAchievement ? getAchievement(currentAchievement) : null;

    useEffect(() => {
        if (currentAchievement) {
            setIsVisible(true);
            // Play success sound when achievement pops up
            // Using setTimeout to ensure it plays slightly after the animation starts if needed, or immediately
            proceduralSound.playSuccess();
        } else {
            setIsVisible(false);
        }
    }, [currentAchievement]);

    if (!achievement) return null;

    const rarityColors = {
        COMMON: 'from-slate-400/20 to-slate-500/10 border-slate-400/30 text-slate-200',
        RARE: 'from-indigo-500/20 to-blue-600/10 border-indigo-500/30 text-indigo-300',
        EPIC: 'from-amber-400/20 to-orange-500/10 border-amber-400/30 text-amber-300',
        LEGENDARY: 'from-rose-500/20 to-purple-600/10 border-rose-500/30 text-rose-300'
    };

    const rarityLabel = {
        COMMON: 'Alminnelig Meritt',
        RARE: 'Sjelden Bragd',
        EPIC: 'Episk Legende',
        LEGENDARY: 'Mytisk Ettermæle'
    };

    return (
        <div
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[3000] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-24 opacity-0 scale-95'
                }`}
        >
            <div className={`p-1 rounded-[2rem] bg-gradient-to-b ${rarityColors[achievement.rarity].split(' ').slice(0, 2).join(' ')} shadow-2xl`}>
                <div className={`flex items-center gap-6 px-8 py-5 bg-slate-950/40 backdrop-blur-2xl rounded-[1.8rem] border border-white/5 min-w-[320px] max-w-md ${rarityColors[achievement.rarity]}`}>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-current blur-xl opacity-20 animate-pulse" />
                        <div className="w-14 h-14 bg-slate-900/80 border border-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner relative z-10">
                            {achievement.icon}
                        </div>
                    </div>

                    <div className="flex-1 text-left space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                {rarityLabel[achievement.rarity]}
                            </span>
                        </div>
                        <h4 className="text-xl font-black tracking-tight text-white italic">
                            {achievement.name}
                        </h4>
                        <p className="text-sm font-medium text-slate-400 leading-tight">
                            {achievement.description}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-1 pl-4 border-l border-white/5">
                        <div className="flex items-center gap-1 text-amber-400">
                            <Sparkles size={12} />
                            <span className="text-sm font-black italic">+{achievement.xp}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Sjel</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
