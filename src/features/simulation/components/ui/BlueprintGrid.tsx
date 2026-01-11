import React, { memo } from 'react';

export const BlueprintGrid = memo(() => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-[#0f172a]">
            {/* Base Grid */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Major Grid Lines */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '200px 200px'
                }}
            />

            {/* Radial Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f172a_100%)] opacity-80" />

            {/* Scanning Line Animation */}
            <div className="absolute top-0 bottom-0 w-[2px] bg-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-blueprint-scan z-0" />

            {/* Technical Markings */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/20" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/20" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/20" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/20" />

            <div className="absolute bottom-6 right-8 font-mono text-[10px] text-cyan-500/40 tracking-[0.2em]">
                BLUEPRINT_RENDER_V2
            </div>
        </div>
    );
});

BlueprintGrid.displayName = 'BlueprintGrid';

// Add to global CSS or Tailwind config if needed:
// @keyframes blueprint-scan {
//   0% { transform: translateX(0vw); opacity: 0; }
//   10% { opacity: 1; }
//   90% { opacity: 1; }
//   100% { transform: translateX(100vw); opacity: 0; }
// }
