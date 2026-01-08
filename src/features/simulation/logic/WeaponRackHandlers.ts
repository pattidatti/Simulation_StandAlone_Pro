import { ref, runTransaction } from 'firebase/database';
import { simulationDb as db } from '../simulationFirebase';
import { logSimulationMessage } from '../utils/simulationUtils';
import { ITEM_TEMPLATES } from '../constants';
import type { SimulationPlayer, Resources } from '../simulationTypes';



const RACK_LEVELS = [
    { level: 0, label: 'Gammelt Trestativ', slots: 2, cost: { wood: 50 } },
    { level: 1, label: 'Forsterket Jernstativ', slots: 4, cost: { wood: 100, ore: 50 } },
    { level: 2, label: 'Forgylt Kongestativ', slots: 6, cost: { wood: 200, ore: 100, gold: 500 } }
];

export const handleWeaponRackAction = async (pin: string, playerId: string, action: any) => {
    const playerRef = ref(db, `simulation_rooms/${pin}/players/${playerId}`);
    const { type, slotId, itemId, instanceId, trophyId, price } = action;

    let success = false;
    let message = "";

    await runTransaction(playerRef, (player: SimulationPlayer) => {
        if (!player) return;
        if (!player.weaponRack) {
            player.weaponRack = { level: 0, slots: [], unlockedTrophies: [] };
        }

        const rack = player.weaponRack;
        if (!rack.slots) rack.slots = [];
        if (!rack.unlockedTrophies) rack.unlockedTrophies = [];

        const currentLevelDef = RACK_LEVELS.find(l => l.level === rack.level) || RACK_LEVELS[0];
        const maxSlots = currentLevelDef.slots;

        // --- UPGRADE ---
        if (type === 'RACK_UPGRADE') {
            const nextLevel = RACK_LEVELS.find(l => l.level === rack.level + 1);
            if (!nextLevel) return; // Max level

            // Cost Check
            const cost = nextLevel.cost as Partial<Record<keyof Resources, number>>;
            const canAfford = Object.entries(cost).every(([res, amount]) => (player.resources[res as keyof Resources] || 0) >= (amount as number));
            if (!canAfford) return;

            // Deduct
            Object.entries(cost).forEach(([res, amount]) => {
                const rKey = res as keyof Resources;
                player.resources[rKey] = (player.resources[rKey] || 0) - (amount as number);
            });

            rack.level += 1;
            message = `Oppgraderte våpenstativet til ${nextLevel.label}!`;
            success = true;
        }

        // --- MOUNT ITEM (Evaluation: Item moves Inv -> Rack) ---
        if (type === 'RACK_MOUNT_ITEM') {
            if (rack.slots.length >= maxSlots) return; // Full

            // Find item in inventory
            // Note: instanceId is preferred if we had real instances, but for now we look by template ID
            // or if the `instanceId` matches reference.
            // In globalActions.ts we use simple objects. Let's assume passed `item` object reference for now? 
            // No, strictly we should match logic.

            // Assuming itemId is the template ID (e.g. 'iron_sword')
            const invIndex = (player.inventory || []).findIndex(i => i.id === itemId || i.id === instanceId);

            if (invIndex === -1) return; // Item not found

            const itemToMount = player.inventory![invIndex];

            // Remove from Inv
            player.inventory!.splice(invIndex, 1);

            // Add to Rack
            rack.slots.push({
                id: `slot_${Date.now()}`,
                type: 'ITEM',
                itemId: itemToMount.id, // e.g. 'iron_sword'
                instanceId: itemToMount.id // In a real DB this would be a GUID
            });

            message = `Hengte opp ${itemToMount.name}`;
            success = true;
        }

        // --- MOUNT TROPHY ---
        if (type === 'RACK_MOUNT_TROPHY') {
            if (rack.slots.length >= maxSlots) return;
            if (!rack.unlockedTrophies.includes(trophyId)) return; // Don't own it

            // Check if already mounted?
            if (rack.slots.some(s => s.itemId === trophyId)) return;

            rack.slots.push({
                id: `slot_${Date.now()}`,
                type: 'TROPHY',
                itemId: trophyId
            });

            message = "Plasserte trofé på utstilling.";
            success = true;
        }

        // --- UNMOUNT ---
        if (type === 'RACK_UNMOUNT') {
            const slotIndex = rack.slots.findIndex(s => s.id === slotId);
            if (slotIndex === -1) return;

            const slot = rack.slots[slotIndex];

            // If Item -> Return to Inventory
            if (slot.type === 'ITEM') {
                const template = ITEM_TEMPLATES[slot.itemId]; // Should exist
                if (template) {
                    // Re-create item (stateless for now, losing durability if we aren't careful)
                    // Ideally we stored the exact item blob.
                    // For MVP, we regenerate fresh or generic based on template 
                    // OR we should have stored the blob in the slot.
                    // Let's rely on template for MVP.
                    const restoredItem = JSON.parse(JSON.stringify(template));
                    // Quick fix: If we want to persist stats, slot should have 'data' field.
                    // Leaving as fresh for now.
                    if (!player.inventory) player.inventory = [];
                    player.inventory.push(restoredItem);
                }
            }

            // If Trophy -> Just remove from slot (remains in unlockedTrophies)

            rack.slots.splice(slotIndex, 1);
            message = "Tok ned gjenstand.";
            success = true;
        }

        // --- BUY TROPHY ---
        if (type === 'RACK_BUY_TROPHY') {
            if (player.resources.gold < price) return;
            if (rack.unlockedTrophies.includes(trophyId)) return;

            player.resources.gold -= price;
            rack.unlockedTrophies.push(trophyId);
            message = "Kjøpte nytt trofé!";
            success = true;
        }

        // --- POLISH ---
        if (type === 'RACK_POLISH') {
            // Simple cooldown check?
            const now = Date.now();
            const lastPolished = rack.lastPolishedAt || 0;
            if (now - lastPolished < 60000 * 60) {
                message = "Du må vente før du kan pusse utstyret igjen.";
                // Not setting success=true means it will fail silently or display error depending on caller.
                // Let's rely on message being empty = silent fail in current transaction logic?
                // No, runTransaction logic returns 'player' object.
                // We want to abort the transaction update if failed logic.
                return;
            }

            rack.lastPolishedAt = now;

            // Give Buf
            if (!player.status.morale) player.status.morale = 50;
            player.status.morale = Math.min(100, player.status.morale + 10);

            message = "Pusset samlingen. Moralen øker!";
            success = true;
        }

        return player;
    });

    if (success && message) {
        logSimulationMessage(pin, message);
    }

    return { success };
};
