import type { Role } from '../simulationTypes';

export const ROLE_DEFINITIONS: Record<Role, { label: string, description: string }> = {
    KING: { label: 'Konge', description: 'Styrer riket, krever skatt og dømmer i store saker.' },
    BARON: { label: 'Baron', description: 'Styrer en region, krever inn skatt fra bønder, og beskytter mot krig.' },
    PEASANT: { label: 'Bonde', description: 'Produserer mat og ressurser. Betaler skatt.' },
    SOLDIER: { label: 'Soldat', description: 'Beskytter riket og deltar i raids.' },
    MERCHANT: { label: 'Kjøpmann', description: 'Tjener penger på handel og markedsspekulasjon.' }
};

export const ROLE_TITLES: Record<Role, string[]> = {
    PEASANT: ['Trell', 'Leilending', 'Selveier', 'Storbondi', 'Odalbonde'],
    BARON: ['Landmann', 'Væpner', 'Ridder', 'Baron', 'Grev'],
    KING: ['Prins', 'Hertug', 'Konungr'],
    SOLDIER: ['Rekrutt', 'Vakt', 'Kjempe', 'Høvding'],
    MERCHANT: ['Gutt', 'Svenn', 'Mester', 'Hanseat']
};

export const RANK_BENEFITS: Record<string, string[][]> = {
    PEASANT: [
        ['Basis rettigheter som bonde.'],
        ['+10% resurseffektivitet ved innhøsting.'],
        ['Redusert skattetreff (-5%) fra din lensherre.'],
        ['Låser opp bruk av spesialverktøy og ploger.'],
        ['Fullstendig selveie: Maksimal frihet og prestisje.']
    ],
    BARON: [
        ['Rett til å kreve inn skatt i din region.'],
        ['+20% forsvarsstyrke for dine vakter.'],
        ['Låser opp bygging av avanserte steinborger.'],
        ['Høyere status i Tinget: Dine stemmer teller mer.'],
        ['Maksimal autoritet og kontroll over landegrenser.']
    ],
    KING: [
        ['Gunst fra undersåttene og rett til tronen.'],
        ['Nasjonal autoritet: Kan passere lover uten Tinget.'],
        ['Gudegitt makt: Maksimal legitimitet og kontroll.']
    ],
    SOLDIER: [
        ['Grunnleggende kamptrening og utstyr.'],
        ['+15% skade i raids og forsvar.'],
        ['Låser opp bruk av tunge rustninger og hester.'],
        ['Elite-kriger: Fryktet over hele riket.']
    ],
    MERCHANT: [
        ['Rett til å drive handel på markedsplassen.'],
        ['Bedre priser ved kjøp og salg (+10%).'],
        ['Låser opp utlandshandel og karavaner.'],
        ['Finansfyrste: Kontrollerer markedstrender.']
    ]
};


export const ACHIEVEMENT_TITLES: Record<string, string> = {
    'Første korn': 'Den Flittige',
    'Mesterbygger': 'Arkitekten',
    'Kriger': 'Den Tapre',
    'Rikmann': 'Den Velstående',
    'Diplomat': 'Budbringeren',
    'Helgen': 'Den Hellige',
    'Storbruker': 'Odalbonden',
    'Smed': 'Hammermesteren'
};




