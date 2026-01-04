import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SimulationMapWindowProps {
    title?: string;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
    onClose: () => void;
    className?: string; // Content wrapper overrides
    maxWidth?: string; // e.g. 'max-w-5xl' or 'max-w-7xl'
}

export const SimulationMapWindow: React.FC<SimulationMapWindowProps> = ({ title, subtitle, icon, headerRight, children, onClose, className, maxWidth }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8">
            {/* Scrim / Backdrop - slightly darkens map but keeps it visible */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/20 backdrop-blur-[1px] cursor-pointer"
            />

            {/* Window Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    mass: 1
                }}
                className={`relative w-full ${maxWidth || 'max-w-5xl'} max-h-full bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto will-change-transform`}
            >
                {/* Header */}
                <div className="flex-none flex justify-between items-center px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent min-h-[72px]">
                    <div className="flex items-center gap-5 overflow-hidden">
                        {icon && (
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/5 shrink-0">
                                {icon}
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            {title && (
                                <h2 className="text-xl font-display font-black text-white tracking-tighter uppercase truncate">
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate opacity-80">
                                    {subtitle}
                                </div>
                            )}
                        </div>
                        {headerRight && (
                            <div className="hidden sm:flex items-center pl-4 border-l border-white/10 ml-2">
                                {headerRight}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-all group"
                        title="Lukk vindu"
                    >
                        <span className="text-lg group-hover:rotate-90 transition-transform">✕</span>
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 ${className || ''}`}>
                    {children}
                </div>
            </motion.div>
        </div>
    );
};
