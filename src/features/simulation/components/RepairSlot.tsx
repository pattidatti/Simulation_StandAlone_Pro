import React from 'react';
import { Wrench } from 'lucide-react';

interface RepairSlotProps {
    slot: string;
    item: any;
    isSelected: boolean;
    onSelect: (slot: string) => void;
}

export const RepairSlot: React.FC<RepairSlotProps> = ({
    slot,
    item,
    isSelected,
    onSelect
}) => {
    const isDamaged = item.durability < item.maxDurability;

    return (
        <button
            onClick={() => onSelect(slot)}
            className={`w-full flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all group relative overflow-hidden ${isSelected
                ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : isDamaged
                    ? 'border-amber-500/20 bg-slate-900/80 hover:border-amber-500/40 hover:bg-slate-900/90'
                    : 'border-white/5 bg-slate-900/60 opacity-60 grayscale'
                }`}
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner transition-colors ${isSelected ? 'bg-amber-500/20' : 'bg-black/40'
                }`}>
                {item.icon}
            </div>
            <div className="flex-1 text-left">
                <div className="text-lg font-black text-white leading-tight flex items-center gap-2">
                    {item.name}
                    {isSelected && <Wrench className="w-4 h-4 text-amber-500 animate-pulse" />}
                </div>
                <div className="flex flex-col mt-1">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                        <span>Holdbarhet</span>
                        <span className={isDamaged ? (isSelected ? 'text-amber-400' : 'text-amber-500') : 'text-emerald-500'}>
                            {item.durability}/{item.maxDurability}
                        </span>
                    </div>
                    <div className="w-full h-1 bg-black/40 rounded-full mt-1 overflow-hidden">
                        <div
                            className={`h-full transition-all ${isDamaged ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(item.durability / item.maxDurability) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {isSelected && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-amber-500 opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                </div>
            )}
        </button>
    );
};
