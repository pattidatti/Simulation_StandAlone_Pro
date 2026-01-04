import React, { useState } from 'react';
import type { SimulationPlayer, SkillType } from '../simulationTypes';
import { SKILL_DETAILS } from '../constants';

import { GameCard } from '../ui/GameCard';
import { Target, Zap, ChevronRight, Lock, TrendingUp } from 'lucide-react';

interface SimulationSkillsProps {
    player: SimulationPlayer;
}

import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { useSimulation } from '../SimulationContext';

// ... imports ...

export const SimulationSkills: React.FC<SimulationSkillsProps> = React.memo(({ player }) => {

    const { setActiveTab } = useSimulation();

    const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);

    const skillsList = Object.keys(player.skills) as SkillType[];
    const totalLevel = Object.values(player.skills).reduce((acc, s) => acc + s.level, 0);

    // Helper to generate dynamic styles
    const getSkillStyle = (color: string) => ({
        '--skill-color': color,
        '--skill-color-20': `${color}33`,
        '--skill-color-10': `${color}1A`,
        '--skill-color-05': `${color}0D`,
    } as React.CSSProperties);

    return (
        <SimulationMapWindow
            title="Ferdigheter"
            icon={<Target className="w-8 h-8" />}
            onClose={() => setActiveTab('MAP')}
            headerRight={
                <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Totalt Nivå</span>
                    <span className="text-xl font-black text-white font-mono leading-none">{totalLevel}</span>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px] content-start pt-4">

                {/* Left: Skill List - Scrollable */}
                <div className="lg:col-span-4 flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar pr-2 pb-4 max-h-[600px]">
                    {skillsList.map(skillId => {
                        // ... mapping code remains same
                        const skillData = player.skills[skillId];
                        const details = SKILL_DETAILS[skillId];
                        const isSelected = selectedSkill === skillId;
                        const color = details?.color || '#10b981';

                        return (
                            <button
                                key={skillId}
                                onClick={() => setSelectedSkill(skillId)}
                                style={getSkillStyle(color)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden shrink-0 ${isSelected
                                    ? 'bg-[var(--skill-color)]/20 border-[var(--skill-color)] shadow-[inset_0_0_20px_var(--skill-color-05)] z-10'
                                    : 'bg-slate-950/40 border-white/5 hover:bg-slate-900/60 hover:border-white/10'
                                    }`}
                            >
                                {/* Selection Indicator Line */}
                                {isSelected && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--skill-color)] shadow-[0_0_10px_var(--skill-color)]" />
                                )}

                                <div className="flex justify-between items-center relative z-10 pl-3">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-display font-black shadow-inner transition-colors duration-500 ${isSelected ? 'bg-[var(--skill-color)] text-black' : 'bg-black/30 text-[var(--skill-color)] ring-1 ring-white/10'}`}>
                                            {details.label.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className={`text-xl font-black tracking-tight transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                {details?.label || skillId}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-[var(--skill-color)]' : 'text-slate-500'}`}>
                                                    Lvl {skillData.level}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && <ChevronRight className="w-5 h-5 text-[var(--skill-color)]" />}
                                </div>
                                {/* Mini Progress Bar at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/50">
                                    <div
                                        className="h-full bg-[var(--skill-color)] opacity-50"
                                        style={{ width: `${(skillData.xp / (skillData.maxXp || 1)) * 100}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right: Skill Details - Hero Card */}
                <div className="lg:col-span-8 h-full min-h-[600px]">
                    {selectedSkill ? (
                        <div className="h-full animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col">
                            {(() => {
                                const details = SKILL_DETAILS[selectedSkill];
                                const skillData = player.skills[selectedSkill];
                                const color = details?.color || '#10b981';
                                const style = getSkillStyle(color);
                                const progress = (skillData.xp / (skillData.maxXp || 1)) * 100;

                                return (
                                    <GameCard className="flex-1 border-[var(--skill-color)]/30 backdrop-blur-2xl bg-black/40 overflow-hidden flex flex-col relative group h-full" style={style}>

                                        {/* Dynamic Backgrounds */}
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--skill-color-20),transparent_50%)]" />
                                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,bg-slate-950_100%)]" />

                                        {/* BIG WATERMARK ICON */}
                                        <div className="absolute -right-12 -top-12 opacity-[0.03] rotate-12 transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-6">
                                            <Zap size={600} strokeWidth={1} />
                                        </div>

                                        <div className="relative z-10 p-8 flex-1 flex flex-col gap-8">

                                            {/* Hero Header + Info */}
                                            <div className="flex flex-col gap-6 border-b border-white/5 pb-8 relative z-10">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-4">
                                                            <span className="px-4 py-1.5 bg-[var(--skill-color)] text-black font-black text-sm uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_var(--skill-color-20)]">
                                                                {selectedSkill}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-5xl font-display font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none mt-2">
                                                            {details?.label}
                                                        </h3>
                                                        <p className="text-xl text-slate-200 leading-relaxed font-serif italic max-w-2xl mt-2 opacity-90">
                                                            "{details?.description}"
                                                        </p>
                                                    </div>

                                                    {/* Level Circle */}
                                                    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                                                        <svg className="w-full h-full -rotate-90">
                                                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-black/50" />
                                                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-[var(--skill-color)] transition-all duration-1000 ease-out" strokeDasharray={351} strokeDashoffset={351 - (351 * progress) / 100} strokeLinecap="round" />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nivå</span>
                                                            <span className="text-4xl font-black text-white">{skillData.level}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Full Width Progression Grid */}
                                            <div className="flex flex-col flex-1 min-h-0 bg-black/20 rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-2xl">
                                                <div className="flex items-center justify-between mb-6 z-10 relative border-b border-white/5 pb-4">
                                                    <h5 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                                                        <TrendingUp className="w-5 h-5 text-[var(--skill-color)]" />
                                                        Mestringsvei
                                                    </h5>
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        {Object.keys(details?.bonuses || {}).length} Opplåsninger
                                                    </span>
                                                </div>

                                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                                                    <div className="flex flex-col space-y-3">
                                                        {Object.entries(details?.bonuses || {}).map(([level, bonus]) => {
                                                            const lvl = parseInt(level);
                                                            const isUnlocked = skillData.level >= lvl;
                                                            return (
                                                                <div
                                                                    key={level}
                                                                    className={`flex items-center gap-6 p-4 rounded-xl border transition-all duration-300 group/item ${isUnlocked
                                                                        ? 'bg-[var(--skill-color-10)] border-[var(--skill-color-20)] translate-x-2'
                                                                        : 'bg-black/20 border-white/5 opacity-60 hover:opacity-100'
                                                                        }`}
                                                                >
                                                                    <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center font-black font-display text-2xl shadow-lg transition-all ${isUnlocked
                                                                        ? 'bg-[var(--skill-color)] text-black shadow-[0_0_20px_var(--skill-color-20)] scale-110 rotate-3'
                                                                        : 'bg-white/5 text-slate-500'
                                                                        }`}>
                                                                        {lvl}
                                                                    </div>
                                                                    <div className="flex-1 py-1">
                                                                        <p className={`text-lg font-bold leading-tight ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                                                                            {bonus}
                                                                        </p>
                                                                        {isUnlocked && <p className="text-[10px] uppercase tracking-widest text-[var(--skill-color)] font-bold mt-2 opacity-90 flex items-center gap-1.5"><Zap className="w-3 h-3" /> Opplåst</p>}
                                                                    </div>
                                                                    <div className="w-12 flex justify-center">
                                                                        {!isUnlocked && <Lock className="w-6 h-6 text-slate-700" />}
                                                                        {isUnlocked && <div className="w-3 h-3 rounded-full bg-[var(--skill-color)] shadow-[0_0_10px_var(--skill-color)]" />}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </GameCard>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
                            <Target className="w-32 h-32 mb-8 text-slate-600" />
                            <h3 className="text-3xl font-black text-slate-400 uppercase tracking-widest">Velg en ferdighet</h3>
                        </div>
                    )}
                </div>
            </div>
        </SimulationMapWindow>
    );
});

SimulationSkills.displayName = 'SimulationSkills';
