export interface BotGenome {
    id: string;
    generation: number;
    weights: {
        // Gathering
        gatherWood: number;
        gatherStone: number;
        gatherIron: number;
        gatherGrain: number;

        // Economy
        marketAggression: number; // Propensity to sell high/buy low
        savingsFocus: number; // Propensity to keep gold
        upgradeFocus: number; // Propensity to spend on building/skill upgrades

        // Survival
        hungerThreshold: number; // When to eat (stamina level)
        restFocus: number; // When to rest (stamina level)

        // Progression
        promotionFocus: number; // Focus on becoming Baron/King
        contributionFocus: number; // Focus on contributing to village projects
    };
    fitness?: number;
    parents?: string[];
}

export const createRandomGenome = (generation: number = 0): BotGenome => {
    return {
        id: `genome_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        generation,
        weights: {
            gatherWood: Math.random() * 2,
            gatherStone: Math.random() * 2,
            gatherIron: Math.random() * 2,
            gatherGrain: Math.random() * 2,
            marketAggression: Math.random() * 2,
            savingsFocus: Math.random() * 2,
            upgradeFocus: Math.random() * 2,
            hungerThreshold: 0.2 + Math.random() * 0.6, // 20% to 80% stamina
            restFocus: Math.random() * 2,
            promotionFocus: Math.random() * 2,
            contributionFocus: Math.random() * 2
        }
    };
};

export const mutateGenome = (genome: BotGenome, mutationRate: number = 0.1): BotGenome => {
    const newWeights = { ...genome.weights };
    (Object.keys(newWeights) as (keyof typeof newWeights)[]).forEach(key => {
        if (Math.random() < 0.2) { // 20% chance to mutate each weight
            const change = (Math.random() * 2 - 1) * mutationRate; // +/- 10%
            newWeights[key] = Math.max(0, Math.min(2.0, newWeights[key] + change));
        }
    });

    return {
        ...genome,
        id: `genome_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        weights: newWeights,
        generation: genome.generation + 1,
        parents: [genome.id],
        fitness: undefined
    };
};
