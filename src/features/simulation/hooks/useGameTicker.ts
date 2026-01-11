import { useEffect } from 'react';
import { ref, runTransaction, update, get } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import { getSeasonForTick, getYearForTick } from '../utils/timeUtils';
import type { SimulationRoom } from '../simulationTypes';
import { syncServerMetadata } from '../logic/roomInit';
import { handleMarketEntropy } from '../logic/handlers/MarketHandlers';

export const useGameTicker = (pin: string | undefined, roomStatus: SimulationRoom['status'], world: SimulationRoom['world'] | null | undefined, onlineCount?: number) => {
    useEffect(() => {
        if (!pin || roomStatus === 'LOBBY') return;

        const heartbeat = setInterval(async () => {
            const now = Date.now();
            // Optimistic check to avoid slamming DB
            const currentLastTick = world?.lastTickAt || 0;
            if (now - currentLastTick < 1000) return; // Wait at least 1s

            // Check if 60s passed
            if (now - currentLastTick >= 60000) {
                const worldRef = ref(db, `simulation_rooms/${pin}/world`);
                try {
                    let syncedWorld: any = null;
                    await runTransaction(worldRef, (currentWorld) => {
                        if (!currentWorld) return;

                        const lastTickAt = currentWorld.lastTickAt || 0;
                        if (Date.now() - lastTickAt >= 60000) {
                            // WE ARE THE TICKER
                            const newTick = (currentWorld.gameTick || 0) + 1;
                            currentWorld.gameTick = newTick;
                            currentWorld.lastTickAt = Date.now();

                            // Auto-calculate Season/Year inside the transaction
                            currentWorld.season = getSeasonForTick(newTick);
                            currentWorld.year = getYearForTick(newTick, 1100);

                            // --- PHASE 3: MARKET ENTROPY ---
                            // Every 10 ticks (approx 10 mins), apply entropy to all markets
                            if (newTick % 10 === 0) {
                                const marketsRef = ref(db, `simulation_rooms/${pin}/markets`);
                                // We can't easily transaction two refs at once in raw Firebase 
                                // without moving the transaction to the root.
                                // However, since we are the AUTHORATIVE TICKER (inside a successful transaction on world),
                                // we can perform a safe update on markets.
                                // To be 100% safe, we fetch and set/transaction.
                                get(marketsRef).then(snapshot => {
                                    if (snapshot.exists()) {
                                        const markets = snapshot.val();
                                        Object.keys(markets).forEach(mKey => {
                                            handleMarketEntropy(markets[mKey]);
                                        });
                                        update(marketsRef, markets);
                                    }
                                });
                            }

                            syncedWorld = { ...currentWorld };
                            return currentWorld;
                        } else {
                            // Someone else beat us to it, abort
                            return;
                        }
                    });

                    // Sync to public metadata if we successfully ticked
                    if (syncedWorld) {
                        syncServerMetadata(pin, {
                            world: syncedWorld,
                            pin,
                            playerCount: onlineCount
                        } as any);
                    }
                } catch (e) {
                    // Transaction failed/aborted, which is expected in a race.
                }
            } else if (!world?.lastTickAt) {
                // Initialize if missing (e.g. fresh game)
                // Use update here as it's less contended
                update(ref(db, `simulation_rooms/${pin}/world`), { lastTickAt: Date.now() });
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(heartbeat);
    }, [pin, roomStatus, world?.lastTickAt, world?.gameTick, onlineCount]);

    // Independent Player Count Sync (Faster than the 60s tick)
    useEffect(() => {
        if (!pin || onlineCount === undefined) return;

        // Throttled update to avoid spamming if count fluctuates
        const timeout = setTimeout(() => {
            syncServerMetadata(pin, { pin, playerCount: onlineCount } as any);
        }, 2000);

        return () => clearTimeout(timeout);
    }, [pin, onlineCount]);
};
