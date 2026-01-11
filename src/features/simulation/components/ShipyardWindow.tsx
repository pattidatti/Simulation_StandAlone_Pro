import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hammer, Anchor, Palette, ArrowUp, Lock, Check } from 'lucide-react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { ModularBoatSVG } from './ModularBoatSVG';
import { SimulationPlayer, Resources } from '../simulationTypes';
import { BOAT_MODELS, BOAT_UPGRADES, COSMETIC_UNLOCKS } from '../constants';

interface ShipyardWindowProps {
    player: SimulationPlayer;
    room: any;
    onClose: () => void;
    onAction: (action: any) => void;
}

const TABS = [
    { id: 'construct', label: 'Konstruksjon', icon: Hammer },
    { id: 'upgrade', label: 'Modifikasjoner', icon: ArrowUp },
    { id: 'models', label: 'Verft', icon: Anchor },
    { id: 'cosmetics', label: 'Estetikk', icon: Palette },
] as const;

export const ShipyardWindow: React.FC<ShipyardWindowProps> = ({ player, onClose, onAction }) => {
    const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('construct');
    const [hoveredUpgrade, setHoveredUpgrade] = useState<string | null>(null);

    // --- SELF-HEALING MIGRATION ---
    useEffect(() => {
        if (player.boat && !player.boat.componentLevels) {
            console.log("Migrating boat data...");
        }
    }, [player.boat]);

    const boat = player.boat || {
        stage: 0,
        hullType: 'oak_standard',
        model: 'standard',
        componentLevels: { sails: 0, hull: 0, cannons: 0, nets: 0 },
        customization: { color: '#4b2c20', flagId: 'none', figurehead: 'none', unlocked: [] }
    } as any;

    // Ensure defaults for render safety
    if (!boat.model) boat.model = 'standard';
    if (!boat.componentLevels) boat.componentLevels = { sails: 0, hull: 0, cannons: 0, nets: 0 };
    if (!boat.customization) boat.customization = { color: '#4b2c20', flagId: 'none', figurehead: 'none', unlocked: [] };

    // Default to Upgrade tab if construction is done
    useEffect(() => {
        if (boat.stage >= 4 && activeTab === 'construct') {
            setActiveTab('upgrade');
        }
    }, [boat.stage]);

    // --- SUB-COMPONENTS ---

    const ConstructionView = () => {
        const stage = boat.stage;
        const nextStage = stage < 4 ? {
            stage: stage + 1,
            name: ['Kjølstrekking', 'Mast & Rigg', 'Dekk & Detaljer', 'Sjøsetting'][stage],
            reqs: [
                { oak_lumber: 20 },
                { oak_lumber: 40, linen_canvas: 10 },
                { oak_lumber: 30, iron_ingot: 10 },
                { oak_lumber: 50, tar: 20 }
            ][stage] as unknown as Resources
        } : null;

        return (
            <div className="flex-1 flex flex-col gap-6 p-6">
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black uppercase text-amber-500 tracking-widest">
                        {stage >= 4 ? "Fullført" : `Fase ${stage + 1}: ${nextStage?.name}`}
                    </h3>
                    <p className="text-white/40 text-sm">
                        {stage >= 4 ? "Skipet er sjøklart. Gå til Modifikasjoner for å oppgradere." : "Samle ressurser for å bygge videre."}
                    </p>
                </div>

                {nextStage && (
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-bold text-white/60 uppercase tracking-wider">Krav</span>
                            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-black uppercase rounded">
                                Steg {nextStage.stage} / 4
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {Object.entries(nextStage.reqs).map(([res, amt]) => {
                                const has = (player.resources as any)[res] || 0;
                                const ok = has >= (amt as number);
                                return (
                                    <div key={res} className={`flex justify-between items-center p-3 rounded border ${ok ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/10 border-red-500/20'}`}>
                                        <span className="text-sm text-white/80 capitalize">{res.replace('_', ' ')}</span>
                                        <span className={`font-mono font-bold ${ok ? 'text-green-400' : 'text-red-400'}`}>
                                            {has} / {amt as number}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => onAction({ type: 'CONTRIBUTE_TO_BOAT', stage: nextStage.stage, resources: nextStage.reqs })}
                            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-slate-900 font-black uppercase tracking-[0.2em] rounded transition-all active:scale-95 shadow-lg shadow-amber-600/20"
                        >
                            Bygg Videre
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const UpgradeView = () => {
        return (
            <motion.div
                className="grid grid-cols-2 gap-4 p-6 overflow-y-auto max-h-[500px] content-start"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                }}
            >
                {Object.entries(BOAT_UPGRADES).map(([key, def]) => {
                    const currentLevel = (boat.componentLevels as any)[key] || 0;
                    const nextLevelDef = def.levels[currentLevel];
                    const isMaxed = !nextLevelDef;

                    return (
                        <motion.div
                            key={key}
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            className="bg-slate-900/40 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group relative hover:bg-slate-800/60"
                            onMouseEnter={() => setHoveredUpgrade(key)}
                            onMouseLeave={() => setHoveredUpgrade(null)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-amber-100 group-hover:text-amber-400 transition-colors">{def.name}</h4>
                                <span className="text-[10px] font-black bg-black/40 px-2 py-0.5 rounded text-amber-500/80 border border-amber-500/10">
                                    LVL {currentLevel}
                                </span>
                            </div>
                            <p className="text-xs text-white/40 mb-4 h-8">{def.description}</p>

                            {!isMaxed ? (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(nextLevelDef.cost).map(([res, amt]) => {
                                            const has = (player.resources as any)[res] || 0;
                                            return (
                                                <span key={res} className={`text-[10px] px-1.5 py-0.5 rounded border ${has >= (amt as number) ? 'border-white/20 text-white/60' : 'border-red-500/30 text-red-400'}`}>
                                                    {amt as number} {res.split('_')[0]}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                                        <span className="text-xs text-green-400 font-bold">{nextLevelDef.effect}</span>
                                        <button
                                            onClick={() => onAction({ type: 'UPGRADE_BOAT_COMPONENT', componentId: key })}
                                            className="px-3 py-1 bg-amber-600/80 hover:bg-amber-500 text-slate-900 text-xs font-black uppercase rounded shadow-lg shadow-amber-900/20 active:scale-95 transition-all"
                                        >
                                            Oppgrader
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full py-2 bg-white/5 text-center text-xs text-white/30 uppercase font-black rounded border border-white/5">
                                    Maksimalt Nivå
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>
        );
    };

    const ModelsView = () => {
        return (
            <motion.div
                className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[500px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {Object.values(BOAT_MODELS).map((model) => {
                    const isOwned = boat.model === model.id;
                    const isLocked = (player.stats?.level || 1) < (model as any).levelReq;

                    return (
                        <div key={model.id} className={`relative p-5 rounded-xl border transition-all ${isOwned ? 'bg-gradient-to-r from-amber-900/30 to-amber-900/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-slate-900/40 border-white/10 hover:border-white/30'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className={`text-lg font-black uppercase tracking-wider ${isOwned ? 'text-amber-400' : 'text-slate-200'}`}>
                                        {model.name}
                                    </h4>
                                    <div className="flex gap-4 text-xs text-white/40 mt-1 mb-3">
                                        <span className="flex items-center gap-1">♥️ {model.baseHp}</span>
                                        <span className="flex items-center gap-1">💨 {model.baseSpeed}</span>
                                        <span className="flex items-center gap-1">📦 {model.cargoSlots}</span>
                                        <span className="flex items-center gap-1">💣 {model.maxCannons}</span>
                                    </div>
                                    <p className="text-sm text-white/60 max-w-md italic opacity-80">"{model.description}"</p>
                                </div>
                                {isOwned ? (
                                    <div className="flex flex-col items-center text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                                        <Check size={20} />
                                        <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Valgt</span>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        {isLocked ? (
                                            <div className="flex items-center gap-2 text-red-500 bg-red-950/30 px-3 py-1.5 rounded border border-red-500/20 mb-2">
                                                <Lock size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-wide">Krever Nivå {(model as any).levelReq}</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => onAction({ type: 'BUY_BOAT_MODEL', modelId: model.id })}
                                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black uppercase text-xs rounded transition-all active:scale-95"
                                            >
                                                Kjøp
                                            </button>
                                        )}
                                        <div className="flex gap-2 justify-end mt-2">
                                            {Object.entries(model.cost).map(([res, amt]) => (
                                                <span key={res} className="text-[10px] text-white/60 bg-black/60 px-1.5 py-0.5 rounded border border-white/5">
                                                    {amt as number} {res}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </motion.div>
        );
    };

    const CosmeticsView = () => {
        return (
            <motion.div
                className="p-6 space-y-8 overflow-y-auto max-h-[500px]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                {/* Colors */}
                <div>
                    <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Skrogfarge</h4>
                    <div className="flex gap-3 flex-wrap">
                        {COSMETIC_UNLOCKS.colors.map(c => {
                            const isUnlocked = boat.customization.unlocked.includes(c.id) || (c.cost as any).gold === undefined;
                            const isActive = boat.customization.color === c.hex;

                            return (
                                <button
                                    key={c.id}
                                    onClick={() => onAction({ type: 'BUY_BOAT_COSMETIC', typeId: 'color', id: c.id })}
                                    className={`relative w-14 h-14 rounded-xl border-2 transition-all group ${isActive ? 'border-amber-400 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-white/10 hover:border-white/40 hover:scale-105'}`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                >
                                    {!isUnlocked && (
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-0.5 rounded-full text-[9px] text-amber-500 font-bold whitespace-nowrap border border-amber-500/30 shadow-xl z-10 pointer-events-none group-hover:scale-110 transition-transform">
                                            {(c.cost as any)?.gold || 0}g
                                        </div>
                                    )}
                                    {isActive && <div className="absolute inset-0 flex items-center justify-center text-white/80 drop-shadow-md"><Check size={20} /></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Flags */}
                <div>
                    <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Flagg</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {COSMETIC_UNLOCKS.flags.map(f => {
                            const isUnlocked = boat.customization.unlocked.includes(f.id) || f.id === 'none';
                            const isActive = boat.customization.flagId === f.id;

                            return (
                                <button
                                    key={f.id}
                                    onClick={() => onAction({ type: 'BUY_BOAT_COSMETIC', typeId: 'flag', id: f.id })}
                                    className={`p-4 rounded-xl border flex justify-between items-center transition-all active:scale-95 ${isActive ? 'bg-amber-900/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`} />
                                        <span className={`text-sm font-bold ${isActive ? 'text-amber-100' : 'text-slate-400'}`}>{f.name}</span>
                                    </div>
                                    {!isUnlocked && <span className="text-[10px] text-amber-500 font-mono bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-500/20">{(f.cost as any)?.gold || 0}g</span>}
                                    {isActive && <Check size={16} className="text-amber-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <SimulationMapWindow title="" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex h-[600px] w-full overflow-hidden bg-[#0a0a0a]">

                {/* LEFT: SIDEBAR */}
                <div className="w-16 flex flex-col items-center py-6 bg-black/40 border-r border-white/5 gap-4">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        const disabled = tab.id !== 'construct' && boat.stage < 4;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => !disabled && setActiveTab(tab.id)}
                                disabled={disabled}
                                className={`p-3 rounded-xl transition-all ${isActive ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/10'} ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
                                title={tab.label}
                            >
                                <tab.icon size={20} />
                            </button>
                        );
                    })}
                </div>

                {/* CENTER: BLUEPRINT VISUALIZER */}
                <div className="flex-1 relative bg-[#0f172a] shadow-inner overflow-hidden flex items-center justify-center p-12">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0f172a] to-[#0f172a]" />
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    <motion.div
                        key={boat.model}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        className="w-full h-full"
                    >
                        <ModularBoatSVG
                            stage={boat.stage}
                            model={boat.model}
                            componentLevels={activeTab === 'upgrade' && hoveredUpgrade ? { ...boat.componentLevels, [hoveredUpgrade]: (boat.componentLevels[hoveredUpgrade] || 0) + 1 } : boat.componentLevels}
                            customization={boat.customization}
                            view="side"
                        />
                    </motion.div>

                    {/* Stats Overlay */}
                    <div className="absolute bottom-6 left-6 flex gap-6">
                        <div className="text-center">
                            <div className="text-xs text-white/40 uppercase font-black tracking-widest">HP</div>
                            <div className="text-2xl text-white font-mono">{boat.maxHp}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-white/40 uppercase font-black tracking-widest">Kanon</div>
                            <div className="text-2xl text-white font-mono">{boat.cannons}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-white/40 uppercase font-black tracking-widest">Modell</div>
                            <div className="text-sm text-amber-500 font-bold uppercase mt-1">{boat.model || 'Ukjent'}</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: CONTROL PANEL */}
                <div className="w-[450px] bg-[#111] border-l border-white/10 flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-black uppercase text-white tracking-widest">{TABS.find(t => t.id === activeTab)?.label}</h2>
                    </div>

                    {activeTab === 'construct' && <ConstructionView />}
                    {activeTab === 'upgrade' && <UpgradeView />}
                    {activeTab === 'models' && <ModelsView />}
                    {activeTab === 'cosmetics' && <CosmeticsView />}
                </div>

            </div>
        </SimulationMapWindow>
    );
};
