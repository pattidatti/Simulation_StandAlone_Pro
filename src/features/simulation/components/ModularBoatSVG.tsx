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
    variant?: 'standard' | 'drafting' | 'realistic'; // Updated for Royal Shipwright
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
    const isDrafting = variant === 'drafting';

    // Aesthetic Palettes
    const PALETTE = {
        standard: {
            hullFill: customization.color || '#453020', // WoodLight
            hullStroke: '#2a1b12', // WoodDark
            deckFill: '#1a0f0a', // Darker wood
            deckOpacity: 0.4,
            sailFill: customization.sailPattern === 'striped' ? "url(#stripedPattern)" : "#f0e6d2", // Parchment-like sail
            sailStroke: (componentLevels.sails || 0) >= 3 ? "#b45309" : "#a8a29e", // Brass or Stone
            metal: '#3f3f46',
            wood: '#453020',
            gold: '#d97706'
        },
        drafting: {
            hullFill: '#f5f5f4', // Warm Grey / Off-white wash
            hullStroke: '#1c1917', // Stone-900
            deckFill: '#e7e5e4', // Slightly darker wash
            deckOpacity: 1, // SOLID FILL
            sailFill: '#fafaf9', // White wash
            sailStroke: '#1c1917',
            metal: '#44403c', // Dark Stone fill
            wood: '#57534e', // Stone fill
            gold: '#1c1917' // Ink
        }
    };

    const colors = isDrafting ? PALETTE.drafting : PALETTE.standard;
    const strokeWidth = isDrafting ? "2.5" : "4";

    // "Hand-drawn" effect for drafting
    const filter = isDrafting ? "url(#inkRoughness)" : "none";
    const strokeDasharray = isDrafting ? "300 5" : "none"; // Imperfect lines

    const isConstruction = stage < 4;
    const hullPath = (HULL_PATHS as any)[model] || HULL_PATHS.standard;
    const sailPath = (SAIL_PATHS as any)[model] || SAIL_PATHS.standard;
    const cannonCount = componentLevels.cannons || 0;

    // --- SIDE VIEW ---
    if (view === 'side') {
        return (
            <motion.svg
                viewBox="0 0 400 300"
                className={`w-full h-full ${className}`}
                initial={false}
                animate={{ scale }}
                style={{ filter: isDrafting ? 'none' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Ink Effect Defs */}
                {isDrafting && (
                    <defs>
                        <filter id="inkRoughness">
                            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                        </filter>
                    </defs>
                )}

                <g transform="translate(200, 180)" filter={filter}>
                    {stage >= 1 && (
                        <g id="hull-side">
                            <path
                                d={model === 'galleon' ? "M-190,-40 Q-100,50 0,60 Q100,50 180,-40 L160,-50 L-160,-50 Z" : "M-160,-20 Q-150,40 0,50 Q150,40 160,-30 L140,-40 L-140,-40 Z"}
                                fill={colors.hullFill}
                                stroke={colors.hullStroke}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={strokeDasharray}
                            />
                        </g>
                    )}
                    {stage >= 2 && (
                        <g id="mast-side">
                            <rect x="-4" y="-180" width="8" height="150" rx="2" fill={isDrafting ? 'none' : colors.wood} stroke={colors.wood} strokeWidth={isDrafting ? 2 : 0} />
                            <motion.path
                                // UPDATED: Sail now starts at M0 (Mast Center) instead of M-55 (Empty Space)
                                d="M0,-145 Q60,-90 0,-20"
                                fill={colors.sailFill}
                                stroke={colors.sailStroke}
                                strokeWidth="2"
                                strokeDasharray={isDrafting ? "4 2" : "none"} // Dashed lines for sails in draft
                                animate={{
                                    d: [
                                        "M0,-145 Q60,-90 0,-20",
                                        "M0,-145 Q80,-90 0,-20", // Billow out further
                                        "M0,-145 Q60,-90 0,-20"
                                    ]
                                }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} // Slower, calmer sway
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
            {isDrafting && (
                <defs>
                    <filter id="inkRoughness">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                    </filter>
                </defs>
            )}

            <g transform="translate(200, 150) scale(1)" filter={filter}>
                {/* HULL */}
                {stage >= 1 && (
                    <g id="hull">
                        <path
                            d={isConstruction ? HULL_PATHS.standard : hullPath}
                            fill={colors.hullFill}
                            stroke={colors.hullStroke}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
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
                        <rect x="-80" y="-45" width="20" height="8" fill={colors.metal} stroke={isDrafting ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="-40" y="-48" width="20" height="8" fill={colors.metal} stroke={isDrafting ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="0" y="-50" width="20" height="8" fill={colors.metal} stroke={isDrafting ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="-80" y="37" width="20" height="8" fill={colors.metal} stroke={isDrafting ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="-40" y="40" width="20" height="8" fill={colors.metal} stroke={isDrafting ? colors.hullStroke : 'none'} strokeWidth="1" />
                        <rect x="0" y="42" width="20" height="8" fill={colors.metal} stroke={isDrafting ? colors.hullStroke : 'none'} strokeWidth="1" />
                        {model === 'galleon' && (
                            <>
                                <rect x="-120" y="-42" width="20" height="8" fill={colors.metal} stroke={isDrafting ? colors.hullStroke : 'none'} strokeWidth="1" />
                                <rect x="-120" y="34" width="20" height="8" fill={colors.metal} stroke={isDrafting ? colors.hullStroke : 'none'} strokeWidth="1" />
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
                            opacity={isDrafting ? 1 : 0.9}
                            strokeDasharray={isDrafting ? "4 2" : "none"}
                        />
                        {/* Flag */}
                        <motion.path
                            d="M-4,-80 L-40,-70 L-40,-90 Z"
                            fill={isDrafting ? colors.gold : (customization.color || '#ef4444')}
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
        prev.variant === next.variant &&
        prev.scale === next.scale &&
        prev.rotation === next.rotation &&
        prev.customization?.color === next.customization?.color &&
        prev.componentLevels?.sails === next.componentLevels?.sails &&
        prev.componentLevels?.cannons === next.componentLevels?.cannons
    );
});
