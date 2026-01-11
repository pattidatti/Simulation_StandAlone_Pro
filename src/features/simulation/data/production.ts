import type { Resources } from '../simulationTypes';

export const CROP_DATA: Record<string, { label: string, seed: string, yieldResource: string, duration: number, minYield: number, maxYield: number, xp: number }> = {
    grain: {
        label: 'Kornåker',
        seed: 'grain',
        yieldResource: 'grain',
        duration: 3 * 60 * 1000,
        minYield: 12,
        maxYield: 20,
        xp: 20
    },
    flax: {
        label: 'Lin-åker',
        seed: 'flax',
        yieldResource: 'flax',
        duration: 5 * 60 * 1000, // Longer growth time
        minYield: 8,
        maxYield: 15,
        xp: 35
    }
};

export const VILLAGE_BUILDINGS: Record<string, { id: string, name: string, icon: string, locationId: string, description: string, levels: Record<number, { requirements: Partial<Resources>, unlocks: string[], bonus: string }> }> = {
    farm_house: {
        id: 'farm_house',
        name: 'Gårdshuset',
        icon: '🏠',
        locationId: 'peasant_farm',
        description: 'Ditt personlige hjem. Oppgraderinger gir bedre hvile og mer matlagingsplass.',
        levels: {
            1: { requirements: {}, unlocks: ['SLEEP', 'EAT'], bonus: 'Base hvile' },
            2: { requirements: { wood: 65, gold: 130 }, unlocks: ['FARM_UPGRADE'], bonus: '+20% Stamina fra peisen' },
            3: { requirements: { plank: 26, stone: 65, gold: 390 }, unlocks: ['FARM_UPGRADE_MASTER'], bonus: '+30% Stamina fra senga' },
            4: { requirements: { plank: 65, stone: 130, gold: 780 }, unlocks: ['FARM_UPGRADE_ELITE'], bonus: '+50% Stamina fra hvile' },
            5: { requirements: { plank: 130, stone: 260, gold: 1300, iron_ingot: 26 }, unlocks: ['FARM_UPGRADE_GODLY'], bonus: 'Restaurerer all Stamina ved hvile' }
        }
    },
    sawmill: {
        id: 'sawmill',
        name: 'Sagbruk',
        icon: '🪚',
        locationId: 'village',
        description: 'Gjør det mulig å foredle Ved til Tømmer.',
        levels: {
            1: { requirements: {}, unlocks: ['REFINE_PLANK_BASIC', 'hunting_bow'], bonus: 'Base produksjon' },
            2: { requirements: { wood: 130, stone: 65, gold: 130 }, unlocks: ['REFINE_PLANK_FAST'], bonus: '+10% Woodcutting XP' },
            3: { requirements: { plank: 65, stone: 195, gold: 390 }, unlocks: ['REFINE_PLANK_MASTER', 'longbow'], bonus: 'Låser opp Tier 3 verktøy og Langbue' }
        }
    },
    windmill: {
        id: 'windmill',
        name: 'Vindmølle',
        icon: '🌬️',
        locationId: 'village',
        description: 'Gjør det mulig å foredle Korn til Mel mer effektivt.',
        levels: {
            1: { requirements: {}, unlocks: ['REFINE_FLOUR_BASIC'], bonus: 'Base produksjon' },
            2: { requirements: { plank: 39, stone: 65, gold: 195 }, unlocks: ['REFINE_FLOUR_FAST'], bonus: '+10% Farming XP' },
            3: { requirements: { plank: 130, stone: 260, gold: 650 }, unlocks: ['REFINE_FLOUR_AUTO'], bonus: 'Sjanse for dobbel avling' }
        }
    },
    smeltery: {
        id: 'smeltery',
        name: 'Smeltehytte',
        icon: '🔥',
        locationId: 'village',
        description: 'Gjør det mulig å smelte Jernmalm til Jernbarrer.',
        levels: {
            1: { requirements: {}, unlocks: ['REFINE_IRON_BASIC'], bonus: 'Base produksjon' },
            2: { requirements: { stone: 195, wood: 130, gold: 260 }, unlocks: ['REFINE_IRON_FAST'], bonus: '+10% Mining XP' },
            3: { requirements: { stone: 390, plank: 65, gold: 780 }, unlocks: ['REFINE_STEEL', 'glass'], bonus: 'Låser opp Stål og Glass' }
        }
    },
    great_forge: {
        id: 'great_forge',
        name: 'Storsmie',
        icon: '⚒️',
        locationId: 'village',
        description: 'Gjør det mulig å lage avanserte verktøy og våpen.',
        levels: {
            1: { requirements: {}, unlocks: ['stone_axe', 'stone_pickaxe', 'stone_sickle', 'whetstone', 'hunting_trap'], bonus: 'Base produksjon' },
            2: { requirements: { iron_ingot: 26, plank: 39, gold: 390 }, unlocks: ['iron_axe', 'iron_pickaxe', 'iron_sword', 'leather_armor', 'shears', 'siege_swords', 'siege_armor'], bonus: '+10% Crafting XP' },
            3: { requirements: { iron_ingot: 130, plank: 130, gold: 1300 }, unlocks: ['steel_axe', 'steel_sword', 'blacksmith_hammer', 'repair_advanced'], bonus: 'Låser opp Mester-utstyr' }
        }
    },
    bakery: {
        id: 'bakery',
        name: 'Bakeri',
        icon: '🍞',
        locationId: 'village',
        description: 'Gjør det mulig å bake Brød fra Mel.',
        levels: {
            1: { requirements: {}, unlocks: ['CRAFT_BREAD', 'CRAFT_omelette'], bonus: 'Base produksjon' },
            2: { requirements: { stone: 65, plank: 26, gold: 130 }, unlocks: ['CRAFT_PIE'], bonus: 'Bedre stamina fra mat' },
            3: { requirements: { stone: 195, plank: 65, gold: 520 }, unlocks: ['CRAFT_FEAST'], bonus: 'Låser opp Gildemåltid' }
        }
    },
    tavern: {
        id: 'tavern',
        name: 'Vertshuset',
        icon: '🍺',
        locationId: 'village',
        description: 'Et sted for hvile og rykter. Øker stamina-regenerering.',
        levels: {
            1: { requirements: {}, unlocks: ['ENTER_TAVERN', 'REST_BASIC', 'BUY_MEAL', 'OPEN_DICE_GAME', 'OPEN_RESOURCE_GAME', 'CHAT_LOCAL'], bonus: 'Standard hvile' },
            2: { requirements: { wood: 130, stone: 65, gold: 325 }, unlocks: ['REST_COMFY'], bonus: 'Dobbel stamina-regen' },
            3: { requirements: { plank: 65, stone: 195, gold: 975 }, unlocks: ['REST_ROYAL'], bonus: 'Gjenoppretter all stamina raskt' }
        }
    },
    weavery: {
        id: 'weavery',
        name: 'Veveri',
        icon: '🧶',
        locationId: 'village',
        description: 'Foredler Ull til Stoff for videre salg eller klær.',
        levels: {
            1: { requirements: {}, unlocks: ['REFINE_CLOTH_BASIC'], bonus: 'Base produksjon' },
            2: { requirements: { plank: 52, stone: 39, gold: 195 }, unlocks: ['REFINE_CLOTH_FAST'], bonus: '+10% Trading XP' },
            3: { requirements: { plank: 130, stone: 130, gold: 520 }, unlocks: ['REFINE_CLOTH_MASTER'], bonus: 'Låser opp Silke-produksjon' }
        }
    },
    well: {
        id: 'well',
        name: 'Bybrønn',
        icon: '💧',
        locationId: 'village',
        description: 'Gir tilgang til ferskvann for baking og hygiene.',
        levels: {
            1: { requirements: {}, unlocks: ['GATHER_WATER'], bonus: 'Basiskilde' },
            2: { requirements: { stone: 65, gold: 65 }, unlocks: ['GATHER_WATER_FAST'], bonus: 'Bedre vanntilgang' },
            3: { requirements: { stone: 195, gold: 260 }, unlocks: ['GATHER_WATER_MASTER'], bonus: 'Hellig kilde: +5 Stamina ved drikking' }
        }
    },
    apothecary: {
        id: 'apothecary',
        name: 'Apoteker',
        icon: '🌿',
        locationId: 'village',
        description: 'Fremstiller medisin og salver.',
        levels: {
            1: { requirements: {}, unlocks: ['REFINE_minor_stamina_potion', 'REFINE_herbal_balm'], bonus: 'Basis urter' },
            2: { requirements: { wood: 130, stone: 65, gold: 325 }, unlocks: ['REFINE_focus_brew', 'REFINE_strength_tincture'], bonus: 'Gift og Tinkturer' },
            3: { requirements: { plank: 130, glass: 65, gold: 1300 }, unlocks: ['REFINE_masters_draught', 'REFINE_elixir_of_life'], bonus: 'Mesterverk & Eliksirer' }
        }
    },
    watchtower: {
        id: 'watchtower',
        name: 'Vaktårn',
        icon: '🏰',
        locationId: 'village',
        description: 'Bedre oversikt og forsvar av landsbyen.',
        levels: {
            1: { requirements: {}, unlocks: ['PATROL'], bonus: '+5 Forsvar' },
            2: { requirements: { stone: 130, plank: 65, gold: 260 }, unlocks: ['SCOUT'], bonus: '+15 Forsvar' },
            3: { requirements: { stone: 390, plank: 130, gold: 1040 }, unlocks: ['VOLLEY'], bonus: 'Bueskytter-støtte i kamp' }
        }
    },
    stables: {
        id: 'stables',
        name: 'Stall',
        icon: '🐴',
        locationId: 'village',
        description: 'Muliggjør raskere reise og kavaleri.',
        levels: {
            1: { requirements: {}, unlocks: ['MOUNT_HORSE'], bonus: 'Transport' },
            2: { requirements: { plank: 65, wood: 65, gold: 195 }, unlocks: ['BREED_WARHORSE'], bonus: 'Stridshester' },
            3: { requirements: { plank: 195, iron_ingot: 26, gold: 520 }, unlocks: ['KNIGHT_TRAINING'], bonus: 'Riddere' }
        }
    },
    manor_ost: {
        id: 'manor_ost',
        name: 'Slott Øst',
        icon: '🏰',
        locationId: 'castle',
        description: 'Setet til den østlige herre. Krever enorme ressurser å bygge.',
        levels: {
            1: { requirements: { stone: 500, plank: 300, iron_ingot: 50, gold: 1000 }, unlocks: ['BARON_STATUS'], bonus: 'Krav på regionen' }
        }
    },
    manor_vest: {
        id: 'manor_vest',
        name: 'Slott Vest',
        icon: '🏰',
        locationId: 'castle',
        description: 'Setet til den vestlige herre. Krever enorme ressurser å bygge.',
        levels: {
            1: { requirements: { stone: 500, plank: 300, iron_ingot: 50, gold: 1000 }, unlocks: ['BARON_STATUS'], bonus: 'Krav på regionen' }
        }
    },
    throne_room: {
        id: 'throne_room',
        name: 'Slottet',
        icon: '👑',
        locationId: 'castle',
        description: 'Kongens stol. Den første Baronen som fullfører denne blir Konge.',
        levels: {
            1: { requirements: { stone: 2000, plank: 1000, iron_ingot: 200, gold: 5000 }, unlocks: ['KING_STATUS'], bonus: 'Krav på riket' }
        }
    },
    wharf: {
        id: 'wharf',
        name: 'Havnekaia',
        icon: '⚓',
        locationId: 'dock_hub',
        description: 'Sentrum for maritim handel. Oppgraderinger låser opp flere maritime ressurser og bedre båter.',
        levels: {
            1: { requirements: {}, unlocks: ['OPEN_SHIPYARD', 'START_SAILING'], bonus: 'Grunnleggende sjøfart' },
            2: { requirements: { plank: 100, tar: 50, gold: 5000 }, unlocks: ['OPEN_WHARF_UPGRADE_MASTER'], bonus: '+20% Fiske-utbytte' },
            3: { requirements: { plank: 250, linen_canvas: 100, iron_ingot: 100, gold: 15000 }, unlocks: ['OPEN_OCEAN_SAILING'], bonus: 'Låser opp Havseilas' }
        }
    }
};

export const REFINERY_RECIPES: Record<string, any> = {
    plank: { label: 'Planker', icon: '🪵', input: { wood: 5 }, outputResource: 'plank', outputAmount: 1, buildingId: 'sawmill', stamina: 10, xp: 5, skill: 'WOODCUTTING' },
    flour: { label: 'Fint Mel', icon: '🧂', input: { grain: 20 }, outputResource: 'flour', outputAmount: 10, buildingId: 'windmill', stamina: 15, xp: 8, skill: 'FARMING', duration: 120000 },
    iron_ingot: { label: 'Jernbarre', icon: '🧱', input: { iron_ore: 5, wood: 2 }, outputResource: 'iron_ingot', outputAmount: 1, buildingId: 'smeltery', stamina: 20, xp: 12, skill: 'CRAFTING' },
    bread: { label: 'Bondebrød', icon: '🍞', input: { flour: 2 }, outputResource: 'bread', outputAmount: 5, buildingId: 'bakery', stamina: 5, xp: 3, skill: 'CRAFTING' },
    pie: { label: 'Kjøttpai', icon: '🥧', input: { flour: 4, meat: 2 }, outputResource: 'bread', outputAmount: 15, buildingId: 'bakery', stamina: 15, xp: 10, skill: 'CRAFTING' },
    mead: { label: 'Mjød', icon: '🍺', input: { honey: 5 }, outputResource: 'stamina', outputAmount: 20, buildingId: 'tavern', stamina: 5, xp: 5, skill: 'CRAFTING' },
    cloth: { label: 'Lin-stoff', icon: '🧶', input: { wool: 5 }, outputResource: 'cloth', outputAmount: 1, buildingId: 'weavery', stamina: 15, xp: 10, skill: 'CRAFTING' },
    glass: { label: 'Glass', icon: '🥛', input: { stone: 10, wood: 5 }, outputResource: 'glass', outputAmount: 1, buildingId: 'smeltery', requiredLevel: 3, stamina: 25, xp: 15, skill: 'CRAFTING' },

    // Apothecary Recipes
    minor_stamina_potion: { label: 'Liten Stamina-brygg', icon: '🧪', input: { honey: 2, glass: 1 }, outputResource: 'minor_stamina_potion', outputAmount: 1, buildingId: 'apothecary', requiredLevel: 1, stamina: 20, xp: 15, skill: 'CRAFTING', duration: 30000 },
    herbal_balm: { label: 'Urtebalsam', icon: '🌿', input: { wood: 5, honey: 3 }, outputResource: 'herbal_balm', outputAmount: 1, buildingId: 'apothecary', requiredLevel: 1, stamina: 20, xp: 15, skill: 'CRAFTING', duration: 45000 },
    focus_brew: { label: 'Fokus-brygg', icon: '🧪', input: { honey: 5, glass: 1, grain: 10 }, outputResource: 'focus_brew', outputAmount: 1, buildingId: 'apothecary', requiredLevel: 2, stamina: 30, xp: 30, skill: 'CRAFTING', duration: 60000 },
    strength_tincture: { label: 'Styrke-tinktur', icon: '🍶', input: { iron_ore: 5, honey: 5, glass: 1 }, outputResource: 'strength_tincture', outputAmount: 1, buildingId: 'apothecary', requiredLevel: 2, stamina: 40, xp: 40, skill: 'CRAFTING', duration: 90000 },
    masters_draught: { label: 'Mester-drikk', icon: '🧪', input: { gold: 100, honey: 10, glass: 2 }, outputResource: 'masters_draught', outputAmount: 1, buildingId: 'apothecary', requiredLevel: 3, stamina: 60, xp: 100, skill: 'CRAFTING', duration: 180000 },
    elixir_of_life: { label: 'Livseliksir', icon: '🏺', input: { gold: 250, honey: 20, glass: 5 }, outputResource: 'elixir_of_life', outputAmount: 1, buildingId: 'apothecary', requiredLevel: 3, stamina: 100, xp: 250, skill: 'CRAFTING', duration: 300000 },

    // Maritime Refinery Recipes
    linen_canvas: { label: 'Seilduk', icon: '📜', input: { flax: 5 }, outputResource: 'linen_canvas', outputAmount: 1, buildingId: 'weavery', stamina: 15, xp: 20, skill: 'CRAFTING' },
    tar: { label: 'Tjære', icon: '⚱️', input: { wood: 5 }, outputResource: 'tar', outputAmount: 1, buildingId: 'smeltery', stamina: 20, xp: 10, skill: 'CRAFTING' },
    fish_cooked: { label: 'Stekt Fisk', icon: '🍳', input: { fish_raw: 1 }, outputResource: 'fish_cooked', outputAmount: 1, buildingId: 'bakery', stamina: 10, xp: 5, skill: 'CRAFTING' }
};

export const CRAFTING_RECIPES: Record<string, any> = {
    stone_axe: { label: 'Steinøks', icon: '🪓', input: { stone: 13, wood: 7, gold: 7 }, outputItemId: 'stone_axe', buildingId: 'great_forge', level: 1, stamina: 15, xp: 10, description: 'Et enkelt redskap for tømmerhogst.', skill: 'CRAFTING' },
    stone_pickaxe: { label: 'Steinhakke', icon: '⛏️', input: { stone: 13, wood: 7, gold: 7 }, outputItemId: 'stone_pickaxe', buildingId: 'great_forge', level: 1, stamina: 15, xp: 10, description: 'En primitiv hakke for gruvearbeid.', skill: 'CRAFTING' },
    stone_sickle: { label: 'Steinsigd', icon: '🌾', input: { stone: 7, wood: 7, gold: 13 }, outputItemId: 'stone_sickle', buildingId: 'great_forge', level: 1, stamina: 10, xp: 5, description: 'Enkel sigd for kornhøsting.', skill: 'CRAFTING' },
    whetstone: { label: 'Bryne', icon: '🪨', input: { stone: 20, gold: 26 }, outputItemId: 'whetstone', buildingId: 'great_forge', level: 1, stamina: 10, xp: 5, description: 'Brukt for å slipe verktøy og øke utbyttet.', skill: 'CRAFTING' },
    stone_chisel: { label: 'Steinmeisel', icon: '🔨', input: { stone: 13, gold: 13 }, outputItemId: 'stone_chisel', buildingId: 'great_forge', level: 1, stamina: 10, xp: 8, description: 'Nødvendig for å hugge stein i steinhuggeriet.', skill: 'CRAFTING' },
    iron_chisel: { label: 'Jernmeisel', icon: '🔨', input: { iron_ingot: 7, gold: 104 }, outputItemId: 'iron_chisel', buildingId: 'great_forge', level: 2, stamina: 20, xp: 15, description: 'Effektiv mesiel for steinhugging.', skill: 'CRAFTING' },
    iron_axe: { label: 'Jernøks', icon: '🪓', input: { iron_ingot: 7, plank: 3, gold: 65 }, outputItemId: 'iron_axe', buildingId: 'great_forge', level: 2, stamina: 25, xp: 20, description: 'Et solid verktøy av jern.', skill: 'CRAFTING' },
    iron_pickaxe: { label: 'Jernhakke', icon: '⛏️', input: { iron_ingot: 7, plank: 3, gold: 65 }, outputItemId: 'iron_pickaxe', buildingId: 'great_forge', level: 2, stamina: 25, xp: 20, description: 'Effektiv hakke for dypere graving.', skill: 'CRAFTING' },
    iron_sword: { label: 'Jernsverd', icon: '⚔️', input: { iron_ingot: 13, plank: 3, gold: 130 }, outputItemId: 'iron_sword', buildingId: 'great_forge', level: 2, stamina: 40, xp: 35, description: 'Et skarpt sverd for krigere.', skill: 'CRAFTING' },
    leather_armor: { label: 'Lærrustning', icon: '🧥', input: { cloth: 13, gold: 195 }, outputItemId: 'leather_armor', buildingId: 'great_forge', level: 2, stamina: 30, xp: 25, description: 'God beskyttelse for en reisende.', skill: 'CRAFTING' },
    shears: { label: 'Saks', icon: '✂️', input: { iron_ingot: 7, gold: 130 }, outputItemId: 'shears', buildingId: 'great_forge', level: 2, stamina: 20, xp: 15, description: 'Nødvendig for å klippe sauer og få ull.', skill: 'CRAFTING' },
    siege_swords: { label: 'Beleiringsvåpen (x10)', icon: '⚔️', input: { iron_ingot: 7, plank: 7, gold: 65 }, outputItemId: 'siege_sword', outputAmount: 10, buildingId: 'great_forge', level: 2, stamina: 40, xp: 30, description: 'En kasse med våpen til garnisonen.', skill: 'CRAFTING' },
    siege_armor: { label: 'Beleiringsrustning (x10)', icon: '🛡️', input: { iron_ingot: 7, cloth: 7, gold: 65 }, outputItemId: 'siege_armor', outputAmount: 10, buildingId: 'great_forge', level: 2, stamina: 40, xp: 30, description: 'En kasse med rustninger til garnisonen.', skill: 'CRAFTING' },
    steel_axe: { label: 'Ståløks', icon: '🪓', input: { iron_ingot: 26, plank: 13, gold: 325 }, outputItemId: 'steel_axe', buildingId: 'great_forge', level: 3, stamina: 50, xp: 50, description: 'Mesterlig utformet øks av herdet stål.', skill: 'CRAFTING' },
    steel_sword: { label: 'Stålsverd', icon: '⚔️', input: { iron_ingot: 39, plank: 7, gold: 650 }, outputItemId: 'steel_sword', buildingId: 'great_forge', level: 3, stamina: 80, xp: 100, description: 'Det ultimate våpenet for en herre.', skill: 'CRAFTING' },
    blacksmith_hammer: { label: 'Smedhammer', icon: '🔨', input: { iron_ingot: 20, plank: 7, gold: 260 }, outputItemId: 'blacksmith_hammer', buildingId: 'great_forge', level: 3, stamina: 40, xp: 50, description: 'Mesterverktøy for en ekte smed.', skill: 'CRAFTING' },
    omelette: { label: 'Omelett', icon: '🍳', input: { egg: 3 }, outputItemId: 'omelette', buildingId: 'bakery', level: 1, stamina: 10, xp: 8, description: 'En mettende frokost. Gir energi-buff.', skill: 'CRAFTING' },
    hunting_trap: { label: 'Jaktfelle', icon: '🕸️', input: { wood: 13, iron_ingot: 3, gold: 39 }, outputItemId: 'hunting_trap', buildingId: 'great_forge', level: 1, stamina: 20, xp: 15, description: 'En enkel snare for småvilt.', skill: 'CRAFTING' },
    hunting_bow: { label: 'Jaktbue', icon: '🏹', input: { plank: 7, cloth: 7, gold: 65 }, outputItemId: 'hunting_bow', buildingId: 'sawmill', level: 1, stamina: 25, xp: 20, description: 'En stødig bue for jakt.', skill: 'CRAFTING' },
    longbow: { label: 'Langbue', icon: '🏹', input: { plank: 20, cloth: 13, iron_ingot: 1, gold: 325 }, outputItemId: 'longbow', buildingId: 'sawmill', level: 3, stamina: 40, xp: 45, description: 'En kraftig bue med lang rekkevidde.', skill: 'CRAFTING' },
    cannonball: { label: 'Kanonkuler (x5)', icon: '💣', input: { stone: 5, iron_ingot: 1, gold: 10 }, outputItemId: 'cannonball', outputAmount: 5, buildingId: 'great_forge', level: 2, stamina: 30, xp: 25, description: 'Tunge kuler for skipsartilleri.', skill: 'CRAFTING' }
};
