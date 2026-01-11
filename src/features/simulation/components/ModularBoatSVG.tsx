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
    variant?: 'standard' | 'blueprint'; // NEW: Holographic Mode
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
    sloop: "M-140,-35 Q-100,-35 0,-45 Q100,-35 160,0 Q100,35 0,45 Q-100,35 -140,35 L-140,-35 Z",
    cog: "M-160,-50 Q-120,-50 0,-60 Q120,-50 140,0 Q120,50 0,60 Q-120,50 -160,50 L-160,-50 Z",
    galleon: "M-180,-55 Q-130,-55 0,-65 Q130,-55 170,0 Q130,55 0,65 Q-130,55 -180,55 L-180,-55 Z"
};

const SAIL_PATHS = {
    standard: "M-40,-70 Q10,-70 20,0 Q10,70 -40,70",
    sloop: "M-60,-80 Q20,-60 60,0 Q20,60 -60,80 L-50,0 Z",
    cog: "M-50,-90 Q0,-90 50,0 Q0,90 -50,90",
    galleon: "M-60,-100 Q10,-100 60,-30 Q10,-30 -60,-30 M-50,30 Q10,30 50,90 Q10,90 -50,90"
};

export const ModularBoatSVG: React.FC<ModularBoatSVGProps> = React.memo(({
    stage,
    model = 'standard',
    componentLevels = { sails: 0, hull: 0, cannons: 0, nets: 0 },
    view = 'top',
    variant = 'standard',
    customization = {},
    scale = 1,
    rotation = 0,
    className = ""
}) => {
    // --- STYLE LOGIC ---
    const isBlueprint = variant === 'blueprint';

    // Aesthetic Palettes
    const PALETTE = {
        standard: {
            hullFill: customization.color || '#4b2c20',
            hullStroke: '#2d1a12',
            deckFill: '#000000',
            deckOpacity: 0.2,
            sailFill: customization.sailPattern === 'striped' ? "url(#stripedPattern)" : "#f3f4f6", // TODO: proper Pattern ref
            sailStroke: (componentLevels.sails || 0) >= 3 ? "#fbbf24" : "#d1d5db",
            metal: '#1f2937',
            wood: '#3d2319',
            gold: '#fbbf24'
        },
        blueprint: {
            hullFill: 'rgba(6, 182, 212, 0.05)', // Low opacity Cyan
            hullStroke: '#06b6d4', // Cyan-500
            deckFill: 'transparent',
            deckOpacity: 0,
            sailFill: 'rgba(255, 255, 255, 0.05)',
            sailStroke: '#22d3ee', // Cyan-400
            metal: '#0891b2', // Cyan-600
            wood: '#0e7490', // Cyan-700
            gold: '#fbbf24' // Keep gold for highlights/active
        }
    };

    const colors = isBlueprint ? PALETTE.blueprint : PALETTE.standard;
    const filter = isBlueprint ? "drop-shadow(0 0 2px rgba(6,182,212,0.5))" : "none";
    const strokeWidth = isBlueprint ? "2" : "4";

    const isConstruction = stage < 4;
    const hullPath = (HULL_PATHS as any)[model] || HULL_PATHS.standard;
    const sailPath = (SAIL_PATHS as any)[model] || SAIL_PATHS.standard;
    const sailLevel = componentLevels.sails || 0;
    const cannonCount = componentLevels.cannons || 0;

    // --- SIDE VIEW ---
    if (view === 'side') {
        return (
            <motion.svg
                viewBox="0 0 400 300"
                className={`w-full h-full ${className}`}
                initial={false}
                animate={{ scale }}
                style={{ filter }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <g transform="translate(200, 180)">
                    {stage >= 1 && (
                        <g id="hull-side">
                            <path
                                d={model === 'galleon' ? "M-190,-40 Q-100,50 0,60 Q100,50 180,-40 L160,-50 L-160,-50 Z" : "M-160,-20 Q-150,40 0,50 Q150,40 160,-30 L140,-40 L-140,-40 Z"}
                                fill={colors.hullFill}
                                stroke={colors.hullStroke}
                                strokeWidth={strokeWidth}
                            />
                        </g>
                    )}
                    {stage >= 2 && (
                        <g id="mast-side">
                            <rect x="-4" y="-180" width="8" height="150" rx="2" fill={colors.wood} stroke={isBlueprint ? colors.hullStroke : 'none'} />
                            <motion.path
                                d="M-55,-145 Q20,-100 -55,-20"
                                fill={colors.sailFill}
                                stroke={colors.sailStroke}
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
            style={{ rotate: rotation, filter }}
            initial={false}
            animate={{ scale }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <g transform="translate(200, 150) scale(1)">
                {/* HULL */}
                {stage >= 1 && (
                    <g id="hull">
                        <path
                            d={isConstruction ? HULL_PATHS.standard : hullPath}
                            fill={colors.hullFill}
                            stroke={colors.hullStroke}
                            strokeWidth={strokeWidth}
                        />
                        <path
                            d="M-130,-30 L110,-30 L130,0 L110,30 L-130,30 Z"
                            fill={colors.deckFill}
                            fillOpacity={colors.deckOpacity}
                        />
                    </g>
                )}

                {/* CANNONS */}
                {!isConstruction && cannonCount > 0 && (
                    <g id="cannons">
                        <rect x="-80" y="-45" width="20" height="8" fill={colors.metal} stroke={isBlueprint ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="-40" y="-48" width="20" height="8" fill={colors.metal} stroke={isBlueprint ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="0" y="-50" width="20" height="8" fill={colors.metal} stroke={isBlueprint ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="-80" y="37" width="20" height="8" fill={colors.metal} stroke={isBlueprint ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="-40" y="40" width="20" height="8" fill={colors.metal} stroke={isBlueprint ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="0" y="42" width="20" height="8" fill={colors.metal} stroke={isBlueprint ? colors.hullStroke : 'none'} strokeWidth="1" />
                        {model === 'galleon' && (
                            <>
                                <rect x="-120" y="-42" width="20" height="8" fill={colors.metal} stroke={isBlueprint ? colors.hullStroke : 'none'} strokeWidth="1" />
                                <rect x="-120" y="34" width="20" height="8" fill={colors.metal} stroke={isBlueprint ? colors.hullStroke : 'none'} strokeWidth="1" />
                            </>
                        )}
                    </g>
                )}

                {/* MAST & SAILS */}
                {stage >= 2 && (
                    <g id="mast-rigging">
                        <circle cx="0" cy="0" r="6" fill={colors.wood} />
                        <rect x="-4" y="-80" width="8" height="160" rx="2" fill={colors.wood} transform="rotate(90)" />
                        <path
                            d={sailPath}
                            fill={colors.sailFill}
                            stroke={colors.sailStroke}
                            strokeWidth="2"
                            opacity="0.9"
                        />
                        {/* Flag */}
                        <motion.path
                            d="M-4,-80 L-40,-70 L-40,-90 Z"
                            fill={isBlueprint ? colors.gold : (customization.color || '#ef4444')} // Gold flag in blueprint
                            animate={{ scaleX: [1, 1.2, 1], rotate: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                    </g>
                )}
            </g>
        </motion.svg>
    );
}, (prev, next) => {
    return (
        prev.stage === next.stage &&
        prev.model === next.model &&
        prev.view === next.view &&
        prev.variant === next.variant && // NEW
        prev.scale === next.scale &&
        prev.rotation === next.rotation &&
        prev.customization?.color === next.customization?.color &&
        prev.componentLevels?.sails === next.componentLevels?.sails &&
        prev.componentLevels?.cannons === next.componentLevels?.cannons
    );
});
