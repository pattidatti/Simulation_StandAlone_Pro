import type { ActionCost, ActionType, EquipmentSlot, ResourceType } from '../simulationTypes';

export const GAME_BALANCE = {
    MARKET: {
        SELL_RATIO: 0.8,
        PRICE_IMPACT_BUY: 0.005,
        PRICE_IMPACT_SELL: 0.005,
        MIN_PRICE_MULTIPLIER: 0.2,
        MAX_PRICE_MULTIPLIER: 5.0,
        VISCOSITY: 100
    },
    CONTRIBUTION_VALUES: {
        gold: 1,
        wood: 0.5,
        stone: 1,
        iron_ore: 1,
        iron_ingot: 5,
        plank: 2,
        grain: 0.1,
        flour: 0.5,
        bread: 1,
        meat: 1,
        honey: 1,
        cloth: 1,
        wool: 0.5,
        oak_log: 0.5,
        oak_lumber: 2,
        flax: 0.2,
        linen_canvas: 3,
        tar: 2,
        fish_raw: 0.5,
        silk: 5,
        spice: 10,
        default: 0.1
    } as Record<string, number>,
    CAREERS: {
        SOLDIER: { COST: 200, LEVEL_REQ: 3 },
        MERCHANT: { COST: 500, LEVEL_REQ: 3 }
    },
    TAX: {
        PEASANT_RATE_DEFAULT: 0.15,
        PEASANT_RATE_CUT: 0.07,
        ROYAL_RATE: 0.20,
        LOYALTY_PENALTY_PEASANT: 10,
        LOYALTY_PENALTY_BARON: 5
    },
    GATHERING: {
        NO_TOOL_PENALTY: 0.75,
    },
    YIELD: {
        WORK_GRAIN: 10,
        CHOP_WOOD: 6,
        MINE_ORE: 5,
        QUARRY_STONE: 8,
        FORAGE_BREAD: 1,
        PLOW_BONUS: 4,
        SUMMER_WOOD_BONUS: 2
    },
    DURABILITY: {
        MAX: 100,
        LOSS_WORK: 5,
        LOSS_COMBAT_WEAPON: 10,
        LOSS_COMBAT_ARMOR: 15,
        REPAIR_AMOUNT: 30
    },
    MINIGAME: {
        BASE_MULTIPLIER: 0.5,
        PERFORMANCE_WEIGHT: 1.0,
        CRAFTING_WEIGHT: 1.5,
        THRESHOLD_GREAT: 0.8
    },
    RELIGION: {
        PRAY_MIN: 1,
        PRAY_MAX: 5,
        XP_PRAY: 2
    },
    COMBAT: {
        RAID_LOOT_FACTOR: 0.4,
        DEFEND_GOLD_BASE: 20,
        XP_WIN: 20,
        XP_LOSS: 0
    },
    LUCKY_DROP: {
        CHANCE: 0.05,
        MULTIPLIER: 2.0
    },
    PASSIVE_INCOME: {
        COW: 2,
        ACCOUNTING_BOOKS: 5,
        CARAVAN: 10
    },
    SKILLS: {
        GATHERING_BONUS: 0.1,
        REFINING_BONUS: 0.1,
        CRAFTING_XP: 25,
        REFINING_XP: 10
    },
    COUP: {
        BASE_BRIBE_COST: 500,        // Base cost for +10% progress
        HONEYMOON_DURATION: 600000,  // 10 minutes (ms)
        VACANCY_DURATION: 300000,    // 5 minutes (ms)
        RESTORE_ORDER_COST: 600,     // Baron's cost to reduce progress
        LEGITIMACY_SHIELD_MULT: 2.0, // Double cost if Baron has 100 legitimacy
        KING_VOTE_WEIGHT: 15,
        PEASANT_VOTE_WEIGHT: 1
    },
    CARAVAN: {
        LEVELS: [
            { level: 1, name: 'Håndkjære', capacity: 5, speed: 1.0, cost: 0, durability: 100 },
            { level: 2, name: 'Enkel vogn', capacity: 15, speed: 1.2, cost: 300, durability: 150 },
            { level: 3, name: 'Overbygd kjerre', capacity: 40, speed: 1.5, cost: 800, durability: 200 },
            { level: 4, name: 'Jernkledd konvoi', capacity: 100, speed: 1.8, cost: 2000, durability: 300 },
            { level: 5, name: 'Storkjøpmannens vogn', capacity: 250, speed: 2.2, cost: 5000, durability: 500 }
        ],
        UPGRADES: {
            SILK_CHESTS: { id: 'silk_chests', name: 'Silkeforede kister', cost: 150, benefit: 'Beskytter luksusvarer' },
            HEAVY_AXLES: { id: 'heavy_axles', name: 'Forsterkede akslinger', cost: 250, benefit: '+10% fart med full last' },
            GUARD_POST: { id: 'guard_post', name: 'Vaktpost', cost: 400, benefit: 'Reduserer bandittfare' }
        }
    }
};

export const REWARDS = {
    WORK: { grain: 10, xp: 5 },
    CHOP: { wood: 5, xp: 5 },
    FORAGE: { bread: 1, xp: 2 },
};

export const LEVEL_XP = [0, 100, 300, 700, 1500, 3000, 6000];

export const SEASONS = {
    Spring: { label: 'Vår', yieldMod: 1.0, staminaMod: 1.0, color: '#4ade80' },
    Summer: { label: 'Sommer', yieldMod: 1.2, staminaMod: 1.0, color: '#fbbf24' },
    Autumn: { label: 'Høst', yieldMod: 1.5, staminaMod: 1.0, color: '#f97316' },
    Winter: { label: 'Vinter', yieldMod: 0.2, staminaMod: 1.5, color: '#38bdf8' }
};

export const WEATHER = {
    Clear: { label: 'Klart Vær', desc: 'Ideelle forhold for alt arbeid.', mod: 1.0, icon: '☀️', speedMod: 1.0, staminaMod: 1.0 },
    Rain: { label: 'Regn', desc: 'Glatte forhold. Minispill går litt fortere.', mod: 0.9, icon: '🌧️', speedMod: 1.2, staminaMod: 1.0 },
    Storm: { label: 'Storm', desc: 'Farlig vær. Høy stamina-kostnad og lavt utbytte!', mod: 0.5, icon: '⛈️', speedMod: 1.5, staminaMod: 2.0 },
    Fog: { label: 'Tåke', desc: 'Dårlig sikt. Vanskeligere å treffe blinker.', mod: 0.8, icon: '🌫️', speedMod: 0.8, staminaMod: 1.0 }
};

export const ACTION_COSTS: Record<ActionType, ActionCost> = {
    WORK: { bread: 1, stamina: 10 },
    CHOP: { bread: 1, stamina: 15 },
    FORAGE: { stamina: 40 },
    MINE: { bread: 1, stamina: 25 },
    RAID: { bread: 3, stamina: 40 },
    TAX: { stamina: 20 },
    TAX_PEASANTS: { stamina: 25 },
    TAX_ROYAL: { stamina: 30 },
    MILL: { grain: 10 },        // Stamina removed (handled in handler)
    SMELT: { iron_ore: 5, wood: 2 },
    SAWMILL: { wood: 5 },
    BAKERY: { flour: 5 },
    REFINE: {},                 // Cost handled in handleRefine
    CRAFT: {},                  // Cost handled in handleCraft
    QUARRY: { bread: 1, stamina: 20 },
    REPAIR: { stamina: 15 },
    HUNT: { stamina: 30 },
    GATHER_WOOL: { stamina: 15 },
    GATHER_HONEY: { stamina: 20 },
    PRAY: { stamina: 15 },
    FEAST: { bread: 30, gold: 100, stamina: 10 },
    CONTRIBUTE: { stamina: 10 },
    CONSTRUCT: { stamina: 20 },
    SLEEP: { stamina: 0 },
    EAT: { bread: 1, stamina: 0 },
    PLANT: { grain: 5, stamina: 25 },
    HARVEST: { stamina: 15 },
    BAKE: {},                  // Cost handled in handler
    WEAVE: {},
    MIX: {},
    DEFEND: { stamina: 30 },
    EXPLORE: { stamina: 25 },
    PATROL: { stamina: 10 },
    MAINTAIN_CROP: { stamina: 5 },
    MOUNT_HORSE: { stamina: 5 },
    BUY_HORSE_COSMETIC: { stamina: 0 },
    SELECT_HORSE_COSMETIC: { stamina: 0 },
    LOAD_CARAVAN: { stamina: 5 },
    UNLOAD_CARAVAN: { stamina: 5 },
    UPGRADE_CARAVAN: { stamina: 0 },
    TRAVEL_START: { stamina: 20, bread: 1 }
};

export const REPAIR_CONFIG: Record<string, { material: ResourceType, goldCost: number, staminaCost: number, slots: EquipmentSlot[] }> = {
    great_forge: {
        material: 'iron_ingot',
        goldCost: 20,
        staminaCost: 15,
        slots: ['MAIN_HAND', 'OFF_HAND', 'HEAD', 'BODY', 'FEET', 'AXE', 'PICKAXE', 'SCYTHE', 'HAMMER', 'BOW', 'TRAP', 'CHISEL']
    },
    weavery: {
        material: 'cloth',
        goldCost: 10,
        staminaCost: 10,
        slots: ['BODY', 'FEET', 'HEAD']
    },
    sawmill: {
        material: 'plank',
        goldCost: 5,
        staminaCost: 10,
        slots: ['OFF_HAND', 'MAIN_HAND']
    }
};

export const ACTION_ICONS: Record<string, string> = {
    GOLD: '🪙',
    GRAIN: '🌾',
    WOOD: '🪵',
    IRON_ORE: '🪨',
    STONE: '🪨',
    PLANK: '🪵',
    IRON_INGOT: '🧱',
    BREAD: '🍞',
    SWORDS: '⚔️',
    ARMOR: '🛡️',
    CLOTH: '🧵',
    WOOL: '🧶',
    MEAT: '🥩',
    HONEY: '🍯',
    GLASS: '🥃',
    FLOUR: '🥡',
    EGG: '🥚',
    OMELETTE: '🍳',
    MANPOWER: '💪',
    FAVOR: '🙏',
    OAK_LOG: '🪵',
    OAK_LUMBER: '🪵',
    FLAX: '🌿',
    LINEN_CANVAS: '📜',
    TAR: '⚱️',
    FISH_RAW: '🐟',
    SILK: '🧶',
    SPICE: '🧂'
};
