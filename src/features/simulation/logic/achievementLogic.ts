import { ref, update } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import { ACHIEVEMENTS, getAchievement, AchievementDef } from '../data/achievements';
import type { SimulationPlayer, SimulationAccount } from '../simulationTypes';

/**
 * Checks all PASSIVE achievements (polling).
 * Returns IDs of newly unlocked achievements.
 */
export async function checkPassiveAchievements(
    uid: string,
    player: SimulationPlayer,
    account: SimulationAccount,
    showNotification: (id: string) => void
) {
    if (!uid || !player || !account) return;

    // Support legacy/both formats
    const unlockedData = account.unlockedAchievements || {};
    const alreadyUnlocked = Array.isArray(unlockedData)
        ? new Set(unlockedData)
        : new Set(Object.keys(unlockedData));

    const newUnlocks: string[] = [];

    // Filter for PASSIVE triggers and check conditions
    const passiveAchievements = ACHIEVEMENTS.filter(a => a.triggerType === 'PASSIVE');

    for (const def of passiveAchievements) {
        if (alreadyUnlocked.has(def.id)) continue;
        if (evaluateCondition(def, player, account)) {
            newUnlocks.push(def.id);
        }
    }

    if (newUnlocks.length > 0) {
        await commitUnlocks(uid, account, newUnlocks, showNotification);
    }
}

/**
 * Checks EVENT-based achievements (hooks).
 * Called when an action is performed (e.g., 'TRADE', 'CRAFT').
 */
export async function checkEventAchievements(
    uid: string,
    player: SimulationPlayer,
    account: SimulationAccount,
    eventType: string, // e.g., 'ACTION_COUNT', 'MANUAL'
    target: string,    // e.g., 'TRADE', 'DEATH_FIRST'
    value: number,     // e.g., 1 (increment) or current count
    showNotification: (id: string) => void
) {
    if (!uid || !player || !account) return;

    const unlockedData = account.unlockedAchievements || {};
    const alreadyUnlocked = Array.isArray(unlockedData)
        ? new Set(unlockedData)
        : new Set(Object.keys(unlockedData));

    const newUnlocks: string[] = [];

    // Filter by Trigger Type AND Event Targets to save perf
    const eventAchievements = ACHIEVEMENTS.filter(a =>
        a.triggerType === 'EVENT' &&
        a.condition.type === eventType &&
        a.condition.target === target
    );

    if (eventAchievements.length === 0) return;

    // Handle Persistent Counters (Accumulation)
    // We assume 'value' passed in is the DELTA (increment), usually 1.
    // We fetch the current total from account.statistics
    const stats = account.statistics || {};
    const currentTotal = (stats[target] || 0) + value;

    // Prepare updates
    const accountRef = ref(db, `simulation_accounts/${uid}`);
    const updates: Record<string, any> = {};
    updates[`statistics/${target}`] = currentTotal;

    for (const def of eventAchievements) {
        if (alreadyUnlocked.has(def.id)) continue;

        // Check Condition against NEW Total
        if (currentTotal >= Number(def.condition.value)) {
            newUnlocks.push(def.id);

            // Add unlock to updates
            updates[`unlockedAchievements/${def.id}`] = Date.now();

            // Add XP
            const currentXp = (account.globalXp || 0) + def.xp;
            // NOTE: We don't have atomic increment here easily without transaction, 
            // but for now we trust the client state + delta since we are the single source of truth for this client.
            updates['globalXp'] = currentXp; // We might overwrite parallel updates, but acceptable for MVP

            showNotification(def.id);
        }
    }

    // Commit all updates (Stats + Unlocks)
    try {
        await update(accountRef, updates);
        if (newUnlocks.length > 0) console.log(`Unlocked via Event: ${newUnlocks.join(', ')}`);
    } catch (e) {
        console.error("Failed to commit event updates:", e);
    }
}

/**
 * Core Evaluator for Passive Conditions
 */
function evaluateCondition(def: AchievementDef, player: SimulationPlayer, account: SimulationAccount): boolean {
    const { type, target, value, comparison } = def.condition;
    const numericValue = Number(value);

    // Safety checks
    const pResources = player.resources || {};
    const pStats = player.stats || {};

    let actualValue: any = 0;

    try {
        switch (type) {
            case 'RESOURCE':
                actualValue = pResources[target as keyof typeof pResources] || 0;
                break;
            case 'STAT':
                actualValue = pStats[target as keyof typeof pStats] || 0;
                break;
            case 'ROLE':
                actualValue = player.role;
                return actualValue === value; // Role is strict equality
            case 'ACCOUNT_STAT':
                actualValue = account[target as keyof SimulationAccount] || 0;
                break;
            default:
                return false;
        }

        // Numeric Comparison
        if (typeof actualValue === 'number') {
            if (comparison === 'EQ') return actualValue === numericValue;
            return actualValue >= numericValue; // Default GTE
        }
    } catch (e) {
        console.warn(`Achievement Eval Failed for ${def.id}`, e);
        return false;
    }

    return false;
}

/**
 * Commits unlocks to Firebase atomically + updates Global XP
 */
async function commitUnlocks(
    uid: string,
    account: SimulationAccount,
    newUnlocks: string[],
    showNotification: (id: string) => void
) {
    const accountRef = ref(db, `simulation_accounts/${uid}`);
    const updates: Record<string, any> = {};

    let currentTempXp = account.globalXp || 0;

    for (const id of newUnlocks) {
        const def = getAchievement(id);
        if (!def) continue;

        updates[`unlockedAchievements/${id}`] = Date.now();
        currentTempXp += def.xp;
        showNotification(id);
    }

    updates['globalXp'] = currentTempXp;
    updates['globalLevel'] = Math.floor(Math.sqrt(currentTempXp / 100)) + 1;

    try {
        await update(accountRef, updates);
        console.log(`Unlocked items for ${uid}: ${newUnlocks.join(', ')}`);
    } catch (e) {
        console.error("Failed to unlock achievements:", e);
    }
}
