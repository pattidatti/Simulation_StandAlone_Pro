import React from 'react';
import type { TavernNPC } from '../TavernData';

interface TavernDialogProps {
    npc: TavernNPC;
    step: string;
    setStep: (step: string) => void;
    onClose: () => void;
}

export const TavernDialog: React.FC<TavernDialogProps> = ({ npc, step, setStep, onClose }) => {
    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-amber-600/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-slate-950 p-6 border-b border-white/5 flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center text-3xl shadow-inner">
                        👤
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-amber-500">{npc.name}</h3>
                        <p className="text-sm text-slate-400 italic font-medium">{npc.role}</p>
                    </div>
                    <button onClick={onClose} className="ml-auto w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-colors">×</button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 opacity-50">{npc.description}</div>
                    <p className="text-slate-300 text-lg leading-relaxed italic border-l-4 border-amber-500/20 pl-4 py-2">
                        "{npc.conversation[step]?.text || "..."}"
                    </p>

                    {/* Options */}
                    <div className="grid gap-3 pt-4">
                        {npc.conversation[step]?.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (opt.nextId === 'EXIT') {
                                        onClose();
                                    } else {
                                        setStep(opt.nextId);
                                    }
                                }}
                                className="w-full text-left bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/50 border border-white/10 p-4 rounded-xl transition-all font-medium text-slate-200 active:scale-[0.98]"
                            >
                                <span className="text-amber-500 mr-2">➜</span> {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
