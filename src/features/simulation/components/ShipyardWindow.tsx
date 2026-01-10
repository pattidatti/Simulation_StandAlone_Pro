import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationPlayer, Resources } from '../simulationTypes';
import { ModularBoatSVG } from './ModularBoatSVG';
import { Hammer, X, CheckCircle2 } from 'lucide-react';
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
const ShipyardBadge: React.FC<{ children: React.ReactNode; active?: boolean }> = ({ children, active }) => (
    <div className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${active ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
        {children}
    </div>
);

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

export const ShipyardWindow: React.FC<ShipyardWindowProps> = ({ player, room, onClose, onContribute }) => {
    const currentBoatStage = player.boat?.stage || 0;
    const nextStage = BOAT_STAGES.find(s => s.stage === currentBoatStage + 1);

    // Check if player can afford
    const hasResources = nextStage ? Object.entries(nextStage.requirements).every(([res, amt]) => {
        return (player.resources[res as keyof Resources] || 0) >= amt;
    }) : false;

    // Convert nextStage requirements to "recipe" format for RequirementList
    const recipeForList = nextStage ? {
        input: nextStage.requirements,
        stamina: 25 // Constant stamina cost for building
    } : null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
            <div className="relative w-full max-w-5xl h-[700px] bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
                    <div>
                        <ShipyardBadge active={true}>Skipsverftet</ShipyardBadge>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase grayscale-[0.2]">Båtbyggeriet</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 text-white/40 flex items-center justify-center transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side: Visual Blueprint */}
                    <div className="flex-[1.2] p-8 flex flex-col items-center justify-center bg-slate-950/60 border-r border-white/5 relative overflow-hidden">
                        {/* Blueprint Asset Background */}
                        <img
                            src={`${import.meta.env.BASE_URL}antigravity/brain/07597a3b-439f-498d-aa43-1b02768f5015/maritime_shipyard_blueprint_bg_1768089214778.png`}
                            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none grayscale"
                            alt="Blueprint Background"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none" />

                        <div className="w-full h-[400px] flex items-center justify-center drop-shadow-[0_0_50px_rgba(251,191,36,0.1)]">
                            <ModularBoatSVG
                                stage={currentBoatStage}
                                customization={player.boat?.customization}
                                scale={1.2}
                            />
                        </div>

                        <div className="mt-8 text-center flex gap-12">
                            <div className="flex flex-col items-center">
                                <div className="text-[11px] font-black uppercase text-slate-500 mb-1">Status</div>
                                <div className="text-xl font-black text-white italic uppercase tracking-widest leading-none">
                                    {currentBoatStage === 4 ? 'Ferdigstilt' : `Fase ${currentBoatStage}/4`}
                                </div>
                            </div>
                            <div className="flex flex-col items-center opacity-40">
                                <div className="text-[11px] font-black uppercase text-slate-500 mb-1">Skrog</div>
                                <div className="text-sm font-bold text-white uppercase italic">Eik</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Construction Logic */}
                    <div className="flex-1 p-8 bg-slate-900/50 flex flex-col">
                        <AnimatePresence mode="wait">
                            {nextStage ? (
                                <motion.div
                                    key={nextStage.stage}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="h-full flex flex-col"
                                >
                                    <div className="mb-8">
                                        <div className="text-amber-400 font-black italic text-sm mb-1 uppercase tracking-widest leading-none">Neste Steg</div>
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{nextStage.name}</h3>
                                        <p className="mt-4 text-slate-400 text-sm leading-relaxed">{nextStage.description}</p>
                                    </div>

                                    <div className="flex-1">
                                        <div className="text-[11px] font-black uppercase text-slate-500 mb-4 border-b border-white/5 pb-2">Materialer som kreves</div>
                                        {recipeForList && (
                                            <RequirementList
                                                recipe={recipeForList}
                                                player={player}
                                                room={room}
                                            />
                                        )}
                                    </div>

                                    <div className="mt-8">
                                        {currentBoatStage === 4 ? (
                                            <ShipyardButton variant="success">
                                                <CheckCircle2 /> Fartøyet er ferdigstilt
                                            </ShipyardButton>
                                        ) : (
                                            <ShipyardButton
                                                disabled={!hasResources}
                                                onClick={() => nextStage && onContribute(nextStage.stage, nextStage.requirements)}
                                            >
                                                <Hammer /> {currentBoatStage === 0 ? 'Begynn Bygging' : 'Fullfør Steg'}
                                            </ShipyardButton>
                                        )}
                                        {!hasResources && (
                                            <p className="text-center text-rose-400 font-bold text-[11px] uppercase mt-3 animate-pulse">
                                                Mangler materialer i lageret
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/30">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white italic uppercase">Båten er ferdig!</h3>
                                    <p className="text-slate-400 mt-2 max-w-xs">Din stolte skute er ferdigstilt og klar for de store havene.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
