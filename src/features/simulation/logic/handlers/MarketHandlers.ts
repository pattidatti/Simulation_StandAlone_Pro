import { GAME_BALANCE, INITIAL_MARKET } from '../../constants';
import type { ActionContext } from '../actionTypes';

/**
 * Handles buying a resource from the market.
 */
export const handleBuy = (ctx: ActionContext) => {
    const { actor, room, action, localResult } = ctx;
    const { resource } = action;

    // Resolve which market to use
    const marketKey = actor.regionId || 'capital';
    let market = room.markets?.[marketKey] || room.market;

    // Self-healing: Create market if missing
    if (!market) {
        if (!room.markets) room.markets = {};
        market = JSON.parse(JSON.stringify(INITIAL_MARKET));
        room.markets[marketKey] = market;
    }

    if (!market) {
        localResult.success = false;
        localResult.message = "Markedet er ikke tilgjengelig.";
        return false;
    }

    // Lazy Patch
    if (!(market as any)[resource] && (INITIAL_MARKET as any)[resource]) {
        (market as any)[resource] = { ...(INITIAL_MARKET as any)[resource] };
    }

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
    const price = item.price;

    if (item.stock <= 0) {
        localResult.success = false;
        localResult.message = "Varen er utsolgt.";
        return false;
    }

    if ((actor.resources.gold || 0) < price) {
        localResult.success = false;
        localResult.message = "Du har ikke nok gull.";
        return false;
    }

    // Perform Transaction
    actor.resources.gold = (actor.resources.gold || 0) - price;
    (actor.resources as any)[resource] = ((actor.resources as any)[resource] || 0) + 1;
    item.stock -= 1;

    // Price impact (linear)
    item.price += item.price * (GAME_BALANCE.MARKET.PRICE_IMPACT_BUY || 0.005);

    localResult.message = `Kjøpte 1 ${resource} for ${price.toFixed(2)}g`;
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
        market = JSON.parse(JSON.stringify(INITIAL_MARKET));
        room.markets[marketKey] = market;
    }

    if (!market) {
        localResult.success = false;
        localResult.message = "Markedet er ikke tilgjengelig.";
        return false;
    }

    // Lazy Patch: If resource is missing in market but exists in schema, add it dynamically
    if (!(market as any)[resource] && (INITIAL_MARKET as any)[resource]) {
        console.log(`Lazy patching market: Adding missing ${resource}`);
        (market as any)[resource] = { ...(INITIAL_MARKET as any)[resource] };
    }

    if (!(market as any)[resource]) {
        localResult.success = false;
        localResult.message = "Markedet tar ikke imot denne varen her.";
        return false;
    }

    if (((actor.resources as any)[resource] || 0) < 1) {
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
    const sellPrice = item.price * (GAME_BALANCE.MARKET.SELL_RATIO || 0.8);

    // Perform Transaction
    (actor.resources as any)[resource] -= 1;
    actor.resources.gold = (actor.resources.gold || 0) + sellPrice;
    item.stock += 1;

    // Price impact
    item.price -= item.price * (GAME_BALANCE.MARKET.PRICE_IMPACT_SELL || 0.01);

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
        // Buy from target, add to source (as merchant stock? No, merchant is personal agent for now)
        // Merchants usually buy low somewhere else and sell high at home.
        // For simplicity: Merchants buy 10 units from target and add to source market stock?
        // Or Merchant buys for themselves from target.
        // Let's assume the Trade Route action is a "Bulk Buy/Sell" that moves market stock and gives merchant profit.

        const priceAtTarget = targetItem.price;
        const totalCost = priceAtTarget * 5; // Bulk 5

        if ((actor.resources.gold || 0) < totalCost) {
            localResult.success = false;
            localResult.message = "Ikke nok gull til bulk-import.";
            return false;
        }

        if (targetItem.stock < 5) {
            localResult.success = false;
            localResult.message = "Mangler bulk-lager ved kilden.";
            return false;
        }

        actor.resources.gold -= totalCost;
        (actor.resources as any)[resource] = ((actor.resources as any)[resource] || 0) + 5;
        targetItem.stock -= 5;
        targetItem.price += targetItem.price * 0.02; // higher impact for bulk

        localResult.message = `Importerte 5 ${resource} fra ${targetRegionId} for ${totalCost.toFixed(2)}g`;
    } else {
        // EXPORT: Sell from personal inventory to target market
        if (((actor.resources as any)[resource] || 0) < 5) {
            localResult.success = false;
            localResult.message = `Mangler 5 ${resource} for eksport.`;
            return false;
        }

        const priceAtTarget = targetItem.price * GAME_BALANCE.MARKET.SELL_RATIO;
        const totalGain = priceAtTarget * 5;

        (actor.resources as any)[resource] -= 5;
        actor.resources.gold += totalGain;
        targetItem.stock += 5;
        targetItem.price -= targetItem.price * 0.02;

        localResult.message = `Eksporterte 5 ${resource} til ${targetRegionId} for ${totalGain.toFixed(2)}g`;
    }

    trackXp('TRADING', 25);
    return true;
};
