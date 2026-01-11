import type { Role, Resources } from '../simulationTypes';

export const RESOURCE_DETAILS: Record<string, { label: string, icon: string, isCommodity?: boolean }> = {
    gold: { label: 'Gull', icon: '💰' },
    grain: { label: 'Korn', icon: '🌾', isCommodity: true },
    flour: { label: 'Mel', icon: '🧂', isCommodity: true },
    bread: { label: 'Brød', icon: '🍞' },
    wood: { label: 'Ved', icon: '🪵', isCommodity: true },
    plank: { label: 'Planker', icon: '🪵', isCommodity: true },
    iron_ore: { label: 'Jernmalm', icon: '🪨', isCommodity: true },
    iron_ingot: { label: 'Jernbarre', icon: '🧱', isCommodity: true },
    stone: { label: 'Stein', icon: '🏔️', isCommodity: true },
    siege_sword: { label: 'Beleiringsvåpen', icon: '⚔️' },
    siege_armor: { label: 'Beleiringsrustning', icon: '🛡️' },
    favor: { label: 'Gunst', icon: '✨' },
    honey: { label: 'Honning', icon: '🍯', isCommodity: true },
    meat: { label: 'Kjøtt', icon: '🍗', isCommodity: true },
    wool: { label: 'Ull', icon: '🧶', isCommodity: true },
    cloth: { label: 'Stoff', icon: '📜', isCommodity: true },
    glass: { label: 'Glass', icon: '🥛', isCommodity: true },
    egg: { label: 'Egg', icon: '🥚', isCommodity: true },
    omelette: { label: 'Omelett', icon: '🍳' },
    minor_stamina_potion: { label: 'Liten Stamina-brygg', icon: '🧪' },
    herbal_balm: { label: 'Urtebalsam', icon: '🌿' },
    focus_brew: { label: 'Fokus-brygg', icon: '🧪' },
    strength_tincture: { label: 'Styrke-tinktur', icon: '🍶' },
    masters_draught: { label: 'Mester-drikk', icon: '🧪' },
    elixir_of_life: { label: 'Livseliksir', icon: '🏺' },
    // Maritime Resources
    oak_log: { label: 'Eiketømmer', icon: '🪵', isCommodity: true },
    oak_lumber: { label: 'Eikeplekker', icon: '🪵', isCommodity: true },
    flax: { label: 'Lin', icon: '🌿', isCommodity: true },
    linen_canvas: { label: 'Seilduk', icon: '📜', isCommodity: true },
    tar: { label: 'Tjære', icon: '⚱️', isCommodity: true },
    fish_raw: { label: 'Rå fisk', icon: '🐟', isCommodity: true },
    fish_cooked: { label: 'Stekt fisk', icon: '🍳' },
    silk: { label: 'Silke', icon: '🧵', isCommodity: true },
    spice: { label: 'Krydder', icon: '🌶️', isCommodity: true },
    cannonball: { label: 'Kanonkuler', icon: '💣', isCommodity: true }
};

export const INITIAL_RESOURCES: Record<Role, Resources> = {
    KING: {
        gold: 1000, grain: 500, flour: 200, bread: 50, wood: 200, plank: 50, iron_ore: 0, iron_ingot: 20, stone: 100,
        siege_sword: 50, siege_armor: 20, favor: 0, wool: 50, cloth: 20, honey: 0, meat: 0, glass: 0, manpower: 0,
        egg: 0, omelette: 0, oak_log: 0, oak_lumber: 0, flax: 0, linen_canvas: 0, tar: 0, fish_raw: 0, fish_cooked: 0,
        silk: 0, spice: 0, cannonball: 20
    },
    BARON: {
        gold: 300, grain: 100, flour: 50, bread: 20, wood: 50, plank: 20, iron_ore: 0, iron_ingot: 10, stone: 20,
        siege_sword: 10, siege_armor: 10, favor: 0, wool: 20, cloth: 5, honey: 0, meat: 0, glass: 0, manpower: 0,
        egg: 0, omelette: 0, oak_log: 0, oak_lumber: 0, flax: 0, linen_canvas: 0, tar: 0, fish_raw: 0, fish_cooked: 0,
        silk: 0, spice: 0, cannonball: 10
    },
    PEASANT: {
        gold: 20, grain: 30, flour: 5, bread: 10, wood: 0, plank: 0, iron_ore: 0, iron_ingot: 0, stone: 0,
        siege_sword: 0, siege_armor: 0, favor: 0, wool: 10, cloth: 0, honey: 0, meat: 0, glass: 0, manpower: 0,
        egg: 0, omelette: 0, oak_log: 0, oak_lumber: 0, flax: 0, linen_canvas: 0, tar: 0, fish_raw: 0, fish_cooked: 0,
        silk: 0, spice: 0, cannonball: 0
    },
    SOLDIER: {
        gold: 50, grain: 10, flour: 10, bread: 10, wood: 0, plank: 0, iron_ore: 0, iron_ingot: 0, stone: 0,
        siege_sword: 5, siege_armor: 2, favor: 0, wool: 0, cloth: 0, honey: 0, meat: 0, glass: 0, manpower: 0,
        egg: 0, omelette: 0, oak_log: 0, oak_lumber: 0, flax: 0, linen_canvas: 0, tar: 0, fish_raw: 0, fish_cooked: 0,
        silk: 0, spice: 0, cannonball: 10
    },
    MERCHANT: {
        gold: 500, grain: 50, flour: 50, bread: 20, wood: 50, plank: 20, iron_ore: 0, iron_ingot: 5, stone: 50,
        siege_sword: 5, siege_armor: 2, favor: 0, wool: 20, cloth: 10, honey: 0, meat: 0, glass: 0, manpower: 0,
        egg: 0, omelette: 0, oak_log: 0, oak_lumber: 0, flax: 0, linen_canvas: 0, tar: 0, fish_raw: 0, fish_cooked: 0,
        silk: 0, spice: 0, cannonball: 5
    }
};
