import React, { useState } from 'react';
import { X, Send, Handshake, AlertCircle } from 'lucide-react';
import type { SimulationPlayer, Resources } from '../simulationTypes';
import { handleCreateTrade } from '../socialActions';
import { ACTION_ICONS } from '../data/gameBalance';
import { RESOURCE_DETAILS } from '../constants';

interface TradeContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    myPlayer: SimulationPlayer;
    targetPlayer: SimulationPlayer;
    pin: string;
}

const RESOURCE_LIST: (keyof Resources)[] = ['gold', 'grain', 'wood', 'iron_ore', 'stone', 'plank', 'iron_ingot', 'bread', 'swords', 'armor', 'cloth', 'wool'];

export const TradeContractModal: React.FC<TradeContractModalProps> = ({ isOpen, onClose, myPlayer, targetPlayer, pin }) => {
    const [offer, setOffer] = useState<Partial<Resources>>({ gold: 0 });
    const [demand, setDemand] = useState<Partial<Resources>>({ gold: 0 });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    if (!isOpen) return null;

    // ESC Key Handler
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSend = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const res = await handleCreateTrade(pin, myPlayer.id, targetPlayer.id, offer, demand);
            if (res.success) {
                setStatus("Handelstilbud sendt!");
                setTimeout(onClose, 1500);
            } else {
                setStatus("Feil: " + res.error);
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setStatus("En ukjent feil oppstod.");
            setLoading(false);
        }
    };

    const updateOffer = (res: keyof Resources, amount: number) => {
        setOffer(prev => ({ ...prev, [res]: Math.max(0, amount) }));
    };

    const updateDemand = (res: keyof Resources, amount: number) => {
        setDemand(prev => ({ ...prev, [res]: Math.max(0, amount) }));
    };

    // Helper for resource input
    const ResourceInput = ({
        label,
        values,
        onChange,
        max
    }: {
        label: string,
        values: Partial<Resources>,
        onChange: (r: keyof Resources, v: number) => void,
        max?: (r: keyof Resources) => number
    }) => (
        <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">{label}</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {RESOURCE_LIST.map(res => {
                    const currentVal = values[res] || 0;
                    const maxVal = max ? max(res) : 9999;

                    if (max && maxVal <= 0 && currentVal <= 0) return null; // Hide resources I don't have

                    return (
                        <div key={res} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                            <span className="text-lg w-8 text-center">{ACTION_ICONS[res.toUpperCase()] || '📦'}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-slate-300 font-medium capitalize truncate">{(RESOURCE_DETAILS as any)[res]?.label || res.replace('_', ' ')}</div>
                                {max && <div className="text-[10px] text-slate-500">Du har: {maxVal}</div>}
                            </div>
                            <input
                                type="number"
                                value={currentVal || ''}
                                placeholder="0"
                                onChange={(e) => onChange(res, parseInt(e.target.value) || 0)}
                                className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-sm font-mono focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    );
                })}
                {!max && (
                    // Show all for demand side slightly different? Actually we show all for demand.
                    // But let's add a button to "Add Row" instead of showing 20 inputs?
                    // For MVP "Ultrathink", keep it simple but functional.
                    <div className="text-xs text-slate-500 text-center italic mt-2">Velg hva du krever</div>
                )}
            </div>
        </div>
    );
    // Simplified Demand View: Only show resources with >0 or provide a dropdown to add?
    // For "Avant-Garde", listing all is messy.
    // Let's do a compact list for Demand where you toggle active ones.
    // Re-using the same simple list for now to ensure robustness.

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-slate-900 border-b border-indigo-500/20 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div>
                        <h2 className="text-2xl font-black italic text-white flex items-center gap-3">
                            <Handshake className="text-indigo-400" />
                            HANDELSKONTRAKT
                        </h2>
                        <p className="text-slate-400 text-sm">Opprett et tilbud til <span className="text-white font-bold">{targetPlayer.name}</span></p>
                    </div>
                    <button onClick={onClose} className="relative z-10 p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
                        <X className="text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950/50">
                    {/* LEFT: MY OFFER */}
                    <div className="p-6 overflow-hidden flex flex-col">
                        <ResourceInput
                            label="Ditt Tilbud (Assets)"
                            values={offer}
                            onChange={updateOffer}
                            max={(r) => myPlayer.resources[r] || 0}
                        />
                    </div>

                    {/* RIGHT: MY DEMAND */}
                    <div className="p-6 overflow-hidden flex flex-col">
                        {/* We show all inputs for demand since we can demand anything */}
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Ditt Krav (Liabilities)</h4>
                            {RESOURCE_LIST.map(res => (
                                <div key={res} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                                    <span className="text-lg w-8 text-center opacity-70">{ACTION_ICONS[res.toUpperCase()] || '📦'}</span>
                                    <span className="flex-1 text-xs text-slate-300 font-medium capitalize truncate">{(RESOURCE_DETAILS as any)[res]?.label || res.replace('_', ' ')}</span>
                                    <input
                                        type="number"
                                        value={demand[res] || ''}
                                        placeholder="0"
                                        onChange={(e) => updateDemand(res, parseInt(e.target.value) || 0)}
                                        className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-sm font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-900 border-t border-indigo-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-500/80 text-xs">
                        <AlertCircle size={14} />
                        <span>Ressursene trekkes umiddelbart (Escrow).</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {status && <span className={`text-sm font-bold ${status.startsWith('Feil') ? 'text-red-400' : 'text-green-400'}`}>{status}</span>}
                        <button
                            onClick={handleSend}
                            disabled={loading || status !== null}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? 'Signerer...' :
                                <>
                                    <Send size={18} />
                                    Send Kontrakt
                                </>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
