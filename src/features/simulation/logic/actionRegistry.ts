import type { ActionRegistry } from './actionTypes';
import { handleWork, handleChop, handleMiningAction, handleForage, handleHunt, handleGatherWool, handleGatherHoney, handlePlant, handleHarvest, handleFeedChickens, handleCollectEggs, handleMaintainCrop } from './handlers/GatheringHandlers';
import { handleCraft, handleRefine, handleRepair } from './handlers/CraftingHandlers';
import { handleEquipItem, handleUnequipItem, handleDiscardItem } from './handlers/InventoryHandlers';
import { handleTax, handleDraft, handleDecree, handleContribute, handleUpgradeBuilding, handleUpgrade, handleJoinRole } from './handlers/ManagementHandlers';
import { handleStartSiege, handleJoinSiege, handleSiegeAction, handleReinforceGarrison, handleRepairWalls } from './handlers/SiegeHandlers';
import { handleRaid, handlePatrol } from './handlers/CombatHandlers';
import { handleBuy, handleSell, handleTradeRoute } from './handlers/MarketHandlers';
import { handleSleep, handleRest, handlePray, handleChat, handleGamble, handleBuyMeal, handleRetire, handleConsume, handleMountHorse } from './handlers/SocialRestHandlers';

export const ACTION_REGISTRY: ActionRegistry = {
    // Gathering
    WORK: handleWork,
    CHOP: handleChop,
    MINE: handleMiningAction,
    QUARRY: handleMiningAction,
    FORAGE: handleForage,
    HUNT: handleHunt,
    GATHER_WOOL: handleGatherWool,
    GATHER_HONEY: handleGatherHoney,
    PLANT: handlePlant,
    HARVEST: handleHarvest,
    MAINTAIN_CROP: handleMaintainCrop,

    // Crafting & Refining
    CRAFT: handleCraft,
    REFINE: handleRefine,
    BAKE: handleRefine,
    MILL: handleRefine,
    SMELT: handleRefine,
    WEAVE: handleRefine,
    MIX: handleRefine,
    REPAIR: handleRepair,

    // Inventory
    EQUIP_ITEM: handleEquipItem,
    UNEQUIP_ITEM: handleUnequipItem,
    DISCARD_ITEM: handleDiscardItem,

    // Management
    TAX: handleTax,
    DRAFT: handleDraft,
    DECREE: handleDecree,
    CONSTRUCT: handleContribute,
    CONTRIBUTE_TO_UPGRADE: handleContribute,
    CONTRIBUTE_TO_PRIVATE_UPGRADE: handleContribute,
    UPGRADE_BUILDING: handleUpgradeBuilding,
    UPGRADE: handleUpgrade,
    JOIN_ROLE: handleJoinRole,

    // Siege
    START_SIEGE: handleStartSiege,
    JOIN_SIEGE: handleJoinSiege,
    SIEGE_ACTION: handleSiegeAction,
    REINFORCE_GARRISON: handleReinforceGarrison,
    REPAIR_WALLS: handleRepairWalls,

    // Combat
    RAID: handleRaid,
    PATROL: handlePatrol,

    // Social & Rest
    SLEEP: handleSleep,
    REST: handleRest,
    EAT: handleRest,
    FEAST: handleRest,
    PRAY: handlePray,
    CHAT_LOCAL: handleChat,
    GAMBLE_RESULT: handleGamble,
    PLAY_DICE: handleGamble,
    BUY_MEAL: handleBuyMeal,
    RETIRE: handleRetire,
    CONSUME: handleConsume,
    FEED_CHICKENS: handleFeedChickens, // Custom
    COLLECT_EGGS: handleCollectEggs,   // Custom
    GATHER_WATER: handleRest,          // Added for Well
    TRADE_ROUTE: handleTradeRoute,
    MOUNT_HORSE: handleMountHorse,

    // Market
    BUY: handleBuy,
    SELL: handleSell
};
