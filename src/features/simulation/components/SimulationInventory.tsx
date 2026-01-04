import React from 'react';
import type { SimulationPlayer } from '../simulationTypes';
import { RESOURCE_DETAILS } from '../constants';
import { GameCard } from '../ui/GameCard';
import { ResourceIcon } from '../ui/ResourceIcon';
import { Package } from 'lucide-react';

interface SimulationInventoryProps {
    player: SimulationPlayer;
}

export const SimulationInventory: React.FC<SimulationInventoryProps> = ({ player }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <h2 className="text-3xl font-display font-bold text-white tracking-wider uppercase flex items-center gap-3">
                    <Package className="w-8 h-8 text-game-wood_light" />
                    Min Oppakning
                </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.entries(player.resources || {}).map(([resId, amount]) => {
                    // Gold is often shown in header, but we can show it here too or skip it
                    if (resId === 'manpower') return null;

                    return (
                        <GameCard key={resId} className="flex flex-col items-center text-center p-6 group hover:bg-white/5 transition-colors">
                            <div className="mb-4 transform group-hover:scale-110 transition-transform">
                                <ResourceIcon resource={resId} size="lg" />
                            </div>
                            <div className="text-3xl font-display font-bold text-white">{amount as number}</div>
                            <div className="text-xs font-bold uppercase text-game-stone_light tracking-widest mt-1">
                                {(RESOURCE_DETAILS as any)[resId]?.label || resId}
                            </div>
                        </GameCard>
                    );
                })}
            </div>
        </div>
    );
};
