import type { ActionContext } from '../../actionTypes';

export const handleThroneAction = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const regionId = action.payload?.targetRegionId || actor.regionId;
    const siege = room.regions[regionId].activeSiege;

    if (!siege || siege.phase !== 'THRONE_ROOM' || !siege.throneState) return false;
    const throne = siege.throneState;

    // TICK LOGIC (Called periodically)
    if (action.subType === 'TICK') {
        const now = Date.now();
        const delta = (now - throne.lastTick) / 1000;
        throne.lastTick = now;

        Object.values(throne.occupiers).forEach(occ => {
            // Legitimacy Drain Logic
            // If you have high legitimacy, you drain armor slower.
            // Base drain: 5 armor/sec. Legitimacy reduces this.
            const legitModifier = (occ.legitimacySnapshot || 0) / 100; // 0.0 - 1.0
            const drainRate = 5 * (1 - (legitModifier * 0.5)); // Max 50% reduction

            occ.armor -= (drainRate * delta);
            occ.progress += (2 * delta); // 2% per second

            // Ejection
            if (occ.armor <= 0) {
                delete throne.occupiers[occ.id];
                // Notify? Hard to notify async without event bus, but UI will reflect it.
            }

            // Victory
            if (occ.progress >= 100) {
                // Game Over - Handle Victory elsewhere or trigger event
                // For now, clear siege
                delete room.regions[regionId].activeSiege;
                localResult.message = `${occ.name} HAR TATT TRONEN! LEVE KONGEN!`;
                // Logic to actually set role/region owner should be here
            }
        });
        return true;
    }

    // CLAIM ACTION
    if (action.subType === 'CLAIM_THRONE') {
        const armor = actor.resources.siege_armor || 0;
        if (armor < 10) {
            localResult.success = false;
            localResult.message = "Du trenger minst 10 rustning for å entre tronen.";
            return false;
        }

        // Spend all armor to enter
        actor.resources.siege_armor = 0;

        throne.occupiers[actor.id] = {
            id: actor.id,
            name: actor.name,
            armor: armor,
            progress: 0,
            joinedAt: Date.now(),
            legitimacySnapshot: actor.status.legitimacy || 0
        };

        localResult.message = `Kastet seg på tronen med ${armor} rustning!`;
        return true;
    }

    return false;
};
