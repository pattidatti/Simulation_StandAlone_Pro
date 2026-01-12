import React, { useMemo, useState } from 'react';
import { ACHIEVEMENTS } from '../data/achievements';
import { useSimulationAuth } from '../SimulationAuthContext';
import { AchievementCard } from './AchievementCard';

interface AchievementGalleryProps {
    // If true, we assume we are in the "In-Game" modal context
    // If false, we might be in the global profile context
    inGameMode?: boolean;
}

type TabCategory = 'ALL' | 'LIFE' | 'SOUL' | 'ROLE';

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({ inGameMode = false }) => {
    const { account } = useSimulationAuth();
    const [activeTab, setActiveTab] = useState<TabCategory>('ALL');

    const unlockedAchievements = useMemo(() => {
        const data = account?.unlockedAchievements || {};
        if (Array.isArray(data)) return new Set(data);
        return new Set(Object.keys(data));
    }, [account]);

    const isUnlocked = (id: string) => unlockedAchievements.has(id);

    // Filter Logic
    const filteredAchievements = useMemo(() => {
        if (activeTab === 'ALL') return ACHIEVEMENTS;
        // Map TabCategory to AchievementDef.category
        // Note: TabCategory uses 'LIFE', AchievementDef uses 'LIFE'. They match.
        return ACHIEVEMENTS.filter(a => a.category === activeTab);
    }, [activeTab]);

    // Stats
    const totalCount = ACHIEVEMENTS.length;
    const unlockedCount = unlockedAchievements.size;
    const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

    const tabs: { id: TabCategory; label: string; icon: string }[] = [
        { id: 'ALL', label: 'Alle Bragder', icon: '🏆' },
        { id: 'LIFE', label: 'Nuet', icon: '👣' },
        { id: 'SOUL', label: 'Sjelen', icon: '✨' },
        { id: 'ROLE', label: 'Rollene', icon: '⚔️' },
    ];

    return (
        <div className={`w-full ${inGameMode ? 'max-w-6xl mx-auto' : ''} space-y-8 animate-in fade-in duration-700`}>

            {/* Header / Stats Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 italic uppercase tracking-tighter">
                        Mine Bragder
                    </h3>
                    <p className="text-sm text-slate-400 font-medium max-w-lg">
                        En samling av dine største triumfer gjennom alle dine liv.
                        Hver bragd styrker sjelen din for evigheten.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-white/5">
                    <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5 flex flex-col items-center min-w-[100px]">
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Antall</span>
                        <span className="text-xl font-black text-white">{unlockedCount} <span className="text-slate-500 text-sm">/ {totalCount}</span></span>
                    </div>
                    <div className="px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/5 flex flex-col items-center min-w-[100px]">
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Fullført</span>
                        <span className="text-xl font-black text-white">{completionPercentage}%</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] whitespace-nowrap transition-all
                            flex items-center gap-2 border
                            ${activeTab === tab.id
                                ? 'bg-white text-slate-900 border-white shadow-lg shadow-white/10 scale-105'
                                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                            }
                        `}
                    >
                        <span className="text-base">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredAchievements.map((ach) => (
                    <AchievementCard
                        key={ach.id}
                        achievement={ach}
                        unlocked={isUnlocked(ach.id)}
                    // Stagger animation index could be passed if Card supported delay
                    />
                ))}
            </div>

            {/* Empty State if needed */}
            {filteredAchievements.length === 0 && (
                <div className="py-20 text-center opacity-30">
                    <p className="text-sm font-black uppercase tracking-widest">Ingen bragder funnet i denne kategorien</p>
                </div>
            )}
        </div>
    );
};
