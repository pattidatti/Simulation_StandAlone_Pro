import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationPlayer, Resources } from '../simulationTypes';
import { ModularBoatSVG } from './ModularBoatSVG';
import { Hammer, CheckCircle2 } from 'lucide-react';
import { RequirementList } from './RequirementList';

interface ShipyardWindowProps {
    player: SimulationPlayer;
    room: any;
    onClose: () => void;
    onContribute: (stage: number, resources: Partial<Resources>) => void;
}

const BOAT_STAGES = [
    {
        stage: 1,
        name: 'Kjøl & Skrog',
        description: 'Båtens fundament. Krever sterkt eiketømmer og tjære for å være sjødyktig.',
        requirements: { oak_lumber: 50, iron_ingot: 10, tar: 5 }
    },
    {
        stage: 2,
        name: 'Mast & Rigg',
        description: 'Uten seil kommer du ingen vei. Krever solid kledde master og lin-seil.',
        requirements: { plank: 30, linen_canvas: 15 }
    },
    {
        stage: 3,
        name: 'Dekk & Utstyr',
        description: 'Gjør båten rustet for lange ferder og fiske. Lagerplass og rekkverk.',
        requirements: { plank: 40, iron_ingot: 5 }
    },
    {
        stage: 4,
        name: 'Gallionsfigur & Luksus',
        description: 'En ekte herre viser sin rikdom på havet. Gullforgylte detaljer og silke.',
        requirements: { silk: 10, gold: 1000 }
    }
];

// --- INTERNAL BESPOKE COMPONENTS ---

const ShipyardButton: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'success' }> = ({ children, onClick, disabled, variant = 'primary' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 flex items-center justify-center gap-2
            ${disabled ? 'opacity-30 cursor-not-allowed grayscale bg-slate-800 text-slate-500' : 'hover:scale-[1.02] shadow-2xl'}
            ${variant === 'primary' ? 'bg-amber-500 text-slate-950 shadow-amber-500/20' : 'bg-emerald-600 text-white shadow-emerald-600/20'}
        `}
    >
        {children}
    </button>
);

import { SimulationMapWindow } from './ui/SimulationMapWindow';

// ... (BOAT_STAGES and internal components kept same)

export const ShipyardWindow: React.FC<ShipyardWindowProps> = ({ player, room, onClose, onContribute }) => {
    const currentBoatStage = player.boat?.stage || 0;
    const isDamaged = player.boat?.isDamaged || false;
    const hp = player.boat?.hp || 0;
    const maxHp = player.boat?.maxHp || 100;

    // Logic Priority: Critical Repair -> Maintenance -> Upgrade
    let nextStage: any = null;

    if (isDamaged) {
        nextStage = {
            stage: -1,
            name: 'Skrogreparasjon',
            description: 'Skipet har tatt skade og må tettest før det kan seile igjen. En enkel lapp holder det flytende.',
            requirements: { oak_lumber: 5, tar: 2 }
        };
    } else if (hp < maxHp) {
        nextStage = {
            stage: -2,
            name: 'Vedlikehold',
            description: `Skroget er slitt (${hp}/${maxHp} HP). Bytt ut råtne planker for å gjenopprette full styrke.`,
            requirements: { plank: 10, tar: 5 }
        };
    } else {
        nextStage = BOAT_STAGES.find(s => s.stage === currentBoatStage + 1);
    }

    const hasResources = nextStage ? Object.entries(nextStage.requirements).every(([res, amt]) => {
        return (player.resources[res as keyof Resources] || 0) >= (amt as number);
    }) : false;

    const recipeForList = nextStage ? {
        input: nextStage.requirements,
        stamina: 25
    } : null;

    return (
        <SimulationMapWindow
            title="Båtbyggeriet"
            subtitle="Kongelig Skipsverft • Port of Valheim"
            icon={<Hammer className="text-amber-500" />}
            onClose={onClose}
            maxWidth="max-w-6xl"
            className="p-0" // Remove default padding for bespoke layout
        >
            <div className="flex w-full h-[650px] overflow-hidden">
                {/* Left Side: Visual Blueprint */}
                <div className="flex-1 p-12 flex flex-col items-center justify-center bg-slate-950/40 border-r border-white/5 relative overflow-hidden">
                    {/* Blueprint Asset Background */}
                    <img
                        src={`${import.meta.env.BASE_URL}assets/maritime/blueprint.png`}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-multiply pointer-events-none"
                        alt="Blueprint Background"
                    />

                    {/* Architectural Grid Overlay */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-transparent to-slate-950/50 pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full h-[350px] flex items-center justify-center drop-shadow-[0_0_80px_rgba(251,191,36,0.15)] relative z-10"
                    >
                        <ModularBoatSVG
                            stage={currentBoatStage}
                            customization={player.boat?.customization}
                            scale={1.3}
                        />
                    </motion.div>

                    <div className="mt-12 text-center flex gap-16 relative z-10">
                        <div className="flex flex-col items-center">
                            <div className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Konstruksjonsfase</div>
                            <div className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none flex items-center gap-3">
                                <span className="text-amber-500">{currentBoatStage}</span>
                                <div className="w-8 h-px bg-white/20" />
                                <span className="opacity-40 font-medium text-lg">4</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center border-l border-white/10 pl-16">
                            <div className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Materialstatus</div>
                            <div className="text-sm font-bold text-emerald-400 uppercase italic flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Eik & Tjære
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Construction Logic */}
                <div className="w-[420px] p-12 bg-slate-900/30 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {nextStage ? (
                            <motion.div
                                key={nextStage.stage}
                                initial={{ x: 30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="h-full flex flex-col relative z-10"
                            >
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">Aktiv Plan</div>
                                        <div className="h-px flex-1 bg-amber-500/10" />
                                    </div>
                                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-tight drop-shadow-md">{nextStage.name}</h3>
                                    <p className="mt-5 text-slate-400 text-sm leading-relaxed font-medium italic opacity-80">"{nextStage.description}"</p>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                                        <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Materialkrav</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(s => (
                                                <div key={s} className={`w-1.5 h-1.5 rounded-full ${s <= currentBoatStage ? 'bg-amber-500' : 'bg-white/10'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    {recipeForList && (
                                        <RequirementList
                                            recipe={recipeForList}
                                            player={player}
                                            room={room}
                                        />
                                    )}
                                </div>

                                <div className="mt-10">
                                    <ShipyardButton
                                        disabled={!hasResources}
                                        onClick={() => nextStage && onContribute(nextStage.stage, nextStage.requirements)}
                                        variant={hasResources ? 'primary' : 'primary'}
                                    >
                                        <Hammer size={18} />
                                        <Hammer size={18} />
                                        {nextStage?.stage === -1 ? 'Utfør Nødreparasjon' : (nextStage?.stage === -2 ? 'Utfør Vedlikehold' : (currentBoatStage === 0 ? 'Legg Ned Kjøl' : 'Ferdigstill Seksjon'))}
                                    </ShipyardButton>

                                    {!hasResources && (
                                        <div className="flex items-center justify-center gap-2 mt-4 text-rose-400/80 font-black text-[10px] uppercase tracking-widest animate-pulse">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                            Ressurser mangler i forrådet
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center p-6"
                            >
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                                    <div className="relative w-24 h-24 bg-emerald-500 border-2 border-emerald-400/50 rounded-3xl flex items-center justify-center text-white shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
                                        <CheckCircle2 size={56} />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Mesterverk Fullført!</h3>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-xs italic">Dette skipet er nå det fremste vidunderet i havnen. Klar for dype hav og store erobringer.</p>

                                <div className="mt-12 p-4 bg-white/5 border border-white/10 rounded-2xl w-full">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Skipets Navn</div>
                                    <div className="text-xl font-black text-amber-500 italic uppercase">Drakkar III</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </SimulationMapWindow>
    );
};
