import { memo } from 'react';
import { motion } from 'framer-motion';
import { ModularBoatSVG } from './ModularBoatSVG';
import { BlueprintGrid } from './ui/BlueprintGrid';

interface ShipyardVisualizerProps {
    stage: number;
    model: any;
    componentLevels: any;
    customization: any;
    hoveredUpgrade: string | null;
}

export const ShipyardVisualizer = memo(({ stage, model, componentLevels, customization, hoveredUpgrade }: ShipyardVisualizerProps) => {

    // Logic to highlight/dim parts based on hover
    // For now, we just pass the componentLevels + 1 preview if hovered
    const previewLevels = hoveredUpgrade ? {
        ...componentLevels,
        [hoveredUpgrade]: (componentLevels[hoveredUpgrade] || 0) + 1
    } : componentLevels;

    return (
        <div className="absolute inset-0 bg-[#0f172a] overflow-hidden flex items-center justify-center p-12">
            <BlueprintGrid />

            <motion.div
                key={model}
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full relative z-10"
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <ModularBoatSVG
                        stage={stage}
                        model={model}
                        componentLevels={previewLevels}
                        customization={customization}
                        view="side"
                        variant="blueprint" // Holographic Mode Active
                        className="drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    />
                </div>
            </motion.div>

            {/* HOLO-HUD OVERLAY */}
            <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
                <div className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase mb-1">
                    System Status
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                    <span className="text-xs text-green-400 font-bold tracking-wider">ONLINE</span>
                </div>
                <div className="h-[1px] w-24 bg-gradient-to-r from-cyan-500/50 to-transparent mt-2" />
            </div>

            <div className="absolute bottom-8 right-8 text-right pointer-events-none">
                <div className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase">
                    Model: {model?.toUpperCase() || 'UNKNOWN'}
                </div>
                <div className="text-xs text-white/40 mt-1 font-mono">
                    ID: {model ? model.toUpperCase().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0).toString(16).padEnd(4, '0').toUpperCase() : '0000'}
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    // Only re-render if visual props change
    return (
        prev.stage === next.stage &&
        prev.model === next.model &&
        prev.hoveredUpgrade === next.hoveredUpgrade &&
        prev.componentLevels === next.componentLevels && // Deep check might be needed if object ref changes
        JSON.stringify(prev.customization) === JSON.stringify(next.customization)
    );
});

ShipyardVisualizer.displayName = 'ShipyardVisualizer';
