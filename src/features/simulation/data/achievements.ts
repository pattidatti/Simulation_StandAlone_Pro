
export interface AchievementDef {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    xp: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
    // COMMON
    {
        id: 'first_steps',
        name: 'Første Skritt',
        description: 'Fullfør din første dag i simuleringen (Nå nivå 2).',
        icon: '👣',
        rarity: 'COMMON',
        xp: 50
    },
    {
        id: 'resource_gatherer',
        name: 'Samleren',
        description: 'Samle 100 ressurser totalt.',
        icon: '🪵',
        rarity: 'COMMON',
        xp: 75
    },
    {
        id: 'social_butterfly',
        name: 'Folkekjær',
        description: 'Motta 5 gaver fra andre spillere.',
        icon: '🎁',
        rarity: 'COMMON',
        xp: 100
    },

    // RARE
    {
        id: 'baron_rising',
        name: 'Lensherre',
        description: 'Bli utnevnt til Baron for første gang.',
        icon: '🏰',
        rarity: 'RARE',
        xp: 500
    },
    {
        id: 'master_craftsman',
        name: 'Mesterhåndverker',
        description: 'Nå nivå 10 i en ferdighet.',
        icon: '🔨',
        rarity: 'RARE',
        xp: 300
    },
    {
        id: 'wealth_accumulator',
        name: 'Gullbaron',
        description: 'Ha 5000 gull på bok.',
        icon: '💰',
        rarity: 'RARE',
        xp: 400
    },

    // EPIC
    {
        id: 'king_slayer',
        name: 'Kongemakt',
        description: 'Bli kronet til Konge over riket.',
        icon: '👑',
        rarity: 'EPIC',
        xp: 2000
    },
    {
        id: 'survivor',
        name: 'Overleveren',
        description: 'Nå nivå 20 med én karakter.',
        icon: '💪',
        rarity: 'EPIC',
        xp: 1500
    },
    {
        id: 'legendary_blacksmith',
        name: 'Legendarisk Smed',
        description: 'Smi et Legendarisk våpen.',
        icon: '⚔️',
        rarity: 'EPIC',
        xp: 1000
    },

    // LEGENDARY
    {
        id: 'eternal_dynasty',
        name: 'Evig Dynasti',
        description: 'Ha 10 døde karakterer i Hall of Fame.',
        icon: '🏛️',
        rarity: 'LEGENDARY',
        xp: 5000
    },
    {
        id: 'world_traveler',
        name: 'Verdensvandrer',
        description: 'Besøk 5 forskjellige servere (Rooms).',
        icon: '🌍',
        rarity: 'LEGENDARY',
        xp: 2500
    }
];

export const getAchievement = (id: string) => ACHIEVEMENTS.find(a => a.id === id);
