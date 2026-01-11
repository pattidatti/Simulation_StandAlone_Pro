import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { ResourceIcon } from '../ui/ResourceIcon';

// --- DESIGN TOKENS ---
const COLORS = {
    parchment: '#d6cbb8', // Deep Latte / Darker Parchment
    inkPrimary: '#0c0a09', // Near black
    inkSecondary: '#292524', // Warm Dark Grey
    woodDark: '#2a1b12',
    woodLight: '#453020',
    brass: '#b45309',
    brassHighlight: '#d97706',
    paperShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.5)'
};



// --- COMPONENTS ---

export const ParchmentPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    return (
        <div
            className={`relative overflow-hidden rounded-sm ${className}`}
            style={{
                backgroundColor: COLORS.parchment,
                color: COLORS.inkPrimary,
                boxShadow: `inset 0 0 60px rgba(0,0,0,0.1), ${COLORS.paperShadow}`,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
            }}
        >
            {/* Corner decorations (Brass accents) */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-700/50" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-700/50" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-700/50" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-700/50" />

            {children}
        </div>
    );
};

export const InkButton: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    className?: string;
}> = ({ onClick, children, disabled, variant = 'primary', className = '' }) => {
    const isPrimary = variant === 'primary';

    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
            whileTap={!disabled ? { scale: 0.98, y: 1 } : {}}
            onClick={onClick}
            disabled={disabled}
            className={`
                relative px-6 py-2 font-bold uppercase tracking-widest text-xs transition-all
                ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}
                ${className}
            `}
            style={{
                backgroundColor: isPrimary ? COLORS.inkPrimary : 'transparent',
                color: isPrimary ? COLORS.parchment : COLORS.inkPrimary,
                border: isPrimary ? 'none' : `2px solid ${COLORS.inkPrimary}`,
                borderRadius: '2px', // Slight rounding but mostly sharp
            }}
        >
            {/* Sketchy border effect for secondary */}
            {!isPrimary && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ opacity: 0.6 }}>
                    <path d="M0,0 L100%,0 L100%,100% L0,100% Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" />
                </svg>
            )}

            {children}
        </motion.button>
    );
};

export const WaxSeal: React.FC<{ onClick?: () => void; label?: string; color?: string }> = ({ onClick, label, color = '#b91c1c' }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex flex-col items-center gap-2 group"
        >
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg relative"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${color}, #7f1d1d)`,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
                }}
            >
                {/* Improper circular shape to look like wax */}
                <div className="absolute inset-0 border-4 border-dashed border-black/10 rounded-full opacity-50" style={{ transform: 'rotate(15deg)' }} />

                <span className="font-serif font-black text-white/90 text-xl drop-shadow-md">
                    ⚓
                </span>
            </div>
            {label && (
                <span className="font-serif font-bold text-[10px] uppercase tracking-widest text-slate-600 transition-colors group-hover:text-amber-800">
                    {label}
                </span>
            )}
        </motion.button>
    );
};

export const QuillTab: React.FC<{
    active: boolean;
    onClick: () => void;
    label: string;
    icon?: React.ElementType
}> = ({ active, onClick, label, icon: Icon }) => {
    return (
        <button
            onClick={onClick}
            className={`
                group relative flex items-center gap-3 px-4 py-3 w-full text-left transition-all
                ${active ? 'translate-x-2' : 'hover:translate-x-1'}
            `}
        >
            {/* Tab marker (Ribbon) */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${active ? 'bg-amber-700' : 'bg-slate-300 group-hover:bg-slate-400'}`}
            />

            {/* Icon */}
            {Icon && (
                <Icon
                    size={16}
                    className={`transition-colors ${active ? 'text-amber-900' : 'text-slate-400'}`}
                />
            )}

            <span className={`
                font-bold uppercase tracking-wider text-xs transition-colors
                ${active ? 'text-slate-900' : 'text-slate-500'}
            `}>
                {label}
            </span>

            {/* Active Ink underline */}
            {active && (
                <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-2 left-4 right-8 h-[1px] bg-amber-900/30"
                />
            )}
        </button>
    );
};

interface ActionListRowProps {
    title: string;
    level: number;
    maxLevel: number;
    description: string;
    effect?: string | React.ReactNode;
    cost: Record<string, number>;
    playerResources: any;
    onAction: () => void;
    actionLabel?: string;
}

export const ActionListRow: React.FC<ActionListRowProps> = ({
    title,
    level,
    maxLevel,
    description,
    effect,
    cost,
    playerResources,
    onAction,
    actionLabel = "MONTERE"
}) => {
    const isMaxed = level >= maxLevel;

    // Check affordability
    let canAfford = true;
    if (!isMaxed) {
        Object.entries(cost).forEach(([res, amt]) => {
            if ((playerResources[res] || 0) < amt) canAfford = false;
        });
    }

    return (
        <div className="flex items-center justify-between p-4 border-b border-[#a8a29e]/20 hover:bg-[#a8a29e]/5 transition-colors group relative">
            <div className="flex-1 pr-8">
                <div className="flex items-center gap-4 mb-2">
                    <h4 className="font-serif font-bold text-lg text-[#292524]">{title}</h4>
                    <span className={`text-xs font-black px-2 py-0.5 rounded border uppercase tracking-widest ${level > 0 ? 'bg-amber-900/10 text-amber-800 border-amber-900/10' : 'bg-stone-300/50 text-stone-600 border-stone-300'}`}>
                        NIVÅ {level} <span className="text-stone-500/80">/ {maxLevel}</span>
                    </span>
                </div>
                <p className="text-[#44403c] italic font-serif leading-snug mb-2 text-sm max-w-md">{description}</p>
                {effect && (
                    <div className="text-emerald-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                        <Zap size={12} />
                        {effect}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-end gap-3 min-w-[240px]">
                {!isMaxed ? (
                    <>
                        <div className="flex items-center justify-end gap-3 w-full">
                            {Object.entries(cost).map(([res, amt]) => {
                                const canAffordRes = (playerResources[res] || 0) >= amt;
                                return (
                                    <div key={res} className={`flex items-center gap-1.5 ${canAffordRes ? 'opacity-100' : 'opacity-100'}`}>
                                        <ResourceIcon
                                            resource={res}
                                            amount={amt}
                                            size="sm"
                                            showLabel={true}
                                            className={canAffordRes ? "text-[#292524]" : "text-rose-700 font-bold"}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <InkButton
                            onClick={onAction}
                            disabled={!canAfford}
                            className={`w-full py-1.5 text-xs ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {actionLabel}
                        </InkButton>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-2 px-6 border border-[#b45309]/30 rounded bg-[#b45309]/10 w-full">
                        <span className="text-[#aa5212] font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                            <Zap size={10} strokeWidth={3} /> Mesterverk
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ConfirmationOverlay: React.FC<{
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    cost: Record<string, number>;
}> = ({ isOpen, onConfirm, onCancel, title, cost }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#f2e8d5] p-8 w-full max-w-md shadow-2xl relative rotate-1 border border-[#b45309]/30"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E")`
                }}
            >
                {/* Tape effect */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/40 rotate-1 shadow-sm backdrop-blur-sm" />

                <div className="border-b-2 border-dashed border-[#292524]/20 pb-6 mb-6 text-center">
                    <h3 className="font-serif font-black text-2xl uppercase tracking-widest text-[#2a1b12] mb-1">Faktura</h3>
                    <p className="font-serif italic text-stone-600 text-sm">Kongelig Skipsverft</p>
                </div>

                <div className="space-y-6 mb-8">
                    <div className="flex justify-between items-baseline border-b border-stone-300 pb-2">
                        <span className="font-bold text-stone-500 text-sm uppercase tracking-wide">Vare</span>
                        <span className="font-serif font-bold text-lg text-[#292524]">{title}</span>
                    </div>

                    <div className="bg-[#e7ded0] p-4 rounded-sm border border-[#d6cbb8]">
                        <div className="text-xs font-black uppercase tracking-widest text-[#b45309] mb-3 text-center">Kostnader</div>
                        <div className="flex flex-wrap justify-center gap-4 text-[#292524]">
                            {Object.entries(cost).map(([res, amt]) => (
                                <div key={res} className="flex items-center gap-2">
                                    <ResourceIcon resource={res} amount={amt} size="sm" showLabel={true} className="text-[#292524]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 border-2 border-[#292524]/20 font-bold uppercase tracking-widest text-xs text-[#57534e] hover:bg-[#292524]/5 transition-colors"
                    >
                        Avslå
                    </button>
                    <InkButton onClick={onConfirm} className="flex-1 py-3" variant="primary">
                        Signer
                    </InkButton>
                </div>
            </motion.div>
        </div>
    );
};
