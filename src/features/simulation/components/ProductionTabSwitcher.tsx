import React from 'react';

interface ProductionTabSwitcherProps {
    isStationWithRepair: boolean;
    viewMode: 'PRODUCE' | 'REPAIR';
    setViewMode: (mode: 'PRODUCE' | 'REPAIR') => void;
}

export const ProductionTabSwitcher: React.FC<ProductionTabSwitcherProps> = ({
    isStationWithRepair,
    viewMode,
    setViewMode
}) => {
    if (!isStationWithRepair) return null;

    return (
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner">
            <button
                onClick={() => setViewMode('PRODUCE')}
                className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'PRODUCE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Produksjon
            </button>
            <button
                onClick={() => setViewMode('REPAIR')}
                className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'REPAIR' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Reparasjon
            </button>
        </div>
    );
};
