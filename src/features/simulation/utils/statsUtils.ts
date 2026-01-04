
import { ref, update, increment } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';

/**
 * Centrally track systemic events in the simulation.
 * @param pin Room PIN
 * @param category 'roleChanges' | 'coups' | 'contributions' | 'crafted' | 'consumed'
 * @param subkey The specific item (e.g. 'PEASANT', 'gold', 'iron_sword')
 * @param amount Amount to increment
 */
export const logSystemicStat = (pin: string, category: string, subkey: string, amount: number = 1) => {
    if (!pin || !category || !subkey) return;

    // Cleanup key (Firebase doesn't like dots or certain characters in keys)
    const safeKey = subkey.replace(/\./g, '_');

    const statsRef = ref(db, `simulation_rooms/${pin}/stats/${category}`);
    update(statsRef, {
        [safeKey]: increment(amount)
    }).catch(err => console.error("Failed to log systemic stat:", err));
};
