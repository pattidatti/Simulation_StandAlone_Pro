# Oversikt over Ressurs-utbytte fra Mini-games

Her er en oversikt over hvor stort utbytte man får fra de ulike ressurs-mini-games i Simulation. Utbyttet påvirkes av prestasjon (score), ferdighetsnivå, sesong, vær og utstyr.

## 1. Innsamling (Rhythme-spill / Klikk-spill)
Utbyttet beregnes som: `Base * Modifikatorer * Prestasjon`
*Prestasjon (Score 0.0 - 1.0) gir en multiplikator fra **0.5x til 1.5x**.*

| Aktivitet | Ressurs | Base-utbytte | Viktige Modifikatorer | Verktøy-straff |
| :--- | :--- | :--- | :--- | :--- |
| **Kornhøsting** | Korn | **10** | +4 med Jernplog, -20% ved Verneplikt-lov | -75% uten Sigd |
| **Vedhogst** | Ved | **6** | +2 om sommeren, Region (Øst +20%, Vest -20%) | -75% uten Øks |
| **Gruvedrift** | Jernmalm | **5** | Region (Vest +20%, Øst -20%) | -75% uten Hakke |
| **Steinhugging** | Stein | **8** | - | -75% uten Meisel |
| **Sanking** | Mat (Brød/Bær)| **1** | - | Ingen straff |
| **Jakt** | Kjøtt | **8** | Basert på Combat-ferdighet | Ingen straff |
| **Saueklipping** | Ull | **6** | - | **Krever Saks** (0 hvis mangler) |
| **Bier** | Honning | **4** | - | Ingen straff |

---

## 2. Foredling (Pumpe-spill / Timing-spill)
Utbyttet beregnes som: `Base * Prestasjon * Bygningsbonus`
*Bygningsbonus gir **+20% utbytte** per nivå over kravet.*

| Produkt | Ressurs | Base-output | Bygning |
| :--- | :--- | :--- | :--- |
| **Planker** | Tømmer | **1** | Sagbruk |
| **Mel** | Mel | **10** | Vindmølle |
| **Jernbarre** | Jern | **1** | Smeltehytte |
| **Brød** | Brød | **5** | Bakeri |
| **Kjøttpai** | Brød (Stamina) | **15** | Bakeri (Lvl 2) |
| **Lin-stoff** | Stoff | **1** | Veveri |
| **Glass** | Glass | **1** | Smeltehytte (Lvl 3) |

---

## 3. Jordbruk (Såing & Høsting)
Innhøsting av åker er lineært basert på din score i minispillet.

*   **Kornåker**: Gir mellom **12 og 20 korn** (før bonuser).
*   **Bonus**: +5% utbytte for hver gang du luker ugress/skremmer fugler (opptil +15%).

---

## 4. Vertshuset (Ressurs-hjulet)
Gambling med egne ressurser (Gull, Korn, Ved, Stein, Jern).

*   **Tap**: 0x (50% sjanse)
*   **Gevinst**: 1.5x (30% sjanse)
*   **Stor Gevinst**: 2.5x (15% sjanse)
*   **JACKPOT**: 5x (5% sjanse)

---

## 5. Automatiske Kilder
*   **Hønsegård**: Gir **3-5 egg** hvert 4. minutt hvis de mates.
*   **Passive kilder (per minutt)**: Ku (+2 gull), Regnskapsbøker (+5 gull), Karavane (+10 gull).
