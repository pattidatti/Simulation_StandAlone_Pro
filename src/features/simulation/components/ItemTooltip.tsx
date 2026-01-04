import React from 'react';
import { Box, Timer } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ITEM_TEMPLATES } from '../data/items';

interface ItemTooltipProps {
    content: any;
    position: { x: number, y: number };
}

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ content, position }) => {
    if (!content) return null;

    const { type, data } = content;
    const isResource = type === 'resource';

    // Lookup template if it's a resource (to get description/type/proper name)
    const template = data?.id ? (ITEM_TEMPLATES as any)[data.id] : null;

    // Merge data: Prefer explicit data, then template data, then fallbacks
    const displayData = {
        ...data,
        name: data.name || template?.name || data.id,
        icon: data.icon || template?.icon || '📦',
        description: data.description || template?.description || (isResource ? `En verdifull ressurs brukt til håndverk og handel.` : ''),
        type: data.type || template?.type || (isResource ? 'RESOURCE' : 'ITEM'),
        // Ensure stats and durability are preserved if they exist on data
        stats: data.stats || template?.stats,
        durability: data.durability,
        maxDurability: data.maxDurability || template?.maxDurability
    };

    return createPortal(
        <div
            className="fixed z-[9999] pointer-events-none transition-transform duration-75 ease-out"
            style={{
                left: position.x + 15,
                top: position.y + 15,
                transform: 'translate3d(0, 0, 0)'
            }}
        >
            <div className="bg-slate-950/95 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[240px] animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                        {displayData.icon}
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white leading-tight">{displayData.name}</h4>
                        <span className="text-xs font-black uppercase text-indigo-400 tracking-[0.2em]">
                            {displayData.type === 'CONSUMABLE' ? 'Matvare' : isResource ? 'Ressurs' : 'Gjenstand'}
                        </span>
                    </div>
                </div>

                {/* Description */}
                {displayData.description && (
                    <p className="text-xs text-slate-300 leading-relaxed italic mb-4 opacity-80">
                        {displayData.description}
                    </p>
                )}

                {/* Stats */}
                {!isResource && displayData.stats && (
                    <div className="space-y-2 border-t border-white/10 pt-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Box className="w-3 h-3 text-slate-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Egenskaper</span>
                        </div>
                        {Object.entries(displayData.stats).map(([stat, value]) => (
                            <div key={stat} className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 capitalize">{stat.replace('Bonus', '')}</span>
                                <span className="text-emerald-400 font-mono font-bold">
                                    {typeof value === 'number' && value > 1 ? `x${value}` : typeof value === 'number' && value < 1 ? `+${Math.round(value * 100)}%` : `+${value}`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Durability */}
                {!isResource && displayData.durability !== undefined && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                            <span className="flex items-center gap-1.5"><Timer className="w-3 h-3" /> Holdbarhet</span>
                            <span>{displayData.durability} / {displayData.maxDurability}</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden p-[1px]">
                            <div
                                className={`h-full rounded-full transition-all ${(displayData.durability / displayData.maxDurability) < 0.2 ? 'bg-red-500' :
                                    (displayData.durability / displayData.maxDurability) < 0.5 ? 'bg-yellow-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${(displayData.durability / displayData.maxDurability) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Resource Info */}
                {isResource && (
                    <div className="mt-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">
                            Beholdning: <span className="text-white ml-2">{data.amount}</span>
                        </p>
                    </div>
                )}

                {/* Consumable Hint */}
                {(displayData.type === 'CONSUMABLE') && (
                    <div className="mt-4 text-center">
                        <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 animate-pulse shadow-lg shadow-emerald-500/10">
                            Trykk for å spise
                        </span>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
