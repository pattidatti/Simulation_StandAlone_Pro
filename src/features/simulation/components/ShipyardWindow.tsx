import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Hammer, Anchor, Palette, ArrowUp, Check, Box, Wind, Heart } from 'lucide-react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { ShipyardVisualizer } from './ShipyardVisualizer';
import { SimulationPlayer } from '../simulationTypes';
import { BOAT_MODELS, BOAT_UPGRADES, COSMETIC_UNLOCKS } from '../constants';
import { InkButton, WaxSeal, ActionListRow, ConfirmationOverlay } from './ShipyardUI';
import { ResourceIcon } from '../ui/ResourceIcon';

interface ShipyardWindowProps {
    player: SimulationPlayer;
    room: any;
    onClose: () => void;
    onAction: (action: any) => void;
}

const TABS = [
    { id: 'construct', label: 'Construction', icon: Hammer },
    { id: 'upgrade', label: 'The Ledger', icon: ArrowUp },
    { id: 'models', label: 'Models', icon: Anchor },
    { id: 'cosmetics', label: 'Aesthetics', icon: Palette },
] as const;

const ShipyardWindowComponent: React.FC<ShipyardWindowProps> = ({ player, onClose, onAction }) => {
    const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('construct');

    // --- ROBUST INITIALIZATION (Crash Prevention) ---
    // Ensure the boat object and its deep properties exist to prevent runtime errors (e.g. 'includes' on undefined)
    // --- DATA PREP ---
    const boat = {
        stage: player.boat?.stage ?? 0,
        hullType: player.boat?.hullType ?? 'oak_standard',
        model: player.boat?.model ?? 'standard',
        hp: player.boat?.hp,
        maxHp: player.boat?.maxHp || BOAT_MODELS[player.boat?.model as keyof typeof BOAT_MODELS]?.baseHp || 100,
        componentLevels: {
            sails: player.boat?.componentLevels?.sails ?? 0,
            hull: player.boat?.componentLevels?.hull ?? 0,
            cannons: player.boat?.componentLevels?.cannons ?? 0,
            nets: player.boat?.componentLevels?.nets ?? 0
        },
        customization: {
            color: player.boat?.customization?.color ?? '#4b2c20',
            flagId: player.boat?.customization?.flagId ?? 'none',
            figurehead: player.boat?.customization?.figurehead ?? 'none',
            unlocked: Array.isArray(player.boat?.customization?.unlocked) ? player.boat.customization.unlocked : []
        }
    };

    // --- STATE ---
    const [confirmingItem, setConfirmingItem] = useState<{
        action: any;
        label: string;
        cost: Record<string, number>;
    } | null>(null);

    const handleAction = (action: any, label?: string, cost?: Record<string, number>) => {
        // If it's a purchase (Buy Model or Cosmetic) that isn't free, require confirmation
        if (['BUY_BOAT_MODEL', 'BUY_BOAT_COSMETIC'].includes(action.type) && cost && Object.keys(cost).length > 0) {
            setConfirmingItem({ action, label: label || 'Ukjent Vare', cost });
        } else {
            // Direct action (Upgrades, Construction, Free items)
            onAction(action);
        }
    };

    const confirmPurchase = () => {
        if (confirmingItem) {
            onAction(confirmingItem.action);
            setConfirmingItem(null);
        }
    };



    return (
        <SimulationMapWindow title="" onClose={onClose} maxWidth="max-w-7xl" hideHeader={true} noPadding={true}>
            <div className="flex flex-col h-[700px] w-full overflow-hidden rounded-b-xl shadow-2xl bg-[#0f0a05] relative">

                {/* CONFIRMATION OVERLAY */}
                <AnimatePresence>
                    {confirmingItem && (
                        <ConfirmationOverlay
                            isOpen={true}
                            title={confirmingItem.label}
                            cost={confirmingItem.cost}
                            onConfirm={confirmPurchase}
                            onCancel={() => setConfirmingItem(null)}
                        />
                    )}
                </AnimatePresence>

                {/* HEADER: TITLE & TABS (THE BINDING) */}
                <div className="h-24 bg-[#2a1b12] flex items-center justify-between px-10 border-b border-[#453020] relative z-20 shadow-xl">
                    {/* Branding */}
                    <div className="flex items-center gap-6">
                        <Anchor className="text-amber-500 drop-shadow-md" size={40} />
                        <div>
                            <h2 className="text-2xl font-serif font-black text-[#e7ded0] uppercase tracking-[0.2em] leading-none">
                                Kongelig <span className="text-amber-500">Skipsverft</span>
                            </h2>
                            <div className="h-1 w-16 bg-amber-600 mt-2 rounded-full opacity-60" />
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-2 h-full pt-6 pr-12 relative z-30">
                        {TABS.map(tab => {
                            const isConstruction = tab.id === 'construct';
                            const disabled = !isConstruction && boat.stage < 4;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    disabled={disabled}
                                    className={`
                                        flex items-center gap-3 px-8 h-full rounded-t-lg transition-all group relative overflow-hidden
                                        ${isActive
                                            ? 'bg-[#d6cbb8] text-[#2a1b12] shadow-[0_-5px_20px_rgba(0,0,0,0.3)] scale-y-110 translate-y-1'
                                            : 'bg-transparent text-[#a8a29e] hover:bg-[#453020] hover:text-[#e7ded0]'}
                                        ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}
                                    `}
                                >
                                    <tab.icon size={18} className={isActive ? 'text-[#b45309]' : 'text-[#57534e] group-hover:text-[#e7ded0]'} />
                                    <span className="font-serif font-bold uppercase tracking-widest text-sm">
                                        {{
                                            'Construction': 'Konstruksjon',
                                            'The Ledger': 'Loggbok',
                                            'Models': 'Modeller',
                                            'Aesthetics': 'Estetikk'
                                        }[tab.label]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-rose-900/40 text-[#a8a29e] hover:text-rose-400 rounded-full flex items-center justify-center transition-all group border border-white/5 z-50 backdrop-blur-sm"
                        title="Lukk Vinduet"
                    >
                        <span className="text-xl group-hover:rotate-90 transition-transform">✕</span>
                    </button>
                </div>

                {/* BODY: VISUALIZER & CONTENT */}
                <div className="flex-1 grid grid-cols-[40%_60%] min-h-0 overflow-hidden bg-[#0c0a09]">

                    {/* LEFT: VISUALIZER */}
                    <div className="relative border-r border-[#292524] bg-[#1c1917]">
                        {/* Dark Wood/Sea Texture */}
                        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q25 20 50 10 T100 10' fill='none' stroke='%2338bdf8' opacity='0.05'/%3E%3C/svg%3E")`
                        }} />

                        <div className="h-full flex items-center justify-center p-8 relative z-10">
                            <ShipyardVisualizer
                                stage={boat.stage}
                                model={boat.model}
                                componentLevels={boat.componentLevels}
                                customization={boat.customization}
                            />
                        </div>

                        <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                            <span className="font-serif italic text-[#57534e] text-sm opacity-50">Fig. {boat.model.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* RIGHT: CONTENT (Parchment) */}
                    <div className="relative bg-[#d6cbb8] flex flex-col h-full overflow-hidden shadow-[inset_10px_0_30px_rgba(0,0,0,0.3)]">
                        {/* Paper Texture */}
                        <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-multiply" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                        }} />

                        <div className="flex-1 overflow-hidden p-8 relative z-10">
                            <div className="h-full relative overflow-hidden">
                                {activeTab === 'construct' && <ConstructionView boat={boat} player={player} onAction={handleAction} />}
                                {activeTab === 'upgrade' && <UpgradeView boat={boat} player={player} onAction={handleAction} />}
                                {activeTab === 'models' && <ModelsView boat={boat} player={player} onAction={handleAction} />}
                                {activeTab === 'cosmetics' && <CosmeticsView boat={boat} onAction={handleAction} />}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </SimulationMapWindow>
    );
};

// --- EXTRACTED COMPONENTS (To prevent re-renders) ---

const ConstructionView = ({ boat, player, onAction }: any) => {
    console.log('[Shipyard] Rendering ConstructionView', { boat, stage: boat?.stage, player });

    if (!player || !boat) {
        console.error('[Shipyard] ConstructionView missing props', { player, boat });
        return <div className="p-8 text-red-500 font-bold">Error: Missing Data</div>;
    }

    const stage = boat.stage ?? 0;

    // Safety check for stage
    const currentStageName = ['Kjølstrekking', 'Mast & Rigg', 'Dekk & Detaljer', 'Sjøsetting'][stage] || 'Ukjent Fase';

    const nextStage = stage < 4 ? {
        stage: stage + 1,
        name: currentStageName,
        reqs: ([
            { plank: 20 },
            { plank: 40, linen_canvas: 10 },
            { plank: 30, iron_ingot: 10 },
            { plank: 50, tar: 20 }
        ][stage]) || {} // Fallback to empty object if out of bounds
    } : null;

    const isFinished = stage >= 4;
    const hp = boat.hp ?? boat.maxHp ?? 100;
    const maxHp = boat.maxHp ?? 100;
    const hpPercent = (hp / maxHp) * 100;
    const isDamaged = hp < maxHp;

    const missingHp = maxHp - hp;
    const itemsNeeded = Math.ceil(missingHp / 10);
    const repairCost = isDamaged ? { plank: itemsNeeded, tar: itemsNeeded } : {};

    return (
        <div className="p-8 flex flex-col gap-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-stone-400 scrollbar-track-transparent">
            <div>
                <h3 className="text-4xl font-serif font-black uppercase text-amber-900 tracking-[0.2em] mb-2 drop-shadow-sm">
                    {isFinished ? "VEDLIKEHOLD" : `FASE ${stage + 1}`}
                </h3>
                <p className="text-stone-700 font-serif italic text-lg tracking-wide">
                    {isFinished ? "Verft & Reparasjon" : nextStage?.name}
                </p>
            </div>

            {/* MAINTENANCE DOCK (For Finished Boats) */}
            {isFinished && (
                <div className="bg-[#292524] rounded-sm p-6 border border-white/5 relative overflow-hidden group shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold text-stone-400 uppercase tracking-widest font-serif flex items-center gap-2">
                            <Heart size={14} className={isDamaged ? "text-rose-500" : "text-emerald-500"} />
                            Skrog Integritet
                        </span>
                        <span className={`font-mono text-lg font-bold ${isDamaged ? "text-rose-500" : "text-emerald-500"}`}>
                            {hp} / {maxHp} HP
                        </span>
                    </div>

                    {/* HP Bar */}
                    <div className="h-4 bg-black/40 rounded-full overflow-hidden mb-8 border border-white/5 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex justify-between px-1 opacity-20">
                            {[...Array(9)].map((_, i) => <div key={i} className="w-[1px] h-full bg-white" />)}
                        </div>
                        <div
                            className={`h-full transition-all duration-1000 ease-out relative ${isDamaged ? "bg-rose-600" : "bg-emerald-600"}`}
                            style={{ width: `${hpPercent}%` }}
                        >
                            <div className="absolute inset-0 bg-white/10" />
                        </div>
                    </div>

                    {isDamaged ? (
                        <>
                            <div className="flex items-center gap-4 mb-6 p-4 bg-black/20 rounded border border-white/5">
                                <span className="text-stone-400 text-sm font-serif italic">Reparasjonskostnad:</span>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <ResourceIcon resource="plank" size="sm" amount={repairCost.plank} className={player.resources.plank >= itemsNeeded ? "text-[#e7ded0]" : "text-rose-500 font-bold"} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ResourceIcon resource="tar" size="sm" amount={repairCost.tar} className={player.resources.tar >= itemsNeeded ? "text-[#e7ded0]" : "text-rose-500 font-bold"} />
                                    </div>
                                </div>
                            </div>

                            <InkButton
                                onClick={() => onAction({ type: 'REPAIR_BOAT' }, "Reparer Skrog", repairCost)}
                                disabled={(player.resources.plank || 0) < itemsNeeded || (player.resources.tar || 0) < itemsNeeded}
                                className="w-full py-4 text-sm"
                            >
                                Utfør Reparasjon
                            </InkButton>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 gap-4 opacity-80">
                            <WaxSeal label="GODKJENT" color="#10b981" />
                            <span className="text-emerald-500/50 text-xs font-black tracking-[0.3em] uppercase">Ingen feil funnet</span>
                        </div>
                    )}
                </div>
            )}

            {/* CONSTRUCTION PREVIEW (For Unfinished Boats) */}
            {!isFinished && nextStage && (
                <div className="bg-[#292524] rounded-sm p-6 border border-white/5 relative overflow-hidden group shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <span className="text-sm font-bold text-stone-400 uppercase tracking-widest font-serif">Nødvendige Materialer</span>
                        <span className="font-serif font-bold text-[#b45309] text-lg">Steg {nextStage.stage}/4</span>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        {Object.entries(nextStage.reqs as unknown as Record<string, number>).map(([res, amt]) => {
                            const has = (player.resources as any)[res] || 0;
                            const ok = has >= (amt as number);
                            return (
                                <div key={res} className={`flex justify-between items-center pb-2 border-b ${ok ? 'border-green-800/20' : 'border-red-800/20'}`}>
                                    <ResourceIcon resource={res} size="sm" showLabel />
                                    <span className={`font-mono text-lg font-bold ${ok ? 'text-green-500' : 'text-red-500'}`}>
                                        {has} / {amt as number}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <InkButton
                        onClick={() => onAction({ type: 'CONTRIBUTE_TO_BOAT', stage: nextStage.stage, resources: nextStage.reqs })}
                        className="w-full py-5 text-base"
                    >
                        Start Bygging
                    </InkButton>
                </div>
            )}
        </div>
    );
};

const UpgradeView = ({ boat, player, onAction }: any) => {
    return (
        <div className="flex flex-col pb-10 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-[#b45309]/20 px-4">
            {Object.entries(BOAT_UPGRADES).map(([key, def]) => {
                const currentLevel = (boat.componentLevels as any)[key] || 0;
                const maxLevel = def.levels.length;
                const nextLevelDef = def.levels[currentLevel];

                return (
                    <ActionListRow
                        key={key}
                        title={def.name}
                        level={currentLevel}
                        maxLevel={maxLevel}
                        description={def.description}
                        effect={nextLevelDef?.effect}
                        cost={nextLevelDef?.cost || {}}
                        playerResources={player.resources}
                        onAction={() => onAction({ type: 'UPGRADE_BOAT_COMPONENT', componentId: key })} // Upgrades are instant/no confirm needed or low friction
                    />
                );
            })}
        </div>
    );
};

const ModelsView = ({ boat, player, onAction }: any) => {
    return (
        <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-stone-400 scrollbar-track-transparent">
            {Object.values(BOAT_MODELS).map((model) => {
                const isOwned = boat.model === model.id;

                return (
                    <div
                        key={model.id}
                        className={`relative p-8 rounded border transition-all ${isOwned ? 'bg-[#e7ded0] border-[#b45309]' : 'bg-[#e0d5c1] border-[#c0b39c]'}`}
                    >
                        {isOwned && <div className="absolute top-4 right-4 text-[#b45309] opacity-20"><Anchor size={80} /></div>}

                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex-1">
                                <h4 className={`text-2xl font-black uppercase tracking-[0.1em] mb-2 font-serif ${isOwned ? 'text-amber-700' : 'text-stone-800'}`}>
                                    {model.name}
                                </h4>
                                <div className="flex gap-6 text-xs font-mono text-stone-600 mb-6 uppercase tracking-widest">
                                    <span className="flex items-center gap-1 font-bold"><Box size={14} /> {model.baseHp} HP</span>
                                    <span className="flex items-center gap-1 font-bold"><Wind size={14} /> {model.baseSpeed} KNOP</span>
                                </div>
                                <p className="text-base text-stone-700 max-w-lg italic border-l-4 border-[#292524]/10 pl-4 py-1 mb-4">
                                    "{model.description}"
                                </p>
                            </div>

                            {isOwned ? (
                                <div className="flex flex-col items-center justify-center h-full pl-8">
                                    <WaxSeal label="Aktiv" color="#b45309" />
                                </div>
                            ) : (
                                <div className="text-right flex flex-col items-end gap-3 pl-8 min-w-[200px]">
                                    <InkButton
                                        onClick={() => onAction({ type: 'BUY_BOAT_MODEL', modelId: model.id }, `Kjøp Skjøte: ${model.name}`, model.cost)}
                                        className="mb-2 w-full py-3 text-sm"
                                    >
                                        Kjøp Skjøte
                                    </InkButton>
                                    <div className="flex flex-wrap justify-end gap-2 mt-2">
                                        {Object.entries(model.cost).map(([res, amt]) => {
                                            const playerAmt = (player.resources as any)[res] || 0;
                                            const canAffordRes = playerAmt >= (amt as number);
                                            return (
                                                <div key={res} className={`bg-stone-800/10 rounded px-2 py-1 ${!canAffordRes ? 'bg-rose-900/10 border border-rose-900/30' : ''}`}>
                                                    <ResourceIcon
                                                        resource={res}
                                                        amount={amt as number}
                                                        size="sm"
                                                        className={canAffordRes ? "text-[#292524]" : "text-rose-700 font-bold"}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

};

export const ShipyardWindow: React.FC<ShipyardWindowProps> = (props) => {
    return <ShipyardWindowComponent {...props} />;
};

const CosmeticsView = ({ boat, onAction }: any) => {
    return (
        <div className="p-6 space-y-8 overflow-y-auto max-h-[600px]">
            {/* Colors */}
            <div>
                <h4 className="text-xs font-black text-stone-700 uppercase tracking-[0.2em] mb-6 border-b border-stone-400/30 pb-2 font-serif">Skrogmaling</h4>
                <div className="flex gap-4 flex-wrap">
                    {COSMETIC_UNLOCKS.colors.map(c => {
                        const isUnlocked = boat.customization.unlocked.includes(c.id) || (c.cost as any)?.gold === undefined;
                        const isActive = boat.customization.color === c.hex;

                        return (
                            <button
                                key={c.id}
                                onClick={() => onAction(
                                    { type: 'BUY_BOAT_COSMETIC', cosmeticType: 'color', id: c.id },
                                    `Maling: ${c.name}`,
                                    !isUnlocked ? c.cost : {}
                                )}
                                className={`relative w-16 h-16 rounded shadow-sm transition-all ${isActive ? 'ring-4 ring-amber-600 ring-offset-2 ring-offset-[#d6cbb8] scale-105' : 'hover:scale-105 ring-1 ring-stone-900/10'}`}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                            >
                                {!isUnlocked && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                                        <span className="text-[10px] text-white font-bold bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                            {(c.cost as any)?.gold}g
                                        </span>
                                    </div>
                                )}
                                {isActive && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Check size={28} className="text-white drop-shadow-md" strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

