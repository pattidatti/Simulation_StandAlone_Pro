import { ref, update } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import { ACHIEVEMENTS, getAchievement } from '../data/achievements';
import type { SimulationPlayer, SimulationAccount } from '../simulationTypes';

/**
 * Evaluates and unlocks achievements for a given player and account.
 * Uses atomic path updates for RTDB to prevent race conditions.
 */
export async function checkAndUnlockAchievements(
    uid: string,
    player: SimulationPlayer,
    account: SimulationAccount,
    showNotification: (id: string) => void
) {
    if (!uid || !player || !account) return;

    // Support both record and array (migration/fallback)
    const unlockedData = account.unlockedAchievements || {};
    const alreadyUnlocked = Array.isArray(unlockedData)
        ? new Set(unlockedData)
        : new Set(Object.keys(unlockedData));

    const newUnlocks: string[] = [];

    // 1. Evaluate Logic
    for (const def of ACHIEVEMENTS) {
        if (alreadyUnlocked.has(def.id)) continue;

        let isMet = false;

        switch (def.id) {
            case 'first_steps':
                if ((player.stats?.level || 1) >= 2) isMet = true;
                break;
            case 'resource_gatherer':
                if ((player.stats?.level || 1) >= 5) isMet = true;
                break;
            case 'baron_rising':
                if (player.role === 'BARON') isMet = true;
                break;
            case 'king_slayer':
                if (player.role === 'KING') isMet = true;
                break;
            case 'soul_awakening':
                if ((account.globalLevel || 1) >= 5) isMet = true;
                break;
            case 'eternal_dynasty':
                if ((account.characterHistory?.length || 0) >= 10) isMet = true;
                break;
        }

        if (isMet) {
            newUnlocks.push(def.id);
        }
    }

    if (newUnlocks.length === 0) return;

    // 2. Perform Atomic Update to Global Account
    const accountRef = ref(db, `simulation_accounts/${uid}`);
    const updates: Record<string, any> = {};

    let currentTempXp = account.globalXp || 0;

    for (const id of newUnlocks) {
        const def = getAchievement(id);
        if (!def) continue;

        // Path-based atomic update in RTDB
        updates[`unlockedAchievements/${id}`] = Date.now();

        // Accumulate XP
        currentTempXp += def.xp;

        // Trigger notification
        showNotification(id);
    }

    // Update Totals
    updates['globalXp'] = currentTempXp;
    updates['globalLevel'] = Math.floor(Math.sqrt(currentTempXp / 100)) + 1;

    try {
        await update(accountRef, updates);
        console.log(`Unlocked items for ${uid}: ${newUnlocks.join(', ')}`);
    } catch (e) {
        console.error("Failed to unlock achievements:", e);
    }
}
