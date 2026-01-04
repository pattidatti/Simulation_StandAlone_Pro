import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ITEM_TEMPLATES } from '../constants';

interface StatsComparisonProps {
    recipe: any;
    player: any;
    type: 'REFINE' | 'CRAFT';
}

export const StatsComparison: React.FC<StatsComparisonProps> = ({ recipe, player, type }) => {
    if (type !== 'CRAFT') return null;

    const nextItem = ITEM_TEMPLATES[recipe.outputItemId];
    if (!nextItem) return null;

    const currentItem = Object.values(player.equipment || {}).find((e: any) => e && e.type === nextItem.type);

    return (
        <div className="space-y-4 pb-2 border-b border-white/5">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">Verktøyets egenskaper</span>
                    {currentItem ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {(() => {
                                const targetYield = nextItem.stats?.yieldBonus || 0;
                                const currentYield = (currentItem as any)?.stats?.yieldBonus || 0;
                                const targetSpeed = nextItem.stats?.speedBonus || 1;
                                const currentSpeed = (currentItem as any)?.stats?.speedBonus || 1;

                                const isUpgrade = targetYield > currentYield || targetSpeed > currentSpeed;
                                const isDowngrade = targetYield < currentYield || targetSpeed < currentSpeed;
                                const isSame = !isUpgrade && !isDowngrade;

                                if (isSame) return <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-md border border-slate-500/20">Samme verktøy</span>;
                                if (isUpgrade) return <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Bedre egenskaper</span>;
                                return <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">Dårligere egenskaper</span>;
                            })()}
                        </div>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mt-1">Nytt verktøy</span>
                    )}
                </div>
                {currentItem ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                        <span className="text-sm">{(currentItem as any).icon}</span>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-tight">{(currentItem as any).name}</span>
                    </div>
                ) : (
                    <span className="text-xs text-slate-600 italic uppercase font-bold">Uten utstyr</span>
                )}
            </div>

            <div className="space-y-2">
                {/* Yield Bonus comparison */}
                {((nextItem.stats?.yieldBonus || 0) > 0 || ((currentItem as any)?.stats?.yieldBonus || 0) > 0) && (
                    <div className="flex items-center justify-between text-sm py-1">
                        <span className="font-bold text-slate-300">Utbytte-bonus <span className="text-[10px] opacity-40 uppercase">(V/BRUK)</span></span>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-bold">{(currentItem as any)?.stats?.yieldBonus || 0}</span>
                            <div className="flex items-center opacity-30">
                                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            {(() => {
                                const target = nextItem.stats?.yieldBonus || 0;
                                const current = (currentItem as any)?.stats?.yieldBonus || 0;
                                const delta = target - current;
                                return (
                                    <div className="flex items-center gap-1.5">
                                        <span className={`font-black ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-white'}`}>{target}</span>
                                        {delta !== 0 && (
                                            <span className={`text-[10px] font-black ${delta > 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>({delta > 0 ? '+' : ''}{delta})</span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
                {/* Speed Bonus comparison */}
                {((nextItem.stats?.speedBonus || 1) > 1 || ((currentItem as any)?.stats?.speedBonus || 1) > 1) && (
                    <div className="flex items-center justify-between text-sm py-1">
                        <span className="font-bold text-slate-300">Hastighet <span className="text-[10px] opacity-40 uppercase">(V/BRUK)</span></span>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-bold">{Math.round((((currentItem as any)?.stats?.speedBonus || 1) - 1) * 100)}%</span>
                            <div className="flex items-center opacity-30">
                                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            {(() => {
                                const target = Math.round(((nextItem.stats?.speedBonus || 1) - 1) * 100);
                                const current = Math.round((((currentItem as any)?.stats?.speedBonus || 1) - 1) * 100);
                                const delta = target - current;
                                return (
                                    <div className="flex items-center gap-1.5">
                                        <span className={`font-black ${delta > 0 ? 'text-blue-400' : delta < 0 ? 'text-rose-400' : 'text-white'}`}>{target > 0 ? '+' : ''}{target}%</span>
                                        {delta !== 0 && (
                                            <span className={`text-[10px] font-black ${delta > 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>({delta > 0 ? '+' : ''}{delta}%)</span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
