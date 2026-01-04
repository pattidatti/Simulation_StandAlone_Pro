import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { SimulationPlayer, SimulationRoom, TradeOffer } from '../simulationTypes';
import { Gift, Handshake, Check, X, MessageSquare } from 'lucide-react';
import { handleRespondToTrade } from '../socialActions';

interface SimulationNotificationLayerProps {
    player: SimulationPlayer;
    room: SimulationRoom;
    onAction: (action: any) => void;
    pin: string;
}

interface ToastAction {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'danger' | 'neutral';
    icon?: React.ReactNode;
}

interface Toast {
    id: string;
    title: string;
    message: string;
    type: 'GIFT' | 'TRADE';
    actions?: ToastAction[];
}

export const SimulationNotificationLayer: React.FC<SimulationNotificationLayerProps> = ({ player, room, onAction: _onAction, pin }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Refs to track previous state for diffing
    const prevTradesRef = useRef<Record<string, TradeOffer>>({});
    const prevActionLogRef = useRef<number>(0);

    // Normalize messages
    const normalizedMessages = useMemo(() => {
        if (!room.messages) return [];
        if (Array.isArray(room.messages)) return room.messages;
        return Object.values(room.messages).sort((a, b) => a.timestamp - b.timestamp);
    }, [room.messages]);

    const addToast = (toast: Toast) => {
        setToasts(prev => [...prev, toast]);
        // Auto-dismiss after longer duration if it has actions, or standard if information
        const duration = toast.actions ? 10000 : 5000;
        setTimeout(() => removeToast(toast.id), duration);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleTradeResponse = async (tradeId: string, response: 'ACCEPT' | 'REJECT') => {
        // Optimistic UI update? No, wait for result.
        const res = await handleRespondToTrade(pin, player.id, tradeId, response);
        if (res && res.success) {
            removeToast(`trade-${tradeId}`);
            addToast({
                id: `trade-res-${Date.now()}`,
                title: response === 'ACCEPT' ? 'Handel Gjennomført' : 'Handel Avslått',
                message: res.message || 'Transaksjon fullført.',
                type: 'TRADE'
            });
        } else {
            addToast({
                id: `trade-err-${Date.now()}`,
                title: 'Feil ved handel',
                message: res?.error || 'Noe gikk galt.',
                type: 'TRADE'
            });
        }
    };

    const activeTradeIsNew = (id: string, _trade: TradeOffer, prevTrades: Record<string, TradeOffer>) => {
        return !prevTrades[id];
    };

    // Monitor Trades
    useEffect(() => {
        const currentTrades = room.trades || {};
        const prevTrades = prevTradesRef.current;

        Object.entries(currentTrades).forEach(([id, trade]) => {
            // New active trade where I am the receiver
            if (activeTradeIsNew(id, trade, prevTrades) && trade.receiverId === player.id && trade.status === 'PENDING') {

                const offerText = Object.entries(trade.offer).map(([k, v]) => `${v} ${k}`).join(', ');
                const demandText = Object.entries(trade.demand).map(([k, v]) => `${v} ${k}`).join(', ');

                addToast({
                    id: `trade-${id}`,
                    title: 'Nytt Handelstilbud',
                    message: `${trade.senderName} tilbyr ${offerText} for ${demandText}.`,
                    type: 'TRADE',
                    actions: [
                        {
                            label: 'Aksepter',
                            variant: 'primary',
                            icon: <Check size={14} />,
                            onClick: () => handleTradeResponse(id, 'ACCEPT')
                        },
                        {
                            label: 'Forhandle',
                            variant: 'neutral',
                            icon: <MessageSquare size={14} />,
                            onClick: () => {
                                // TODO: Open Negotiation Modal
                                removeToast(`trade-${id}`);
                                alert("Forhandling er ikke implementert ennå. Avslå handelen for å sende nytt tilbud.");
                            }
                        },
                        {
                            label: 'Avslå',
                            variant: 'danger',
                            icon: <X size={14} />,
                            onClick: () => handleTradeResponse(id, 'REJECT')
                        }
                    ]
                });
            }
        });

        prevTradesRef.current = currentTrades;
    }, [room.trades, player.id, pin]); // added pin dependency

    // Monitor Messages for Gifts
    useEffect(() => {
        const msgs = normalizedMessages;
        if (msgs.length === 0) return;

        const lastMsg = msgs[msgs.length - 1];

        if (prevActionLogRef.current === 0 && msgs.length > 0) {
            prevActionLogRef.current = msgs[msgs.length - 1].timestamp;
            return;
        }

        if (lastMsg.timestamp > prevActionLogRef.current) {
            const content = lastMsg.content;

            // Check for Gift format: "[GAVE] SenderName -> ReceiverName: Details"
            if (content.startsWith('[GAVE]') && content.includes(`-> ${player.name}`)) {
                const parts = content.split('->');
                const senderName = parts[0].replace('[GAVE]', '').trim();
                const details = content.split(':')[1]?.trim() || '';

                addToast({
                    id: `gift-${lastMsg.timestamp}`,
                    title: `Gave fra ${senderName}`,
                    message: `Du mottok: ${details}`,
                    type: 'GIFT'
                });
            }
            prevActionLogRef.current = lastMsg.timestamp;
        }
    }, [normalizedMessages, player.name]);

    if (toasts.length === 0) return null;

    return (
        <div className="absolute top-24 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col gap-3 animate-in slide-in-from-right duration-300 w-96">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${toast.type === 'GIFT' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {toast.type === 'GIFT' ? <Gift size={24} /> : <Handshake size={24} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">{toast.title}</h4>
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="text-slate-600 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Actions Row */}
                    {toast.actions && (
                        <div className="flex gap-2 pt-2 border-t border-white/5">
                            {toast.actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={action.onClick}
                                    className={`
                                        flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95
                                        ${action.variant === 'primary' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : ''}
                                        ${action.variant === 'danger' ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30' : ''}
                                        ${action.variant === 'neutral' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : ''}
                                    `}
                                >
                                    {action.icon}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
