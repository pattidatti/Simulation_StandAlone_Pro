import type { SimulationPlayer, SimulationRoom, SkillType, EquipmentSlot } from '../simulationTypes';

/**
 * Context provided to every action handler.
 * Contains references to the current state and helpers to track results.
 */
export interface ActionContext {
    actor: SimulationPlayer;
    room: SimulationRoom;
    pin: string;
    action: any;
    timestamp: string;
    // Trackers for the response overlay
    localResult: {
        success: boolean;
        timestamp: number;
        message: string;
        utbytte: any[];
        xp: any[];
        durability: any[];
    };
    // Helper function to add XP and track it for the UI
    trackXp: (skill: SkillType, amount: number) => void;
    // Helper function to damage tools and track it for the UI
    damageTool: (slot: EquipmentSlot, amount: number) => boolean;
}

/**
 * Type definition for an action handler function.
 */
export type ActionHandler = (ctx: ActionContext) => void | boolean;

/**
 * Interface for the global Action Registry.
 */
export type ActionRegistry = Record<string, ActionHandler>;
