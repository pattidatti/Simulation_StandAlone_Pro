import React, { useEffect } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface SimulationRoleWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    roleName: string;
}

export const SimulationRoleWarningModal: React.FC<SimulationRoleWarningModalProps> = ({ isOpen, onClose, onConfirm, roleName }) => {


    useEffect(() => {
        if (isOpen) {
            // Optional: Timer to prevent instant clicking? 
            // For now, let's just make them click a "I understand" checkbox or just a scary button.
            // Let's stick to the plan: simple buttons but scary visuals.
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg bg-slate-900 border-2 border-red-500/30 rounded-[2rem] shadow-[0_0_100px_rgba(239,68,68,0.2)] overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header Pattern */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-red-900/20 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="p-8 relative">
                    <div className="flex flex-col items-center text-center space-y-6">

                        {/* Icon */}
                        <div className="w-24 h-24 bg-red-900/20 rounded-[2rem] border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.1)] relative group">
                            <div className="absolute inset-0 bg-red-500/10 rounded-[2rem] blur animate-pulse" />
                            <AlertTriangle size={48} className="text-red-500 relative z-10" />
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                                Advarsel: <span className="text-red-500">Uferdig Innhold</span>
                            </h2>
                            <div className="h-px w-24 bg-gradient-to-r from-transparent via-red-500/50 to-transparent mx-auto" />
                        </div>

                        <div className="space-y-4 text-slate-300 font-medium leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5">
                            <p>
                                Du er i ferd med å velge rollen <strong className="text-white uppercase tracking-wide">{roleName}</strong>.
                            </p>
                            <p className="text-sm">
                                Denne rollen er under aktiv utvikling og mangler vesentlig funksjonalitet.
                                Spillopplevelsen kan være ufullstendig eller ubalansert.
                            </p>
                            <div className="flex items-center gap-3 p-3 bg-red-950/30 border border-red-500/20 rounded-xl">
                                <ShieldAlert size={20} className="text-red-400 shrink-0" />
                                <p className="text-xs text-red-300 font-bold uppercase text-left">
                                    Dette valget er permanent og kan ikke angres.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-2">
                            <button
                                onClick={onClose}
                                className="px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold tracking-wider uppercase text-sm border border-white/10 transition-all hover:scale-[1.02]"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-6 py-4 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-bold tracking-wider uppercase text-sm border-2 border-red-600/30 hover:border-red-500 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                            >
                                Jeg forstår risikoen
                            </button>
                        </div>

                    </div>

                    {/* Close x top right */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};
