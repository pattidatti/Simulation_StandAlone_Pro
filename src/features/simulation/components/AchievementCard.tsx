import React from 'react';
import { AchievementDef } from '../data/achievements';
import { Lock } from 'lucide-react';

interface AchievementCardProps {
    achievement: AchievementDef;
    unlocked: boolean;
    onClick?: () => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, unlocked, onClick }) => {
    // Rarity-based styling using HSL-aligned colors
    const rarityStyles = {
        COMMON: {
            border: 'border-slate-500/20',
            bg: 'bg-slate-500/5',
            glow: 'shadow-slate-500/5',
            text: 'text-slate-400',
            iconBg: 'bg-slate-500/10'
        },
        RARE: {
            border: 'border-indigo-500/20',
            bg: 'bg-indigo-500/5',
            glow: 'shadow-indigo-500/10',
            text: 'text-indigo-400',
            iconBg: 'bg-indigo-500/10'
        },
        EPIC: {
            border: 'border-amber-500/20',
            bg: 'bg-amber-500/5',
            glow: 'shadow-amber-500/20',
            text: 'text-amber-400',
            iconBg: 'bg-amber-500/10'
        },
        LEGENDARY: {
            border: 'border-rose-500/20',
            bg: 'bg-rose-500/5',
            glow: 'shadow-rose-500/30',
            text: 'text-rose-400',
            iconBg: 'bg-rose-500/10'
        }
    };

    const style = rarityStyles[achievement.rarity];

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick?.();
                }
            }}
            className={`
                group relative flex flex-col items-center justify-center p-5 rounded-[1.5rem] 
                transition-all duration-500 cursor-help overflow-hidden
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                ${unlocked
                    ? `border ${style.border} ${style.bg} hover:border-opacity-50 hover:scale-105 hover:shadow-2xl ${style.glow}`
                    : 'border border-white/5 bg-slate-900/40 opacity-40 grayscale hover:opacity-60 hover:grayscale-0'
                }
            `}
        >
            {/* Subtle Inner Glow for Unlocked High Tiers */}
            {unlocked && (achievement.rarity === 'EPIC' || achievement.rarity === 'LEGENDARY') && (
                <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${style.text.replace('text-', 'from-')}/0 to-transparent pointer-events-none`} />
            )}

            {/* Animated Pulse for Legendary */}
            {unlocked && achievement.rarity === 'LEGENDARY' && (
                <div className="absolute inset-0 animate-pulse opacity-10 bg-rose-500 blur-xl pointer-events-none" />
            )}

            {/* Icon Container */}
            <div className={`
                relative mb-3 w-14 h-14 flex items-center justify-center rounded-2xl text-3xl
                transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3
                ${unlocked ? style.iconBg : 'bg-white/5'}
            `}>
                {unlocked ? (
                    <span className="drop-shadow-lg filter">{achievement.icon}</span>
                ) : (
                    <Lock size={20} className="opacity-50" />
                )}

                {/* Glint Effect on Hover */}
                {unlocked && (
                    <div className="absolute inset-0 bg-white/20 translate-y-full rotate-45 group-hover:translate-y-[-150%] transition-transform duration-700 w-full h-full pointer-events-none" />
                )}
            </div>

            {/* Content */}
            <div className="text-center space-y-1 relative z-10">
                <h5 className={`
                    font-black italic tracking-tight text-sm
                    ${unlocked ? 'text-white' : 'text-slate-500'}
                `}>
                    {unlocked ? achievement.name : 'Ukjent Bragd'}
                </h5>

                {/* Category Badge */}
                <div className="flex items-center justify-center gap-2 opacity-60">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                        {unlocked ? achievement.category : '???'}
                    </span>
                </div>
            </div>

            {/* Hover Popover (Ported from original plan, kept for context) */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-52 p-4 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-2xl translate-y-4 group-hover:translate-y-0">
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${style.text}`}>
                    {achievement.rarity}
                </p>
                <h5 className="text-white font-black italic mb-2 tracking-tight text-sm">
                    {achievement.name}
                </h5>
                <p className="text-[11px] text-slate-400 leading-tight">
                    {achievement.description}
                </p>
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase">
                        {achievement.category}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                        <span className="text-[10px] font-black italic">+{achievement.xp} XP</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
