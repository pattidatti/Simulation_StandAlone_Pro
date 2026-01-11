import React from 'react';
import { motion } from 'framer-motion';

interface ModularBoatSVGProps {
    stage: number; // 0-4 (Construction Phase)
    model?: 'standard' | 'sloop' | 'cog' | 'galleon';
    componentLevels?: {
        sails: number;
        hull: number;
        cannons: number;
        nets: number;
    };
    view?: 'top' | 'side';
    customization?: {
        color?: string;
        flagId?: string;
        figurehead?: string;
        sailPattern?: 'none' | 'striped' | 'emblem';
        sternDecor?: string;
    };
    scale?: number;
    rotation?: number;
    className?: string;
}

const HULL_PATHS = {
    standard: "M-150,-40 Q-120,-40 0,-50 Q120,-40 150,0 Q120,40 0,50 Q-120,40 -150,40 L-150,-40 Z",
    sloop: "M-140,-35 Q-100,-35 0,-45 Q100,-35 160,0 Q100,35 0,45 Q-100,35 -140,35 L-140,-35 Z", // Sleeker, pointed
    cog: "M-160,-50 Q-120,-50 0,-60 Q120,-50 140,0 Q120,50 0,60 Q-120,50 -160,50 L-160,-50 Z", // Wide, round
    galleon: "M-180,-55 Q-130,-55 0,-65 Q130,-55 170,0 Q130,55 0,65 Q-130,55 -180,55 L-180,-55 Z" // Massive
};

const SAIL_PATHS = {
    standard: "M-40,-70 Q10,-70 20,0 Q10,70 -40,70",
    sloop: "M-60,-80 Q20,-60 60,0 Q20,60 -60,80 L-50,0 Z", // Triangular-ish / Lateen hint
    cog: "M-50,-90 Q0,-90 50,0 Q0,90 -50,90", // Large square sail
    galleon: "M-60,-100 Q10,-100 60,-30 Q10,-30 -60,-30 M-50,30 Q10,30 50,90 Q10,90 -50,90" // Multi-sail hint (simplified top-down)
};

/**
 * ModularBoatSVG - V2
 * Supports multi-model rendering and component tier visualization.
 * Memoized for high-performance rendering in the sailing minigame.
 */
export const ModularBoatSVG: React.FC<ModularBoatSVGProps> = React.memo(({
    stage,
    model = 'standard',
    componentLevels = { sails: 0, hull: 0, cannons: 0, nets: 0 },
    view = 'top',
    customization = {},
    scale = 1,
    rotation = 0,
    className = ""
}) => {
    const boatColor = customization.color || '#4b2c20';
    const flagColor = customization.color || '#ef4444'; // Use main color for flag if not specific? Or default red.
    const isConstruction = stage < 4;

    // Derived Visual State
    const hullPath = (HULL_PATHS as any)[model] || HULL_PATHS.standard;
    const sailPath = (SAIL_PATHS as any)[model] || SAIL_PATHS.standard;
    const sailLevel = componentLevels.sails || 0;
    const cannonCount = componentLevels.cannons || 0;

    // --- SIDE VIEW (Still mostly 'Standard' for now, but scalable) ---
    if (view === 'side') {
        return (
            <motion.svg
                viewBox="0 0 400 300"
                className={`w-full h-full ${className}`}
                initial={false}
                animate={{ scale }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <g transform="translate(200, 180)">
                    {/* Construction or Full Model */}
                    {stage >= 1 && (
                        <g id="hull-side">
                            <path
                                d={model === 'galleon' ? "M-190,-40 Q-100,50 0,60 Q100,50 180,-40 L160,-50 L-160,-50 Z" : "M-160,-20 Q-150,40 0,50 Q150,40 160,-30 L140,-40 L-140,-40 Z"}
                                fill={boatColor}
                                stroke="#2d1a12"
                                strokeWidth="4"
                            />
                        </g>
                    )}
                    {stage >= 2 && (
                        <g id="mast-side">
                            <rect x="-4" y="-180" width="8" height="150" rx="2" fill="#3d2319" />
                            <motion.path
                                d="M-55,-145 Q20,-100 -55,-20"
                                fill={sailLevel > 2 ? "#ffffff" : "#f3f4f6"}
                                stroke={sailLevel > 2 ? "#fbbf24" : "#d1d5db"} // Gold trim for max level
                                strokeWidth="2"
                                animate={{ d: ["M-55,-145 Q20,-95 -55,-20", "M-55,-145 Q40,-95 -55,-20", "M-55,-145 Q20,-95 -55,-20"] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            />
                        </g>
                    )}
                </g>
            </motion.svg>
        );
    }

    // --- TOP VIEW ---
    return (
        <motion.svg
            viewBox="0 0 400 300"
            className={`w-full h-full ${className}`}
            style={{ rotate: rotation }}
            initial={false}
            animate={{ scale }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <g transform="translate(200, 150) scale(1)">
                {/* HULL */}
                {stage >= 1 && (
                    <g id="hull">
                        <path
                            d={isConstruction ? HULL_PATHS.standard : hullPath} // Use standard frame during build
                            fill={boatColor}
                            stroke="#2d1a12"
                            strokeWidth="4"
                        />
                        {/* Deck Shading */}
                        <path
                            d="M-130,-30 L110,-30 L130,0 L110,30 L-130,30 Z"
                            fill="#000000"
                            fillOpacity="0.2"
                        />
                    </g>
                )}

                {/* CANNONS (Visual Representation based on level) */}
                {!isConstruction && cannonCount > 0 && (
                    <g id="cannons">
                        <rect x="-80" y="-45" width="20" height="8" fill="#1f2937" />
                        <rect x="-40" y="-48" width="20" height="8" fill="#1f2937" />
                        <rect x="0" y="-50" width="20" height="8" fill="#1f2937" />

                        <rect x="-80" y="37" width="20" height="8" fill="#1f2937" />
                        <rect x="-40" y="40" width="20" height="8" fill="#1f2937" />
                        <rect x="0" y="42" width="20" height="8" fill="#1f2937" />

                        {model === 'galleon' && (
                            <>
                                <rect x="-120" y="-42" width="20" height="8" fill="#1f2937" />
                                <rect x="-120" y="34" width="20" height="8" fill="#1f2937" />
                            </>
                        )}
                    </g>
                )}

                {/* MAST & SAILS */}
                {stage >= 2 && (
                    <g id="mast-rigging">
                        <circle cx="0" cy="0" r="6" fill="#3d2319" />
                        <rect x="-4" y="-80" width="8" height="160" rx="2" fill="#3d2319" transform="rotate(90)" />

                        {/* Sail */}
                        <path
                            d={sailPath}
                            fill={customization.sailPattern === 'striped' ? "url(#stripedPattern)" : "#f3f4f6"}
                            stroke={sailLevel >= 3 ? "#fbbf24" : "#d1d5db"} // Gold trim
                            strokeWidth="2"
                            opacity="0.9"
                        />

                        {/* Custom Pattern Def (if needed) - simplified for now, usually needs <defs> */}

                        {/* Flag */}
                        <motion.path
                            d="M-4,-80 L-40,-70 L-40,-90 Z"
                            fill={flagColor}
                            animate={{ scaleX: [1, 1.2, 1], rotate: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                    </g>
                )}

                {/* DECOR & LUXURY */}
                {stage >= 4 && (
                    <g id="luxury">
                        {customization.figurehead !== 'none' && (
                            <circle cx="180" cy="0" r="8" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                        )}
                        {/* Stern Lanterns if componentLevels.hull > 2 */}
                        {componentLevels.hull > 2 && (
                            <rect x="-160" y="-10" width="10" height="20" fill="#fcd34d" />
                        )}
                    </g>
                )}
            </g>
        </motion.svg>
    );
}, (prev, next) => {
    // Custom Comparison for Performance
    return (
        prev.stage === next.stage &&
        prev.model === next.model &&
        prev.view === next.view &&
        prev.scale === next.scale &&
        prev.rotation === next.rotation &&
        prev.customization?.color === next.customization?.color &&
        prev.componentLevels?.sails === next.componentLevels?.sails &&
        prev.componentLevels?.cannons === next.componentLevels?.cannons
        // Add others as needed
    );
});
