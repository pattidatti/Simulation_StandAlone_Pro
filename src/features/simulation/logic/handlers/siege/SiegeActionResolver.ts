import type { ActionContext } from '../../actionTypes';
import { handleBreachAction, handleStartSiege, handleJoinSiege } from './SiegeBreachHandler';
import { handleCourtyardAction } from './SiegeCourtyardHandler';
import { handleThroneAction } from './SiegeThroneHandler';

export const handleSiegeRouter = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;

    if (!regionId) {
        localResult.success = false;
        localResult.message = "Fant ikke region-ID for beleiringshandling.";
        return false;
    }

    // Special Case: START_SIEGE (No active siege yet)
    if (action.type === 'START_SIEGE') {
        return handleStartSiege(ctx);
    }

    const region = room.regions[regionId];
    if (!region?.activeSiege) {
        localResult.success = false;
        localResult.message = "Ingen aktiv beleiring i denne regionen.";
        return false;
    }

    const siege = region.activeSiege;

    // Special Case: JOIN (Can join at any time, usually)
    if (action.type === 'JOIN_SIEGE') {
        return handleJoinSiege(ctx);
    }

    // Phase Routing
    switch (siege.phase) {
        case 'BREACH':
            return handleBreachAction(ctx);
        case 'COURTYARD':
            return handleCourtyardAction(ctx);
        case 'THRONE_ROOM':
            return handleThroneAction(ctx);
        default:
            console.error(`Unknown Siege Phase: ${(siege as any).phase}`);
            return false;
    }
};
