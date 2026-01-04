import type { ActionContext } from '../actionTypes';
import type { EquipmentSlot } from '../../simulationTypes';

export const handleEquipItem = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { itemId, slot } = action;

    // Normalize inventory to array if it's currently an object from Firebase
    if (actor.inventory && !Array.isArray(actor.inventory)) {
        actor.inventory = Object.values(actor.inventory);
    }
    if (!actor.inventory) actor.inventory = [];

    const invIndex = actor.inventory.findIndex((i: any) => i.id === itemId);

    if (invIndex !== -1) {
        const itemToEquip = actor.inventory[invIndex];
        const currentEquipped = actor.equipment[slot as EquipmentSlot];

        // Remove from inventory
        actor.inventory.splice(invIndex, 1);

        // Equip
        actor.equipment[slot as EquipmentSlot] = itemToEquip;

        // Put old back in inventory
        if (currentEquipped) {
            actor.inventory.push(currentEquipped);
        }

        localResult.message = `Utstyrte ${itemToEquip.name}`;
    }
    return true;
};

export const handleUnequipItem = (ctx: ActionContext) => {
    const { actor, action, localResult } = ctx;
    const { slot } = action;
    const item = actor.equipment[slot as EquipmentSlot];
    if (item) {
        actor.equipment[slot as EquipmentSlot] = null as any;

        // Normalize inventory
        if (actor.inventory && !Array.isArray(actor.inventory)) {
            actor.inventory = Object.values(actor.inventory);
        }
        if (!actor.inventory) actor.inventory = [];

        actor.inventory.push(item);
        localResult.message = `Tok av ${item.name}`;
    }
    return true;
};
