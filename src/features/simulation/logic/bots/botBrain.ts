import type { ActionType, SimulationPlayer, SimulationRoom } from '../../simulationTypes';
import type { BotGenome } from './botGenome';
import { ACTION_COSTS } from '../../constants';

export interface BotDecision {
    action: any;
    score: number;
    reason: string;
}

export class BotBrain {
    private genome: BotGenome;

    constructor(genome: BotGenome) {
        this.genome = genome;
    }

    public decide(player: SimulationPlayer, room: SimulationRoom): BotDecision {
        const potentialActions: BotDecision[] = [];

        // 1. Survival Actions (High priority if stamina is low)
        const stamina = player.status.stamina;
        const hungerScore = (1.0 - (stamina / 100)) * this.genome.weights.hungerThreshold * 5.0;

        if (player.resources.bread > 0 && stamina < 80) {
            potentialActions.push({
                action: { type: 'EAT' },
                score: hungerScore,
                reason: 'Sulten'
            });
        }

        if (stamina < 50) {
            potentialActions.push({
                action: { type: 'SLEEP' },
                score: (1.0 - (stamina / 100)) * this.genome.weights.restFocus * 3.0,
                reason: 'Trøtt'
            });
        }

        // 2. Gathering Actions
        potentialActions.push({
            action: { type: 'CHOP' },
            score: this.genome.weights.gatherWood * this.getNeedMultiplier(player, 'wood'),
            reason: 'Trengte ved'
        });

        potentialActions.push({
            action: { type: 'QUARRY' },
            score: this.genome.weights.gatherStone * this.getNeedMultiplier(player, 'stone'),
            reason: 'Trengte stein'
        });

        potentialActions.push({
            action: { type: 'MINE' },
            score: this.genome.weights.gatherIron * this.getNeedMultiplier(player, 'iron_ore'),
            reason: 'Trengte jernmalm'
        });

        potentialActions.push({
            action: { type: 'WORK' }, // Grain
            score: this.genome.weights.gatherGrain * this.getNeedMultiplier(player, 'grain'),
            reason: 'Trengte korn'
        });

        // 3. Economy (Buy/Sell)
        // If we have lots of something, sell it
        const market = room.markets?.[player.regionId] || room.market;
        if (market) {
            Object.entries(player.resources).forEach(([res, amount]) => {
                if (res === 'gold') return;
                const marketItem = (market as any)[res];
                if (marketItem && amount > 10) {
                    const price = marketItem.price;
                    potentialActions.push({
                        action: { type: 'SELL', itemId: res, amount: Math.floor(amount / 2) },
                        score: this.genome.weights.marketAggression * (price / 20) * (amount / 50),
                        reason: `Selger ${res} for gull`
                    });
                }
            });
        }

        // 4. Upgrades (If we have gold)
        if (player.resources.gold > 200) {
            potentialActions.push({
                action: { type: 'CONTRIBUTE_TO_UPGRADE', buildingId: 'great_hall' }, // Example
                score: this.genome.weights.promotionFocus * (player.resources.gold / 1000),
                reason: 'Vil bli mektigere'
            });
        }

        // Filter out actions we can't afford
        const affordableActions = potentialActions.filter(decision => {
            const actionType = typeof decision.action === 'string' ? decision.action : decision.action.type;
            const cost = ACTION_COSTS[actionType as ActionType];
            if (!cost) return true;

            // Basic stamina check (ignoring modifiers for simplicity in core brain)
            if (stamina < (cost.stamina || 0)) return false;

            for (const [res, amt] of Object.entries(cost)) {
                if (res === 'stamina') continue;
                if ((player.resources[res as keyof typeof player.resources] || 0) < (amt as number)) return false;
            }
            return true;
        });

        if (affordableActions.length === 0) {
            return { action: 'IDLE', score: 0, reason: 'Ingenting å gjøre' };
        }

        // Sort by score and pick the best
        affordableActions.sort((a, b) => b.score - a.score);
        return affordableActions[0];
    }

    private getNeedMultiplier(player: SimulationPlayer, resource: string): number {
        const amount = player.resources[resource as keyof typeof player.resources] || 0;
        if (amount < 5) return 2.0;
        if (amount < 20) return 1.2;
        if (amount > 100) return 0.5;
        return 1.0;
    }
}
