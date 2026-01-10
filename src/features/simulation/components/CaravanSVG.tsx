import React from 'react';

interface CaravanSVGProps {
    level: number;
    upgrades?: string[];
    className?: string;
    isMoving?: boolean;
}

/**
 * CaravanSVG - A minimalist, high-contrast SVG representation of the Merchant's caravan.
 * Evolves from a simple handcart to a grand guild carriage.
 */
export const CaravanSVG: React.FC<CaravanSVGProps> = ({ level, upgrades = [], className, isMoving }) => {
    // Colors
    const primary = "#1e293b"; // Slate 800
    const accent = "#fbbf24";  // Amber 400 (The Glow)
    const highlight = "#94a3b8"; // Slate 400
    const darkAccent = "#0f172a"; // Slate 900

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

            {/* Wheels */}
            {level === 1 ? (
                /* Level 1: Single small wheel */
                <g>
                    <circle cx="100" cy="100" r="10" fill={primary} stroke={highlight} strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="2" fill={highlight} />
                </g>
            ) : (
                /* Level 2+: Double larger wheels */
                <g>
                    <circle cx="60" cy="95" r="15" fill={primary} stroke={highlight} strokeWidth="2" />
                    <circle cx="140" cy="95" r="15" fill={primary} stroke={highlight} strokeWidth="2" />
                    {/* Spokes */}
                    <path d="M 60 80 L 60 110 M 45 95 L 75 95" stroke={highlight} strokeWidth="1" />
                    <path d="M 140 80 L 140 110 M 125 95 L 155 95" stroke={highlight} strokeWidth="1" />

                    {/* HUB */}
                    <circle cx="60" cy="95" r="4" fill={darkAccent} />
                    <circle cx="140" cy="95" r="4" fill={darkAccent} />
                </g>
            )}

            {/* Body */}
            {level === 1 ? (
                /* HANDCART */
                <g>
                    <path d="M 50 85 L 150 85 L 155 70 L 45 70 Z" fill={primary} />
                    <rect x="55" y="60" width="30" height="15" fill={highlight} opacity="0.5" />
                    <line x1="150" y1="80" x2="175" y2="80" stroke={primary} strokeWidth="4" />
                </g>
            ) : (
                /* WAGON BODY */
                <g>
                    <rect x="40" y="55" width="120" height="35" rx="2" fill={primary} />
                    {/* Iron trim for level 4+ */}
                    {level >= 4 && (
                        <g>
                            <rect x="40" y="55" width="120" height="4" fill="#64748b" />
                            <rect x="40" y="86" width="120" height="4" fill="#64748b" />
                        </g>
                    )}
                </g>
            )}

            {/* Roof / Cover */}
            {level >= 3 && (
                <path
                    d="M 40 55 C 40 55 100 10 160 55 Z"
                    fill={level >= 5 ? "#1e1b4b" : "#334155"}
                    stroke={darkAccent}
                    strokeWidth="1"
                />
            )}

            {/* Lantern "The Glow" */}
            <g filter="url(#glow)">
                <circle cx={level === 1 ? 140 : 160} cy="45" r="3" fill={accent} />
                <rect x={level === 1 ? 138 : 158} y="38" width="4" height="8" rx="1" fill={primary} />
            </g>

            {/* Horse for level 2+ */}
            {level >= 2 && (
                <g transform="translate(160, 60) scale(0.6)">
                    <path d="M 0 0 Q 20 -20 40 0 L 40 40 L 0 40 Z" fill={primary} />
                    <path d="M 40 0 Q 60 -10 65 15" stroke={primary} strokeWidth="8" fill="none" strokeLinecap="round" />
                    <circle cx="55" cy="5" r="10" fill={primary} />
                </g>
            )}

            {/* Upgrades Visualization */}
            {upgrades.includes('heavy_axles') && (
                <g stroke={accent} strokeWidth="1" opacity="0.6">
                    <line x1="60" y1="95" x2="140" y2="95" />
                </g>
            )}
        </svg>
    );
};
