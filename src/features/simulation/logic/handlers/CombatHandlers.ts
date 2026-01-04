import { GAME_BALANCE } from '../../constants';
import type { ActionContext } from '../actionTypes';

export const handleRaid = (ctx: ActionContext) => {
    const { actor, room, localResult, trackXp, damageTool } = ctx;
    if (actor.role !== 'BARON') {
        localResult.success = false;
        return false;
    }

    const targetBaron = Object.values(room.players).find((p: any) => p.role === 'BARON' && p.id !== actor.id) as any;
    if (targetBaron) {
        const activeLaws = room.world?.activeLaws || [];
        if (activeLaws.includes('peace')) {
            localResult.success = false;
            localResult.message = "Fredsavtale blokkerer raid!";
            return false;
        }

        const myPower = actor.resources.manpower || 0;
        let targetPower = targetBaron.resources.manpower || 0;
        let roll = Math.random() * 0.5 + 0.75; // 0.75 - 1.25 varians

        if (targetBaron.upgrades?.includes('stone_keep')) targetPower += 30;
        if (targetBaron.upgrades?.includes('fence')) targetPower += 10;
        if (actor.upgrades?.includes('stables')) roll += 0.1;

        if (actor.equipment?.MAIN_HAND) damageTool('MAIN_HAND', GAME_BALANCE.DURABILITY.LOSS_COMBAT_WEAPON || 5);
        if (actor.equipment?.BODY) damageTool('BODY', GAME_BALANCE.DURABILITY.LOSS_COMBAT_ARMOR || 5);

        if (myPower * roll > targetPower) {
            const lootGold = Math.floor((targetBaron.resources.gold || 0) * GAME_BALANCE.COMBAT.RAID_LOOT_FACTOR);
            const lootGrain = Math.floor((targetBaron.resources.grain || 0) * GAME_BALANCE.COMBAT.RAID_LOOT_FACTOR);

            targetBaron.resources.gold = Math.max(0, (targetBaron.resources.gold || 0) - lootGold);
            targetBaron.resources.grain = Math.max(0, (targetBaron.resources.grain || 0) - lootGrain);

            actor.resources.gold = (actor.resources.gold || 0) + lootGold;
            actor.resources.grain = (actor.resources.grain || 0) + lootGrain;

            actor.resources.manpower = Math.max(0, actor.resources.manpower - 5);
            targetBaron.resources.manpower = Math.max(0, targetBaron.resources.manpower - 8);

            localResult.utbytte.push({ resource: 'gold', amount: lootGold });
            localResult.utbytte.push({ resource: 'grain', amount: lootGrain });
            localResult.message = `Plyndret ${targetBaron.name} for ${lootGold}g og ${lootGrain} korn!`;
            trackXp('COMBAT', 50);
        } else {
            actor.resources.manpower = Math.max(0, actor.resources.manpower - 10);
            localResult.success = false;
            localResult.message = `Angrepet på ${targetBaron.name} ble slått tilbake.`;
            trackXp('COMBAT', 10);
            return false;
        }
    } else {
        localResult.success = false;
        localResult.message = "Fant ingen annen baron å raide.";
        return false;
    }
    return true;
};

export const handlePatrol = (ctx: ActionContext) => {
    const { actor, action, localResult, trackXp } = ctx;
    const performance = action.performance || 0.5;
    const goldReward = Math.ceil(15 * performance);
    actor.resources.gold = (actor.resources.gold || 0) + goldReward;

    trackXp('COMBAT', 10);
    localResult.utbytte.push({ resource: 'gold', amount: goldReward });
    localResult.message = "Utførte patrulje.";
    return true;
};
