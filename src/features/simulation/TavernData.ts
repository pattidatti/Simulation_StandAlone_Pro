
export interface DialogOption {
    label: string;
    nextId: string;
    action?: string;
}

export interface DialogNode {
    text: string;
    options: DialogOption[];
}

export interface TavernNPC {
    id: string;
    name: string;
    role: string;
    description: string;
    conversation: Record<string, DialogNode>;
}

export const TAVERN_NPCS: TavernNPC[] = [
    {
        id: 'pilegrim',
        name: 'Sigurd Pilegrim',
        role: 'Vandrer mot Nidaros',
        description: 'Han sitter masserer sine såre føtter. En bredbremmet hatt med et kamskjell ligger på bordet, og vandringsstaven er slitt glatt av tusenvis av grep.',
        conversation: {
            'start': {
                text: 'Fred være med deg, reisende. Kjenner du veien nordover? Mine føtter verker som om jeg har gått på glødende kull, men sjelen... sjelen trekkes mot Hellig Olavs by.',
                options: [
                    { label: 'Hvorfor denne lange reisen?', nextId: 'why' },
                    { label: 'Er det farlig langs veien?', nextId: 'danger' },
                    { label: 'Fortell om kamskjellet.', nextId: 'shell' },
                    { label: 'Lykke til videre. (Gå)', nextId: 'EXIT' }
                ]
            },
            'why': {
                text: 'For bot og bedring! Vi bærer alle synder, min venn. Men i Nidaros, ved kongens skrin, er himmelen nærmere jorden. Det sies at en pilegrimsferd kan korte ned tiden i skjærsilden med mange år.',
                options: [
                    { label: 'Tror du virkelig på det?', nextId: 'believe' },
                    { label: 'Hva håper du å finne?', nextId: 'hope' }
                ]
            },
            'believe': {
                text: 'Jeg *må* tro. Jeg har sett halte kaste krykkene og blinde få synet tilbake ved katedralen. Olavs kraft er sterk, selv om han har vært død i hundrevis av år. Han er Norges evige konge.',
                options: [{ label: 'Fortell om Olav.', nextId: 'olav' }]
            },
            'hope': {
                text: 'Tilgivelse. Og kanskje litt sjelefred. Livet er hardt, vinteren er lang. Å vite at man har gjort denne ofringen... det gir styrke.',
                options: [{ label: 'Forståelig.', nextId: 'start' }]
            },
            'danger': {
                text: 'Å ja! Dovrefjell er nådeløst. Snøstormer kan komme midt på sommeren. Og i dalene lurer landeveisrøvere som ser på oss pilegrimer som vandrende pengesekker. Men vi reiser ofte i flokk for beskyttelse.',
                options: [
                    { label: 'Har du blitt ranet?', nextId: 'robbed' },
                    { label: 'Hvor sover dere?', nextId: 'sjelehus' }
                ]
            },
            'robbed': {
                text: 'Nesten. En gang, nær Gudbrandsdalen, så vi skygger i skogen. Vi sang salmer så høyt vi kunne, og drev dem bort med troens styrke! ...og kanskje fordi vi var førti stykker.',
                options: [{ label: 'God taktikk.', nextId: 'danger' }]
            },
            'sjelehus': {
                text: 'Det finnes sjelehus – herberger bygget for Guds skyld – langs ruten. Der får vi tak over hodet og enkel mat. Ofte deler vi rom med dyrene for varmen.',
                options: [{ label: 'Høres... koselig ut.', nextId: 'danger' }]
            },
            'shell': {
                text: 'Ah, Ib-skjellet! Symbolet på St. Jakob. Dette viser at jeg har vandret helt til Santiago de Compostela i Spania. Jeg har sett verden, min venn. Fra nordlyset her til de solbrente slettene i sør.',
                options: [{ label: 'Du er en bereist mann.', nextId: 'start' }]
            },
            'olav': {
                text: 'Han falt på Stiklestad i 1030. De sier at da de gravde ham opp et år senere, var kroppen like frisk, og håret og neglene hadde vokst! Det var beviset. Han kristnet oss med sverd, men reddet oss med sin hellighet.',
                options: [{ label: 'En mektig legende.', nextId: 'start' }]
            }
        }
    },
    {
        id: 'hansa',
        name: 'Gerhard fra Lübeck',
        role: 'Hansa-kjøpmann',
        description: 'Kledd i kostbar ull og pels. Han studerer en lang regnskapsrull med rynket panne og nipper til en vin som ser langt bedre ut enn husets vanlige.',
        conversation: {
            'start': {
                text: '*Mumler på tysk* ...zwei schock, drei stück... Ah! En lokal? Si meg, har fiskerne i nord fått opp farten? Mine skip venter i Bergen. Tid er penger, som vi sier i Lübeck.',
                options: [
                    { label: 'Hvem er du?', nextId: 'intro' },
                    { label: 'Hvorfor er tørrfisken så viktig?', nextId: 'stockfish' },
                    { label: 'Hva er Hansaen egentlig?', nextId: 'hansa_deep' },
                    { label: 'Jeg lar deg arbeide. (Gå)', nextId: 'EXIT' }
                ]
            },
            'intro': {
                text: 'Gerhard, handelsmann av Det Tyske Hanseforbund. Vi sørger for at dere får korn og mel, og at dere får solgt den... vel, illeluktende fisken deres. En god byttehandel, *nicht wahr*?',
                options: [
                    { label: 'Vi klarer oss vel selv?', nextId: 'monitor' },
                    { label: 'Takk for kornet.', nextId: 'grain' }
                ]
            },
            'grain': {
                text: 'Ja, det burde dere. Uten vårt baltiske korn ville mange nordmenn sultet når avlingene svikter. Vi binder Nord-Europa sammen med våre kogger.',
                options: [{ label: 'Kogger?', nextId: 'cog' }]
            },
            'monitor': {
                text: 'Haha! Tror du det? Uten oss ville fisken deres råtnet på stranden. Vi har nettverket. Vi har markedene i sør – katolikkene trenger fisk til fasten, og vi leverer.',
                options: [{ label: 'Dere tar stor fortjeneste.', nextId: 'monopoly' }]
            },
            'monopoly': {
                text: 'Risiko koster! Stormer, pirater, kriger. Vi tar risikoen, vi tar profitten. Og vi har Kongens velsignelse... og privilegier. Vi dømmer våre egne på Bryggen.',
                options: [{ label: 'Egne lover?', nextId: 'laws' }]
            },
            'laws': {
                text: 'Ja. En hanseat dømmes etter hansas lov, ikke norsk lov. Det... skaper litt friksjon med byborgerne, innrømmer jeg. Men handelen må flyte!',
                options: [{ label: 'Høres urettferdig ut.', nextId: 'start' }]
            },
            'stockfish': {
                text: 'Det er "Det hvite gullet"! Tørket i den kalde norske vinden blir den hard som tre og holder i årevis. Perfekt mat for soldater og munker i hele Europa. Vi bytter det mot korn, klær, vin og krydder.',
                options: [{ label: 'En viktig ressurs.', nextId: 'start' }]
            },
            'hansa_deep': {
                text: 'Et brorskap av handelsbyer. Lübeck, Hamburg, Rostock, Visby... og vårt kontor i Bergen. Vi beskytter hverandre mot konger som vil skattlegge oss for hardt, og mot sjørøvere. Sammen er vi sterkere enn noe kongerike.',
                options: [{ label: 'Morsomt at du nevner pirater...', nextId: 'pirates' }, { label: 'Imponerende.', nextId: 'start' }]
            },
            'pirates': {
                text: 'Vitaliebrødrene... en plage! De herjer i Østersjøen. Men Hansaen har sine egne skip. Vi kan bite fra oss. Ikke tro at en kjøpmann ikke kan svinge et sverd.',
                options: [{ label: 'Notert.', nextId: 'EXIT' }]
            },
            'cog': {
                text: 'Våre skip. Brede, høye, med plass til enorme mengder last. De er ikke raske som vikingenes langskip, men de bygget vår rikdom. Ett skip kan fø hele Bergen med korn.',
                options: [{ label: 'Teknologi er makt.', nextId: 'start' }]
            }
        }
    },
    {
        id: 'leilending',
        name: 'Tormod',
        role: 'Sliten Leilending',
        description: 'Hendene hans er grove som bark, og ryggen er bøyd av år med pløying. Han drikker tynt øl og ser tankefullt ned i kruset.',
        conversation: {
            'start': {
                text: 'Enda en høst, enda en landskyld å betale. Livet til en leilending er å så for andre og høste smuler selv. Skål for det.',
                options: [
                    { label: 'Hva er landskyld?', nextId: 'rent' },
                    { label: 'Hvorfor eier du ikke jorda?', nextId: 'own' },
                    { label: 'Hvordan var det før?', nextId: 'plague' },
                    { label: 'Går det så dårlig? (Gå)', nextId: 'EXIT' }
                ]
            },
            'rent': {
                text: 'Leieavgiften. Jeg driver gården, men Kirken eier grunnen. Hvert år må jeg gi dem en fjerdedel av kornet, tre skippund smør og to kyr. Det som er igjen... det skal fø familien min gjennom vinteren.',
                options: [
                    { label: 'Hva hvis avlingen svikter?', nextId: 'fail' },
                    { label: 'Hvem bestemmer prisen?', nextId: 'laws' }
                ]
            },
            'fail': {
                text: 'Da sulter vi. Eller vi må låne såkorn av jordeieren, og da havner vi dypere i gjeld. Det er en sirkel det er vanskelig å bryte.',
                options: [{ label: 'Trist skjebne.', nextId: 'start' }]
            },
            'own': {
                text: 'Få bønder eier sin egen jord nå. Adelen og Kirken har kjøpt opp nesten alt. Men jeg har i det minste *bygslebrev*. Så lenge jeg betaler og driver jorda, kan de ikke kaste meg ut. Det er norsk lov.',
                options: [{ label: 'En viss trygghet.', nextId: 'laws' }]
            },
            'laws': {
                text: 'Ja, Landsloven til Magnus Lagabøte. Den gir oss rettigheter. Jordeieren kan ikke bare ta gården fordi han vil. Og jeg kan kreve at sønnen min får overta bygselen. Vi er ikke slaver, vi er frie menn... bare fattige.',
                options: [{ label: 'Viktig forskjell.', nextId: 'start' }]
            },
            'plague': {
                text: '*Han senker stemmen* Bestefar fortalte om Den Store Døden. Da to av tre døde. Etterpå... etterpå var det gode tider for de som overlevde. Masse ledig jord! Lav landskyld! Nå? Nå er vi mange igjen, og jordeierne strammer grepet.',
                options: [
                    { label: 'Ødegårder?', nextId: 'deserted' },
                    { label: 'Tidene skifter.', nextId: 'start' }
                ]
            },
            'deserted': {
                text: 'Ja, du kan fortsatt se ruinene i skogen. Gårder der folk bodde før, som nå er grodd igjen. Noen sier det spøker der, at de døde går igjen og passer på arvesølvet sitt.',
                options: [{ label: 'Grøss.', nextId: 'start' }]
            }
        }
    },
    {
        id: 'steinhugger',
        name: 'Master William',
        role: 'Engelsk Steinhugger',
        description: 'Han tegner geometriske figurer i sølt øl på bordet. Fingrene er hvite av steinstøv.',
        conversation: {
            'start': {
                text: 'Ser du? Hvis du løfter buen *her*, og krysser hvelvet *slik*... da kan du bygge høyere enn fjellene! Ah, unnskyld. Jeg drømmer om stein.',
                options: [
                    { label: 'Bygger du katedralen?', nextId: 'nidaros' },
                    { label: 'Du er ikke herfra?', nextId: 'english' },
                    { label: 'Stein er bare stein. (Gå)', nextId: 'EXIT' }
                ]
            },
            'nidaros': {
                text: 'Kristkirken i Nidaros, ja! Verdens nordligste gotiske katedral. Vi hugger Kleberstein. Den er myk som smør når den brytes, men blir hard som jern i luften. Et mirakuløst materiale.',
                options: [
                    { label: 'Fortell om stilen.', nextId: 'gothic' },
                    { label: 'Hvor lenge holder dere på?', nextId: 'time' }
                ]
            },
            'gothic': {
                text: 'Gotikk! Det er lysets arkitektur. I gamle dager bygget de tykke vegger og små vinduer (romansk stil). Nå? Vi bruker strebepilarer på utsiden til å bære taket, så vi kan fylle veggene med glassmalerier. Guds lys strømmer inn!',
                options: [{ label: 'Høres vakkert ut.', nextId: 'symbolism' }]
            },
            'symbolism': {
                text: 'Det er mer enn vakkert. Kirken er et bilde på himmelen. Hver søyle, hver bue peker oppover. Når bonden kommer inn fra gjørma, skal han føle at han trer inn i Guds rike.',
                options: [{ label: 'Mektig.', nextId: 'start' }]
            },
            'english': {
                text: 'Nei, jeg kom fra Lincoln. Erkebiskopen hentet håndverkere fra England. Vi tar med oss kunnskapen om de nye stilene. Det er et internasjonalt laug, steinhuggerne. Vi reiser dit Gud og gullet kaller oss.',
                options: [{ label: 'Et reisende liv.', nextId: 'start' }]
            },
            'time': {
                text: 'Haha! "Hvor lenge?" Min oldefar begynte. Jeg fortsetter. Mine barnebarn vil kanskje se spiret reise seg. En katedral bygges ikke for oss, men for evigheten.',
                options: [{ label: 'En tålmodighetsprøve.', nextId: 'EXIT' }]
            }
        }
    },
    {
        id: 'vaering',
        name: 'Halvdan',
        role: 'Veteran fra Væringgarden',
        description: 'Han bærer en kappe av falmet, men kostbar silke. Et stygt arr deler venstre øyenbryn i to. Han drikker ikke øl, men vin fra en liten flaske.',
        conversation: {
            'start': {
                text: 'Dette stedet... det er kaldt, mørkt og lukter av våt hund. I Miklagard skinte solen på gulltakene hver dag, og keiserens hager duftet av sjasmin.',
                options: [
                    { label: 'Hvor er Miklagard?', nextId: 'miklagard' },
                    { label: 'Var du en kriger?', nextId: 'guard' },
                    { label: 'Hjemme best. (Gå)', nextId: 'EXIT' }
                ]
            },
            'miklagard': {
                text: '"Den Store Byen". Konstantinopel! Verdens sentrum. Der møtes øst og vest. Gatene er brolagt med marmor, og de har badehus med varmt vann i veggene! Kan du tenke deg? Varmt vann uten å koke det over bål!',
                options: [
                    { label: 'Utrolig.', nextId: 'hagia' },
                    { label: 'Savner du det?', nextId: 'miss' }
                ]
            },
            'hagia': {
                text: 'Og Hagia Sofia... Guds Helligdoms Kirke. Kuppelen er så stor at den ser ut som om den henger i en gullkjede fra himmelen. Jeg har sett menn gråte bare av å gå inn der.',
                options: [{ label: 'Må være et syn.', nextId: 'start' }]
            },
            'guard': {
                text: 'Væringgarden. Keiserens livvakt. Vi nordboere er høye, sterke og... vel, vi sviker ikke for penger. Grekerne er slueste folk, men de stoler bare på våre økser. "Pelekysphoroi" kaller de oss. Øksebærere.',
                options: [
                    { label: 'Måtte dere slåss?', nextId: 'fight' },
                    { label: 'Ble du rik?', nextId: 'rich' }
                ]
            },
            'fight': {
                text: 'Mot sarasenere, mot bulgarere, mot opprørske generaler. Jeg har sett gresk ild – flytende flammer som brenner på vann! Det er djevelens verk, men effektivt.',
                options: [{ label: 'Gresk ild?', nextId: 'start' }]
            },
            'rich': {
                text: 'Keiseren er sjenerøs. Når han dør, har vi rett til å gå gjennom skattkammeret og ta det vi kan bære. "Polutasvarf", kaller vi det. Palass-plyndring. Det er slik jeg fikk denne kappen... og denne ringen.',
                options: [{ label: 'En god pensjon.', nextId: 'start' }]
            },
            'miss': {
                text: 'Hver vinter. Men her er min slekt, min jord. Og her snakker folk et språk man kan forstå. Men jeg vil alltid drømme om det Gyldne Horn.',
                options: [{ label: 'Skål for minnene.', nextId: 'EXIT' }]
            }
        }
    },
    {
        id: 'munk',
        name: 'Broder Johannes',
        role: 'Lærd Skrivermunk',
        description: 'Fingrene hans er flekkete av blekk. Han myser, som om han er vant til å lese i dårlig lys, og snakker lavmelt.',
        conversation: {
            'start': {
                text: 'Hysj. Hører du stillheten? Nei, selvsagt ikke. Her er det støy. I skriptoriet hører man bare fjærpennens skraping mot pergamentet. Guds ord som festes til huden.',
                options: [
                    { label: 'Hva skriver du?', nextId: 'write' },
                    { label: 'Er du ikke ensom?', nextId: 'lonely' },
                    { label: 'Jeg lar deg være i fred. (Gå)', nextId: 'EXIT' }
                ]
            },
            'write': {
                text: 'Akkurat nå? En kopi av "Kongespeilet" – *Konungs skuggsjá*. En lærebok for prinser. Den forteller om høflighet, handel, stjernene og Guds orden. En klok konge må være lærd, ikke bare sterk.',
                options: [
                    { label: 'Er bøker dyre?', nextId: 'expensive' },
                    { label: 'Hvem leser disse?', nextId: 'readers' }
                ]
            },
            'expensive': {
                text: 'Ufattelig. Et stort bibelverk krever skinnet fra 300 kalver! Tenk på flokken... og arbeidet. Å forberede skinnet, blande blekket, male initialene med bladgull. En bok kan koste mer enn en gård.',
                options: [{ label: 'En skatt altså.', nextId: 'start' }]
            },
            'readers': {
                text: 'De geistlige, kongen, og noen få adelige. Men kunnskapen risler nedover. Det vi bevarer i bibliotekene, er verdens hukommelse. Uten oss ville historien forsvinne i mørket.',
                options: [{ label: 'Et viktig ansvar.', nextId: 'start' }]
            },
            'lonely': {
                text: 'Aldri. Jeg er omgitt av apostler, helgener og kirkefedrene. Augustin, Thomas Aquinas... de taler til meg gjennom sidene. Og brødrene i klosteret er min familie. Vi ber sammen, arbeider sammen.',
                options: [
                    { label: 'Ora et labora?', nextId: 'rule' },
                    { label: 'Høres fredelig ut.', nextId: 'start' }
                ]
            },
            'rule': {
                text: 'Be og arbeid. Ja. Det er St. Benedikts regel. Lediggang er fienden av sjelen. Så vi dyrker urter, brygger øl (som dette, Guds gave!), og kopierer bøker.',
                options: [{ label: 'Skål for ølet.', nextId: 'EXIT' }]
            }
        }
    },
    {
        id: 'pestlege',
        name: 'Doktor Pestus',
        role: 'Pestlege',
        description: 'Han sitter litt for seg selv. En merkelig maske med nebb henger rundt halsen hans, og han lukter sterkt av eddik og tørkede blomster.',
        conversation: {
            'start': {
                text: 'Ikke kom for nær! Balansen i væskene dine ser... urolig ut. Er du sangvinsk? Eller melankolsk? Luften her er tykk av miasma.',
                options: [
                    { label: 'Miasma?', nextId: 'miasma' },
                    { label: 'Hva er masken til?', nextId: 'mask' },
                    { label: 'Jeg er frisk! (Gå)', nextId: 'EXIT' }
                ]
            },
            'miasma': {
                text: 'Dårlig luft! Sykdom kommer av råtten luft som stiger opp fra jorden eller fra syke kropper. Den forstyrrer balansen i kroppen – blod, slim, gul og svart galle. Pesten... den er den verste ubalansen.',
                options: [
                    { label: 'Svartedauden?', nextId: 'plague' },
                    { label: 'Hvordan kurerer man det?', nextId: 'cure' }
                ]
            },
            'plague': {
                text: 'Den store døden. Den kom med et skip til Bergen i 1349. Jeg så hele landsbyer tømmes. Prester døde mens de ga den siste olje. Det var som om Gud hadde forlatt oss. De som overlevde... vi er merket.',
                options: [{ label: 'Forferdelig.', nextId: 'social' }]
            },
            'social': {
                text: 'Men se rundt deg! De færre vi er, jo mer verdt er hver mann. Bøndene krever bedre lønn nå. Tjenestepikene går med silke. Verden er snudd på hodet etter pesten.',
                options: [{ label: 'En ny tid.', nextId: 'start' }]
            },
            'mask': {
                text: 'Nebbet fylles med urter. Nellik, roser, mynte. Sterk lukt motvirker den dårlige luften. Det er som et filter mot døden selv. Og kappen er innsatt med voks så pestloppene glir av.',
                options: [{ label: 'Smart oppfinnelse.', nextId: 'cure' }]
            },
            'cure': {
                text: 'Årelating for å fjerne ondt blod. Kopping. Og Theriak – en blanding av over 60 ingredienser, inkludert ormekjøtt og opium. Det beste rådet? "Cito, longe, tarde." Dra fort, dra langt, kom sent tilbake.',
                options: [{ label: 'Skal huske det.', nextId: 'EXIT' }]
            }
        }
    },
    {
        id: 'birkebeiner',
        name: 'Gunnar',
        role: 'Birkebeiner-opprører',
        description: 'En hardfør mann med slitte klær, men sverdet ved beltet er velstelt. Han ser mistenksomt mot døren hver gang den åpnes.',
        conversation: {
            'start': {
                text: 'Hvem holder du med? Kongen eller Kirken? Baglerne eller Birkebeinerne? Svar fort, før ølet blir varmt.',
                options: [
                    { label: 'Birkebeinerne!', nextId: 'birkebeiner' },
                    { label: 'Jeg blander meg ikke.', nextId: 'neutral' },
                    { label: 'Baglerne?', nextId: 'bagler' },
                    { label: 'Ingen. (Gå)', nextId: 'EXIT' }
                ]
            },
            'birkebeiner': {
                text: 'Godt svar! Vi er kong Sverres menn. Mange av oss startet med ingenting, med never rundt leggene i snøen. Men vi kjemper for norges rettmessige konge mot biskopenes tyranni!',
                options: [
                    { label: 'Hvorfor hater dere biskopene?', nextId: 'church' },
                    { label: 'Fortell om Kong Sverre.', nextId: 'sverre' }
                ]
            },
            'bagler': {
                text: '*Han spytter på gulvet* Kirkens løpegutter. De vil at paven i Roma skal styre Norge, ikke kongen. Pass deg, ellers tror jeg du er en spion.',
                options: [{ label: 'Jeg mente det ikke sånn.', nextId: 'start' }]
            },
            'neutral': {
                text: 'Ingen kan være nøytrale i borgerkrig. Når bror dreper bror, må man velge side. Men kanskje det er klokest å holde kjeft, ja.',
                options: [{ label: 'Nettopp.', nextId: 'start' }]
            },
            'church': {
                text: 'Erkebiskopen vil ha makt. Han nekter å krone Sverre! Han lyste ham i bann! Men Sverre talte Roma midt imot. "En tale mot biskopene", kalte han det. Han sa at kirken er råtten, og at kongen er innsatt av Gud, ikke av Paven.',
                options: [{ label: 'Sterke ord.', nextId: 'start' }]
            },
            'sverre': {
                text: 'En prest fra Færøyene som ble konge! Han er liten av vekst, men en kjempe i kløkt. Han lærte oss å slåss på en ny måte. Ikke bare storme frem, men bruke terrenget, slå til og forsvinne. Gerilja, kaller de det visst i sør.',
                options: [{ label: 'En taktiker.', nextId: 'EXIT' }]
            }
        }
    },
    {
        id: 'kone',
        name: 'Ragnhild',
        role: 'Klok Kone',
        description: 'En eldre kvinne med grått hår flettet med fargerike bånd. Hun har en kurv full av tørkede planter og røtter på bordet.',
        conversation: {
            'start': {
                text: 'Har du en plage, ungen min? En verkebyll? Kjærlighetssorg? Eller kanskje kua di har sluttet å melke? Naturen har en bot for alt, hvis man vet hvor man skal lete.',
                options: [
                    { label: 'Er du en heks?', nextId: 'witch' },
                    { label: 'Har du noe mot sår?', nextId: 'herbs' },
                    { label: 'Jeg tror på bønner. (Gå)', nextId: 'EXIT' }
                ]
            },
            'witch': {
                text: 'Hysj! Ikke bruk det ordet. Prestene brenner folk for mindre. Jeg er en hjelper. Jeg bruker bare Guds skaperverk. Er det trolldom å vite at groblad stanser blødning? Nei, det er kunnskap.',
                options: [
                    { label: 'Unnskyld.', nextId: 'signs' },
                    { label: 'Hva med magi?', nextId: 'magic' }
                ]
            },
            'herbs': {
                text: 'Groblad for sår. Ryllik for feber. Og johannesurt for de tunge tankene som kommer om vinteren. Og honning... honning er bra for alt. Det holder betennelsen borte.',
                options: [{ label: 'Nyttig å vite.', nextId: 'start' }]
            },
            'signs': {
                text: 'Man må lese tegnene. Hvis rogna bærer mye bær, blir vinteren snøtung. Hvis kråka skriker mot nord, kommer det gjester. Det er ikke magi, det er å lytte til verden.',
                options: [{ label: 'Klokt.', nextId: 'start' }]
            },
            'magic': {
                text: '*Hun lener seg frem* Det finnes krefter... de underjordiske. Nissen på låven, Huldra i skogen. Man må vise dem respekt. Ofre litt grøt, litt øl. Kirken liker det ikke, men bonden vet at det er best å holde seg inne med dem.',
                options: [{ label: 'Best å være forsiktig.', nextId: 'EXIT' }]
            }
        }
    },
    {
        id: 'skald',
        name: 'Einar Skald',
        role: 'Hoff-poet',
        description: 'Han sitter med lukkede øyne og trommer rytmisk på bordet. Plutselig slår han ut med hånden og deklamerer en strofe.',
        conversation: {
            'start': {
                text: '"Sverdets sang, blodets brang, ravnens fang..." Nei, nei. Det mangler bokstavrim. En god dråpa skal være som et vevd teppe, hver ord skal låse det neste.',
                options: [
                    { label: 'Hva er en dråpa?', nextId: 'drapa' },
                    { label: 'Fortell en saga!', nextId: 'saga' },
                    { label: 'Du virker intens. (Gå)', nextId: 'EXIT' }
                ]
            },
            'drapa': {
                text: 'Det ypperste av kvad! Et hyllingsdikt til en fyrste eller konge. Det må ha "stef" – et omkved som gjentas. Hvis jeg gjør en feil i versefoten foran Jarlen, kan jeg miste hodet. Eller verre, miste min ære.',
                options: [
                    { label: 'Høres vanskelig ut.', nextId: 'oral' },
                    { label: 'Hva er versefot?', nextId: 'poetry' }
                ]
            },
            'saga': {
                text: 'Ah, historiene. Ikke bare dikt, men sannheten om våre forfedre. Som historien om Egil Skallagrimsson... kriger og poet. Han reddet sitt eget liv ved å dikte "Hodeløsningen" til Eirik Blodøks. Ord er makt, min venn.',
                options: [{ label: 'Fortell om Egil.', nextId: 'egil' }]
            },
            'egil': {
                text: 'Han var stygg som juling, men sterk som en bjørn. Og han kunne drepe med et sverd i én hånd og dikte med den andre. En gang spydde han over en hirdmann som prøvde å fornærme ham! En ekte helt.',
                options: [{ label: 'Fargerik type.', nextId: 'start' }]
            },
            'oral': {
                text: 'Vi bærer historien i hodet. Bøker kan brenne, men et godt kvede lever på folkemunne i tusen år. Det er min oppgave. Å sørge for at kongens bedrifter aldri glemmes. Jeg er levende historie.',
                options: [{ label: 'Imponerende hukommelse.', nextId: 'start' }]
            },
            'poetry': {
                text: 'Det er regler! Fornyrdislag, Ljogahått... du må bruke "Kenninger". Du sier ikke "sverd", du sier "sår-isl". Du sier ikke "blod", du sier "sverd-vann". Det gjør språket rikt og gåtefullt.',
                options: [{ label: 'Vakkert språk.', nextId: 'EXIT' }]
            }
        }
    }
];
