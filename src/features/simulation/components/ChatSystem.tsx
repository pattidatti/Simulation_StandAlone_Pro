import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { handleSendMessage } from '../globalActions';
import type { SimulationPlayer } from '../simulationTypes';
import { MessageSquare, Send, ChevronDown, Users, MapPin, Crown, Lock } from 'lucide-react';

// Inline cn helper
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface ChatSystemProps {
    pin: string;
    player: SimulationPlayer;
    onOpenProfile?: (playerId: string) => void;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({ pin, player, onOpenProfile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { activeChannelId, setActiveChannelId, channels, messages, totalUnreadCount, markChannelAsRead, isLoading } = useChat(pin, player);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Mark as read when open or switching channels
    useEffect(() => {
        if (isOpen) {
            markChannelAsRead(activeChannelId);
        }
    }, [isOpen, activeChannelId, markChannelAsRead]);

    // Hotkey: Toggle with 'C'
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

            if (e.key.toLowerCase() === 'c') {
                setIsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSend = async () => {
        if (!inputText.trim() || isSending) return;
        setIsSending(true);

        const result = await handleSendMessage(pin, player.id, inputText, activeChannelId);
        if (result.success) {
            setInputText('');
        } else {
            alert(result.error || "Feil ved sending.");
        }
        setIsSending(false);
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'GLOBAL': return <Users size={14} />;
            case 'REGION': return <MapPin size={14} />;
            case 'DIPLOMACY': return <Crown size={14} className="text-amber-400" />;
            case 'DM': return <Lock size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-50 bg-slate-900/90 border border-slate-700/50 text-white p-3 rounded-full shadow-2xl hover:bg-indigo-600 hover:scale-105 transition-all group backdrop-blur-md"
            >
                <div className="relative">
                    <MessageSquare size={24} className="group-hover:text-white text-slate-200" />
                    {totalUnreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-900 px-1 animate-in zoom-in duration-300">
                            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                        </div>
                    )}
                </div>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 left-6 z-50 w-[380px] h-[500px] flex flex-col bg-slate-950/95 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-800/50 bg-slate-900/50 rounded-t-2xl drag-handle cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Comms Array</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <ChevronDown size={18} />
                </button>
            </div>

            {/* Channels Tabs */}
            <div className="flex gap-1 p-2 bg-slate-900/30 overflow-x-auto scrollbar-hide">
                {Object.values(channels).map((channel: any) => (
                    <button
                        key={channel.id}
                        onClick={() => setActiveChannelId(channel.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all relative",
                            activeChannelId === channel.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                    >
                        {getChannelIcon(channel.type)}
                        {channel.name}
                        {channel.unreadCount > 0 && activeChannelId !== channel.id && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />
                        )}
                    </button>
                ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-950/50 to-transparent">
                {isLoading ? (
                    <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs italic mt-10">Ingen meldinger i denne kanalen ennå.</div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.senderId === player.id;
                        return (
                            <div key={msg.id} className={cn("flex flex-col gap-1 max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 px-1">
                                    <span
                                        onClick={() => onOpenProfile && onOpenProfile(msg.senderId || '')}
                                        className={cn(
                                            "font-bold hover:underline cursor-pointer",
                                            isMe ? "text-indigo-400" : "text-amber-500"
                                        )}
                                    >
                                        {msg.senderName}
                                    </span>
                                    <span className="opacity-50">• {new Date(msg.timestamp as number).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className={cn(
                                    "px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm break-words relative group",
                                    isMe
                                        ? "bg-indigo-600 text-white rounded-tr-sm"
                                        : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50"
                                )}>
                                    {msg.content}
                                    {/* Role Badge if not me */}
                                    {!isMe && msg.senderRole !== 'PEASANT' && (
                                        <div className="absolute -top-2 -right-2 bg-slate-950 border border-slate-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-xl scale-0 group-hover:scale-100 transition-transform">
                                            {msg.senderRole}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-900/80 border-t border-slate-800 backdrop-blur-md">
                <div className="relative flex items-center gap-2">
                    <input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={`Melding til #${channels[activeChannelId]?.name || 'kanal'}...`}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                        disabled={isSending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || isSending}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                    >
                        {isSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                    </button>

                    {/* Cost Indicator */}
                    {player.role !== 'KING' && activeChannelId === 'global' && (
                        <div className="absolute -top-6 right-2 text-[10px] text-amber-500 font-mono bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50">
                            Kostnad: 2 Gull
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
