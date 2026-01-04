import type { Role, Resources } from '../simulationTypes';

export const RESOURCE_DETAILS: Record<string, { label: string, icon: string }> = {
    gold: { label: 'Gull', icon: '💰' },
    grain: { label: 'Korn', icon: '🌾' },
    flour: { label: 'Mel', icon: '🧂' },
    bread: { label: 'Brød', icon: '🍞' },
    wood: { label: 'Ved', icon: '🪵' },
    plank: { label: 'Planker', icon: '🪵' },
    iron_ore: { label: 'Jernmalm', icon: '🪨' },
    iron_ingot: { label: 'Jernbarre', icon: '🧱' },
    stone: { label: 'Stein', icon: '🏔️' },
    swords: { label: 'Beleiringsvåpen', icon: '⚔️' },
    armor: { label: 'Beleiringsrustning', icon: '🛡️' },
    favor: { label: 'Gunst', icon: '✨' },
    honey: { label: 'Honning', icon: '🍯' },
    meat: { label: 'Kjøtt', icon: '🍗' },
    wool: { label: 'Ull', icon: '🧶' },
    cloth: { label: 'Stoff', icon: '📜' },
    glass: { label: 'Glass', icon: '🥛' },
    egg: { label: 'Egg', icon: '🥚' },
    omelette: { label: 'Omelett', icon: '🍳' }
};

export const INITIAL_RESOURCES: Record<Role, Resources> = {
    KING: { gold: 1000, grain: 500, flour: 200, bread: 50, wood: 200, plank: 50, iron_ore: 0, iron_ingot: 20, stone: 100, swords: 50, armor: 20, favor: 0, wool: 50, cloth: 20, honey: 0, meat: 0, glass: 0, manpower: 0, egg: 0, omelette: 0 },
    BARON: { gold: 300, grain: 100, flour: 50, bread: 20, wood: 50, plank: 20, iron_ore: 0, iron_ingot: 10, stone: 20, swords: 10, armor: 10, favor: 0, wool: 20, cloth: 5, honey: 0, meat: 0, glass: 0, manpower: 0, egg: 0, omelette: 0 },
    PEASANT: { gold: 20, grain: 30, flour: 5, bread: 10, wood: 0, plank: 0, iron_ore: 0, iron_ingot: 0, stone: 0, swords: 0, armor: 0, favor: 0, wool: 10, cloth: 0, honey: 0, meat: 0, glass: 0, manpower: 0, egg: 0, omelette: 0 },
    SOLDIER: { gold: 50, grain: 10, flour: 10, bread: 10, wood: 0, plank: 0, iron_ore: 0, iron_ingot: 0, stone: 0, swords: 5, armor: 2, favor: 0, wool: 0, cloth: 0, honey: 0, meat: 0, glass: 0, manpower: 0, egg: 0, omelette: 0 },
    MERCHANT: { gold: 500, grain: 50, flour: 50, bread: 20, wood: 50, plank: 20, iron_ore: 0, iron_ingot: 5, stone: 50, swords: 5, armor: 2, favor: 0, wool: 20, cloth: 10, honey: 0, meat: 0, glass: 0, manpower: 0, egg: 0, omelette: 0 }
};
