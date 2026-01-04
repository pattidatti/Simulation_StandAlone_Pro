import React, { useState } from 'react';
import { X, Gift, Handshake, Shield, User, MapPin, Crown, Sword, Coins } from 'lucide-react';
import type { SimulationPlayer, Resources } from '../simulationTypes';
import { handleSendGift } from '../socialActions';
import { TradeContractModal } from './TradeContractModal';
import { ACTION_ICONS } from '../data/gameBalance';

interface PlayerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    myPlayer: SimulationPlayer;
    targetPlayer: SimulationPlayer;
    pin: string;
}

const RESOURCE_LIST: (keyof Resources)[] = ['gold', 'grain', 'wood', 'iron_ore', 'bread']; // Common gift items

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ isOpen, onClose, myPlayer, targetPlayer, pin }) => {
    const [activeTab, setActiveTab] = useState<'INFO' | 'GIFT'>('INFO');
    const [isTradeOpen, setTradeOpen] = useState(false);

    // ESC Key Handler
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Gift State
    const [giftRes, setGiftRes] = useState<keyof Resources>('gold');
    const [giftAmount, setGiftAmount] = useState(0);
    const [giftStatus, setGiftStatus] = useState<string | null>(null);

    // Helpers
    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'KING': return <Crown size={32} className="text-yellow-400" />;
            case 'BARON': return <Shield size={32} className="text-purple-400" />;
            case 'SOLDIER': return <Sword size={32} className="text-red-400" />;
            case 'MERCHANT': return <Coins size={32} className="text-emerald-400" />;
            default: return <User size={32} className="text-slate-400" />;
        }
    };

    const sendGift = async () => {
        if (giftAmount <= 0) return;
        setGiftStatus("Sender...");
        const payload: any = {};
        payload[giftRes] = giftAmount;

        const res = await handleSendGift(pin, myPlayer.id, targetPlayer.id, payload);
        if (res.success) {
            setGiftStatus(`Sendte ${giftAmount} ${giftRes}!`);
            setTimeout(() => {
                setGiftStatus(null);
                setActiveTab('INFO');
            }, 1500);
        } else {
            setGiftStatus("Feil: " + res.error);
        }
    };

    if (!isOpen) return null;

    // If Trade is open, it takes over (stacked modal)
    if (isTradeOpen) {
        return (
            <TradeContractModal
                isOpen={true}
                onClose={() => setTradeOpen(false)}
                myPlayer={myPlayer}
                targetPlayer={targetPlayer}
                pin={pin}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">

                {/* Header / Banner */}
                <div className={`h-32 w-full relative bg-gradient-to-br ${targetPlayer.role === 'KING' ? 'from-yellow-900/40 to-slate-900' : 'from-indigo-900/40 to-slate-900'}`}>
                    <div className="absolute top-4 right-4">
                        <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors backdrop-blur-sm text-white">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Avatar & Ident */}
                <div className="px-8 relative -mt-16 mb-4 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center shadow-xl relative group overflow-hidden">
                        {/* Avatar Image Placeholder or Icon */}
                        {targetPlayer.avatar ? (
                            <img src={targetPlayer.avatar} alt={targetPlayer.name} className="w-full h-full object-cover" />
                        ) : (
                            getRoleIcon(targetPlayer.role)
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h2 className="text-2xl font-black text-white mt-4">{targetPlayer.name}</h2>
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium uppercase tracking-wider">
                        <span className="text-indigo-400">{targetPlayer.role}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {targetPlayer.regionId || 'Ukjent'}</span>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="flex-1 px-8 pb-8 space-y-6">

                    {/* Stats Grid */}
                    {activeTab === 'INFO' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Level</div>
                                <div className="text-3xl font-black text-white">{targetPlayer.stats.level}</div>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Reputasjon</div>
                                <div className="text-3xl font-black text-indigo-400">{targetPlayer.stats.reputation}</div>
                            </div>
                        </div>
                    )}

                    {/* Gift UI */}
                    {activeTab === 'GIFT' && (
                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                            <h3 className="text-center text-slate-300 font-bold">Send en gave</h3>
                            <div className="flex gap-2 justify-center">
                                {RESOURCE_LIST.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setGiftRes(r)}
                                        className={`p-2 rounded-lg border transition-all ${giftRes === r ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                                    >
                                        <span className="text-xl">{ACTION_ICONS[r.toUpperCase()] || '📦'}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2">
                                <input
                                    type="number"
                                    className="bg-transparent w-full text-center text-xl font-bold focus:outline-none"
                                    value={giftAmount}
                                    onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                />
                                <span className="text-xs font-bold text-slate-500 uppercase">{giftRes}</span>
                            </div>
                            <button
                                onClick={sendGift}
                                disabled={!!giftStatus}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {giftStatus || 'Send Gave'}
                            </button>
                        </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex gap-2">
                        {activeTab === 'INFO' ? (
                            <>
                                <button
                                    onClick={() => setActiveTab('GIFT')}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
                                >
                                    <Gift size={18} />
                                    <span>Gave</span>
                                </button>
                                <button
                                    onClick={() => setTradeOpen(true)}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-indigo-500/20"
                                >
                                    <Handshake size={18} />
                                    <span>Handel</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setActiveTab('INFO')}
                                className="w-full py-3 text-slate-400 hover:text-white font-bold"
                            >
                                Avbryt
                            </button>
                        )}
                    </div>

                    {/* Meta Actions */}
                    {targetPlayer.role === 'SOLDIER' && myPlayer.role === 'SOLDIER' && (
                        <button className="w-full py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                            <Sword size={14} />
                            Utfordre til Duell (Kommer snart)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
