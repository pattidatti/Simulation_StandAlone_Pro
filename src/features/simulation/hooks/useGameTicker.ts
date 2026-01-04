import { useEffect } from 'react';
import { ref, runTransaction, update } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import { getSeasonForTick, getYearForTick } from '../utils/timeUtils';
import type { SimulationRoom } from '../simulationTypes';

export const useGameTicker = (pin: string | undefined, roomStatus: SimulationRoom['status'], world: SimulationRoom['world'] | null | undefined) => {
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

                            return currentWorld;
                        } else {
                            // Someone else beat us to it, abort
                            return;
                        }
                    });
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
    }, [pin, roomStatus, world?.lastTickAt, world?.gameTick]);
};
