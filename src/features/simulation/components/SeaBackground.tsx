import React, { useMemo, useState, useEffect } from 'react';

interface SeaBackgroundProps {
    pos: { x: number; y: number };
}

/**
 * SeaBackground - A high-performance, non-repetitive sea visual component.
 * Uses tiered parallax layers and soft-blended cloud entities to create depth.
 * 
 * @param {Object} props.pos - The current world position of the player (camera center).
 */
export const SeaBackground: React.FC<SeaBackgroundProps> = React.memo(({ pos }) => {
    // Constants for depth and performance
    const WORLD_MODULO = 4000; // Smaller area for higher density
    const HALF_WORLD = WORLD_MODULO / 2;
    const CLOUD_COUNT = 15; // Increased count for better visual frequency

    const [time, setTime] = useState(0);

    // Animation loop for autonomous cloud drift
    useEffect(() => {
        let frameId: number;
        const tick = () => {
            setTime(prev => prev + 0.15); // Adjust for base drift speed
            frameId = requestAnimationFrame(tick);
        };
        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, []);

    // Generate stable cloud entities using useMemo
    const clouds = useMemo(() => {
        return Array.from({ length: CLOUD_COUNT }, (_, i) => ({
            id: i,
            seedX: (i * 777) % WORLD_MODULO,
            seedY: (i * 999) % WORLD_MODULO,
            scale: 0.6 + (i % 5) * 0.4,
            // 1:1 Locking: Clouds are fixed to world coordinates (plus wind)
            parallaxFactor: 1.0,
            driftSpeedX: 0.15 + (i % 3) * 0.1,
            driftSpeedY: 0.05 + (i % 2) * 0.05,
            opacity: 0.25 + (i % 3) * 0.15,
            blur: 10 + (i % 3) * 10,
            hue: 200 + (i % 5) * 2
        }));
    }, []);

    return (
        <div
            className="absolute inset-0 pointer-events-none overflow-hidden z-[200]"
            style={{
                contain: 'strict'
            }}
        >
            {/* 1. ABYSS BASE (Moved to Bottom if internal, but here we only want Top Clouds) */}
            {/* Split logic: Sea Depth at Z-0, Clouds at Z-200 */}

            {/* 2. SURFACE GRAIN (Subtle Deep Layer) */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[6000px] h-[6000px] opacity-[0.03] mix-blend-overlay z-[-1]"
                style={{
                    backgroundColor: 'hsl(210, 65%, 12%)',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='1000' height='1000' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    transform: `translate3d(${-pos.x * 0.4}px, ${-pos.y * 0.4}px, 0)`,
                    willChange: 'transform'
                }}
            />

            {/* 3. PARALLAX CLOUDS */}
            <div className="absolute inset-0" style={{ perspective: '1000px' }}>
                {clouds.map(cloud => {
                    // Combine Autonomous Drift (Time) + User Motion Parallax (pos)
                    let cx = (cloud.seedX + time * cloud.driftSpeedX - pos.x * cloud.parallaxFactor) % WORLD_MODULO;
                    let cy = (cloud.seedY + time * cloud.driftSpeedY - pos.y * cloud.parallaxFactor) % WORLD_MODULO;

                    if (cx < -HALF_WORLD) cx += WORLD_MODULO;
                    if (cx > HALF_WORLD) cx -= WORLD_MODULO;
                    if (cy < -HALF_WORLD) cy += WORLD_MODULO;
                    if (cy > HALF_WORLD) cy -= WORLD_MODULO;

                    return (
                        <div
                            key={cloud.id}
                            className="absolute left-1/2 top-1/2 rounded-full mix-blend-screen"
                            style={{
                                width: 250 * cloud.scale,
                                height: 150 * cloud.scale,
                                // Complex background: Solid-ish white core with soft aura
                                background: `radial-gradient(circle at 30% 40%, hsla(${cloud.hue}, 20%, 100%, ${cloud.opacity}) 0%, hsla(${cloud.hue}, 10%, 90%, ${cloud.opacity * 0.6}) 40%, transparent 80%)`,
                                // Box shadows create a "clumpy" cloud shape without extra DOM nodes
                                boxShadow: `
                                    ${20 * cloud.scale}px ${10 * cloud.scale}px ${30 * cloud.scale}px hsla(${cloud.hue}, 10%, 95%, ${cloud.opacity * 0.8}),
                                    ${-30 * cloud.scale}px ${20 * cloud.scale}px ${40 * cloud.scale}px hsla(${cloud.hue}, 10%, 90%, ${cloud.opacity * 0.5})
                                `,
                                filter: `blur(${cloud.blur}px)`,
                                transform: `translate3d(${cx}px, ${cy}px, 0)`,
                                willChange: 'transform'
                            }}
                        />
                    );
                })}
            </div>

            {/* 4. SURFACE GLOW (Player Follower) */}
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full pointer-events-none opacity-20 mix-blend-soft-light"
                style={{
                    background: 'radial-gradient(circle, hsla(200, 100%, 50%, 0.2) 0%, transparent 70%)'
                }}
            />
        </div>
    );
});

SeaBackground.displayName = 'SeaBackground';
