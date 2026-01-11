export interface Resources {
    gold: number;
    grain: number;
    flour: number;
    bread: number;
    wood: number;
    plank: number;
    iron_ore: number;
    iron_ingot: number;
    stone: number;
    siege_sword: number;
    siege_armor: number;
    favor: number;
    wool: number;
    cloth: number;
    honey: number;
    meat: number;
    glass: number;
    manpower: number;
    egg: number;
    omelette: number;
    minor_stamina_potion: number;
    herbal_balm: number;
    focus_brew: number;
    strength_tincture: number;
    masters_draught: number;
    elixir_of_life: number;
    // Maritime Resources
    flax: number;
    linen_canvas: number;
    tar: number;
    fish_raw: number;
    fish_cooked: number;
    silk: number;
    spice: number;
    cannonball: number;
}

export type EquipmentSlot = 'MAIN_HAND' | 'OFF_HAND' | 'HEAD' | 'BODY' | 'FEET' | 'TRINKET' | 'AXE' | 'PICKAXE' | 'SCYTHE' | 'HAMMER' | 'BOW' | 'TRAP' | 'CHISEL' | 'CONSUMABLE';

export interface ItemStats {
    yieldBonus?: number;
    speedBonus?: number;
    luckBonus?: number;
    defense?: number;
    attack?: number;
}

export interface EquipmentItem {
    id: string;
    name: string;
    icon: string;
    type: EquipmentSlot;
    description?: string;
    stats?: ItemStats;
    durability: number;
    maxDurability: number;
    level: number;
    relevantActions?: string[];
}

export interface ItemTemplate {
    id: string;
    name: string;
    icon: string;
    type: EquipmentSlot;
    description: string;
    stats?: ItemStats;
    level: number;
    relevantActions?: string[];
    nextTierId?: string;
    durability: number;
    maxDurability: number;
}
