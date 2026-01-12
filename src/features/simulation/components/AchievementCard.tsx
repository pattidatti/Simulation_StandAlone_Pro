import React from 'react';
import { AchievementDef } from '../data/achievements';
import { Lock, Zap } from 'lucide-react';
import { IconMap } from '../data/iconMap';

interface AchievementCardProps {
    achievement: AchievementDef;
    unlocked: boolean;
    onClick?: () => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, unlocked, onClick }) => {
    // Premium Gradients & Borders for Unlocked State
    const rarityStyles = {
        COMMON: {
            border: 'border-slate-600/50',
            bg: 'bg-gradient-to-br from-slate-800/40 to-slate-900/60',
            glow: 'shadow-slate-500/10',
            text: 'text-slate-300',
            iconBg: 'bg-slate-700/30'
        },
        RARE: {
            border: 'border-cyan-500/40',
            bg: 'bg-gradient-to-br from-cyan-900/40 to-slate-900/80',
            glow: 'shadow-cyan-500/20',
            text: 'text-cyan-400',
            iconBg: 'bg-cyan-500/20'
        },
        EPIC: {
            border: 'border-fuchsia-500/40',
            bg: 'bg-gradient-to-br from-fuchsia-900/40 to-slate-900/80',
            glow: 'shadow-fuchsia-500/20',
            text: 'text-fuchsia-400',
            iconBg: 'bg-fuchsia-500/20'
        },
        LEGENDARY: {
            border: 'border-amber-500/50',
            bg: 'bg-gradient-to-br from-amber-900/40 to-slate-900/80',
            glow: 'shadow-amber-500/30',
            text: 'text-amber-400',
            iconBg: 'bg-amber-500/20'
        }
    };

    const style = rarityStyles[achievement.rarity];

    // Determine State Config
    const isSecretAndLocked = achievement.isSecret && !unlocked;

    // Icon Logic
    const rawIcon = IconMap[achievement.icon] || <Zap size={32} />;

    let displayIcon = rawIcon;
    let iconColorClass = style.text;

    if (!unlocked) {
        if (isSecretAndLocked) {
            displayIcon = <Lock size={28} />;
            iconColorClass = 'text-slate-800'; // Very dark for secret
        } else {
            // Visible but locked -> Dark Silhouette
            iconColorClass = 'text-slate-800';
        }
    }

    // Texts
    const title = isSecretAndLocked ? 'Hemmelig Bragd' : achievement.name;
    const description = unlocked
        ? achievement.description
        : (isSecretAndLocked ? '???' : `${achievement.requirementText}`);

    // Locked Style Override - SOLID DARK, NO OPACITY
    const computedClass = unlocked
        ? `border ${style.border} ${style.bg} ${style.glow} hover:scale-[1.02] hover:shadow-2xl hover:border-opacity-100`
        : `border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700`;

    return (
        <div
            onClick={onClick}
            role="button"
            className={`
                group relative flex flex-col items-center justify-between p-6 rounded-[1.5rem] min-h-[240px] text-center
                transition-all duration-300 overflow-hidden select-none
                ${computedClass}
            `}
        >
            {/* BACKGROUND EFFECTS (Unlocked Only) */}
            {unlocked && (
                <div className={`absolute inset-0 opacity-20 bg-gradient-to-tr ${style.text.replace('text-', 'from-')}/10 to-transparent pointer-events-none`} />
            )}

            {/* ICON HEADER */}
            <div className={`
                relative w-20 h-20 rounded-3xl flex items-center justify-center mb-5 text-4xl
                transition-transform duration-500 group-hover:scale-110
                ${unlocked ? style.iconBg + ' ' + iconColorClass : 'bg-slate-900/50 border border-slate-800/50 ' + iconColorClass}
            `}>
                {displayIcon}

                {unlocked && achievement.rarity === 'LEGENDARY' && (
                    <div className="absolute inset-0 animate-pulse bg-amber-400/20 blur-2xl rounded-full" />
                )}
            </div>

            {/* TEXT CONTENT */}
            <div className="flex-1 flex flex-col items-center justify-start w-full gap-3">
                <h5 className={`font-black uppercase tracking-wider text-xl leading-tight ${unlocked ? 'text-white' : 'text-slate-300'}`}>
                    {title}
                </h5>

                {/* Description / Requirement */}
                <div className="flex-1 flex items-center justify-center">
                    <p className={`text-sm font-medium leading-relaxed ${unlocked ? 'text-slate-300' : 'text-slate-500'}`}>
                        {description}
                    </p>
                </div>

                {/* XP Badge (Only if not secret) */}
                {!isSecretAndLocked && (
                    <div className="mt-auto px-3 py-1 rounded-full border border-slate-800 bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 group-hover:border-slate-600 transition-colors">
                        {achievement.xp} XP
                    </div>
                )}
            </div>

            {/* Rarity Stripe (Bottom - Unlocked Only) */}
            {unlocked && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${style.text.replace('text-', 'bg-')} opacity-50`} />
            )}
        </div>
    );
};
