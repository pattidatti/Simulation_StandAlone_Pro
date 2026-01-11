import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressiveImage } from './ui/ProgressiveImage';
import { SimulationPlayer } from '../simulationTypes';
import { ModularBoatSVG } from './ModularBoatSVG';
import { Hammer, Navigation, ShieldAlert, Package, Box } from 'lucide-react';

interface DockViewProps {
    player: SimulationPlayer;
    world: {
        season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
        weather: string;
        time: 'Day' | 'Night';
    };
    onAction: (actionId: string) => void;
}

/**
 * DockView - High-realism 1st person hub for the Maritime expansion.
 * Overhauled with Armory mechanics and side-profile boat rendering.
 */
// --- INTERNAL BESPOKE COMPONENTS ---
const DockBadge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'amber' }) => (
    <div className={`px-4 py-1.5 rounded-full bg-${color}-500/20 border border-${color}-400/30 text-${color}-400 text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
        {children}
    </div>
);

const DockButton: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger' }> = ({ children, onClick, disabled, variant = 'primary' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter transition-all active:scale-95 flex items-center gap-3
            ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-105'}
            ${variant === 'primary' ? 'bg-amber-500 text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.2)]' : ''}
            ${variant === 'ghost' ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10' : ''}
            ${variant === 'danger' ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' : ''}
        `}
    >
        {children}
    </button>
);

export const DockView: React.FC<DockViewProps> = ({ player, world, onAction }) => {
    const { season, time } = world;
    const isDamaged = player.boat?.isDamaged || false;
    const boatAmmo = player.boat?.cannonballs || 0;
    const inventoryAmmo = player.resources.cannonball || 0;
    const canSail = player.boat && player.boat.stage >= 2 && !isDamaged;

    const seasonKey = season.toLowerCase();
    const timeKey = time.toLowerCase();
    const backgroundAsset = `${import.meta.env.BASE_URL}assets/maritime/dock_${seasonKey}_${timeKey}.png`;

    return (
        <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center font-sans tracking-tight">
            {/* HIGH-REALISM BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <ProgressiveImage
                    src={backgroundAsset}
                    alt={`${season} ${time} Dock View`}
                    className="w-full h-full object-cover brightness-[0.7] contrast-[1.1]"
                    disableMotion={true}
                />

                {/* Cinematic Atmospheric Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 pointer-events-none" />
            </div>

            {/* THE BOAT (Side View Profile) */}
            <AnimatePresence>
                {player.boat && player.boat.stage > 0 && (
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{
                            x: 0,
                            opacity: 1,
                            y: [0, -10, 0] // Subtle bobbing
                        }}
                        transition={{
                            y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
                            default: { type: 'spring', damping: 20 }
                        }}
                        className="absolute bottom-[5%] left-[5%] w-[800px] h-[500px] z-10 pointer-events-none drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
                    >
                        <ModularBoatSVG
                            stage={player.boat.stage}
                            view="side"
                            customization={player.boat.customization}
                            scale={0.85}
                            className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)]"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INTERACTIVE HUB OVERLAY */}
            <div className="relative z-20 w-full h-full flex flex-col justify-between p-12">
                {/* Top Row: Headers & Stats */}
                <div className="flex justify-between items-start pt-16">
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-slate-950/40 backdrop-blur-2xl border border-white/5 p-6 rounded-[2rem] shadow-2xl"
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3 mb-2">
                                <DockBadge color="amber">Maritim Hub</DockBadge>
                                <div className="h-px w-12 bg-white/10" />
                                <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Region {player.regionId === 'region_vest' ? 'Vest' : 'Øst'}</span>
                            </div>
                            <h1 className="text-8xl font-black text-white italic tracking-tighter leading-none mb-2 drop-shadow-2xl">KAIA</h1>
                            <p className="text-slate-400 text-base max-w-[280px] leading-relaxed font-medium">
                                {player.boat ? 'Båten din ligger klar ved bryggen. Vinden er gunstig.' : 'Verftet venter. Legg ned den første kjølen for å erobre havet.'}
                            </p>
                        </div>
                    </motion.div>

                    {/* ARMORY PANEL (Glassmorphism) */}
                    {player.boat && (
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="w-72 bg-slate-950/40 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-black italic uppercase tracking-tighter">Arsenalet</h3>
                                <Package className="text-amber-500" size={20} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="text-white/40 text-[9px] uppercase font-bold block mb-1">I Lasterom</span>
                                    <div className="flex items-center gap-2">
                                        <Box size={14} className="text-amber-400" />
                                        <span className="text-xl font-black text-white italic">{boatAmmo}</span>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="text-white/40 text-[9px] uppercase font-bold block mb-1">Ryggsekk</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black text-white italic">{inventoryAmmo}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => onAction('REFILL_AMMO')}
                                disabled={inventoryAmmo <= 0}
                                className={`w-full py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all
                                    ${inventoryAmmo > 0
                                        ? 'bg-white text-slate-950 hover:scale-[1.02] active:scale-95 shadow-xl'
                                        : 'bg-white/5 text-white/20 cursor-not-allowed'}
                                `}
                            >
                                Last ombord
                            </button>
                        </motion.div>
                    )}
                </div>

                {/* Bottom Row: Actions */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex justify-center gap-6"
                >
                    <div className="flex items-center gap-6 bg-slate-950/20 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <DockButton variant="ghost" onClick={() => onAction('OPEN_SHIPYARD')}>
                            <Hammer size={18} /> Verftet
                        </DockButton>

                        <DockButton
                            disabled={!canSail}
                            onClick={() => onAction('START_SAILING')}
                            variant={canSail ? 'primary' : 'ghost'}
                        >
                            <Navigation size={20} />
                            {isDamaged ? 'SKADET SKROG!' : 'Sette Seil'}
                        </DockButton>

                        {isDamaged && (
                            <DockButton variant="danger" onClick={() => onAction('REPAIR_BOAT')}>
                                <ShieldAlert size={18} /> Reparer
                            </DockButton>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Cinematic Perspective Lines */}
            <div className="absolute top-[45%] w-full h-px bg-white/5 shadow-[0_0_50px_rgba(255,255,255,0.1)] pointer-events-none" />
        </div>
    );
};
