
import React, { useRef, useEffect } from 'react';

interface ThermometerGaugeProps {
    heatRef: React.MutableRefObject<number>;
    targetRange: { min: number; max: number };
}

export const ThermometerGauge: React.FC<ThermometerGaugeProps> = ({ heatRef, targetRange }) => {
    const fillRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    // Independent Visual Loop
    useEffect(() => {
        let rafId: number;
        const update = () => {
            const h = heatRef.current;
            if (fillRef.current) {
                fillRef.current.style.height = `${h}%`;

                // Dynamic Color shifting based on State
                // We use CSS variables for performance if possible, or just class switching if we want to be fancy.
                // But inline styles for direct color manipulation is also fine for visual flair.

                // Slight "breathe" effect or jitter if near danger
                if (h > 90) {
                    fillRef.current.style.filter = `hue-rotate(${Math.sin(Date.now() / 50) * 10}deg) brightness(1.2)`;
                } else {
                    fillRef.current.style.filter = 'none';
                }
            }
            if (glowRef.current) {
                // Opacity based on how close to max heat
                glowRef.current.style.opacity = `${h / 100}`;
            }
            rafId = requestAnimationFrame(update);
        };
        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, [heatRef]);

    return (
        <div className="relative w-24 h-96 bg-slate-900 rounded-full border-4 border-slate-700 shadow-2xl overflow-hidden backdrop-blur-sm">
            {/* Background Grid/Tick marks */}
            <div className="absolute inset-0 opacity-20 flex flex-col justify-between py-4 px-2">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-white" />
                ))}
            </div>

            {/* Target Zone Highlight */}
            <div
                className="absolute w-full bg-green-500/20 border-y-2 border-green-500/50 z-10"
                style={{
                    bottom: `${targetRange.min}%`,
                    height: `${targetRange.max - targetRange.min}%`
                }}
            >
                <div className="w-full h-full animate-pulse bg-green-400/10" />
            </div>

            {/* Liquid Fill */}
            <div className="absolute bottom-0 w-full px-2 pb-2 transition-transform duration-75 ease-out z-20 h-full flex items-end pointer-events-none">
                <div
                    ref={fillRef}
                    className="w-full rounded-b-full rounded-t-sm bg-gradient-to-t from-red-900 via-orange-600 to-yellow-300 shadow-[0_0_20px_rgba(255,165,0,0.6)]"
                    style={{ height: '0%', transition: 'height 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)' }} // Smooth out the jerky physics updates slightly via CSS transition as well
                >
                    {/* Bubbles particle effect could go here */}
                </div>
            </div>

            {/* Glass Glare Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none z-30 rounded-full" />

            {/* Heat Glow Bloom */}
            <div
                ref={glowRef}
                className="absolute inset-0 z-0 bg-orange-500/30 blur-xl pointer-events-none transition-opacity duration-300"
            />
        </div>
    );
};
