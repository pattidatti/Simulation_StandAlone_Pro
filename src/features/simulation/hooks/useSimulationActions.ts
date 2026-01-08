import { useState, useCallback, useEffect } from 'react';
import { performAction } from '../actions';
import { checkActionRequirements } from '../utils/actionUtils';
import type { SimulationPlayer, SimulationRoom, ActionType } from '../simulationTypes';

export function useSimulationActions(
    pin: string | undefined,
    player: SimulationPlayer | null,
    world: SimulationRoom['world'] | null,
    setActiveMinigame: (m: ActionType | null) => void,
    setActiveMinigameMethod: (m: string | null) => void,
    setActiveMinigameAction: (a: any | null) => void,
    activeMinigame: ActionType | null
) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionResult, setActionResult] = useState<any | null>(null);

    // Self-Healing: Reset stuck loading state after 5 seconds
    useEffect(() => {
        if (actionLoading) {
            const timer = setTimeout(() => {
                console.warn("[useSimulationActions] Self-Healing: Resetting stuck loading state:", actionLoading);
                setActionLoading(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [actionLoading]);

    const handleClearActionResult = useCallback(() => {
        setActionResult(null);
    }, []);

    const handleAction = useCallback(async (action: any) => {
        if (!pin || !player || actionLoading) {
            return;
        }

        const actionType = typeof action === 'string' ? action : action.type;
        const actionMethod = typeof action === 'object' ? action.method : null;

        const minigameTypes: ActionType[] = [
            'WORK', 'CHOP', 'CRAFT', 'DEFEND', 'EXPLORE',
            'MINE', 'QUARRY', 'PATROL', 'FORAGE', 'REFINE',
            'SMELT', 'BAKE', 'WEAVE', 'MIX', 'PLANT', 'HARVEST',
            'GATHER_WOOL', 'HUNT', 'SAWMILL', 'MOUNT_HORSE'
        ];


        if (minigameTypes.includes(actionType as any) && !activeMinigame && (!action.performance)) {
            const currentSeason = (world?.season || 'Spring') as any;
            const currentWeather = (world?.weather || 'Clear') as any;
            const gameTick = world?.gameTick || 0;

            const check = checkActionRequirements(player, action as any, currentSeason, currentWeather, gameTick);
            if (!check.success) {
                alert(`Du har ikke råd til dette: ${check.reason}`);
                setActionResult({
                    success: false,
                    timestamp: Date.now(),
                    message: `Kan ikke utføre: ${check.reason}`,
                    utbytte: [],
                    xp: [],
                    durability: []
                });
                return;
            }

            let actualType = actionType;
            if (actionType === 'REFINE') {
                const rid = action.recipeId;
                if (rid === 'iron_ingot' || rid === 'glass' || rid === 'smelt') actualType = 'SMELT';
                if (rid === 'bread' || rid === 'pie' || rid === 'mead' || rid === 'bake') actualType = 'BAKE';
                if (rid === 'cloth' || rid === 'weave') actualType = 'WEAVE';
                if (rid === 'plank') actualType = 'SAWMILL';

                // IF recipe has duration, skip minigame
                // We don't have the recipe object easily here, but we can check rid === 'flour'
                if (rid === 'flour') {
                    // Skip minigame block
                }
            }

            if (actionType === 'CRAFT' && action.subType === 'omelette') {
                actualType = 'BAKE';
            }

            // If actualType is REFINE and it's flour, we don't want a minigame (it's not in MINIGAME_VARIANTS anymore anyway)
            // But minigameTypes includes 'REFINE'. 

            // Also skip minigame if harvesting a MILL or CRAFT (timed) process
            const activeProcesses = (player as any).activeProcesses || [];
            // Check for exact match or sub-location (e.g. 'windmill' matches 'windmill_stones')
            const readyProcess = activeProcesses.find((p: any) =>
                (p.locationId === action.locationId || (action.locationId && p.locationId?.startsWith(action.locationId))) &&
                p.readyAt <= Date.now()
            );

            // Skip minigame if RID is flour OR it's a harvest for a timed process (MILL/CRAFT)
            if ((actionType === 'REFINE' && action.recipeId === 'flour') || (actionType === 'HARVEST' && (readyProcess?.type === 'MILL' || readyProcess?.type === 'CRAFT'))) {
                // Return to fall through to performAction
            } else {
                setActiveMinigame(actualType as any);
                if (actionMethod) setActiveMinigameMethod(actionMethod);
                setActiveMinigameAction(action);
                setActionResult(null);
                return;
            }
        }

        const isSilentAction = actionType === 'EQUIP_ITEM' || actionType === 'UNEQUIP_ITEM' || actionType === 'CONSUME';

        if (action.performance && !isSilentAction) {
            setActiveMinigame(null);
            setActiveMinigameAction(null);
            setActiveMinigameMethod(null);
        }

        if (!isSilentAction) {
            setActionLoading(actionType);
        }

        const timeoutPromise = new Promise<{ success: boolean, error: any }>((_, reject) => {
            setTimeout(() => reject(new Error("Handlingen tok for lang tid (Timeout)")), 30000);
        });

        try {
            const result = await Promise.race([performAction(pin, player.id, action), timeoutPromise]) as any;

            if (!isSilentAction) {
                if (result.data) {
                    setActionResult(result.data);
                } else if (!result.success) {
                    setActionResult({
                        success: false,
                        timestamp: Date.now(),
                        message: `Handlingen feilet: ${(result as any).error?.message || (result as any).error || 'Ukjent feil'}`,
                        utbytte: [],
                        xp: [],
                        durability: []
                    });
                }
            }
        } catch (err: any) {
            console.error("Action Timeout/Error:", err);
            if (!isSilentAction) {
                setActionResult({
                    success: false,
                    timestamp: Date.now(),
                    message: `⚠️ ${err.message || 'Ukjent feil'}`,
                    utbytte: [],
                    xp: [],
                    durability: []
                });
            }
        } finally {
            if (!isSilentAction) {
                setActionLoading(null);
            }
            setActiveMinigame(null);
            setActiveMinigameAction(null);
            setActiveMinigameMethod(null);
        }

    }, [pin, player, actionLoading, world, activeMinigame, setActiveMinigame, setActiveMinigameMethod, setActiveMinigameAction]);

    return {
        actionLoading,
        actionResult,
        handleAction,
        handleClearActionResult,
        setActionLoading
    };
}
