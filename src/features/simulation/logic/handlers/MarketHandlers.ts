import { GAME_BALANCE, INITIAL_MARKET } from '../../constants';
import type { ActionContext } from '../actionTypes';
import type { MarketItem } from '../../types/world';

/**
 * Calculates current price based on Scarcity-Based Pricing (vAMM derivative).
 * P = P_base * (S_base / S_curr) ^ 1.25
 */
export const getDynamicPrice = (item: MarketItem): number => {
    if (!item.basePrice || !item.baseStock) return item.price;

    // Safety: Stock can never be 0 for the divisor
    const currentStock = Math.max(1, item.stock);
    const scarcityRatio = item.baseStock / currentStock;

    // Volatility Curve (1.25 exponent)
    let multiplier = Math.pow(scarcityRatio, 1.25);

    // Safety Clamps: 0.2x to 10x
    multiplier = Math.min(10.0, Math.max(0.2, multiplier));

    return item.basePrice * multiplier;
};

/**
 * Calculates total cost for multiple units including price slippage.
 */
export const calculateBulkPrice = (item: MarketItem, qty: number, isBuy: boolean): number => {
    let total = 0;
    const tempItem = { ...item };
    const stockChange = isBuy ? -1 : 1;

    for (let i = 0; i < qty; i++) {
        const unitPrice = getDynamicPrice(tempItem);
        total += isBuy ? unitPrice : unitPrice * (GAME_BALANCE.MARKET.SELL_RATIO || 0.8);
        tempItem.stock += stockChange;

        // Safety: Prevent stock from going below 0 in projection
        if (tempItem.stock < 0) break;
    }
    return total;
};

/**
 * Handles buying a resource from the market.
 */
export const handleBuy = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const { resource } = action;

    // Resolve which market to use
    const marketKey = actor.regionId || 'capital';
    let market = room.markets?.[marketKey] || room.market;

    // --- SELF-HEALING: Cleanup rogue entries & Sync missing keys ---
    const rogueKeys = ['iron', 'swords', 'armor'];
    let wasChanged = false;

    // 1. Remove rogue keys
    rogueKeys.forEach(k => {
        if ((market as any)[k]) {
            delete (market as any)[k];
            wasChanged = true;
        }
    });

    // 2. Add missing keys from INITIAL_MARKET (e.g. siege weapons)
    Object.keys(INITIAL_MARKET).forEach(k => {
        if (!(market as any)[k]) {
            (market as any)[k] = JSON.parse(JSON.stringify((INITIAL_MARKET as any)[k]));
            wasChanged = true;
        }
    });

    if (wasChanged && room.markets) {
        room.markets[marketKey] = market;
    }

    if (!market) {
        localResult.success = false;
        localResult.message = "Markedet er ikke tilgjengelig.";
        return false;
    }

    // Validation: Resource MUST exist in market
    if (!(market as any)[resource]) {
        localResult.success = false;
        localResult.message = "Markedet tilbyr ikke denne varen her.";
        return false;
    }

    const item = (market as any)[resource];
    if (!item) {
        localResult.success = false;
        localResult.message = "Varen finnes ikke på dette markedet.";
        return false;
    }

    // Dynamic Price Calculation
    const currentPrice = getDynamicPrice(item);

    if (item.stock <= 0) {
        localResult.success = false;
        localResult.message = "Varen er utsolgt.";
        return false;
    }

    if ((actor.resources.gold || 0) < currentPrice) {
        localResult.success = false;
        localResult.message = `Du har ikke nok gull. Trenger ${currentPrice.toFixed(2)}g`;
        return false;
    }

    // Perform Transaction
    actor.resources.gold = (actor.resources.gold || 0) - currentPrice;
    (actor.resources as any)[resource] = ((actor.resources as any)[resource] || 0) + 1;
    item.stock -= 1;

    // Update the cached price for UI/legacy support
    item.price = getDynamicPrice(item);

    localResult.message = `Kjøpte 1 ${resource} for ${currentPrice.toFixed(2)}g`;
    localResult.utbytte.push({ resource, amount: 1 });

    return true;
};

/**
 * Handles selling a resource to the market.
 */
export const handleSell = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const { resource } = action;

    const marketKey = actor.regionId || 'capital';
    let market = room.markets?.[marketKey] || room.market;

    // Self-healing: Create market if missing
    if (!market) {
        if (!room.markets) room.markets = {};

        // ULTRATHINK: Generate Regional Variance
        const base = JSON.parse(JSON.stringify(INITIAL_MARKET));
        const varianceMap: Record<string, { discount: string[], premium: string[] }> = {
            'region_vest': { discount: ['iron_ore', 'stone', 'swords'], premium: ['grain', 'bread', 'cloth'] }, // Mountainous
            'region_ost': { discount: ['grain', 'bread', 'wool', 'meat'], premium: ['iron_ore', 'tools', 'wood'] }, // Plains
            'capital': { discount: ['luxury_goods', 'glass'], premium: ['raw_materials', 'wood', 'stone'] } // City
        };

        const variance = varianceMap[marketKey] || { discount: [], premium: [] };

        Object.keys(base).forEach(key => {
            if (variance.discount.includes(key)) {
                base[key].price *= 0.6; // 40% cheaper
                base[key].stock *= 1.5; // More abundance
            }
            if (variance.premium.includes(key)) {
                base[key].price *= 1.4; // 40% more expensive
                base[key].stock *= 0.7; // Scarce
            }
            // Add slight randomness (±10%) so it feels organic
            base[key].price *= (0.9 + Math.random() * 0.2);
        });

        market = base;
        room.markets[marketKey] = market;
    }

    if (!market) {
        localResult.success = false;
        localResult.message = "Markedet er ikke tilgjengelig.";
        return false;
    }

    // Validation: Resource MUST exist in market. No lazy patching.
    if (!(market as any)[resource]) {
        localResult.success = false;
        localResult.message = "Markedet tar ikke imot denne varen her.";
        return false;
    }

    if (!(market as any)[resource]) {
        localResult.success = false;
        localResult.message = "Markedet tar ikke imot denne varen her.";
        return false;
    }

    // Security: Strict inventory check
    const currentStock = (actor.resources as any)[resource] || 0;
    if (typeof currentStock !== 'number' || currentStock < 1) {
        localResult.success = false;
        localResult.message = `Du har ingen ${resource} å selge.`;
        return false;
    }

    const item = (market as any)[resource];
    if (!item) {
        localResult.success = false;
        localResult.message = "Markedet tar ikke imot denne varen.";
        return false;
    }

    // Dynamic Price Calculation (Sell Ratio applied)
    const marketPrice = getDynamicPrice(item);
    const sellPrice = marketPrice * (GAME_BALANCE.MARKET.SELL_RATIO || 0.8);

    // Perform Transaction
    (actor.resources as any)[resource] -= 1;
    actor.resources.gold = (actor.resources.gold || 0) + sellPrice;
    item.stock += 1;

    // Update cached price
    item.price = getDynamicPrice(item);

    localResult.message = `Solgte 1 ${resource} for ${sellPrice.toFixed(2)}g`;

    return true;
};

/**
 * Handles merchant trade routes (IMPORTS/EXPORTS between regions)
 */
export const handleTradeRoute = (ctx: ActionContext) => {
    const { actor, room, action, localResult, trackXp } = ctx;
    const { resource, targetRegionId, action: direction } = action;

    const sourceMarketKey = actor.regionId || 'capital';
    const sourceMarket = room.markets?.[sourceMarketKey] || room.market;
    const targetMarket = room.markets?.[targetRegionId];

    if (!sourceMarket || !targetMarket || !(sourceMarket as any)[resource] || !(targetMarket as any)[resource]) {
        localResult.success = false;
        localResult.message = "Ugyldig handelsrute eller vare.";
        return false;
    }

    const sourceItem = (sourceMarket as any)[resource];
    const targetItem = (targetMarket as any)[resource];

    if (!sourceItem || !targetItem) {
        localResult.success = false;
        localResult.message = "Varen handles ikke på disse markedene.";
        return false;
    }

    if (direction === 'IMPORT') {
        const purchaseUnits = 5;
        // Bulk 5 Import
        // Calculate slippage using the same projection logic as the UI
        const currentTotal = calculateBulkPrice(targetItem, purchaseUnits, true);

        if ((actor.resources.gold || 0) < currentTotal) {
            localResult.success = false;
            localResult.message = `Ikke nok gull. Trenger ${currentTotal.toFixed(2)}g for 5stk.`;
            return false;
        }

        // Execute: update stock one by one to ensure internal metadata (item.price) is updated correctly
        for (let i = 0; i < purchaseUnits; i++) {
            targetItem.stock -= 1;
            targetItem.price = getDynamicPrice(targetItem);
        }

        actor.resources.gold -= currentTotal;
        (actor.resources as any)[resource] = ((actor.resources as any)[resource] || 0) + purchaseUnits;

        localResult.message = `Bulk-Import: ${purchaseUnits} ${resource} fra ${targetRegionId} for ${currentTotal.toFixed(2)}g`;
    } else {
        // Bulk 5 Export
        const saleUnits = 5;

        if (((actor.resources as any)[resource] || 0) < saleUnits) {
            localResult.success = false;
            localResult.message = `Mangler ${saleUnits} ${resource} for eksport.`;
            return false;
        }

        const totalGain = calculateBulkPrice(targetItem, saleUnits, false);

        // Execute
        for (let i = 0; i < saleUnits; i++) {
            targetItem.stock += 1;
            targetItem.price = getDynamicPrice(targetItem);
        }

        (actor.resources as any)[resource] -= saleUnits;
        actor.resources.gold += totalGain;

        localResult.message = `Bulk-Eksport: ${saleUnits} ${resource} til ${targetRegionId} for ${totalGain.toFixed(2)}g`;
    }

    trackXp('TRADING', 25);
    return true;
};

/**
 * Global Market Tick (Entropy). 
 * Consumes 0.3% of stock for food/commodities to simulate "city consumption".
 */
export const handleMarketEntropy = (market: any) => {
    if (!market) return;

    Object.keys(market).forEach(key => {
        const item = market[key];
        if (!item || !item.baseStock) return;

        // Only consume if stock > 10% of base stock (prevent absolute depletion)
        if (item.stock > item.baseStock * 0.1) {
            // 0.3% consumption
            const consumption = item.stock * 0.003;
            item.stock = Math.max(0, item.stock - consumption);

            // Re-calculate price
            item.price = getDynamicPrice(item);
        }
    });
};
