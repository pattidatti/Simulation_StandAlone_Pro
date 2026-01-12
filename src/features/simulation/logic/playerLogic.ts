import { ref, update, get } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import { INITIAL_SKILLS, LEVEL_XP } from '../constants';
import type { SkillType, SimulationPlayer } from '../simulationTypes';

export const addXp = (actor: SimulationPlayer, skillType: SkillType, amount: number, messages: string[]) => {
    if (!actor.roleStats) actor.roleStats = {};
    const currRole = actor.role;

    if (!actor.roleStats[currRole]) {
        actor.roleStats[currRole] = {
            level: actor.stats?.level || 1,
            xp: actor.stats?.xp || 0,
            skills: JSON.parse(JSON.stringify(actor.skills || INITIAL_SKILLS[currRole as keyof typeof INITIAL_SKILLS] || INITIAL_SKILLS.PEASANT))
        };
    }

    const roleStats = actor.roleStats[currRole]!;
    const skill = roleStats.skills[skillType];
    if (skill) {
        skill.xp += (amount || 0);
        if (skill.xp >= skill.maxXp) {
            skill.level += 1;
            skill.xp -= skill.maxXp;
            skill.maxXp = Math.floor(skill.maxXp * 1.5);
            messages.push(`⭐ ${actor.name} ble bedre i ${skillType}! (Nivå ${skill.level})`);
        }
    }

    roleStats.xp = (roleStats.xp || 0) + (amount || 0);

    const getLevel = (xp: number) => {
        const index = LEVEL_XP.findIndex(req => xp < req);
        return index === -1 ? LEVEL_XP.length : index;
    };

    const newLevel = getLevel(roleStats.xp);
    if (newLevel > roleStats.level) {
        roleStats.level = newLevel;
        messages.push(`🏰 ${actor.name} har steget i rang som ${currRole} til Nivå ${newLevel}!`);
    }

    actor.stats.xp = roleStats.xp;
    actor.stats.level = roleStats.level;
    actor.skills = roleStats.skills;
};

export async function recordCharacterLife(uid: string, roomPin: string, player: SimulationPlayer) {
    if (!uid || !player) return;

    // Defensiv delay: Unngå parallelle skrive-kollisjoner hvis kalt i batch
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));

    const accountRef = ref(db, `simulation_accounts/${uid}`);
    try {
        const snapshot = await get(accountRef);
        if (!snapshot.exists()) return;

        const accountData = snapshot.val();
        const history = accountData.characterHistory || [];

        const newEntry = {
            name: player.name,
            role: player.role,
            level: player.stats?.level || 1,
            xp: player.stats?.xp || 0,
            roomPin: roomPin,
            timestamp: Date.now()
        };

        const updatedHistory = [...history, newEntry];
        const addedXp = player.stats?.xp || 0;
        const newGlobalXp = (accountData.globalXp || 0) + addedXp;
        const newGlobalLevel = Math.floor(Math.sqrt(newGlobalXp / 100)) + 1;

        // Atomic Update: Push to history, Update Globals, Remove from Active Sessions
        // We use a multi-path update to ensure atomicity
        const updates: Record<string, any> = {};

        // 1. Update History
        updates['characterHistory'] = updatedHistory;

        // 2. Update Globals
        updates['globalXp'] = newGlobalXp;
        updates['globalLevel'] = newGlobalLevel;
        updates['lastActive'] = Date.now();

        // 3. Remove from Active Sessions (Set to null)
        updates[`activeSessions/${roomPin}`] = null;

        await update(accountRef, updates);

        console.log(`Character life recorded for ${player.name} (${uid})`);
    } catch (e) {
        console.error("Failed to record character life:", e);
    }
}
