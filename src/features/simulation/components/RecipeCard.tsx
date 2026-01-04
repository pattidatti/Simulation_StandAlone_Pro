import React from 'react';
import { Settings, ChevronRight } from 'lucide-react';

interface RecipeCardProps {
    id: string;
    isSelected: boolean;
    isLocked: boolean;
    canAfford: boolean;
    isReady?: boolean;
    info: {
        name: string;
        icon: string;
    };
    onSelect: (id: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
    id,
    isSelected,
    isLocked,
    canAfford,
    isReady,
    info,
    onSelect
}) => {
    return (
        <button
            onClick={() => !isLocked && onSelect(id)}
            className={`flex items-center gap-3 p-3.5 rounded-[1.8rem] border-[1.5px] transition-all group relative overflow-hidden ${isLocked
                ? 'grayscale opacity-60 cursor-not-allowed bg-black/20 border-white/5'
                : isReady
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.15)] animate-in fade-in zoom-in duration-300'
                    : isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_25px_rgba(79,70,229,0.15)]'
                        : 'bg-slate-900/80 border-white/5 hover:border-white/10 hover:bg-slate-800/80 shadow-lg'
                }`}
        >
            {isLocked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                    <Settings className="w-5 h-5 text-slate-500 animate-spin-slow" />
                </div>
            )}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform ${isReady ? 'bg-emerald-500/20' : isSelected ? 'bg-indigo-600/20' : 'bg-black/40'}`}>
                {info.icon}
            </div>
            <div className="flex-1 text-left min-w-0">
                <div className={`text-base font-black truncate tracking-tighter uppercase transition-colors ${isReady ? 'text-emerald-400' : isSelected ? 'text-indigo-300' : 'text-white'}`}>
                    {info.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-slate-700' : isReady ? 'bg-emerald-400 animate-pulse' : canAfford ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                    <span className={`text-xs font-black uppercase tracking-[0.05em] ${isLocked ? 'text-slate-600' : isReady ? 'text-emerald-400' : canAfford ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                        {isLocked ? 'Låst' : isReady ? 'Ferdig! Trykk for å hente' : canAfford ? 'Klar til bruk' : 'Mangler noe'}
                    </span>
                </div>
            </div>
            {!isLocked && (
                <ChevronRight className={`w-4 h-4 transition-transform ${isReady ? 'text-emerald-500' : isSelected ? 'text-indigo-400 translate-x-1' : 'text-slate-700'}`} />
            )}
        </button>
    );
};
