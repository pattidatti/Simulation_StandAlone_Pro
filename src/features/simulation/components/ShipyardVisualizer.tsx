import { memo } from 'react';
import { motion } from 'framer-motion';
import { ModularBoatSVG } from './ModularBoatSVG';

interface ShipyardVisualizerProps {
    stage: number;
    model: any;
    componentLevels: any;
    customization: any;
}

export const ShipyardVisualizer = memo(({ stage, model, componentLevels, customization }: ShipyardVisualizerProps) => {



    return (
        <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden">
            {/* Background - Subtle Map Texture or Wood */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply"
                style={{
                    backgroundColor: '#1c1917', // Dark background for contrast
                    backgroundImage: `radial-gradient(circle at center, #292524 0%, #1c1917 100%)`
                }}
            />

            <motion.div
                key={model}
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(2px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="w-full h-full relative z-10"
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <ModularBoatSVG
                        stage={stage}
                        model={model}
                        componentLevels={componentLevels}
                        customization={customization}
                        view="side"
                        variant="standard" // FULL COLOR MODE
                        className="opacity-100 drop-shadow-2xl"
                    />
                </div>
            </motion.div>

            {/* Handwritten Metadata */}
            <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none opacity-60">
                <span className="font-serif italic text-[#1e293b] text-sm">
                    Fig. 1: Lateral View
                </span>
            </div>

            <div className="absolute bottom-8 right-8 text-right pointer-events-none opacity-60">
                <div className="font-serif font-bold text-[#1e293b] text-xs uppercase tracking-widest">
                    Model: {model?.toUpperCase() || 'UNKNOWN'}
                </div>
                <div className="font-mono text-[#57534e] text-[10px] mt-1">
                    REF: {model ? model.toUpperCase().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0).toString(16).padEnd(4, '0').toUpperCase() : '0000'}
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.stage === next.stage &&
        prev.model === next.model &&
        prev.componentLevels === next.componentLevels &&
        JSON.stringify(prev.customization) === JSON.stringify(next.customization)
    );
});

ShipyardVisualizer.displayName = 'ShipyardVisualizer';
