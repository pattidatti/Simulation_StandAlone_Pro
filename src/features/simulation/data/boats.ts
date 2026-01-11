import type { Resources } from '../simulationTypes';

export const BOAT_MODELS = {
    standard: {
        id: 'standard',
        name: 'Snekke',
        description: 'En enkel, men pålitelig båt for kystfiske og korte turer.',
        baseSpeed: 5,
        baseHp: 100,
        cargoSlots: 2,
        maxCannons: 0,
        cost: { plank: 50, tar: 20 } as Partial<Resources>
    },
    sloop: {
        id: 'sloop',
        name: 'Slupp',
        description: 'En rask seilbåt som balanserer fart og lastekapasitet. Perfekt for handel.',
        baseSpeed: 10,
        baseHp: 250,
        cargoSlots: 4,
        maxCannons: 2,
        cost: { plank: 200, iron_ingot: 50, linen_canvas: 40, tar: 50 } as Partial<Resources>
    },
    cog: {
        id: 'cog',
        name: 'Kogg',
        description: 'Et tungt handelsskip med bredt skrog. Tåler mye juling.',
        baseSpeed: 6,
        baseHp: 600,
        cargoSlots: 8,
        maxCannons: 4,
        cost: { plank: 500, iron_ingot: 100, linen_canvas: 80, tar: 100 } as Partial<Resources>
    },
    galleon: {
        id: 'galleon',
        name: 'Gallion',
        description: 'Havets ubestridte hersker. En flytende festning.',
        baseSpeed: 8,
        baseHp: 1500,
        cargoSlots: 12,
        maxCannons: 12,
        cost: { plank: 1000, iron_ingot: 300, linen_canvas: 150, gold: 5000, silk: 50 } as Partial<Resources>
    }
} as const;

export const BOAT_UPGRADES = {
    sails: {
        id: 'sails',
        name: 'Seilduk',
        description: 'Forbedret seilduk fanger vinden bedre og øker farten.',
        levels: [
            { level: 1, cost: { linen_canvas: 10 }, effect: '+10% Fart' },
            { level: 2, cost: { linen_canvas: 25, silk: 5 }, effect: '+20% Fart' },
            { level: 3, cost: { linen_canvas: 50, silk: 20 }, effect: '+35% Fart' }
        ]
    },
    hull: {
        id: 'hull',
        name: 'Skrogforsterkning',
        description: 'Ekstra lag med eik og jernbeslag gir båten mer helse.',
        levels: [
            { level: 1, cost: { plank: 20, tar: 5 }, effect: '+50 HP' },
            { level: 2, cost: { plank: 50, iron_ingot: 10 }, effect: '+150 HP' },
            { level: 3, cost: { plank: 100, iron_ingot: 30 }, effect: '+350 HP' }
        ]
    },
    cannons: {
        id: 'cannons',
        name: 'Kanonbatteri',
        description: 'Bedre kanoner øker skaden og rekkevidden.',
        levels: [
            { level: 1, cost: { iron_ingot: 20, plank: 10 }, effect: '+20 Skade' },
            { level: 2, cost: { iron_ingot: 50, plank: 25 }, effect: '+50 Skade' },
            { level: 3, cost: { iron_ingot: 100, gold: 500 }, effect: '+100 Skade' }
        ]
    },
    nets: {
        id: 'nets',
        name: 'Fiskenot',
        description: 'Større og sterkere garn øker fangsten per kast.',
        levels: [
            { level: 1, cost: { linen_canvas: 15 }, effect: '+20% Fangst' },
            { level: 2, cost: { linen_canvas: 40 }, effect: '+50% Fangst' },
            { level: 3, cost: { linen_canvas: 80, silk: 5 }, effect: '+100% Fangst' }
        ]
    }
} as const;

export const COSMETIC_UNLOCKS = {
    colors: [
        { id: 'classic_brown', name: 'Valnøtt', hex: '#4b2c20', cost: {} },
        { id: 'royal_red', name: 'Kongelig Rød', hex: '#7f1d1d', cost: { gold: 100 } },
        { id: 'deep_blue', name: 'Havdyp Blå', hex: '#1e3a8a', cost: { gold: 250 } },
        { id: 'midnight_black', name: 'Svartedauden', hex: '#0f172a', cost: { gold: 500 } },
        { id: 'gold_leaf', name: 'Bladgull', hex: '#fbbf24', cost: { gold: 2000 } }
    ],
    flags: [
        { id: 'none', name: 'Ingen', cost: {} },
        { id: 'pirate', name: 'Sjørøver', cost: { gold: 150 } },
        { id: 'merchant', name: 'Handelslaug', cost: { gold: 300 } },
        { id: 'royal', name: 'Kongens Vakt', cost: { gold: 1000 } }
    ]
} as const;
