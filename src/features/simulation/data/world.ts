import type { SimulationMarket } from '../simulationTypes';

export const INITIAL_MARKET: SimulationMarket = {
    grain: { price: 10, stock: 500, demand: 1.0 },
    flour: { price: 15, stock: 100, demand: 1.0 },
    bread: { price: 25, stock: 50, demand: 1.0 },
    wood: { price: 15, stock: 300, demand: 1.0 },
    plank: { price: 25, stock: 100, demand: 1.0 },
    iron_ore: { price: 30, stock: 100, demand: 1.0 },
    iron_ingot: { price: 60, stock: 50, demand: 1.0 },
    stone: { price: 20, stock: 200, demand: 1.0 },
    wool: { price: 12, stock: 200, demand: 1.0 },
    cloth: { price: 45, stock: 50, demand: 1.0 },
    honey: { price: 30, stock: 50, demand: 1.0 },
    meat: { price: 25, stock: 100, demand: 1.0 },
    siege_sword: { price: 40, stock: 20, demand: 1.0 },
    siege_armor: { price: 40, stock: 20, demand: 1.0 },
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
