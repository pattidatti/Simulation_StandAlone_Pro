import type { Role, PlayerUpgrade } from '../simulationTypes';

export const UPGRADES_LIST: Record<Role, PlayerUpgrade[]> = {
    PEASANT: [
        { id: 'iron_plow', name: 'Jernplog', description: 'Øker kornhøst med +5.', cost: { gold: 50, wood: 10 }, benefit: 'YIELD_GRAIN' },
        { id: 'fence', name: 'Solid Gjerde', description: 'Beskytter mot småtyveri.', cost: { wood: 50 }, benefit: 'DEFENSE_REGION' },
        { id: 'cow', name: 'Melkeku', description: 'Gir passivt 2 gull per minutt (simulert via actions).', cost: { gold: 80 }, benefit: 'PASSIVE_GOLD' },
        { id: 'roof', name: 'Tett Tak', description: 'Bedre hvile. Mer utholdenhet.', cost: { wood: 20, gold: 10 }, benefit: 'STAMINA_REGEN' }
    ],
    BARON: [
        { id: 'stone_keep', name: 'Steintårn', description: 'Gjør raiding av deg mye vanskeligere.', cost: { gold: 200, wood: 100 }, benefit: 'FORTRESS' },
        { id: 'armory', name: 'Våpenkammer', description: 'Dobbelt så effektiv rekruttering.', cost: { gold: 150 }, benefit: 'DRAFT_BONUS' },
        { id: 'stables', name: 'Staller', description: 'Raskere raids.', cost: { gold: 100, wood: 50 }, benefit: 'RAID_SPEED' }
    ],
    KING: [
        { id: 'cathedral', name: 'Katedral', description: 'Øker din legitimitet og skattevilje.', cost: { gold: 500, stone: 200 } as any, benefit: 'ROYAL_AUTHORITY' },
        { id: 'royal_guard', name: 'Kongelig Garde', description: 'Uovervinnelig defensiv styrke.', cost: { gold: 400, iron: 100 }, benefit: 'ELITE_DEFENSE' }
    ],
    SOLDIER: [
        { id: 'knight_armor', name: 'Ridderrustning', description: 'Du tar mindre skade og ser tøffere ut.', cost: { gold: 100, swords: 5 }, benefit: 'ARMOR' },
        { id: 'warhorse', name: 'Stridshest', description: 'Gjør deg til en Ridder. 2x XP fra kamp.', cost: { gold: 200, grain: 100 }, benefit: 'KNIGHT' }
    ],
    MERCHANT: [
        { id: 'trade_license', name: 'Handelsbrev', description: 'Bedre salgspriser på markedet.', cost: { gold: 150 }, benefit: 'MARKET_BONUS' },
        { id: 'accounting_books', name: 'Regnskapsbøker', description: 'Gir passivt 5 gull per minutt.', cost: { gold: 200, wood: 20 }, benefit: 'PASSIVE_GOLD_HIGH' },
        { id: 'caravan', name: 'Karavane', description: 'Tjen penger på handel med utlandet.', cost: { gold: 300, wood: 50 }, benefit: 'CARAVAN' }
    ]
};
