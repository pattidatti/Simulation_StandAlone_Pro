
export type TriggerType = 'PASSIVE' | 'EVENT';
export type ConditionType = 'RESOURCE' | 'STAT' | 'ROLE' | 'ACCOUNT_STAT' | 'ACTION_COUNT' | 'MANUAL';
export type Comparison = 'GTE' | 'EQ'; // GreaterThanOrEqual, Equal

export interface AchievementCondition {
    type: ConditionType;
    target: string;
    value: number | string;
    comparison?: Comparison;
}

export interface AchievementDef {
    id: string;
    name: string;
    description: string;
    requirementText: string;
    icon: string; // Lucide Icon Name
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    xp: number;
    category: 'LIFE' | 'SOUL' | 'ROLE';
    isSecret?: boolean;

    // Logic Engine Metadata
    triggerType: TriggerType;
    condition: AchievementCondition;
}

export const ACHIEVEMENTS: AchievementDef[] = [
    // --- LIFE (Survival & Basics) ---
    {
        id: 'first_steps',
        name: 'Første Skritt',
        description: 'Du har overlevd din første dag i villmarken. Verden ligger for dine føtter.',
        requirementText: 'Overlev 1 dag.',
        icon: 'Footprints',
        rarity: 'COMMON',
        xp: 100,
        category: 'LIFE',
        triggerType: 'PASSIVE',
        condition: { type: 'STAT', target: 'level', value: 2, comparison: 'GTE' } // Using Level 2 as proxy for survival per old logic
    },
    {
        id: 'full_belly',
        name: 'Mett Mage',
        description: 'En kriger marsjerer på magen. Du har spist godt.',
        requirementText: 'Spis 5 måltider på rad uten å bli sulten.',
        icon: 'Utensils',
        rarity: 'COMMON',
        xp: 50,
        category: 'LIFE',
        triggerType: 'EVENT',
        condition: { type: 'ACTION_COUNT', target: 'EAT_MEAL', value: 5 }
    },
    {
        id: 'lumberjack',
        name: 'Tømmerhogger',
        description: 'Skogen gir, og du har tatt. Ditt første skritt mot sivilisasjon.',
        requirementText: 'Hogg 100 enheter ved.',
        icon: 'Axe',
        rarity: 'COMMON',
        xp: 150,
        category: 'LIFE',
        triggerType: 'PASSIVE',
        condition: { type: 'RESOURCE', target: 'wood', value: 100, comparison: 'GTE' }
    },
    {
        id: 'miner',
        name: 'Fjellets Sønn',
        description: 'Dypt i fjellet fant du rikdom. Jernets tid er kommet.',
        requirementText: 'Utvinn 50 Jernmalm.',
        icon: 'Pickaxe',
        rarity: 'COMMON',
        xp: 150,
        category: 'LIFE',
        triggerType: 'PASSIVE',
        condition: { type: 'RESOURCE', target: 'iron', value: 50, comparison: 'GTE' }
    },
    {
        id: 'survivor_week',
        name: 'Ukenemnda',
        description: 'Syv dager med motgang har herdet deg.',
        requirementText: 'Overlev 7 dager i ett liv.',
        icon: 'Calendar',
        rarity: 'RARE',
        xp: 500,
        category: 'LIFE',
        triggerType: 'PASSIVE',
        condition: { type: 'STAT', target: 'daysAlive', value: 7, comparison: 'GTE' }
    },
    {
        id: 'master_craftsman',
        name: 'Mesterhåndverker',
        description: 'Dine hender skaper vidundere. Du har nådd toppen av ditt fag.',
        requirementText: 'Nå nivå 10 i en ferdighet.',
        icon: 'Hammer',
        rarity: 'RARE',
        xp: 400,
        category: 'LIFE',
        triggerType: 'PASSIVE', // Could be event, but verifying stats is safer
        condition: { type: 'STAT', target: 'maxSkillLevel', value: 10, comparison: 'GTE' }
    },

    // --- ROLE (Economy, Politics, War) ---
    {
        id: 'first_gold',
        name: 'Småpenger',
        description: 'Din første gullmynt. Starten på en formue.',
        requirementText: 'Samle 100 Gull.',
        icon: 'Coins',
        rarity: 'COMMON',
        xp: 100,
        category: 'ROLE',
        triggerType: 'PASSIVE',
        condition: { type: 'RESOURCE', target: 'gold', value: 100, comparison: 'GTE' }
    },
    {
        id: 'merchant_trade',
        name: 'Kremmerånd',
        description: 'En god handel er bedre enn en vunnet krig.',
        requirementText: 'Gjennomfør 10 handler på markedet.',
        icon: 'Scale',
        rarity: 'COMMON',
        xp: 200,
        category: 'ROLE',
        triggerType: 'EVENT',
        condition: { type: 'ACTION_COUNT', target: 'TRADE', value: 10 }
    },
    {
        id: 'wealth_builder',
        name: 'Lokalt Velstand',
        description: 'Du har samlet nok gull til å kjøpe en liten landsby.',
        requirementText: 'Ha 5,000 Gull i banken.',
        icon: 'Wallet',
        rarity: 'RARE',
        xp: 600,
        category: 'ROLE',
        triggerType: 'PASSIVE',
        condition: { type: 'RESOURCE', target: 'gold', value: 5000, comparison: 'GTE' }
    },
    {
        id: 'baron_rising',
        name: 'Baron',
        description: 'Du er ikke lenger en av folket. Du er deres leder.',
        requirementText: 'Bli utnevnt til Baron.',
        icon: 'Shield',
        rarity: 'RARE',
        xp: 1000,
        category: 'ROLE',
        triggerType: 'PASSIVE',
        condition: { type: 'ROLE', target: 'role', value: 'BARON', comparison: 'EQ' }
    },
    {
        id: 'tax_collector',
        name: 'Skattemester',
        description: 'Kongens kasse må fylles, og du gjorde jobben.',
        requirementText: 'Krev inn skatt 5 ganger.',
        icon: 'Scroll',
        rarity: 'RARE',
        xp: 500,
        category: 'ROLE',
        triggerType: 'EVENT',
        condition: { type: 'ACTION_COUNT', target: 'COLLECT_TAX', value: 5 }
    },
    {
        id: 'duke_treasury',
        name: 'Hertugens Skatt',
        description: 'En formue som får selv konger til å sjalue.',
        requirementText: 'Samle 50,000 Gull.',
        icon: 'Gem',
        rarity: 'EPIC',
        xp: 2500,
        category: 'ROLE',
        triggerType: 'PASSIVE',
        condition: { type: 'RESOURCE', target: 'gold', value: 50000, comparison: 'GTE' }
    },
    {
        id: 'midas_touch',
        name: 'Midas Touch',
        description: 'Alt du tar i blir til gull. Din rikdom er legendarisk.',
        requirementText: 'Samle 100,000 Gull.',
        icon: 'Sparkles',
        rarity: 'LEGENDARY',
        xp: 5000,
        category: 'ROLE',
        isSecret: true,
        triggerType: 'PASSIVE',
        condition: { type: 'RESOURCE', target: 'gold', value: 100000, comparison: 'GTE' }
    },
    {
        id: 'king_slayer',
        name: 'Konge',
        description: 'Kronet og salvet. Hele riket bøyer seg for deg.',
        requirementText: 'Bli Konge.',
        icon: 'Crown',
        rarity: 'EPIC',
        xp: 4000,
        category: 'ROLE',
        triggerType: 'PASSIVE',
        condition: { type: 'ROLE', target: 'role', value: 'KING', comparison: 'EQ' }
    },
    {
        id: 'tyrant',
        name: 'Jernhånd',
        description: 'Din vilje er lov. Ingen tør å opponere.',
        requirementText: 'Ha 100% Autoritet som Konge.',
        icon: 'Gavel',
        rarity: 'EPIC',
        xp: 3000,
        category: 'ROLE',
        isSecret: true,
        triggerType: 'PASSIVE',
        condition: { type: 'STAT', target: 'authority', value: 100, comparison: 'GTE' }
    },

    // --- SOUL (Meta-Progression & Secrets) ---
    {
        id: 'soul_awakening',
        name: 'Sjelens Gnist',
        description: 'Du begynner å huske hvem du var før.',
        requirementText: 'Nå Sjelsnivå 2.',
        icon: 'Zap',
        rarity: 'COMMON',
        xp: 200,
        category: 'SOUL',
        triggerType: 'PASSIVE',
        condition: { type: 'ACCOUNT_STAT', target: 'globalLevel', value: 2, comparison: 'GTE' }
    },
    {
        id: 'soul_master',
        name: 'Opplyst',
        description: 'Din sjel brenner lysere enn stjernene.',
        requirementText: 'Nå Sjelsnivå 10.',
        icon: 'Sun',
        rarity: 'EPIC',
        xp: 2000,
        category: 'SOUL',
        triggerType: 'PASSIVE',
        condition: { type: 'ACCOUNT_STAT', target: 'globalLevel', value: 10, comparison: 'GTE' }
    },
    {
        id: 'ancestor',
        name: 'Forfader',
        description: 'Ditt navn vil ikke bli glemt.',
        requirementText: 'Dø og bli lagret i Hall of Fame for første gang.',
        icon: 'Ghost',
        rarity: 'COMMON',
        xp: 300,
        category: 'SOUL',
        triggerType: 'EVENT',
        condition: { type: 'MANUAL', target: 'DEATH_FIRST', value: 1 }
    },
    {
        id: 'eternal_dynasty',
        name: 'Evig Dynasti',
        description: 'En lang linje av helter står bak deg.',
        requirementText: 'Ha 10 forfedre i historikken.',
        icon: 'Users',
        rarity: 'LEGENDARY',
        xp: 5000,
        category: 'SOUL',
        triggerType: 'PASSIVE',
        condition: { type: 'ACCOUNT_STAT', target: 'historyLength', value: 10, comparison: 'GTE' }
    },
    {
        id: 'world_traveler',
        name: 'Vandreren',
        description: 'Verden er stor, og du har sett alt.',
        requirementText: 'Besøk 5 forskjellige regioner.',
        icon: 'Map',
        rarity: 'RARE',
        xp: 800,
        category: 'SOUL',
        triggerType: 'PASSIVE',
        condition: { type: 'STAT', target: 'regionsVisited', value: 5, comparison: 'GTE' }
    },
    {
        id: 'secret_death',
        name: 'Sort Uflaks',
        description: 'Døde på en... spektakulær måte.',
        requirementText: 'Dø av ???',
        icon: 'Skull',
        rarity: 'RARE',
        xp: 666,
        category: 'SOUL',
        isSecret: true,
        triggerType: 'EVENT',
        condition: { type: 'MANUAL', target: 'DEATH_WEIRD', value: 1 }
    },
    {
        id: 'legendary_blacksmith',
        name: 'Gudesmed',
        description: 'Dette våpenet hører hjemme i legendene.',
        requirementText: 'Smi en LEGENDARY gjenstand.',
        icon: 'Flame',
        rarity: 'LEGENDARY',
        xp: 4000,
        category: 'ROLE',
        triggerType: 'EVENT',
        condition: { type: 'MANUAL', target: 'CRAFT_LEGENDARY', value: 1 }
    },
    {
        id: 'diplomat',
        name: 'Fredsmegler',
        description: 'Ord kan avverge kriger.',
        requirementText: 'Signer en fredsavtale.',
        icon: 'Feather',
        rarity: 'RARE',
        xp: 750,
        category: 'ROLE',
        triggerType: 'EVENT',
        condition: { type: 'MANUAL', target: 'PEACE_TREATY', value: 1 }
    },
];

export const getAchievement = (id: string) => ACHIEVEMENTS.find(a => a.id === id);
