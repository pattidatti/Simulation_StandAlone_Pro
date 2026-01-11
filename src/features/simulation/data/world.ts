import type { SimulationMarket } from '../simulationTypes';

export const INITIAL_MARKET: SimulationMarket = {
    grain: { price: 0.5, stock: 800, basePrice: 0.5, baseStock: 800, demand: 1.0 },
    flour: { price: 1.75, stock: 300, basePrice: 1.75, baseStock: 300, demand: 1.0 },
    bread: { price: 1.2, stock: 300, basePrice: 1.2, baseStock: 300, demand: 1.0 },
    wood: { price: 1.25, stock: 800, basePrice: 1.25, baseStock: 800, demand: 1.0 },
    plank: { price: 11.25, stock: 300, basePrice: 11.25, baseStock: 300, demand: 1.0 },
    iron_ore: { price: 2.5, stock: 800, basePrice: 2.5, baseStock: 800, demand: 1.0 },
    iron_ingot: { price: 25.0, stock: 300, basePrice: 25.0, baseStock: 300, demand: 1.0 },
    stone: { price: 1.25, stock: 800, basePrice: 1.25, baseStock: 800, demand: 1.0 },
    wool: { price: 0.5, stock: 800, basePrice: 0.5, baseStock: 800, demand: 1.0 },
    cloth: { price: 10.0, stock: 300, basePrice: 10.0, baseStock: 300, demand: 1.0 },
    honey: { price: 1.0, stock: 300, basePrice: 1.0, baseStock: 300, demand: 1.0 },
    meat: { price: 1.5, stock: 300, basePrice: 1.5, baseStock: 300, demand: 1.0 },
    siege_sword: { price: 40.0, stock: 100, basePrice: 40.0, baseStock: 100, demand: 1.0 },
    siege_armor: { price: 40.0, stock: 100, basePrice: 40.0, baseStock: 100, demand: 1.0 },
    // Maritime Items (Start with 0 stock)
    flax: { price: 10.0, stock: 0, basePrice: 1.0, baseStock: 800, demand: 1.0 }, // Price = Base * 10 (Max Volatility)
    linen_canvas: { price: 125.0, stock: 0, basePrice: 12.5, baseStock: 300, demand: 1.0 },
    tar: { price: 162.5, stock: 0, basePrice: 16.25, baseStock: 300, demand: 1.0 },
    fish_raw: { price: 20.0, stock: 0, basePrice: 2.0, baseStock: 800, demand: 1.0 },
    silk: { price: 500.0, stock: 0, basePrice: 50.0, baseStock: 50, demand: 1.0 },
    spice: { price: 750.0, stock: 0, basePrice: 75.0, baseStock: 50, demand: 1.0 },
};

export const EVENTS = {
    TAX_COLLECTION: 'TAX_COLLECTION',
    MARKET_UPDATE: 'MARKET_UPDATE',
    WAR_DECLARED: 'WAR_DECLARED',
};

export const WORLD_EVENT_TEMPLATES = [
    { type: 'RAID', title: 'Vikinger på horisonten!', description: 'Et vikingskip er sett nær kysten. Forsvar jordene før de stjeler kornet!', locationId: 'fields' },
    { type: 'RAID', title: 'Bandittleir funnet', description: 'Banditter har slått seg ned i skogen. De stjeler ved hver time!', locationId: 'forest' },
    { type: 'QUEST', title: 'Den Hellige Gral?', description: 'Rykter sier en eremitt ved klosteret har funnet noe verdifullt.', locationId: 'village' },
    { type: 'QUEST', title: 'Markedsdag i nabolaget', description: 'En sjelden mulighet for god handel på grensen.', locationId: 'marketplace' }
];

export const LAW_TEMPLATES = [
    { id: 'tax_cut', label: 'Skattekutt', description: 'Alle skatter halveres i 10 minutter. Lojaliteten stiger.' },
    { id: 'peace', label: 'Fredsavtale', description: 'Ingen raids tillatt de neste 10 minuttene.' },
    { id: 'salt_tax', label: 'Saltskatt', description: 'Øker kornprisene, men reduserer lojalitet.' },
    { id: 'conscription', label: 'Verneplikt', description: 'Soldater koster mindre å verve, men bønder jobber 20% tregere.' }
];
