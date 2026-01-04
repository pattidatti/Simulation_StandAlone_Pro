import type { Role, SkillType, SkillData } from '../simulationTypes';

export const INITIAL_SKILLS: Record<Role, Record<SkillType, SkillData>> = {
    PEASANT: {
        FARMING: { level: 1, xp: 0, maxXp: 100 },
        WOODCUTTING: { level: 1, xp: 0, maxXp: 100 },
        MINING: { level: 0, xp: 0, maxXp: 100 },
        CRAFTING: { level: 0, xp: 0, maxXp: 100 },
        STEWARDSHIP: { level: 0, xp: 0, maxXp: 100 },
        COMBAT: { level: 0, xp: 0, maxXp: 100 },
        TRADING: { level: 0, xp: 0, maxXp: 100 },
        THEOLOGY: { level: 0, xp: 0, maxXp: 100 }
    },
    BARON: {
        FARMING: { level: 3, xp: 0, maxXp: 300 },
        WOODCUTTING: { level: 3, xp: 0, maxXp: 300 },
        MINING: { level: 1, xp: 0, maxXp: 100 },
        CRAFTING: { level: 1, xp: 0, maxXp: 100 },
        STEWARDSHIP: { level: 5, xp: 0, maxXp: 1000 },
        COMBAT: { level: 3, xp: 0, maxXp: 300 },
        TRADING: { level: 3, xp: 0, maxXp: 300 },
        THEOLOGY: { level: 1, xp: 0, maxXp: 100 }
    },
    KING: {
        FARMING: { level: 1, xp: 0, maxXp: 100 },
        WOODCUTTING: { level: 1, xp: 0, maxXp: 100 },
        MINING: { level: 1, xp: 0, maxXp: 100 },
        CRAFTING: { level: 1, xp: 0, maxXp: 100 },
        STEWARDSHIP: { level: 10, xp: 0, maxXp: 5000 },
        COMBAT: { level: 5, xp: 0, maxXp: 1500 },
        TRADING: { level: 5, xp: 0, maxXp: 1500 },
        THEOLOGY: { level: 5, xp: 0, maxXp: 1500 }
    },
    SOLDIER: {
        FARMING: { level: 1, xp: 0, maxXp: 100 },
        WOODCUTTING: { level: 1, xp: 0, maxXp: 100 },
        MINING: { level: 0, xp: 0, maxXp: 100 },
        CRAFTING: { level: 1, xp: 0, maxXp: 100 },
        STEWARDSHIP: { level: 0, xp: 0, maxXp: 100 },
        COMBAT: { level: 5, xp: 0, maxXp: 1500 },
        TRADING: { level: 0, xp: 0, maxXp: 100 },
        THEOLOGY: { level: 0, xp: 0, maxXp: 100 }
    },
    MERCHANT: {
        FARMING: { level: 1, xp: 0, maxXp: 100 },
        WOODCUTTING: { level: 1, xp: 0, maxXp: 100 },
        MINING: { level: 0, xp: 0, maxXp: 100 },
        CRAFTING: { level: 2, xp: 0, maxXp: 200 },
        STEWARDSHIP: { level: 1, xp: 0, maxXp: 100 },
        COMBAT: { level: 0, xp: 0, maxXp: 100 },
        TRADING: { level: 5, xp: 0, maxXp: 1500 },
        THEOLOGY: { level: 0, xp: 0, maxXp: 100 }
    }
};

export const SKILL_DETAILS: Record<SkillType, { label: string, description: string, color: string, bonuses: Record<number, string> }> = {
    FARMING: {
        label: 'Jordbruk',
        description: 'Dyrking av mark, høsting av avlinger og husdyrhold.',
        color: '#10b981',
        bonuses: {
            2: '10% raskere høsting.',
            5: 'Avlinger gir 20% mer utbytte.',
            10: 'Mesterbonde: Låser opp avanserte avlinger.'
        }
    },
    WOODCUTTING: {
        label: 'Vedhogging',
        description: 'Kunsten å felle trær og bearbeide tømmer.',
        color: '#8b5cf6',
        bonuses: {
            3: '15% raskere tømmerhogst.',
            7: 'Sjanse for å finne sjelden kvae.',
            12: 'Skovens vokter: Økt utbytte fra alle trær.'
        }
    },
    MINING: {
        label: 'Gruvedrift',
        description: 'Uthenting av malm og edle metaller fra fjellet.',
        color: '#f59e0b',
        bonuses: {
            4: 'Bedre verktøyeffektivitet i gruver.',
            8: 'Låser opp utvinning av edelstener.',
            15: 'Fjellkonge: Maksimalt utbytte fra dype årer.'
        }
    },
    CRAFTING: {
        label: 'Håndverk',
        description: 'Smiing, snekring og tilvirking av avansert utstyr.',
        color: '#3b82f6',
        bonuses: {
            2: 'Mindre materialsvinn ved refining.',
            5: 'Bedre sjanse for høyere kvalitet.',
            10: 'Stormester: Kan smie legendarisk utstyr.'
        }
    },
    STEWARDSHIP: {
        label: 'Godsforvaltning',
        description: 'Administrasjon av land, folk og ressurser.',
        color: '#ec4899',
        bonuses: {
            5: 'Redusert skattetrykk fra overordnede.',
            10: 'Økt passiv inntekt fra oppgraderinger.',
            20: 'Rikets forvalter: Maksimal økonomisk innsikt.'
        }
    },
    COMBAT: {
        label: 'Kamp',
        description: 'Ferdighet i sverd, bue og forsvar av riket.',
        color: '#ef4444',
        bonuses: {
            3: 'Økt angrepskraft (+10%).',
            6: 'Bedre forsvarsevne i beleiringer.',
            12: 'Krigsherre: Fryktinngytende på slagmarken.'
        }
    },
    TRADING: {
        label: 'Handel',
        description: 'Kjøp, salg og markedsspekulering.',
        color: '#facc15',
        bonuses: {
            2: 'Lavere gebyrer på markedet.',
            5: 'Bedre priser ved handel med NPCs.',
            10: 'Handelsfyrste: Kontroll over handelsruter.'
        }
    },
    THEOLOGY: {
        label: 'Teologi',
        description: 'Tro, bønn og forståelse av det guddommelige.',
        color: '#6366f1',
        bonuses: {
            5: 'Bønner gir mer stamina.',
            10: 'Guddommelig beskyttelse mot ulykker.',
            15: 'Helgen: Utstråler en aura av ro og verdighet.'
        }
    }
};
