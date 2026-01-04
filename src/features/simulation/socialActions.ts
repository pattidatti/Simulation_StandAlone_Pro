import { ref, runTransaction, get, push, set, update } from 'firebase/database';
import { simulationDb as db } from './simulationFirebase';
import { logSimulationMessage } from './utils/simulationUtils';
import type { SimulationPlayer, TradeOffer, Resources } from './simulationTypes';

/*
 * SOCIAL ACTION HANDLERS
 * Handles Gift (Direct Transfer) and Trade (Escrow-based Exchange).
 */

/* --- GIFT HANDLER (One-way) --- */
export const handleSendGift = async (pin: string, senderId: string, targetId: string, resources: Partial<Resources>) => {
    if (senderId === targetId) return { success: false, error: "Kan ikke gi gave til deg selv" };

    const senderRef = ref(db, `simulation_rooms/${pin}/players/${senderId}`);
    const targetRef = ref(db, `simulation_rooms/${pin}/players/${targetId}`);

    // Pre-flight check
    const senderSnap = await get(senderRef);
    const targetSnapPre = await get(targetRef);

    if (!senderSnap.exists()) return { success: false, error: "Sender finnes ikke" };
    if (!targetSnapPre.exists()) return { success: false, error: "Mottaker finnes ikke" };

    const sender = senderSnap.val() as SimulationPlayer;
    const target = targetSnapPre.val() as SimulationPlayer; // Ensure we cast to get regionId
    const targetName = target.name;

    // Enforce Regional Restriction
    if (sender.regionId !== target.regionId) {
        return { success: false, error: "Du kan kun sende gaver til spillere i din region." };
    }

    // 1. DEDUCT FROM SENDER
    let senderSuccess = false;
    let deductedDetails = "";

    await runTransaction(senderRef, (player) => {
        if (player === null) return player;
        if (!player.resources) player.resources = {};

        // Check availability
        for (const [res, amount] of Object.entries(resources)) {
            if ((player.resources[res as keyof Resources] || 0) < (amount as number)) {
                return; // Abort transaction
            }
        }

        // Deduct
        for (const [res, amount] of Object.entries(resources)) {
            player.resources[res as keyof Resources] -= (amount as number);
            deductedDetails += `${amount} ${res}, `;
        }
        senderSuccess = true;
        return player;
    });

    if (!senderSuccess) return { success: false, error: "Ikke nok ressurser til å sende gaven." };

    // 2. ADD TO TARGET
    let targetSuccess = false;
    await runTransaction(targetRef, (player) => {
        if (player === null) return player;
        if (!player.resources) player.resources = {};

        for (const [res, amount] of Object.entries(resources)) {
            player.resources[res as keyof Resources] = (player.resources[res as keyof Resources] || 0) + (amount as number);
        }
        targetSuccess = true;
        return player;
    });

    if (!targetSuccess) {
        // CRITICAL FAILURE: Sender deducted, Target failed.
        // Attempt refund? For now, just log error.
        console.error("CRITICAL: Gift transaction partial failure. Sender deducted but target failed.", senderId, targetId);
        return { success: false, error: "Transaksjonsfeil: Gaven gikk tapt i posten (Mottaker utilgjengelig i skrivende stund)." };
    }

    // 3. NOTIFY
    const msg = `Sendte gave (${deductedDetails.slice(0, -2)}) til ${targetName}.`;
    logSimulationMessage(pin, `[GAVE] ${sender.name} -> ${targetName}: ${deductedDetails}`);

    return {
        success: true,
        data: {
            success: true,
            timestamp: Date.now(),
            message: msg
        }
    };
};

/* --- TRADE HANDLER (Two-way Escrow) --- */

// 1. CREATE TRADE (Escrow Offer)
export const handleCreateTrade = async (pin: string, senderId: string, targetId: string, offer: Partial<Resources>, demand: Partial<Resources>) => {
    const senderRef = ref(db, `simulation_rooms/${pin}/players/${senderId}`);
    const tradesRef = ref(db, `simulation_rooms/${pin}/trades`);

    // Get names for the record
    const senderSnap = await get(senderRef);
    const targetSnap = await get(ref(db, `simulation_rooms/${pin}/players/${targetId}`));
    if (!senderSnap.exists() || !targetSnap.exists()) return { success: false, error: "Spiller finnes ikke" };

    const sender = senderSnap.val() as SimulationPlayer;
    const target = targetSnap.val() as SimulationPlayer;
    const senderName = sender.name;
    const targetName = target.name;

    // Enforce Regional Restriction
    if (sender.regionId !== target.regionId) {
        return { success: false, error: "Handel er kun tillatt med spillere i din region." };
    }

    // 1. DEDUCT OFFER FROM SENDER (Escrow)
    let escrowSuccess = false;
    await runTransaction(senderRef, (player) => {
        if (player === null) return player;
        for (const [res, amount] of Object.entries(offer)) {
            if ((player.resources?.[res as keyof Resources] || 0) < (amount as number)) return; // Abort
        }
        // Deduct
        for (const [res, amount] of Object.entries(offer)) {
            player.resources[res as keyof Resources] -= (amount as number);
        }
        escrowSuccess = true;
        return player;
    });

    if (!escrowSuccess) return { success: false, error: "Ikke nok ressurser til å opprette handelen." };

    // 2. CREATE TRADE RECORD
    const newTradeRef = push(tradesRef);
    const tradeData: TradeOffer = {
        id: newTradeRef.key as string,
        senderId,
        senderName,
        receiverId: targetId,
        receiverName: targetName,
        offer,
        demand,
        status: 'PENDING',
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
    };

    await set(newTradeRef, tradeData);

    logSimulationMessage(pin, `[HANDEL] ${senderName} tilbød handel til ${targetName}.`);

    return { success: true, message: "Handelstilbud sendt." };
};

// 2. RESPOND TO TRADE (Accept/Reject)
export const handleRespondToTrade = async (pin: string, responderId: string, tradeId: string, action: 'ACCEPT' | 'REJECT') => {
    const tradeRef = ref(db, `simulation_rooms/${pin}/trades/${tradeId}`);
    const tradeSnap = await get(tradeRef);
    if (!tradeSnap.exists()) return { success: false, error: "Handelen finnes ikke lenger." };

    const trade = tradeSnap.val() as TradeOffer;
    if (trade.status !== 'PENDING') return { success: false, error: "Handelen er ikke lenger aktiv." };
    if (trade.receiverId !== responderId && trade.senderId !== responderId) {
        // Allow sender to cancel
        if (trade.senderId === responderId && action === 'REJECT') {
            // Cancel logic
        } else {
            return { success: false, error: "Du har ikke tilgang til denne handelen." };
        }
    }

    if (action === 'REJECT') {
        // REFUND SENDER
        const senderRef = ref(db, `simulation_rooms/${pin}/players/${trade.senderId}`);
        await runTransaction(senderRef, (player) => {
            if (player === null) return player; // Player deleted? Resources lost.
            if (!player.resources) player.resources = {};
            for (const [res, amount] of Object.entries(trade.offer)) {
                player.resources[res as keyof Resources] = (player.resources[res as keyof Resources] || 0) + (amount as number);
            }
            return player;
        });

        // UPDATE TRADE STATUS
        await update(tradeRef, { status: trade.senderId === responderId ? 'CANCELLED' : 'REJECTED' });
        return { success: true, message: "Handel avbrutt/avslått." };
    }

    if (action === 'ACCEPT') {
        const receiverRef = ref(db, `simulation_rooms/${pin}/players/${responderId}`);

        // 1. TRY TO DEDUCT DEMAND FROM RECEIVER
        let paymentSuccess = false;
        await runTransaction(receiverRef, (player) => {
            if (player === null) return player;
            // Check affordability
            for (const [res, amount] of Object.entries(trade.demand)) {
                if ((player.resources?.[res as keyof Resources] || 0) < (amount as number)) return;
            }
            // Pay demand
            for (const [res, amount] of Object.entries(trade.demand)) {
                player.resources[res as keyof Resources] -= (amount as number);
            }
            // Receive offer
            for (const [res, amount] of Object.entries(trade.offer)) {
                player.resources[res as keyof Resources] = (player.resources[res as keyof Resources] || 0) + (amount as number);
            }
            paymentSuccess = true;
            return player;
        });

        if (!paymentSuccess) return { success: false, error: "Du har ikke råd til denne handelen." };

        // 2. GIVE PAYMENT TO SENDER
        const senderRef = ref(db, `simulation_rooms/${pin}/players/${trade.senderId}`);
        await runTransaction(senderRef, (player) => {
            if (player === null) return player;
            if (!player.resources) player.resources = {};
            // Receive demand
            for (const [res, amount] of Object.entries(trade.demand)) {
                player.resources[res as keyof Resources] = (player.resources[res as keyof Resources] || 0) + (amount as number);
            }
            return player;
        });

        // 3. CLOSE TRADE
        await update(tradeRef, { status: 'ACCEPTED' });

        logSimulationMessage(pin, `[HANDEL] ${trade.receiverName} godtok handelen fra ${trade.senderName}.`);
        return { success: true, message: "Handel gjennomført!" };
    }
};
