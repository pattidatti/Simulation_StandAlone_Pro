import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

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
    resolvedHorseSkin?: string;
}

/**
 * CaravanSVG - Now with full cosmetic support.
 */
export const CaravanSVG: React.FC<CaravanSVGProps> = ({ level, upgrades = [], className, isMoving, customization, resolvedHorseSkin }) => {
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
            viewBox="0 0 200 120"
            className={`${className} ${isMoving ? 'animate-bounce' : ''}`}
            style={{ animationDuration: '0.8s' }}
        >
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Ground Shadow */}
            <ellipse cx="100" cy="110" rx="70" ry="8" fill="rgba(0,0,0,0.15)" />

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
                    {/* Simplified: just draw circles on top roughly where roof is */}
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
                    {/* On roof if roof exists, else on seat */}
                    <path d="M 0 0 Q 3 -8 6 0 Z" fill="#000" />
                    <circle cx="3" cy="-4" r="2.5" fill="#000" />
                    <path d="M 3 -4 L 1 -7 M 3 -4 L 5 -7" stroke="#000" strokeWidth="0.5" />
                </g>
            )}

            {/* --- TREKKDYR (SKIN) --- */}
            {level >= 2 && (
                <g transform="translate(160, 60) scale(0.6)">
                    {(() => {
                        // RESOLVE SKIN
                        let skinId = visuals.skin;
                        if (skinId === 'skin_horse_linked' && resolvedHorseSkin) {
                            skinId = `skin_horse_${resolvedHorseSkin}`; // Map stable skin to caravan format if needed, or use direct
                        }

                        // Default shape (Ox/Horse generic)
                        // If it's a specific fancy horse, change color
                        const bodyColor = skinId === 'skin_horse_white' || skinId === 'white' ? '#f1f5f9' :
                            (skinId === 'skin_horse_mech' ? '#94a3b8' : primary);

                        // Ox vs Horse shape?
                        // Using same shape for now but changing details

                        return (
                            <g>
                                <path d="M 0 0 Q 20 -20 40 0 L 40 40 L 0 40 Z" fill={bodyColor} />
                                <path d="M 40 0 Q 60 -10 65 15" stroke={bodyColor} strokeWidth="8" fill="none" strokeLinecap="round" />
                                <circle cx="55" cy="5" r="10" fill={bodyColor} />
                                {skinId === 'skin_horse_mech' && <circle cx="55" cy="5" r="3" fill="#EF4444" />} {/* Robot Eye */}
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
