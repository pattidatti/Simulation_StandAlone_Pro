import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { HORSE_COSMETICS } from '../constants';

interface CaravanSVGProps {
    level: number;
    upgrades?: string[];
    className?: string;
    isMoving?: boolean;
    customization?: {
        chassis: string;
        wheels: string;
        cover: string;
        lanterns: string;
        flag: string;
        skin: string;
        companion: string;
        trail: string;
        decor: string;
    };
    horseCustomization?: {
        skinId: string;
        maneColor: string;
        hatId?: string;
    };
}

/**
 * CaravanSVG - Now with full cosmetic support and NOBLE HORSE graphics.
 */
export const CaravanSVG: React.FC<CaravanSVGProps> = ({ level, upgrades = [], className, isMoving, customization, horseCustomization }) => {
    // Colors
    const primary = "#1e293b"; // Slate 800
    const accent = "#fbbf24";  // Amber 400
    const highlight = "#94a3b8"; // Slate 400
    const darkAccent = "#0f172a"; // Slate 900
    const gold = "#fcd34d"; // Amber 300

    // Resolve Visuals (Defaults)
    const visuals = useMemo(() => ({
        chassis: customization?.chassis || 'chassis_oak',
        wheels: customization?.wheels || (level === 1 ? 'wheels_wood' : 'wheels_iron'),
        cover: customization?.cover || 'cover_canvas',
        lanterns: customization?.lanterns || 'lantern_oil',
        flag: customization?.flag || 'flag_none',
        skin: customization?.skin || 'skin_ox',
        decor: customization?.decor || 'decor_none',
        companion: customization?.companion || 'companion_none'
    }), [customization, level]);

    return (
        <svg
            viewBox="0 0 260 140"
            className={`${className} ${isMoving ? 'animate-bounce' : ''}`}
            style={{ animationDuration: '0.8s' }}
        >
            <defs>
                <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff0000" />
                    <stop offset="20%" stopColor="#ffff00" />
                    <stop offset="40%" stopColor="#00ff00" />
                    <stop offset="60%" stopColor="#00ffff" />
                    <stop offset="80%" stopColor="#0000ff" />
                    <stop offset="100%" stopColor="#ff00ff" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Ground Shadow */}
            <ellipse cx="130" cy="110" rx="100" ry="10" fill="rgba(0,0,0,0.15)" />

            {/* --- WHEELS --- */}
            {(() => {
                const isBig = level > 1;
                const wheelColor = visuals.wheels === 'wheels_iron' ? '#475569' : (visuals.wheels === 'wheels_spiked' ? '#334155' : '#78350f');
                const strokeColor = visuals.wheels === 'wheels_spiked' ? '#94a3b8' : '#000';

                if (!isBig) {
                    return (
                        <g transform="translate(100, 100)">
                            <circle r="10" fill={wheelColor} stroke={strokeColor} strokeWidth="1.5" />
                            {visuals.wheels === 'wheels_spiked' && <path d="M 0 -12 L 2 -10 L -2 -10 Z" fill="#94a3b8" />}
                        </g>
                    );
                }

                return (
                    <g>
                        {/* Rear Wheel */}
                        <g transform="translate(60, 95)">
                            <circle r="15" fill={wheelColor} stroke={strokeColor} strokeWidth="2" />
                            <circle r="4" fill={darkAccent} />
                            {visuals.wheels === 'wheels_spiked' && (
                                <>
                                    <path d="M 0 -17 L 3 -14 L -3 -14 Z" fill="#94a3b8" />
                                    <path d="M 0 17 L 3 14 L -3 14 Z" fill="#94a3b8" transform="rotate(180)" />
                                    <path d="M 17 0 L 14 3 L 14 -3 Z" fill="#94a3b8" transform="rotate(90)" />
                                    <path d="M -17 0 L -14 3 L -14 -3 Z" fill="#94a3b8" transform="rotate(-90)" />
                                </>
                            )}
                        </g>
                        {/* Front Wheel */}
                        <g transform="translate(140, 95)">
                            <circle r="15" fill={wheelColor} stroke={strokeColor} strokeWidth="2" />
                            <circle r="4" fill={darkAccent} />
                            {visuals.wheels === 'wheels_spiked' && (
                                <>
                                    <path d="M 0 -17 L 3 -14 L -3 -14 Z" fill="#94a3b8" />
                                    <path d="M 0 17 L 3 14 L -3 14 Z" fill="#94a3b8" transform="rotate(180)" />
                                    <path d="M 17 0 L 14 3 L 14 -3 Z" fill="#94a3b8" transform="rotate(90)" />
                                    <path d="M -17 0 L -14 3 L -14 -3 Z" fill="#94a3b8" transform="rotate(-90)" />
                                </>
                            )}
                        </g>
                    </g>
                );
            })()}

            {/* --- CHASSIS --- */}
            {(() => {
                const color = visuals.chassis === 'chassis_gold' ? gold : (visuals.chassis === 'chassis_iron' ? '#334155' : primary);
                const stroke = visuals.chassis === 'chassis_gold' ? '#b45309' : undefined;

                if (level === 1) {
                    return (
                        <g>
                            <path d="M 50 85 L 150 85 L 155 70 L 45 70 Z" fill={color} stroke={stroke} />
                            <rect x="55" y="60" width="30" height="15" fill={highlight} opacity="0.5" />
                            <line x1="150" y1="80" x2="175" y2="80" stroke={color} strokeWidth="4" />
                        </g>
                    );
                }

                return (
                    <g>
                        <rect x="40" y="55" width="120" height="35" rx="2" fill={color} stroke={stroke} strokeWidth={stroke ? 2 : 0} />
                        {/* Iron/Gold trim */}
                        {(level >= 4 || visuals.chassis !== 'chassis_oak') && (
                            <g>
                                <rect x="40" y="55" width="120" height="4" fill={visuals.chassis === 'chassis_gold' ? '#fff' : '#64748b'} opacity="0.5" />
                                <rect x="40" y="86" width="120" height="4" fill={visuals.chassis === 'chassis_gold' ? '#fff' : '#64748b'} opacity="0.5" />
                            </g>
                        )}
                        {/* Hitch to horse */}
                        <line x1="160" y1="90" x2="180" y2="85" stroke="#334155" strokeWidth="3" />
                    </g>
                );
            })()}

            {/* --- DECOR (Side Panels) --- */}
            {visuals.decor === 'decor_shields' && level > 1 && (
                <g transform="translate(45, 65)">
                    <circle cx="10" cy="10" r="8" fill="#ef4444" stroke="#fff" />
                    <circle cx="30" cy="10" r="8" fill="#3b82f6" stroke="#fff" />
                    <circle cx="50" cy="10" r="8" fill="#22c55e" stroke="#fff" />
                </g>
            )}
            {visuals.decor === 'decor_flowers' && level > 1 && (
                <g transform="translate(45, 82)">
                    <rect width="110" height="6" fill="#78350f" rx="2" />
                    <circle cx="20" cy="-2" r="3" fill="#ec4899" />
                    <circle cx="40" cy="-2" r="3" fill="#eab308" />
                    <circle cx="60" cy="-2" r="3" fill="#a855f7" />
                    <circle cx="80" cy="-2" r="3" fill="#ef4444" />
                </g>
            )}

            {/* --- COVER --- */}
            {level >= 3 && (
                <path
                    d="M 40 55 C 40 55 100 10 160 55 Z"
                    fill={
                        visuals.cover === 'cover_stars' ? '#1e1b4b' :
                            visuals.cover === 'cover_silk' ? '#f8fafc' :
                                visuals.cover === 'cover_leather' ? '#78350f' :
                                    (level >= 5 ? "#1e1b4b" : "#334155")
                    }
                    stroke={darkAccent}
                    strokeWidth="1"
                />
            )}
            {/* Stars Pattern Overlay */}
            {visuals.cover === 'cover_stars' && level >= 3 && (
                <g clipPath="url(#coverClip)">
                    <circle cx="80" cy="40" r="1" fill="#fff" />
                    <circle cx="100" cy="30" r="1.5" fill="#fff" />
                    <circle cx="120" cy="45" r="1" fill="#fff" />
                </g>
            )}

            {/* --- LANTERNS --- */}
            <g filter="url(#glow)">
                <circle
                    cx={level === 1 ? 140 : 160}
                    cy="45"
                    r={visuals.lanterns === 'lantern_fireflies' ? 4 : 3}
                    fill={
                        visuals.lanterns === 'lantern_crystal' ? '#3b82f6' :
                            visuals.lanterns === 'lantern_fireflies' ? '#84cc16' :
                                accent
                    }
                />
                {visuals.lanterns === 'lantern_fireflies' && (
                    <motion.circle cx={level === 1 ? 142 : 162} cy="43" r="1" fill="#fff" animate={{ opacity: [0, 1, 0] }} />
                )}
                <rect x={level === 1 ? 138 : 158} y="38" width="4" height="8" rx="1" fill={primary} />
            </g>

            {/* --- FLAG --- */}
            {visuals.flag !== 'flag_none' && level >= 2 && (
                <g transform="translate(160, 55)">
                    <line x1="0" y1="0" x2="0" y2="-20" stroke="#000" strokeWidth="1" />
                    {visuals.flag === 'flag_pirate' ? (
                        <path d="M 0 -20 L 15 -15 L 0 -10 Z" fill="#000" />
                    ) : (
                        <path d="M 0 -20 L 15 -15 L 0 -10 Z" fill="#ef4444" />
                    )}
                </g>
            )}


            {/* --- COMPANION --- */}
            {visuals.companion === 'companion_dog' && (
                <g transform="translate(60, 55)">
                    <path d="M 0 0 Q 5 -10 10 0 Z" fill="#d97706" />
                    <circle cx="5" cy="-5" r="3" fill="#d97706" />
                </g>
            )}
            {visuals.companion === 'companion_cat' && (
                <g transform={`translate(100, ${level >= 3 ? '15' : '55'})`}>
                    <path d="M 0 0 Q 3 -8 6 0 Z" fill="#000" />
                    <circle cx="3" cy="-4" r="2.5" fill="#000" />
                    <path d="M 3 -4 L 1 -7 M 3 -4 L 5 -7" stroke="#000" strokeWidth="0.5" />
                </g>
            )}

            {/* --- TREKKDYR (NOBLE HORSE) --- */}
            {level >= 1 && (
                // Positioned at X=160 (front of wagon). Scale 0.4 to fit. Y=20 to align with ground 110?
                // NobleHorse viewbox 0..200. Height 0..200.
                // Feet are at ~190.
                // Scale 0.4 -> Feet at ~76 relative.
                // Ground is at 110. So y + 76 = 110 => y = 34.
                <g transform="translate(160, 35) scale(0.4)">
                    {(() => {
                        let skinColor = '#8B4513'; // Default Brown
                        let maneColor = '#1e1b4b'; // Default Shadow
                        let hatId = 'none';

                        // 1. Check if we have a LINKED horse
                        if (visuals.skin === 'skin_horse_linked' && horseCustomization) {
                            const skinObj = HORSE_COSMETICS.skins.find(s => s.id === horseCustomization.skinId);
                            if (skinObj) skinColor = skinObj.color;
                            maneColor = horseCustomization.maneColor || maneColor;
                            hatId = horseCustomization.hatId || hatId;
                        }
                        // 2. Check if we have a SPECIFIC COSMETIC SKIN from the shop
                        else if (visuals.skin.startsWith('skin_horse_')) {
                            // Map 'skin_horse_white' -> 'white'
                            const rawId = visuals.skin.replace('skin_horse_', '');
                            const skinObj = HORSE_COSMETICS.skins.find(s => s.id === rawId);
                            if (skinObj) skinColor = skinObj.color;
                            else if (visuals.skin === 'skin_horse_mech') skinColor = '#94a3b8'; // Fallback for mechanics
                        }
                        // 3. Fallback to basic Ox if 'skin_ox' or unknown
                        else {
                            // OX RENDER (Simplified Noble Horse but bulkier? Or just legacy blob?)
                            // Let's use legacy blob for Ox to differentiate.
                            return (
                                <g transform="translate(0, 60) scale(1.5)">
                                    <path d="M 0 0 Q 20 -20 40 0 L 40 40 L 0 40 Z" fill="#78350f" />
                                    <path d="M 40 0 Q 60 -10 65 15" stroke="#78350f" strokeWidth="8" fill="none" strokeLinecap="round" />
                                    <circle cx="55" cy="5" r="10" fill="#78350f" />
                                    {/* Horns */}
                                    <path d="M 50 0 L 45 -10 M 60 0 L 65 -10" stroke="#fff" strokeWidth="2" />
                                </g>
                            );
                        }

                        const isRainbow = maneColor === 'rainbow';

                        return (
                            <g>
                                {/* Back Legs */}
                                <path d="M70,160 L70,190 L85,190 L85,150 Z" fill={skinColor} filter="brightness(0.7)" />
                                <path d="M140,160 L140,190 L155,190 L155,150 Z" fill={skinColor} filter="brightness(0.7)" />

                                {/* Body */}
                                <path
                                    d="M50,100 Q40,60 90,60 L140,60 Q180,60 170,110 Q160,160 120,150 L80,150 Q50,150 50,100 Z"
                                    fill={skinColor}
                                />

                                {/* Front Legs */}
                                <path d="M60,150 L60,195 L75,195 L75,150 Z" fill={skinColor} />
                                <path d="M130,150 L130,195 L145,195 L145,150 Z" fill={skinColor} />

                                {/* Neck & Head */}
                                <path
                                    d="M130,65 Q130,30 160,20 L165,25 Q185,25 185,50 L175,70 Q160,85 145,65 Z"
                                    fill={skinColor}
                                />
                                {/* Snout */}
                                <path d="M185,50 L195,55 L190,65 L175,70 Z" fill={skinColor} filter="brightness(0.9)" />

                                {/* Mane */}
                                <path
                                    d="M160,20 Q120,20 120,80 L130,90 Q140,30 165,25 Z"
                                    fill={isRainbow ? "url(#rainbowGradient)" : maneColor}
                                    className={isRainbow ? "animate-pulse" : ""}
                                />

                                {/* Tail */}
                                <path
                                    d="M50,80 Q20,80 20,140"
                                    fill="none"
                                    stroke={isRainbow ? "url(#rainbowGradient)" : maneColor}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                />

                                {/* Eye */}
                                <circle cx="170" cy="40" r="2" fill="white" />
                                <circle cx="170.5" cy="39.5" r="0.5" fill="black" />

                                {/* Hat Rendering */}
                                {hatId === 'straw_hat' && (
                                    <text x="160" y="25" fontSize="40" transform="rotate(10, 160, 25)">👒</text>
                                )}
                                {hatId === 'cowboy_hat' && (
                                    <text x="155" y="25" fontSize="40" transform="rotate(-5, 155, 25)">🤠</text>
                                )}
                                {hatId === 'crown' && (
                                    <text x="155" y="20" fontSize="40" transform="rotate(-10, 155, 20)">👑</text>
                                )}
                                {hatId === 'viking' && (
                                    <text x="155" y="20" fontSize="40" transform="rotate(0, 155, 20)">🪖</text>
                                )}
                                {hatId === 'tophat' && (
                                    <text x="152" y="15" fontSize="45" transform="rotate(-10, 155, 20)">🎩</text>
                                )}
                            </g>
                        );
                    })()}
                </g>
            )}

            {/* Upgrades Visualization (Heavy Axles) */}
            {upgrades.includes('heavy_axles') && (
                <g stroke={accent} strokeWidth="1" opacity="0.6">
                    <line x1="60" y1="95" x2="140" y2="95" />
                </g>
            )}
        </svg>
    );
};

