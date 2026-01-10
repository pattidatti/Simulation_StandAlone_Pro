import React, { useState } from 'react';
import { useSimulation } from '../SimulationContext';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { Sword, Shield, Castle, Hammer, AlertTriangle } from 'lucide-react';
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
    const swordsInInventory = player.resources?.siege_sword || 0;
    const armorInInventory = player.resources?.siege_armor || 0;

    // State for Sliders
    const [swordsToDeposit, setSwordsToDeposit] = useState(1);
    const [armorToDeposit, setArmorToDeposit] = useState(1);

    return (
        <SimulationMapWindow
            title="Krigsrommet"
            icon={<Castle className="w-8 h-8 text-rose-500" />}
            onClose={onClose}
        >
            <div className="space-y-6">
                {/* 1. HEADLINE STATUS & UPGRADES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CURRENT HP */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center">
                        <span className="text-game-stone_light text-[10px] uppercase font-bold mb-1 tracking-widest">Gjeldende Tilstand</span>
                        <div className="text-3xl font-black text-white flex items-center gap-3">
                            <Castle className="w-8 h-8 text-game-stone" />
                            {fort.hp} / {fort.maxHp} HP
                        </div>
                        <div className="w-full bg-black/50 h-3 mt-4 rounded-full overflow-hidden border border-white/5">
                            <div
                                className={`h-full transition-all duration-1000 ${fort.hp < fort.maxHp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${(fort.hp / fort.maxHp) * 100}%` }}
                            />
                        </div>
                        <div className="mt-4 flex gap-2 w-full">
                            <GameButton
                                variant="wood"
                                className="flex-1 text-xs py-3"
                                disabled={fort.hp >= fort.maxHp || (player.resources.stone || 0) < 10 || (player.resources.wood || 0) < 10}
                                onClick={() => onAction({ type: 'REPAIR_WALLS', amount: 1 })}
                                icon={<Hammer className="w-4 h-4" />}
                            >
                                Reparer Murer
                            </GameButton>
                        </div>
                    </div>

                    {/* UPGRADE FORTIFICATION */}
                    <div className="bg-amber-950/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-amber-500 font-bold uppercase tracking-widest text-xs">Festningsnivå: {fort.level || 1}</h3>
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">Neste: LVL {(fort.level || 1) + 1}</span>
                            </div>
                            <p className="text-slate-400 text-xs mb-4 leading-relaxed italic">
                                "En sterkere festning gir angriperne mer motstand i porten og gir bueskytterne dine bedre vinkler."
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-slate-300">
                                    <span>Kostnad:</span>
                                    <div className="flex gap-3">
                                        <span className={`flex items-center gap-1 ${(player.resources.gold || 0) < (fort.level || 1) * 5000 ? 'text-red-500 font-bold' : ''}`}>
                                            {(fort.level || 1) * 5000} <ResourceIcon resource="gold" size="sm" />
                                        </span>
                                        <span className={`flex items-center gap-1 ${(player.resources.stone || 0) < (fort.level || 1) * 100 ? 'text-red-500 font-bold' : ''}`}>
                                            {(fort.level || 1) * 100} <ResourceIcon resource="stone" size="sm" />
                                        </span>
                                        <span className={`flex items-center gap-1 ${(player.resources.wood || 0) < (fort.level || 1) * 100 ? 'text-red-500 font-bold' : ''}`}>
                                            {(fort.level || 1) * 100} <ResourceIcon resource="wood" size="sm" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <GameButton
                            variant="primary"
                            className="w-full mt-4 bg-amber-600 hover:bg-amber-500 border-amber-400 py-3"
                            disabled={
                                !!actionLoading ||
                                (player.resources.gold || 0) < (fort.level || 1) * 5000 ||
                                (player.resources.stone || 0) < (fort.level || 1) * 100 ||
                                (player.resources.wood || 0) < (fort.level || 1) * 100
                            }
                            onClick={() => onAction({ type: 'UPGRADE_FORTIFICATION' })}
                        >
                            Oppgrader Festning
                        </GameButton>
                    </div>
                </div>

                {/* 2. GARRISON MANAGEMENT */}
                <div className="bg-rose-950/10 border border-rose-500/10 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sword className="w-32 h-32 text-rose-500" />
                    </div>

                    <h3 className="text-white font-display font-bold text-2xl mb-6 flex items-center gap-3 relative z-10">
                        <Sword className="w-6 h-6 text-rose-500" />
                        Slottets Garnison
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        {/* SWORDS */}
                        <div className="bg-black/30 rounded-2xl p-6 border border-white/5 hover:border-rose-500/20 transition-colors">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20"><Sword className="w-8 h-8 text-rose-500" /></div>
                                    <div>
                                        <div className="text-white font-black uppercase tracking-tight">Angrepsvåpen</div>
                                        <div className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Lager: {garrison.swords} STK</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-rose-500/5 rounded-xl p-4 mb-6 border border-rose-500/10">
                                <h4 className="text-rose-200 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-400" /> Strategisk Effekt
                                </h4>
                                <p className="text-[11px] text-rose-200/60 leading-relaxed">
                                    Hvert 10. sverd i garnisonen øker skaden fra slottets bueskyttere med 1 poeng under en beleiring. Dette gjelder i Borggården (Fase 2).
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-500 italic">Din beholdning:</span>
                                    <span className="text-white">{swordsInInventory} sverd</span>
                                </div>
                                <div className="flex items-center gap-4 px-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max={Math.max(1, swordsInInventory)}
                                        value={swordsToDeposit}
                                        onChange={(e) => setSwordsToDeposit(parseInt(e.target.value))}
                                        className="flex-1 accent-rose-500 h-1.5 rounded-full bg-black/50"
                                        disabled={swordsInInventory < 1}
                                    />
                                    <span className="w-8 text-center text-sm font-black text-rose-500">{swordsToDeposit}</span>
                                </div>
                                <GameButton
                                    variant="primary"
                                    className="w-full bg-rose-600 hover:bg-rose-500 border-rose-400 py-4 font-black shadow-lg shadow-rose-900/20"
                                    disabled={swordsInInventory < 1 || !!actionLoading}
                                    onClick={() => onAction({ type: 'REINFORCE_GARRISON', resource: 'siege_sword', amount: swordsToDeposit })}
                                >
                                    Donér til Garnisonen
                                </GameButton>
                            </div>
                        </div>

                        {/* ARMOR */}
                        <div className="bg-black/30 rounded-2xl p-6 border border-white/5 hover:border-blue-500/20 transition-colors">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20"><Shield className="w-8 h-8 text-blue-500" /></div>
                                    <div>
                                        <div className="text-white font-black uppercase tracking-tight">Forsvarsrustning</div>
                                        <div className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Lager: {garrison.armor} STK</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/5 rounded-xl p-4 mb-6 border border-blue-500/10">
                                <h4 className="text-blue-200 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-blue-400" /> Strategisk Effekt
                                </h4>
                                <p className="text-[11px] text-blue-200/60 leading-relaxed">
                                    Donert rustning øker Garnisonssjefens HP i Borggården og gir herskeren en kraftig rustnings-buffer i Tronsalen (Fase 3).
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-500 italic">Din beholdning:</span>
                                    <span className="text-white">{armorInInventory} rustning</span>
                                </div>
                                <div className="flex items-center gap-4 px-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max={Math.max(1, armorInInventory)}
                                        value={armorToDeposit}
                                        onChange={(e) => setArmorToDeposit(parseInt(e.target.value))}
                                        className="flex-1 accent-blue-500 h-1.5 rounded-full bg-black/50"
                                        disabled={armorInInventory < 1}
                                    />
                                    <span className="w-8 text-center text-sm font-black text-blue-500">{armorToDeposit}</span>
                                </div>
                                <GameButton
                                    variant="primary"
                                    className="w-full bg-blue-600 hover:bg-blue-500 border-blue-400 py-4 font-black shadow-lg shadow-blue-900/20"
                                    disabled={armorInInventory < 1 || !!actionLoading}
                                    onClick={() => onAction({ type: 'REINFORCE_GARRISON', resource: 'siege_armor', amount: armorToDeposit })}
                                >
                                    Styrk Forsvaret
                                </GameButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SimulationMapWindow>
    );
};
