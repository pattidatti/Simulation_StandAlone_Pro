import { useState, useEffect } from 'react';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import type { SimulationPlayer, SimulationMessage } from '../simulationTypes';

export interface ChatChannel {
    id: string;
    name: string;
    type: 'GLOBAL' | 'REGION' | 'DIPLOMACY' | 'DM';
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

        setChannels(prev => {
            const merged = { ...newChannels };
            Object.keys(prev).forEach(k => {
                if (merged[k]) merged[k].unreadCount = prev[k].unreadCount;
            });
            return merged;
        });

    }, [player?.regionId, player?.role]);

    // 2. Subscribe to ALL Accessible Channels for Unread Logic
    useEffect(() => {
        if (!pin || !player || Object.keys(channels).length === 0) return;

        const unsubs: (() => void)[] = [];

        Object.keys(channels).forEach(channelId => {
            const channelRef = ref(db, `simulation_rooms/${pin}/channels/${channelId}/messages`);
            const q = query(channelRef, limitToLast(20)); // Only need latest for unread check

            const unsub = onValue(q, (snapshot) => {
                const data = snapshot.val();
                const msgs = data ? Object.values(data) as SimulationMessage[] : [];
                msgs.sort((a, b) => (a.timestamp as number) - (b.timestamp as number));

                setMessages(prev => ({
                    ...prev,
                    [channelId]: msgs
                }));

                // Update unread count for this channel
                const lastRead = lastReadTimestamps[channelId] || 0;
                const newUnread = msgs.filter(m => (m.timestamp as number) > lastRead && m.senderId !== player.id).length;

                setChannels(prev => {
                    if (prev[channelId] && prev[channelId].unreadCount === newUnread) return prev;
                    return {
                        ...prev,
                        [channelId]: { ...prev[channelId], unreadCount: newUnread }
                    };
                });
            });
            unsubs.push(unsub);
        });

        return () => unsubs.forEach(u => u());
    }, [pin, player?.id, Object.keys(channels).join(','), lastReadTimestamps]);

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
