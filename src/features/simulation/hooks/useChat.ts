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
    const [isLoading, setIsLoading] = useState(false);

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

    // 2. Subscribe to Active Channel Messages
    useEffect(() => {
        if (!pin || !activeChannelId) return;
        setIsLoading(true);

        const channelRef = ref(db, `simulation_rooms/${pin}/channels/${activeChannelId}/messages`);
        const q = query(channelRef, limitToLast(50));

        const unsub = onValue(q, (snapshot) => {
            const data = snapshot.val();
            const msgs = data ? Object.values(data) as SimulationMessage[] : [];
            // Sort by timestamp
            msgs.sort((a, b) => a.timestamp - b.timestamp);

            setMessages(prev => ({
                ...prev,
                [activeChannelId]: msgs
            }));
            setIsLoading(false);
        });

        return () => unsub();
    }, [pin, activeChannelId]);

    return {
        activeChannelId,
        setActiveChannelId,
        channels,
        messages: messages[activeChannelId] || [],
        isLoading
    };
};
