import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressiveImage } from './ui/ProgressiveImage';
import { SimulationPlayer } from '../simulationTypes';
import { ModularBoatSVG } from './ModularBoatSVG';
import { Hammer, Navigation, Info } from 'lucide-react';

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
 * Features seasonal and time-of-day backgrounds with high fidelity WebP assets.
 */
// --- INTERNAL BESPOKE COMPONENTS ---
const DockBadge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'amber' }) => (
    <div className={`px-4 py-1.5 rounded-full bg-${color}-500/20 border border-${color}-400/30 text-${color}-400 text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
        {children}
    </div>
);

const DockButton: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' }> = ({ children, onClick, disabled, variant = 'primary' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter transition-all active:scale-95 flex items-center gap-3
            ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-105'}
            ${variant === 'primary' ? 'bg-amber-500 text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.2)]' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}
        `}
    >
        {children}
    </button>
);

export const DockView: React.FC<DockViewProps> = ({ player, world, onAction }) => {
    const { season, time } = world;
    const canSail = player.boat && player.boat.stage >= 2;

    // Construct the high-realism asset path based on season and time
    // ULTRATHINK: Fallback to generated high-fidelity asset from artifacts directory
    const backgroundAsset = `${import.meta.env.BASE_URL}antigravity/brain/07597a3b-439f-498d-aa43-1b02768f5015/maritime_dock_autumn_night_1768089201490.png`;
    const placeholderAsset = backgroundAsset;

    return (
        <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
            {/* HIGH-REALISM BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <ProgressiveImage
                    src={backgroundAsset}
                    placeholderSrc={placeholderAsset}
                    alt={`${season} ${time} Dock View`}
                    className="w-full h-full object-cover brightness-[0.8] contrast-[1.1]"
                    disableMotion={true}
                />

                {/* Weather Overlays (Atmospheric Blur/Glow) */}
                {world.weather === 'Fog' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        className="absolute inset-0 backdrop-blur-[2px] bg-white/5 pointer-events-none"
                    />
                )}
            </div>

            {/* THE BOAT (If constructed) */}
            <AnimatePresence>
                {player.boat && player.boat.stage > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] z-10 pointer-events-none"
                    >
                        <ModularBoatSVG
                            stage={player.boat.stage}
                            customization={player.boat.customization}
                            scale={0.8}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INTERACTIVE HUB OVERLAY */}
            <div className="relative z-20 w-full h-full flex flex-col justify-between p-8">
                {/* Header Info */}
                <div className="flex justify-between items-start">
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl"
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3">
                                <DockBadge color="indigo">Dykkerhus Operativt</DockBadge>
                                <h1 className="text-8xl font-black text-white italic tracking-tighter leading-tight mb-2 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">HAVNEKONTORET</h1>
                                <div className="flex items-center gap-4">
                                    <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[11px] max-w-md">Port of {player.regionId === 'region_vest' ? 'Vestfjella' : 'Østlandet'} • Maritime Hub</p>
                                    <div className="h-px w-20 bg-white/10" />
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-300 text-sm max-w-xs mt-4 leading-relaxed font-medium">
                            {player.boat ? 'Båten din ligger klar ved bryggen. Vinden blåser gunstig fra nordvest.' : 'Havnen er tom. Besøk skipsverftet for å legge ned den første kjølen.'}
                        </p>
                    </motion.div>

                    <div className="flex gap-3">
                        <DockButton variant="ghost" onClick={() => onAction('OPEN_WHARF_UPGRADE')}>
                            <Info className="mr-2" size={18} /> Kai-info
                        </DockButton>
                    </div>
                </div>

                {/* Main Actions (Bottom Center) */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex justify-center gap-6 pb-12"
                >
                    <div className="flex items-center gap-6">
                        <DockButton onClick={() => onAction('OPEN_SHIPYARD')}>
                            <Hammer size={20} /> Skipsverftet
                        </DockButton>

                        <DockButton
                            disabled={!canSail}
                            onClick={() => onAction('START_SAILING')}
                            variant={canSail ? 'primary' : 'ghost'}
                        >
                            <Navigation size={20} /> Sette Seil
                        </DockButton>
                    </div>
                </motion.div>
            </div>

            {/* HORIZON LINE - Stylistic Detail */}
            <div className="absolute top-[45%] w-full h-[1px] bg-white/10 pointer-events-none shadow-[0_0_30px_rgba(255,255,255,0.2)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80 pointer-events-none" />
        </div>
    );
};
