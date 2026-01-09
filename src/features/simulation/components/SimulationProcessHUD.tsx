import React, { useState, useEffect, useCallback } from 'react';
import type { SimulationPlayer } from '../simulationTypes';
import { Clock, Check } from 'lucide-react';
import { RESOURCE_DETAILS, REFINERY_RECIPES, ITEM_TEMPLATES } from '../constants';
import { useSimulationActions } from '../hooks/useSimulationActions';

interface SimulationProcessHUDProps {
    player: SimulationPlayer;
    room: any; // Using any to avoid importing full SimulationRoom type if circular dependency is a risk, otherwise import it.
}

export const SimulationProcessHUD: React.FC<SimulationProcessHUDProps> = ({ player, room }) => {
    const [currentTime, setCurrentTime] = useState(Date.now());
    // Removed useSimulation() destructuring for room as it doesn't exist
    const { handleAction } = useSimulationActions(room?.pin, player, room?.world || null, () => { }, () => { }, () => { }, null);

    // Track local events for processes (CROW / WEED)
    // Key: processId, Value: { type: 'CROW' | 'WEED', expiresAt: number }
    const [maintenanceEvents, setMaintenanceEvents] = useState<Record<string, { type: 'CROW' | 'WEED', expiresAt: number }>>({});

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            setCurrentTime(now);

            // Randomly spawn events on ACTIVE CROP processes
            if (Math.random() < 0.05) { // 5% chance per second
                const crops = player.activeProcesses?.filter(p => p.type === 'CROP' && p.readyAt > now) || [];
                if (crops.length > 0) {
                    const target = crops[Math.floor(Math.random() * crops.length)];
                    // Only if no event exists
                    if (!maintenanceEvents[target.id]) {
                        const type = Math.random() > 0.5 ? 'CROW' : 'WEED';
                        setMaintenanceEvents(prev => ({
                            ...prev,
                            [target.id]: { type, expiresAt: now + 10000 } // Lasts 10 seconds
                        }));
                    }
                }
            }

            // Cleanup expired events
            setMaintenanceEvents(prev => {
                const next = { ...prev };
                let changed = false;
                Object.entries(next).forEach(([pid, evt]) => {
                    if (evt.expiresAt < now) {
                        delete next[pid];
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });

        }, 1000);
        return () => clearInterval(timer);
    }, [player.activeProcesses, maintenanceEvents]);

    const handleMaintain = useCallback((processId: string, type: 'CROW' | 'WEED') => {
        // Optimistic UI update: Remove event immediately
        setMaintenanceEvents(prev => {
            const next = { ...prev };
            delete next[processId];
            return next;
        });

        // Dispatch Action
        handleAction({
            type: 'MAINTAIN_CROP',
            processId,
            subType: type
        });
    }, [handleAction]);

    const activeProcesses = player.activeProcesses || [];

    // Define time context first
    const currentTimeCtx = currentTime;

    // Filter relevant processes (Crops, Coop, Mill, etc)
    const trackedProcesses = activeProcesses.filter(p => {
        const isStandard = p.type === 'CROP' || p.type === 'COOP' || p.type === 'MILL' || p.type === 'WELL' || p.type === 'CRAFT';
        if (!isStandard) return false;

        // Special: WELL disappears 10s after readyAt
        if (p.type === 'WELL' && p.readyAt > 0 && currentTimeCtx > p.readyAt + 10000) {
            return false;
        }
        return true;
    });

    // Filter active buffs
    const activeBuffs = (player.activeBuffs || []).filter(b => b.expiresAt > currentTimeCtx);

    if (trackedProcesses.length === 0 && activeBuffs.length === 0) return null;

    // Sort by ready time (soonest first)
    trackedProcesses.sort((a, b) => a.readyAt - b.readyAt);

    const formatTime = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="absolute top-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none items-end">
            {/* BUFFS */}
            {activeBuffs.map(buff => {
                const timeLeft = Math.max(0, buff.expiresAt - currentTimeCtx);
                return (
                    <div
                        key={buff.id}
                        className="group bg-indigo-900/90 backdrop-blur-md border border-indigo-500/30 rounded-xl p-3 shadow-xl pointer-events-auto flex items-center gap-4 transition-all hover:bg-indigo-900/100 hover:scale-105 animate-in slide-in-from-right-4 duration-300 relative"
                    >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center border bg-indigo-500/20 border-indigo-500 text-indigo-300">
                            <span className="text-xl">⚡</span>
                        </div>
                        <div className="flex flex-col min-w-[120px]">
                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                {buff.label}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>

                        {/* Tooltip on Hover */}
                        {buff.description && (
                            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-48 bg-slate-900/95 border border-indigo-500/30 p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none translate-x-2 group-hover:translate-x-0">
                                <p className="text-[10px] text-indigo-100 leading-tight">
                                    {buff.description}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* PROCESSES */}
            {trackedProcesses.map(process => {
                const timeLeft = Math.max(0, process.readyAt - currentTimeCtx);
                const isReady = timeLeft <= 0;

                // Content based on type
                let label = 'Avling Gror';
                let icon: React.ReactNode = <Clock size={20} />;
                let readyLabel = 'Innhøsting Klar!';

                // Lookup resource details if available
                const resourceInfo = RESOURCE_DETAILS[process.itemId];

                if (process.type === 'COOP') {
                    label = 'Høner Spiser';
                    icon = <span className="text-xl">🐔</span>;
                    readyLabel = 'Egg klare!';
                } else if (process.type === 'MILL') {
                    label = 'Kverner korn';
                    icon = <span className="text-xl">⚙️</span>;
                    readyLabel = 'Mel klart!';
                } else if (process.type === 'WELL') {
                    label = 'Brønnen fyller seg';
                    icon = <span className="text-xl">💧</span>;
                    readyLabel = 'Brønnen er klar!';
                } else if (process.type === 'CRAFT') {
                    const recipe = (REFINERY_RECIPES as any)[process.itemId];
                    const template = ITEM_TEMPLATES[process.itemId];

                    if (recipe) {
                        icon = <span className="text-xl">{recipe.icon || '🧪'}</span>;
                        label = recipe.label ? `Lager ${recipe.label}...` : 'Håndverk pågår...';
                        readyLabel = recipe.label ? `${recipe.label} klar!` : 'Håndverk ferdig!';
                    } else if (template) {
                        icon = <span className="text-xl">{template.icon || '📦'}</span>;
                        label = `Lager ${template.name}...`;
                        readyLabel = `${template.name} ferdig!`;
                    } else {
                        icon = <span className="text-xl">⚙️</span>;
                        label = 'Håndverk pågår...';
                        readyLabel = 'Håndverk ferdig!';
                    }
                } else {
                    // CROP / Resource
                    if (resourceInfo) {
                        icon = <span className="text-xl">{resourceInfo.icon}</span>;
                        label = `${resourceInfo.label} gror`;
                        readyLabel = `${resourceInfo.label} klar!`;
                    } else {
                        // Fallback generic
                        icon = isReady ? <Check size={20} /> : <Clock size={20} />;
                    }
                }

                // Maintenance Event Overlay
                const activeEvent = maintenanceEvents[process.id];
                const isMaintainable = !!activeEvent && !isReady;

                return (
                    <div
                        key={process.id}
                        className={`relative bg-slate-900/90 backdrop-blur-md border rounded-xl p-3 shadow-xl pointer-events-auto flex items-center gap-4 transition-all hover:bg-slate-900/95 animate-in slide-in-from-right-4 duration-300 ${process.type === 'WELL' && isReady ? 'animate-pulse' : ''} ${isMaintainable ? 'border-rose-500/50 hover:border-rose-400 cursor-pointer group' : 'border-white/10'}`}
                        onClick={isMaintainable ? () => handleMaintain(process.id, activeEvent.type) : undefined}
                    >
                        {/* Maintenance Interactable */}
                        {isMaintainable && (
                            <div className="absolute -top-3 -right-3 z-50 animate-bounce">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${activeEvent.type === 'CROW' ? 'bg-slate-800' : 'bg-emerald-700'}`}>
                                    <span className="text-lg">{activeEvent.type === 'CROW' ? '🐦' : '🌿'}</span>
                                </div>
                            </div>
                        )}

                        {/* Yield Bonus Badge */}
                        {process.yieldBonus && process.yieldBonus > 0 && (
                            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full shadow-lg border border-emerald-400 z-10">
                                +{Math.round(process.yieldBonus * 100)}%
                            </div>
                        )}

                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isReady ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
                            {icon}
                        </div>

                        <div className="flex flex-col min-w-[120px]">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {isReady ? readyLabel : (isMaintainable ? (activeEvent.type === 'CROW' ? 'Fjern Kråke!' : 'Luk ugress!') : label)}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-black ${isReady ? 'text-emerald-400' : isMaintainable ? 'text-rose-400' : 'text-white'}`}>
                                    {isReady ? 'Hent nå' : formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
