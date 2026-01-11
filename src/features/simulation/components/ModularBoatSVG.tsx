import React from 'react';
import { motion } from 'framer-motion';

interface ModularBoatSVGProps {
    stage: number; // 0: None, 1: Hull, 2: Mast/Rigging, 3: Deck/Details, 4: Luxury
    view?: 'top' | 'side';
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
 * Supports both Top-Down (for sailing) and Side-Profile (for Hubs).
 */
export const ModularBoatSVG: React.FC<ModularBoatSVGProps> = ({
    stage,
    view = 'top',
    customization = {},
    scale = 1,
    rotation = 0,
    className = ""
}) => {
    const boatColor = customization.color || '#4b2c20'; // Default dark wood
    const flagColor = customization.color || '#ef4444';

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
                    {/* STAGE 1: HULL PROFILE */}
                    {stage >= 1 && (
                        <g id="hull-side">
                            <path
                                d="M-160,-20 Q-150,40 0,50 Q150,40 160,-30 L140,-40 L-140,-40 Z"
                                fill={boatColor}
                                stroke="#2d1a12"
                                strokeWidth="4"
                            />
                            {/* Waterline Shading */}
                            <path
                                d="M-152,10 Q-140,35 0,40 Q140,35 152,0 L150,-10 L-150,-10 Z"
                                fill="black"
                                opacity="0.2"
                            />
                        </g>
                    )}

                    {/* STAGE 2: MAST & SAIL PROFILE */}
                    {stage >= 2 && (
                        <g id="mast-side">
                            {/* Mast */}
                            <rect x="-4" y="-180" width="8" height="150" rx="2" fill="#3d2319" />
                            {/* Yardarm */}
                            <rect x="-60" y="-150" width="120" height="6" rx="2" fill="#3d2319" />
                            {/* Billowing Sail */}
                            <motion.path
                                d="M-55,-145 Q20,-100 -55,-20"
                                fill="#f3f4f6"
                                stroke="#d1d5db"
                                strokeWidth="2"
                                animate={{ d: ["M-55,-145 Q20,-95 -55,-20", "M-55,-145 Q40,-95 -55,-20", "M-55,-145 Q20,-95 -55,-20"] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            />
                        </g>
                    )}

                    {/* STAGE 3: DECK DETAILS PROFILE */}
                    {stage >= 3 && (
                        <g id="deck-side">
                            {/* Crow's Nest */}
                            <path d="M-10,-165 L10,-165 L15,-180 L-15,-180 Z" fill="#3d2319" />
                            {/* Bowsprit Profile */}
                            <path d="M160,-30 L200,-50" stroke="#3d2319" strokeWidth="6" strokeLinecap="round" />
                            {/* Railing */}
                            <path d="M-140,-40 L140,-40" stroke="#2d1a12" strokeWidth="2" strokeDasharray="10 5" />
                        </g>
                    )}

                    {/* STAGE 4: LUXURY PROFILE */}
                    {stage >= 4 && (
                        <g id="luxury-side">
                            {/* Gold Line */}
                            <path d="M-155,-25 Q0,10 155,-35" fill="none" stroke="#fbbf24" strokeWidth="3" opacity="0.8" />
                            {/* Figurehead side */}
                            <circle cx="205" cy="-55" r="8" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                            {/* Lantern at Stern */}
                            <rect x="-150" y="-55" width="10" height="15" fill="#fcd34d" stroke="#b45309" strokeWidth="1" />
                        </g>
                    )}
                </g>
            </motion.svg>
        );
    }

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
                {/* --- STAGE 1: HULL (Refactored: Bow points RIGHT/+X) --- */}
                {/* 
                   Old Orientation: Pointed Down (+Y). 
                   New Orientation: Point RIGHT (+X).
                   Bow at x=150, Stern at x=-150.
                */}
                {stage >= 1 && (
                    <g id="hull">
                        {/* Main Hull Shape */}
                        <path
                            d="M-150,-40 Q-120,-40 0,-50 Q120,-40 150,0 Q120,40 0,50 Q-120,40 -150,40 L-150,-40 Z"
                            fill={boatColor}
                            stroke="#2d1a12"
                            strokeWidth="4"
                        />
                        {/* Deck Detail / Interior Shading */}
                        <path
                            d="M-130,-30 L110,-30 L130,0 L110,30 L-130,30 Z"
                            fill="#5d3a2e"
                            filter="brightness(0.8)"
                        />
                    </g>
                )}

                {/* --- STAGE 2: MAST & RIGGING --- */}
                {stage >= 2 && (
                    <g id="mast-rigging">
                        {/* Mast (Central pole) */}
                        <circle cx="0" cy="0" r="6" fill="#3d2319" />
                        <rect x="-4" y="-80" width="8" height="160" rx="2" fill="#3d2319" transform="rotate(90)" />

                        {/* Main Sail (Billowing East/Right) */}
                        {/* Simplification: Top-down sail looks like a curve crossing the hull */}
                        <path
                            d="M-40,-70 Q10,-70 20,0 Q10,70 -40,70"
                            fill="#f3f4f6"
                            stroke="#d1d5db"
                            strokeWidth="2"
                            opacity="0.9"
                        />

                        {/* Flag (Streaming backwards/West) */}
                        <motion.path
                            d="M-4,-80 L-40,-70 L-40,-90 Z"
                            fill={flagColor}
                            transform="translate(0, 0)"
                            animate={{ scaleX: [1, 1.2, 1], rotate: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                    </g>
                )}

                {/* --- STAGE 3: DECK & DETAILS --- */}
                {stage >= 3 && (
                    <g id="deck-details">
                        {/* Cargo (Stern section) */}
                        <rect x="-110" y="-20" width="30" height="20" rx="2" fill="#78350f" stroke="#451a03" />
                        <rect x="-90" y="5" width="20" height="20" rx="2" fill="#92400e" stroke="#451a03" />

                        {/* Bowsprit */}
                        <path d="M150,0 L180,0" stroke="#3d2319" strokeWidth="6" strokeLinecap="round" />
                    </g>
                )}

                {/* --- STAGE 4: LUXURY --- */}
                {stage >= 4 && (
                    <g id="luxury">
                        {/* Gold Trim around Hull */}
                        <path
                            d="M-150,-40 Q-120,-40 0,-50 Q120,-40 150,0 Q120,40 0,50 Q-120,40 -150,40"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="2"
                            strokeDasharray="10 5"
                        />
                        {/* Golden Figurehead */}
                        <circle cx="180" cy="0" r="6" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                    </g>
                )}
            </g>
        </motion.svg>
    );
};
