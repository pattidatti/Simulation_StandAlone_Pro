import { ref, get, update } from 'firebase/database';
import { simulationDb as db } from '../../simulationFirebase';
import { INITIAL_RESOURCES } from '../../constants';
import { ACTION_REGISTRY } from '../actionRegistry';
import { logSystemicStat } from '../../utils/statsUtils';
import type { SkillType } from '../../simulationTypes';

export async function performSiegeTransaction(pin: string, playerId: string, action: any) {
    const actionType = typeof action === 'string' ? action : action.type;
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);
    const regionsRef = ref(db, `simulation_rooms/${pin}/regions`);
    const worldRef = ref(db, `simulation_rooms/${pin}/world`);

    try {
        const [playerSnap, regionsSnap, worldSnap] = await Promise.all([
            get(playerRef),
            get(regionsRef),
            get(worldRef)
        ]);

        if (!playerSnap.exists()) return { success: false, error: "Spiller finnes ikke" };

        const actor = playerSnap.val();
        if (!actor.resources) actor.resources = INITIAL_RESOURCES[actor.role as keyof typeof INITIAL_RESOURCES] || INITIAL_RESOURCES.PEASANT;

        const regions = regionsSnap.val() || {};
        const world = worldSnap.val() || {};

        const localResult = {
            success: true,
            timestamp: Date.now(),
            message: "",
            utbytte: [] as any[],
            xp: [] as any[],
            durability: [] as any[]
        };

        const mockRoom = {
            world,
            regions,
            players: { [playerId]: actor },
            markets: {},
            messages: []
        };

        const ctx = {
            actor,
            room: mockRoom as any,
            pin,
            action,
            timestamp: new Date().toLocaleTimeString(),
            localResult,
            trackXp: (_skill: SkillType, _amount: number) => { },
            damageTool: () => true
        };

        const handler = ACTION_REGISTRY[actionType];
        if (!handler) return { success: false, error: "Ukjent handling" };

        const success = handler(ctx);

        if (!success || !localResult.success) {
            return { success: false, data: localResult };
        }

        const updates: any = {};
        updates[`players/${playerId}`] = actor;

        const winnerId = (localResult as any).siegeWinnerId;
        const targetRegionId = (localResult as any).targetRegionId;

        if (winnerId && targetRegionId) {
            const region = regions[targetRegionId];
            const oldRulerId = region.rulerId;

            if (oldRulerId && oldRulerId !== winnerId) {
                const oldRulerSnap = await get(ref(db, `simulation_rooms/${pin}/players/${oldRulerId}`));
                if (oldRulerSnap.exists()) {
                    const oldRuler = oldRulerSnap.val();
                    oldRuler.role = 'PEASANT';
                    if (oldRuler.status) oldRuler.status.legitimacy = 0;
                    updates[`players/${oldRulerId}`] = oldRuler;
                    updates[`public_profiles/${oldRulerId}/role`] = 'PEASANT';
                    logSystemicStat(pin, 'roleChanges', 'PEASANT (Demoted)', 1);
                }
            }

            const winnerSnap = await get(ref(db, `simulation_rooms/${pin}/players/${winnerId}`));
            if (winnerSnap.exists()) {
                const winner = winnerSnap.val();
                winner.role = 'BARON';
                winner.regionId = targetRegionId;
                if (winner.status) winner.status.legitimacy = 100;
                updates[`players/${winnerId}`] = winner;
                updates[`public_profiles/${winnerId}/role`] = 'BARON';
                updates[`public_profiles/${winnerId}/regionId`] = targetRegionId;

                region.rulerId = winnerId;
                region.rulerName = winner.name;
            }
        }

        updates[`regions`] = regions;
        await update(ref(db, `simulation_rooms/${pin}`), updates);

        return { success: true, data: localResult };

    } catch (e: any) {
        console.error("Siege Transaction Failed", e);
        return { success: false, error: e.message || "Beleiring feilet" };
    }
}
