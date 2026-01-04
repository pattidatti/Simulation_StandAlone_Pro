import React from 'react';
import { ref, update } from 'firebase/database';
import { MessageSquare } from 'lucide-react';
import { simulationDb as db } from '../simulationFirebase';
import type { SimulationPlayer } from '../simulationTypes';
import { SimulationMapWindow } from './ui/SimulationMapWindow';
import { useSimulation } from '../SimulationContext';

interface SimulationDiplomacyProps {
    diplomacy: Record<string, any>;
    player: SimulationPlayer;
    pin: string;
    onAction?: (action: any) => void; // Added to match previous usage in parent if needed, though props were different in Viewport
}

export const SimulationDiplomacy: React.FC<SimulationDiplomacyProps> = React.memo(({ diplomacy, player, pin }) => {
    const { setActiveTab } = useSimulation();

    const handleSendMessage = async (content: string) => {
        if (!content) return;
        const msgId = `msg_${Date.now()}`;
        await update(ref(db, `simulation_rooms/${pin}/diplomacy/${msgId}`), {
            id: msgId,
            senderId: player.id,
            senderName: player.name,
            receiverId: 'ALL_RULERS',
            content,
            timestamp: Date.now()
        });
    };

    return (
        <SimulationMapWindow
            title="Diplomati"
            icon={<MessageSquare className="w-8 h-8" />}
            onClose={() => setActiveTab('MAP')}
            className="flex flex-col h-full"
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <p className="text-slate-400 text-sm italic">Kommuniser med de andre herskerne i riket.</p>
                    <span className="text-xs font-black uppercase text-indigo-500 tracking-widest bg-indigo-500/10 px-4 py-1 rounded-full">Kryptert Kanal</span>
                </div>

                <div className="flex-1 min-h-[400px] flex flex-col gap-4 p-6 bg-black/20 rounded-3xl border border-white/5 overflow-y-auto custom-scrollbar">
                    {diplomacy ? Object.values(diplomacy)
                        .filter((m: any) => m.receiverId === 'ALL_RULERS' || m.receiverId === player.id || m.senderId === player.id)
                        .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0))
                        .map((m: any) => (
                            <div key={m.id} className={`p-4 rounded-2xl max-w-[80%] ${m.senderId === player.id ? 'bg-indigo-600 text-white self-end rounded-br-none shadow-lg shadow-indigo-600/20' : 'bg-slate-800/80 text-slate-200 self-start rounded-bl-none border border-white/5'}`}>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[10px] font-black uppercase opacity-60 italic">{m.senderName}</span>
                                    <span className="text-[8px] opacity-40">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-sm font-medium">{m.content}</p>
                            </div>
                        )) : <div className="m-auto text-slate-500 text-sm font-black italic">Ingen meldinger...</div>
                    }
                </div>

                <div className="flex gap-3 bg-slate-800/50 p-2 rounded-2xl border border-white/5 shrink-0">
                    <input
                        type="text"
                        id="diplomacyInputWidescreen"
                        placeholder="Send beskjed til riket..."
                        className="flex-1 bg-transparent px-4 py-3 outline-none text-white font-bold"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                                handleSendMessage((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            const input = document.getElementById('diplomacyInputWidescreen') as HTMLInputElement;
                            if (input && input.value) {
                                handleSendMessage(input.value);
                                input.value = '';
                            }
                        }}
                        className="bg-indigo-600 text-white px-8 rounded-xl font-black text-sm hover:bg-indigo-500 transition-all active:scale-95"
                    >
                        SEND
                    </button>
                </div>
            </div>
        </SimulationMapWindow>
    );
});

SimulationDiplomacy.displayName = 'SimulationDiplomacy';
