import { useState, useEffect } from 'react';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import type { SimulationPlayer, SimulationMessage } from '../simulationTypes';

export interface ChatChannel {
    id: string;
    name: string;
    type: 'GLOBAL' | 'REGION' | 'DIPLOMACY' | 'DM' | 'FEEDBACK';
    unreadCount: number;
    description?: string;
}

export const useChat = (pin: string, player: SimulationPlayer | null) => {
    const [activeChannelId, setActiveChannelId] = useState<string>('global');
    const [channels, setChannels] = useState<Record<string, ChatChannel>>({});
    const [messages, setMessages] = useState<Record<string, SimulationMessage[]>>({});
    const [isLoading, _setIsLoading] = useState(false);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);

    // Track last read timestamps per channel
    const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>(() => {
        if (!player?.id) return {};
        const saved = localStorage.getItem(`chat_last_read_${pin}_${player.id}`);
        return saved ? JSON.parse(saved) : {};
    });

    const markChannelAsRead = (channelId: string) => {
        const now = Date.now();
        setLastReadTimestamps(prev => {
            const next = { ...prev, [channelId]: now };
            if (player?.id) {
                localStorage.setItem(`chat_last_read_${pin}_${player.id}`, JSON.stringify(next));
            }
            return next;
        });
    };

    // 1. Determine Accessible Channels
    useEffect(() => {
        if (!player) return;

        const newChannels: Record<string, ChatChannel> = {};

        // Global
        newChannels['global'] = { id: 'global', name: 'Riket', type: 'GLOBAL', unreadCount: 0, description: 'Offentlig torg' };

        // Regional
        if (player.role === 'KING') {
            newChannels['region_vest'] = { id: 'region_vest', name: 'Vest', type: 'REGION', unreadCount: 0, description: 'Regional kanal for Vest' };
            newChannels['region_ost'] = { id: 'region_ost', name: 'Øst', type: 'REGION', unreadCount: 0, description: 'Regional kanal for Øst' };
            newChannels['capital'] = { id: 'capital', name: 'Hovedstaden', type: 'REGION', unreadCount: 0, description: 'Hovedstaden' };
        } else if (player.regionId) {
            const regionName = player.regionId === 'capital' ? 'Hovedstaden' :
                (player.regionId === 'region_vest' ? 'Vest' :
                    (player.regionId === 'region_ost' ? 'Øst' : player.regionId));

            newChannels[player.regionId] = {
                id: player.regionId,
                name: regionName,
                type: 'REGION',
                unreadCount: 0,
                description: 'Ditt hjemsted'
            };
        }

        // Diplomacy (Baron/King)
        if (player.role === 'BARON' || player.role === 'KING') {
            newChannels['diplomacy'] = { id: 'diplomacy', name: 'Rådet', type: 'DIPLOMACY', unreadCount: 0, description: 'Hemmelig kanal for ledere' };
        }

        // Feedback (Public but logged)
        newChannels['feedback'] = { id: 'feedback', name: 'Feedback', type: 'FEEDBACK', unreadCount: 0, description: 'Kommentarer? Bugs? Skriv her!' };

        setChannels(prev => {
            const merged = { ...newChannels };
            Object.keys(prev).forEach(k => {
                if (merged[k]) merged[k].unreadCount = prev[k].unreadCount;
            });
            return merged;
        });

    }, [player?.regionId, player?.role]);

    // 2. Subscribe to ALL Accessible Channels
    useEffect(() => {
        if (!pin || !player || Object.keys(channels).length === 0) return;

        console.log("[useChat] Initializing listeners for channels:", Object.keys(channels));
        const unsubs: (() => void)[] = [];

        Object.keys(channels).forEach(channelId => {
            const channelRef = ref(db, `simulation_rooms/${pin}/channels/${channelId}/messages`);
            const q = query(channelRef, limitToLast(50));

            const unsub = onValue(q, (snapshot) => {
                const data = snapshot.val();
                const msgs = data ? Object.values(data) as SimulationMessage[] : [];

                // Stable sort that handles pending server timestamps
                msgs.sort((a, b) => {
                    const tA = (typeof a.timestamp === 'number') ? a.timestamp : Date.now();
                    const tB = (typeof b.timestamp === 'number') ? b.timestamp : Date.now();
                    return tA - tB;
                });

                setMessages(prev => {
                    // Optimized update: only set if content actually changed or counts changed
                    if (JSON.stringify(prev[channelId]) === JSON.stringify(msgs)) return prev;
                    return { ...prev, [channelId]: msgs };
                });
            }, (error) => {
                console.error(`[useChat] Listener error for ${channelId}:`, error);
            });
            unsubs.push(unsub);
        });

        return () => {
            console.log("[useChat] Cleaning up listeners");
            unsubs.forEach(u => u());
        };
    }, [pin, player?.id, Object.keys(channels).sort().join(',')]); // Stable dependency

    // 3. Update Unread Counts when messages or lastRead changes
    useEffect(() => {
        if (Object.keys(channels).length === 0) return;

        setChannels(prev => {
            let changed = false;
            const next = { ...prev };

            Object.keys(next).forEach(channelId => {
                const msgs = messages[channelId] || [];
                const lastRead = lastReadTimestamps[channelId] || 0;

                // Feedback is always 0
                const newUnread = channelId === 'feedback'
                    ? 0
                    : msgs.filter(m => {
                        const ts = (typeof m.timestamp === 'number') ? m.timestamp : Date.now();
                        return ts > lastRead && m.senderId !== player?.id;
                    }).length;

                if (next[channelId].unreadCount !== newUnread) {
                    next[channelId] = { ...next[channelId], unreadCount: newUnread };
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [messages, lastReadTimestamps]);

    // 3. Calculate Total Unread
    useEffect(() => {
        const total = Object.values(channels).reduce((acc, ch) => acc + (ch.unreadCount || 0), 0);
        setTotalUnreadCount(total);
    }, [channels]);

    return {
        activeChannelId,
        setActiveChannelId,
        channels,
        messages: messages[activeChannelId] || [],
        isLoading: isLoading && !messages[activeChannelId],
        totalUnreadCount,
        markChannelAsRead
    };
};
