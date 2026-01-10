export type Role = 'KING' | 'BARON' | 'PEASANT' | 'SOLDIER' | 'MERCHANT';

export type ActionType = 'WORK' | 'CHOP' | 'FORAGE' | 'MINE' | 'RAID' | 'TAX' | 'TAX_PEASANTS' | 'TAX_ROYAL' | 'MILL' | 'SMELT' | 'SAWMILL' | 'BAKERY' | 'REFINE' | 'CRAFT' | 'QUARRY' | 'REPAIR' | 'HUNT' | 'GATHER_WOOL' | 'GATHER_HONEY' | 'PRAY' | 'FEAST' | 'CONTRIBUTE' | 'CONSTRUCT' | 'SLEEP' | 'EAT' | 'PLANT' | 'HARVEST' | 'BAKE' | 'WEAVE' | 'MIX' | 'DEFEND' | 'EXPLORE' | 'PATROL' | 'MAINTAIN_CROP' | 'MOUNT_HORSE' | 'BUY_HORSE_COSMETIC' | 'SELECT_HORSE_COSMETIC' | 'LOAD_CARAVAN' | 'UNLOAD_CARAVAN' | 'UPGRADE_CARAVAN' | 'TRAVEL_START';

export type SkillType = 'FARMING' | 'WOODCUTTING' | 'MINING' | 'CRAFTING' | 'STEWARDSHIP' | 'COMBAT' | 'TRADING' | 'THEOLOGY';

export type ResourceType = 'gold' | 'grain' | 'wood' | 'iron_ore' | 'plank' | 'cloth' | 'iron_ingot';

export type WeatherType = 'Clear' | 'Rain' | 'Storm' | 'Fog';

export type GameStatus = 'LOBBY' | 'PLAYING' | 'PAUSED' | 'FINISHED';
