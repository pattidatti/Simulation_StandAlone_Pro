import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Anchor, Palette, ArrowUp, Lock, Check, Zap, Box, Wind } from 'lucide-react';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { ShipyardVisualizer } from './ShipyardVisualizer';
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


const PANEL_VARIANTS = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.05, ease: [0.22, 1, 0.36, 1], duration: 0.6 } }
};

export const ShipyardWindow: React.FC<ShipyardWindowProps> = ({ player, onClose, onAction }) => {
    const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('construct');
    const [hoveredUpgrade, setHoveredUpgrade] = useState<string | null>(null);

    const boat = player.boat || {
        stage: 0,
        hullType: 'oak_standard',
        model: 'standard',
        componentLevels: { sails: 0, hull: 0, cannons: 0, nets: 0 },
        customization: { color: '#4b2c20', flagId: 'none', figurehead: 'none', unlocked: [] }
    } as any;

    // Ensure defaults
    if (!boat.model) boat.model = 'standard';
    if (!boat.componentLevels) boat.componentLevels = { sails: 0, hull: 0, cannons: 0, nets: 0 };
    if (!boat.customization) {
        boat.customization = { color: '#4b2c20', flagId: 'none', figurehead: 'none', unlocked: [] };
    } else if (!boat.customization.unlocked) {
        boat.customization.unlocked = [];
    }

    useEffect(() => {
        if (boat.stage >= 4 && activeTab === 'construct') {
            setActiveTab('upgrade');
        }
    }, [boat.stage, activeTab]);

    // --- VIEWS ---

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
            <motion.div className="flex-1 flex flex-col gap-8 p-8" variants={PANEL_VARIANTS} initial="hidden" animate="visible">
                <motion.div variants={PANEL_VARIANTS}>
                    <h3 className="text-3xl font-black uppercase text-amber-500 tracking-[0.2em] mb-2 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                        {stage >= 4 ? "COMPLETE" : `PHASE ${stage + 1}`}
                    </h3>
                    <p className="text-cyan-200/60 font-mono text-sm uppercase tracking-wide">
                        {stage >= 4 ? "Unit Ready for Deployment" : nextStage?.name}
                    </p>
                </motion.div>

                {nextStage && (
                    <motion.div variants={PANEL_VARIANTS} className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                            <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Required Assets</span>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase rounded border border-amber-500/30">
                                Step {nextStage.stage} / 4
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {Object.entries(nextStage.reqs).map(([res, amt]) => {
                                const has = (player.resources as any)[res] || 0;
                                const ok = has >= (amt as number);
                                return (
                                    <div key={res} className={`flex justify-between items-center p-3 rounded border transition-colors ${ok ? 'bg-green-900/10 border-green-500/30 text-green-400' : 'bg-red-900/10 border-red-500/20 text-red-400'}`}>
                                        <span className="text-xs font-bold uppercase tracking-wider">{res.replace('_', ' ')}</span>
                                        <span className="font-mono font-bold">
                                            {has} / {amt as number}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => onAction({ type: 'CONTRIBUTE_TO_BOAT', stage: nextStage.stage, resources: nextStage.reqs })}
                            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(217,119,6,0.4)] relative overflow-hidden"
                        >
                            <span className="relative z-10">INITIALIZE CONSTRUCTION</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </motion.div>
                )}
            </motion.div>
        );
    };

    const UpgradeView = () => {
        return (
            <motion.div
                className="grid grid-cols-2 gap-4 p-6 overflow-y-auto max-h-[500px] content-start scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-4"
                variants={PANEL_VARIANTS}
                initial="hidden"
                animate="visible"
            >
                {Object.entries(BOAT_UPGRADES).map(([key, def]) => {
                    const currentLevel = (boat.componentLevels as any)[key] || 0;
                    const nextLevelDef = def.levels[currentLevel];
                    const isMaxed = !nextLevelDef;

                    return (
                        <motion.div
                            key={key}
                            variants={PANEL_VARIANTS}
                            className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-5 hover:border-cyan-500/50 transition-all group relative overflow-hidden"
                            onMouseEnter={() => setHoveredUpgrade(key)}
                            onMouseLeave={() => setHoveredUpgrade(null)}
                        >
                            {/* Holographic Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <h4 className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors uppercase tracking-wider text-sm">{def.name}</h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${currentLevel > 0 ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-slate-800 text-slate-500 border-white/5'}`}>
                                    LVL {currentLevel}
                                </span>
                            </div>

                            <p className="text-[11px] text-slate-400 mb-5 leading-relaxed h-8">{def.description}</p>

                            {!isMaxed ? (
                                <div className="space-y-4 relative z-10">
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(nextLevelDef.cost).map(([res, amt]) => {
                                            const has = (player.resources as any)[res] || 0;
                                            const ok = has >= (amt as number);
                                            return (
                                                <span key={res} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${ok ? 'border-white/10 text-slate-400 bg-black/20' : 'border-red-500/30 text-red-400 bg-red-900/10'}`}>
                                                    {amt as number} {res.split('_')[0]}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Zap size={10} />
                                            {nextLevelDef.effect}
                                        </span>
                                        <button
                                            onClick={() => onAction({ type: 'UPGRADE_BOAT_COMPONENT', componentId: key })}
                                            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase rounded shadow-lg shadow-cyan-900/20 active:scale-95 transition-all tracking-widest"
                                        >
                                            Upgrade
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-transparent text-left px-4 text-[10px] text-amber-500 uppercase font-black rounded border-l-2 border-amber-500">
                                    Max Capacity Reached
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
                variants={PANEL_VARIANTS}
                initial="hidden"
                animate="visible"
            >
                {Object.values(BOAT_MODELS).map((model) => {
                    const isOwned = boat.model === model.id;
                    const isLocked = (player.stats?.level || 1) < (model as any).levelReq;

                    return (
                        <motion.div
                            key={model.id}
                            variants={PANEL_VARIANTS}
                            className={`relative p-6 rounded-xl border transition-all group overflow-hidden ${isOwned ? 'bg-amber-900/10 border-amber-500/50' : 'bg-slate-900/40 border-white/10 hover:border-white/30'}`}
                        >
                            {isOwned && <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_rgba(245,158,11,0.1),transparent)]" />}

                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <h4 className={`text-lg font-black uppercase tracking-[0.1em] mb-1 ${isOwned ? 'text-amber-400' : 'text-slate-200'}`}>
                                        {model.name}
                                    </h4>
                                    <div className="flex gap-4 text-[10px] font-mono text-cyan-200/50 mb-4 uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><Box size={10} /> {model.baseHp} HP</span>
                                        <span className="flex items-center gap-1"><Wind size={10} /> {model.baseSpeed} KNOTS</span>
                                    </div>
                                    <p className="text-sm text-slate-400 max-w-md italic opacity-80 border-l-2 border-white/10 pl-3">
                                        "{model.description}"
                                    </p>
                                </div>
                                {isOwned ? (
                                    <div className="flex flex-col items-center text-amber-500 bg-amber-500/10 px-4 py-2 rounded border border-amber-500/20">
                                        <Check size={16} strokeWidth={4} />
                                        <span className="text-[9px] font-black uppercase mt-1 tracking-widest">Active</span>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        {isLocked ? (
                                            <div className="flex items-center gap-2 text-red-500 bg-red-950/30 px-3 py-1.5 rounded border border-red-500/20 mb-2">
                                                <Lock size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-wide">Req Lvl {(model as any).levelReq}</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => onAction({ type: 'BUY_BOAT_MODEL', modelId: model.id })}
                                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black uppercase text-xs rounded transition-all active:scale-95 tracking-widest hover:border-white/40"
                                            >
                                                Purchase
                                            </button>
                                        )}
                                        <div className="flex gap-2 justify-end mt-2">
                                            {Object.entries(model.cost).map(([res, amt]) => (
                                                <span key={res} className="text-[10px] text-slate-400 bg-black/60 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                                                    {amt as number} {res}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        );
    };

    const CosmeticsView = () => {
        return (
            <motion.div
                className="p-6 space-y-8 overflow-y-auto max-h-[500px]"
                variants={PANEL_VARIANTS}
                initial="hidden"
                animate="visible"
            >
                {/* Colors */}
                <div>
                    <h4 className="text-[10px] font-black text-cyan-200/40 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">Hull Coating</h4>
                    <div className="flex gap-3 flex-wrap">
                        {COSMETIC_UNLOCKS.colors.map(c => {
                            const isUnlocked = boat.customization.unlocked.includes(c.id) || (c.cost as any).gold === undefined;
                            const isActive = boat.customization.color === c.hex;

                            return (
                                <button
                                    key={c.id}
                                    onClick={() => onAction({ type: 'BUY_BOAT_COSMETIC', typeId: 'color', id: c.id })}
                                    className={`relative w-12 h-12 rounded-lg border transition-all group overflow-hidden ${isActive ? 'border-amber-400 scale-105 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-white/10 hover:border-white/40 hover:scale-105'}`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                >
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="text-[9px] text-amber-500 font-bold border border-amber-500/30 px-1 rounded bg-black/80">
                                                {(c.cost as any)?.gold}g
                                            </span>
                                        </div>
                                    )}
                                    {isActive && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <Check size={20} className="text-white drop-shadow-md" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Flags */}
                <div>
                    <h4 className="text-[10px] font-black text-cyan-200/40 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">Ensign</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {COSMETIC_UNLOCKS.flags.map(f => {
                            const isUnlocked = boat.customization.unlocked.includes(f.id) || f.id === 'none';
                            const isActive = boat.customization.flagId === f.id;

                            return (
                                <button
                                    key={f.id}
                                    onClick={() => onAction({ type: 'BUY_BOAT_COSMETIC', typeId: 'flag', id: f.id })}
                                    className={`p-3 rounded-lg border flex justify-between items-center transition-all active:scale-95 group ${isActive ? 'bg-amber-900/10 border-amber-500/40' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-amber-500 animate-pulse shadow-[0_0_10px_orange]' : 'bg-slate-700'}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wide ${isActive ? 'text-amber-100' : 'text-slate-400 group-hover:text-slate-200'}`}>{f.name}</span>
                                    </div>
                                    {!isUnlocked && <span className="text-[9px] text-amber-500 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/20">{(f.cost as any)?.gold}g</span>}
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
            <div className="flex h-[600px] w-full overflow-hidden bg-[#0a0a0a] rounded-b-xl">

                {/* LEFT: SIDEBAR (Control Rib) */}
                <div className="w-20 flex flex-col items-center py-8 bg-[#0a0a0a] border-r border-white/5 gap-6 z-20">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        const disabled = tab.id !== 'construct' && boat.stage < 4;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => !disabled && setActiveTab(tab.id)}
                                disabled={disabled}
                                className={`relative p-4 rounded-xl transition-all group ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
                            >
                                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 transition-opacity ${isActive ? 'opacity-100' : 'group-hover:opacity-50'}`} />
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r bg-cyan-500 transition-all duration-300 ${isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`} />

                                <tab.icon
                                    size={24}
                                    className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </button>
                        );
                    })}
                </div>

                {/* CENTER: HOLOGRAPHIC VISUALIZER */}
                <div className="flex-1 relative bg-black shadow-inner overflow-hidden">
                    <ShipyardVisualizer
                        stage={boat.stage}
                        model={boat.model}
                        componentLevels={boat.componentLevels}
                        customization={boat.customization}
                        hoveredUpgrade={hoveredUpgrade}
                    />
                </div>

                {/* RIGHT: DATA TERMINAL */}
                <div className="w-[480px] bg-[#0c1018] border-l border-white/10 flex flex-col z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
                        <h2 className="text-2xl font-black uppercase text-white tracking-[0.2em]">{TABS.find(t => t.id === activeTab)?.label}</h2>
                        <div className="px-2 py-1 bg-cyan-950/30 border border-cyan-500/20 rounded text-[9px] font-mono text-cyan-400">
                            TERM_V2.0
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <AnimatePresence mode="wait">
                            {activeTab === 'construct' && <ConstructionView key="construct" />}
                            {activeTab === 'upgrade' && <UpgradeView key="upgrade" />}
                            {activeTab === 'models' && <ModelsView key="models" />}
                            {activeTab === 'cosmetics' && <CosmeticsView key="cosmetics" />}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </SimulationMapWindow>
    );
};
