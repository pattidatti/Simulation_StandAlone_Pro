import type { SimulationPlayer } from '../../simulationTypes';
import { createRandomGenome, mutateGenome } from './botGenome';
import type { BotGenome } from './botGenome';

const STORAGE_KEY = 'eiriksbok_ai_top_genomes';

export class BotEvolution {
    public static calculateFitness(player: SimulationPlayer, startTime: number): number {
        const wealth = (player.resources.gold || 0) +
            (Object.values(player.resources).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) * 0.5);

        const rankScores: Record<string, number> = {
            'PEASANT': 1,
            'SOLDIER': 5,
            'MERCHANT': 10,
            'BARON': 50,
            'KING': 200
        };
        const rankScore = rankScores[player.role] || 1;

        const timeSpentMinutes = Math.max(1, (Date.now() - startTime) / 60000);

        return (wealth + (rankScore * 100)) / timeSpentMinutes;
    }

    public static saveTopGenomes(genomes: BotGenome[]): void {
        const top = [...genomes]
            .filter(g => g.fitness !== undefined)
            .sort((a, b) => (b.fitness || 0) - (a.fitness || 0))
            .slice(0, 3);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
    }

    public static getTopGenomes(): BotGenome[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    public static getNextGenerationGenome(): BotGenome {
        const top = this.getTopGenomes();
        if (top.length === 0) {
            return createRandomGenome(0);
        }

        // Pick one of the top 3 and mutate
        const parent = top[Math.floor(Math.random() * top.length)];
        return mutateGenome(parent);
    }
}
