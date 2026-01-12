
import React, { useState } from 'react';

interface BellowsButtonProps {
    onPump: () => void;
}

export const BellowsButton: React.FC<BellowsButtonProps> = ({ onPump }) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleDown = () => {
        setIsPressed(true);
        onPump();
    };

    const handleUp = () => {
        setIsPressed(false);
    };

    return (
        <button
            onPointerDown={handleDown}
            onPointerUp={handleUp}
            onPointerLeave={handleUp}
            aria-label="Pump Bellows"
            className={`
                relative group
                w-48 h-32 
                flex items-center justify-center
                transition-all duration-75 ease-out
                ${isPressed ? 'scale-95' : 'scale-100 hover:scale-[1.02]'}
            `}
        >
            {/* Main Bellow Body (Wood/Leather Aesthetic via CSS) */}
            <div className="absolute inset-0 bg-[#5d4037] rounded-xl shadow-[0_10px_0_#3e2723] active:shadow-none active:translate-y-[10px] transition-all duration-75 overflow-hidden border-2 border-[#8d6e63]">
                {/* Leather Texture Details */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_transparent_20%,_#000_120%)]" />

                {/* Accordion Folds (Visual) */}
                <div className="w-full h-full flex flex-col justify-between py-2 px-4 opacity-50">
                    <div className="h-0.5 bg-black/40 shadow-sm" />
                    <div className="h-0.5 bg-black/40 shadow-sm" />
                    <div className="h-0.5 bg-black/40 shadow-sm" />
                    <div className="h-0.5 bg-black/40 shadow-sm" />
                </div>
            </div>

            {/* Label */}
            <div className="relative z-10 text-orange-100 font-black uppercase text-2xl tracking-widest drop-shadow-md select-none pointer-events-none">
                PUMP
            </div>

            {/* Particles or 'Air' hint could be added here on click */}
        </button>
    );
};
