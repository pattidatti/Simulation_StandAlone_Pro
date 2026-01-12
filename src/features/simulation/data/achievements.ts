
export interface AchievementDef {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    xp: number;
    category: 'LIFE' | 'SOUL' | 'ROLE';
}

export const ACHIEVEMENTS: AchievementDef[] = [
    // --- LIFE ACHIEVEMENTS (Nuet) ---
    {
        id: 'first_steps',
        name: 'Første Skritt',
        description: 'Overlev din første dag i vildmarken.',
        icon: '👣',
        rarity: 'COMMON',
        xp: 100,
        category: 'LIFE'
    },
    {
        id: 'full_belly',
        name: 'Mett Mage',
        description: 'Spis 5 måltider på rad uten å bli sulten.',
        icon: '🍞',
        rarity: 'COMMON',
        xp: 50,
        category: 'LIFE'
    },
    {
        id: 'resource_gatherer',
        name: 'Flittig Arbeider',
        description: 'Samle 250 ressurser med egne hender.',
        icon: '🪵',
        rarity: 'COMMON',
        xp: 150,
        category: 'LIFE'
    },
    {
        id: 'master_craftsman',
        name: 'Faglært',
        description: 'Nå nivå 10 i en ferdighet.',
        icon: '🔨',
        rarity: 'RARE',
        xp: 400,
        category: 'LIFE'
    },

    // --- SOUL ACHIEVEMENTS (Sjelen) ---
    {
        id: 'soul_awakening',
        name: 'Sjelens Oppvåkning',
        description: 'Nå Sjelsnivå 5.',
        icon: '✨',
        rarity: 'RARE',
        xp: 1000,
        category: 'SOUL'
    },
    {
        id: 'eternal_dynasty',
        name: 'Evig Dynasti',
        description: 'Ha 10 forfedre i Hall of Fame.',
        icon: '🏛️',
        rarity: 'LEGENDARY',
        xp: 5000,
        category: 'SOUL'
    },
    {
        id: 'world_traveler',
        name: 'Verdensvandrer',
        description: 'Besøk 5 forskjellige riger.',
        icon: '🌍',
        rarity: 'EPIC',
        xp: 2500,
        category: 'SOUL'
    },

    // --- ROLE ACHIEVEMENTS (Rollene) ---
    {
        id: 'baron_rising',
        name: 'Lokal Stolthet',
        description: 'Bli utnevnt til Baron.',
        icon: '🏰',
        rarity: 'RARE',
        xp: 800,
        category: 'ROLE'
    },
    {
        id: 'tax_collector',
        name: 'Skatteinnkreveren',
        description: 'Krev inn skatt fra 10 forskjellige bønder.',
        icon: '🪙',
        rarity: 'RARE',
        xp: 600,
        category: 'ROLE'
    },
    {
        id: 'king_slayer',
        name: 'Høyest i Riket',
        description: 'Bli kronet til Konge over landet.',
        icon: '👑',
        rarity: 'EPIC',
        xp: 3000,
        category: 'ROLE'
    },
    {
        id: 'benevolent_ruler',
        name: 'Den Gode Hersker',
        description: 'Ha 100% lojalitet i din region som Baron eller Konge.',
        icon: '🕊️',
        rarity: 'EPIC',
        xp: 2000,
        category: 'ROLE'
    },
    {
        id: 'legendary_blacksmith',
        name: 'Gudesmed',
        description: 'Smi en gjenstand av ypperste kvalitet.',
        icon: '⚔️',
        rarity: 'LEGENDARY',
        xp: 4000,
        category: 'ROLE'
    }
];

export const getAchievement = (id: string) => ACHIEVEMENTS.find(a => a.id === id);
