import React, { useState } from 'react';
import { useSimulation } from '../SimulationContext';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { Sword, Shield, Castle, Coins, Hammer, AlertTriangle } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { ResourceIcon } from '../ui/ResourceIcon';
import type { SimulationPlayer, SimulationRegion } from '../simulationTypes';

interface SimulationWarRoomProps {
    player: SimulationPlayer;
    regions: Record<string, SimulationRegion>;
    onAction: (action: any) => void;
    onClose: () => void;
}

export const SimulationWarRoom: React.FC<SimulationWarRoomProps> = ({ player, regions, onAction, onClose }) => {
    const { actionLoading } = useSimulation();

    // 1. Validate Access
    // Must be Baron or King.
    if (player.role !== 'BARON' && player.role !== 'KING') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                <div className="bg-red-950/50 border border-red-500/50 rounded-2xl p-8 max-w-md text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Adgang Forbudt</h2>
                    <p className="text-red-200">Kun regionens hersker har adgang til Krigsrommet.</p>
                    <GameButton onClick={onClose} className="mt-6" variant="wood">
                        <span className="text-white">Forlat området</span>
                    </GameButton>
                </div>
            </div>
        );
    }

    // 2. Identify Region
    const governedRegionId = player.regionId === 'capital' ? 'capital' : player.regionId;
    const region = regions[governedRegionId] || {
        id: governedRegionId,
        name: 'Ukjent Region',
        defenseLevel: 1,
        taxRate: 10,
        garrison: { swords: 0, armor: 0, morale: 100 },
        fortification: { hp: 1000, maxHp: 1000, level: 1 }
    };

    // Safe access
    const garrison = region.garrison || { swords: 0, armor: 0, morale: 100 };
    const fort = region.fortification || { hp: 1000, maxHp: 1000, level: 1 };

    // Inventory Analysis
    const swordsInInventory = player.inventory?.filter(i => i.id === 'iron_sword').length || 0;
    const armorInInventory = player.inventory?.filter(i => i.id === 'leather_armor').length || 0;

    // State for Sliders
    const [swordsToDeposit, setSwordsToDeposit] = useState(1);
    const [armorToDeposit, setArmorToDeposit] = useState(1);
    const [taxRate, setTaxRate] = useState(region.taxRate || 10);

    return (
        <SimulationMapWindow
            title="Krigsrommet"
            icon={<Castle className="w-8 h-8 text-rose-500" />}
            onClose={onClose}
        >
            <div className="space-y-8">

                {/* HEADLINE STATUS */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center">
                        <span className="text-game-stone_light text-xs uppercase font-bold mb-1">Festningsverk</span>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            <Castle className="w-6 h-6 text-game-stone" />
                            {fort.hp} / {fort.maxHp} HP
                        </div>
                        <div className="w-full bg-black/50 h-2 mt-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${fort.hp < fort.maxHp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${(fort.hp / fort.maxHp) * 100}%` }}
                            />
                        </div>
                        <GameButton
                            variant="wood"
                            size="sm"
                            className="mt-3 w-full text-xs"
                            disabled={fort.hp >= fort.maxHp || (player.resources.stone || 0) < 10}
                            onClick={() => onAction({ type: 'REPAIR_WALLS', amount: 1 })}
                            icon={<Hammer className="w-3 h-3" />}
                        >
                            Reparer (10 <ResourceIcon resource="stone" size="sm" /> 10 <ResourceIcon resource="wood" size="sm" />)
                        </GameButton>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center">
                        <span className="text-game-stone_light text-xs uppercase font-bold mb-1">Skattekiste</span>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            <Coins className="w-6 h-6 text-game-gold" />
                            {player.resources.gold?.toFixed(0) || 0}g
                        </div>
                        <div className="w-full mt-2 space-y-2">
                            <div className="flex justify-between items-center text-xs text-game-stone_light">
                                <span>Skattetrykk:</span>
                                <span className={`${taxRate > 15 ? 'text-red-400' : 'text-emerald-400'}`}>{taxRate}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                value={taxRate}
                                onChange={(e) => setTaxRate(parseInt(e.target.value))}
                                onMouseUp={() => onAction({ type: 'SET_TAX', newRate: taxRate })}
                                onTouchEnd={() => onAction({ type: 'SET_TAX', newRate: taxRate })}
                                className="w-full accent-game-gold cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* GARRISON MANAGEMENT */}
                <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-6">
                    <h3 className="text-white font-display font-bold text-xl mb-4 flex items-center gap-2">
                        <Sword className="w-5 h-5 text-rose-500" />
                        Garnisonen
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* SWORDS */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-rose-500/10 p-2 rounded-lg"><Sword className="w-6 h-6 text-rose-500" /></div>
                                    <div>
                                        <div className="text-white font-bold">Angrepsstyrke</div>
                                        <div className="text-rose-200 text-xs">Jernsverd donert</div>
                                    </div>
                                </div>
                                <span className="text-2xl font-black text-rose-500">{garrison.swords}</span>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex justify-between text-xs text-game-stone_light">
                                    <span>Din beholdning:</span>
                                    <span className="text-white font-bold">{swordsInInventory} stk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max={Math.max(1, swordsInInventory)}
                                        value={swordsToDeposit}
                                        onChange={(e) => setSwordsToDeposit(parseInt(e.target.value))}
                                        className="flex-1 accent-rose-500"
                                        disabled={swordsInInventory < 1}
                                    />
                                    <span className="w-8 text-center text-sm font-bold">{swordsToDeposit}</span>
                                </div>
                                <GameButton
                                    variant="primary"
                                    className="w-full bg-rose-600 hover:bg-rose-500 border-rose-400"
                                    disabled={swordsInInventory < 1 || !!actionLoading}
                                    onClick={() => onAction({ type: 'REINFORCE_GARRISON', resource: 'swords', amount: swordsToDeposit })}
                                >
                                    Donér {swordsToDeposit} Sverd
                                </GameButton>
                            </div>
                        </div>

                        {/* ARMOR */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/10 p-2 rounded-lg"><Shield className="w-6 h-6 text-blue-500" /></div>
                                    <div>
                                        <div className="text-white font-bold">Forsvarsstyrke</div>
                                        <div className="text-blue-200 text-xs">Rustninger donert</div>
                                    </div>
                                </div>
                                <span className="text-2xl font-black text-blue-500">{garrison.armor}</span>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex justify-between text-xs text-game-stone_light">
                                    <span>Din beholdning:</span>
                                    <span className="text-white font-bold">{armorInInventory} stk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max={Math.max(1, armorInInventory)}
                                        value={armorToDeposit}
                                        onChange={(e) => setArmorToDeposit(parseInt(e.target.value))}
                                        className="flex-1 accent-blue-500"
                                        disabled={armorInInventory < 1}
                                    />
                                    <span className="w-8 text-center text-sm font-bold">{armorToDeposit}</span>
                                </div>
                                <GameButton
                                    variant="primary"
                                    className="w-full bg-blue-600 hover:bg-blue-500 border-blue-400"
                                    disabled={armorInInventory < 1 || !!actionLoading}
                                    onClick={() => onAction({ type: 'REINFORCE_GARRISON', resource: 'armor', amount: armorToDeposit })}
                                >
                                    Donér {armorToDeposit} Rustning
                                </GameButton>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </SimulationMapWindow>
    );
};
