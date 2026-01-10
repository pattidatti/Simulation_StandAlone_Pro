import React from 'react';
import { motion } from 'framer-motion';

interface ModularBoatSVGProps {
    stage: number; // 0: None, 1: Hull, 2: Mast/Rigging, 3: Deck/Details, 4: Luxury
    customization?: {
        color?: string;
        flagId?: string;
        figurehead?: string;
    };
    scale?: number;
    rotation?: number;
    className?: string;
}

/**
 * ModularBoatSVG - A layered SVG component that renders based on construction stage.
 * Designed to be highly modular and performant, similar to CaravanSVG.
 */
export const ModularBoatSVG: React.FC<ModularBoatSVGProps> = ({
    stage,
    customization = {},
    scale = 1,
    rotation = 0,
    className = ""
}) => {
    const boatColor = customization.color || '#4b2c20'; // Default dark wood
    const flagColor = customization.color || '#ef4444'; // Use boat color for flag too or separate?

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
                {/* --- STAGE 1: HULL --- */}
                {stage >= 1 && (
                    <g id="hull">
                        <path
                            d="M-150,0 Q-150,80 0,100 Q150,80 150,0 L-150,0 Z"
                            fill={boatColor}
                            stroke="#2d1a12"
                            strokeWidth="4"
                        />
                        <path
                            d="M-130,-10 L130,-10 L140,5 L-140,5 Z"
                            fill="#5d3a2e"
                            filter="brightness(0.8)"
                        />
                    </g>
                )}

                {/* --- STAGE 2: MAST & RIGGING --- */}
                {stage >= 2 && (
                    <g id="mast-rigging">
                        {/* Mast */}
                        <rect x="-8" y="-120" width="16" height="120" fill="#3d2319" />
                        {/* Main Sail */}
                        <path
                            d="M0,-110 Q80,-100 80,-40 Q0,-30 -80,-40 Q-80,-100 0,-110 Z"
                            fill="#f3f4f6"
                            stroke="#d1d5db"
                        />
                        {/* Flag */}
                        <motion.path
                            d="M8,-115 L40,-125 L40,-105 L8,-115 Z"
                            fill={flagColor}
                            animate={{ scaleX: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                    </g>
                )}

                {/* --- STAGE 3: DECK & DETAILS --- */}
                {stage >= 3 && (
                    <g id="deck-details">
                        {/* Railing */}
                        <path d="M-140,0 L140,0" stroke="#2d1a12" strokeWidth="4" strokeLinecap="round" />
                        {/* Barrels/Cargo */}
                        <rect x="30" y="-15" width="20" height="25" rx="4" fill="#78350f" />
                        <rect x="55" y="-10" width="15" height="20" rx="3" fill="#92400e" />
                    </g>
                )}

                {/* --- STAGE 4: LUXURY --- */}
                {stage >= 4 && (
                    <g id="luxury">
                        {/* Golden Figurehead */}
                        <path d="M150,0 Q170,-20 180,0" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
                        <circle cx="175" cy="-5" r="5" fill="#fbbf24" />
                    </g>
                )}
            </g>
        </motion.svg>
    );
};
