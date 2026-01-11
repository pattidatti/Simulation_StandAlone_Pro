# MARITIME_EVOLUTION_SUMMARY.md

Dette dokumentet gir en grundig dannelseshistorie for den maritime ekspansjonen (Kaien & Skipsverftet) i simuleringen. Det dekker progresjonen fra de første planleggingsfasene til den endelige implementeringen, samt de ideene som ble forkastet underveis.

---

## 🏗️ Evolusjon av Planen (Versjonshistorikk)

### Versjon 1: Grunnmuren (Konseptfase)
*   **Fokus**: Infrastrukturen for båtbygging.
*   **Ideer**: 
    *   En enkel hub for "Kaien".
    *   Intro til maritime ressurser som eik og tjære.
    *   Første utkast til en modulær båt (SVG).

### Versjon 2: "State of the Art" (Utvidelsesfase)
*   **Fokus**: Realisme og dynamikk.
*   **Lansert**: 
    *   System for 8 sesong/tid-baserte bakgrunner (`map_dock_[season]_[time].webp`).
    *   Sanntids multiplayer-seiling via Firebase (`sea_state`).
    *   "Passive Voyages" (Ekspedisjoner som henter silke/krydder).

### Versjon 3: Visuell Polering (Siste Audit)
*   **Fokus**: Cinematisk opplevelse og høykvalitets assets.
*   **Integrert**: 
    *   Høykvalitets AI-genererte assets for blueprint, havnekontor (natt) og storstilt kai-utvidelse.
    *   Flytting av Lin-åkeren til Åkrene for bedre logisk mapping.
    *   Streng audit av fonter (min. 11px) og UI-spacing.

---

## ✅ Implementerte Funksjoner

| Funksjon | Beskrivelse | Status |
| :--- | :--- | :--- |
| **Modulær Båt (SVG)** | 4 stadier (Kjøl -> Ferdig). Vises i verftet og på havet. | Operativ |
| **Skipsverft (UI)** | Bespoke "Shipwright" estetikk med blueprint-bakgrunn. | Operativ |
| **Kai-system (Hub)** | Sesongbasert visning og cinematisk atmosfære. | Operativ |
| **Multiplayer Seiling** | Sanntids posisjonering og rotasjon for alle spillere. | Operativ |
| **Maritime Ressurser** | Eik, lin, tjære, fisk, krydder, silke. | Operativ |
| **Globalt Kai-prosjekt** | Felles byggeprosjekt for hele regionen. | Operativ |

---

## 🗑️ Forkastede Ideer & "Trimming"

Under utviklingen ble noen ideer fjernet eller nedskalert for å sikre en stabil og ren brukeropplevelse:

1.  **Sea Inventory (Båt-lager)**:
    *   *Plan*: Båten skulle ha eget lager separat fra spillerens ryggsekk (`boat.inventory`).
    *   *Hvorfor fjernet*: Skapte unødvendig kompleksitet i UI og risiko for desynk. Vi valgte å bruke spillerens globale ryggsekk for enkelhet.

2.  **Vind-drevet Fysikk (Full Simulering)**:
    *   *Plan*: Kompleks seil-simulering hvor man måtte "kryss-seile" mot vinden.
    *   *Hvorfor trimmet*: Ble for vanskelig for tilfeldige spillere. Fysikken ble forenklet til en "fart-boost" ved medvind, men kontrollen forble intuitiv (WASD).

3.  **Passive Voyages (Timer-basert)**:
    *   *Plan*: Sende båten ut på 1-times tokt som returnerte med gull.
    *   *Hvorfor trimmet*: Vi ønsket å prioritere *aktiv* spillopplevelse på havet (fiske og seiling) fremfor enda en "set and forget" timer-funksjon i denne fasen.

4.  **Dynamisk Vær på Havet (Visuals)**:
    *   *Plan*: Regn og tåke på havet som påvirket sikten.
    *   *Hvorfor fjernet*: Performance-hensyn på eldre maskiner ved sanntids rendering av mange skip. Vi beholdt en ren og atmosfærisk hav-flate (SeaHUD).

---

## 🔍 Versjonssammenligning: Kai-utvidelse

| Element | Opprinnelig Tanke | Endelig Implementering |
| :--- | :--- | :--- |
| **Bakgrunnsbilder** | Enkle placeholders. | High-fidelity cinematics (natt/dag). |
| **Byggeprosess** | Soloprosjekt for hver spiller. | Splittet mellom personlig båt OG global kai-utvidelse. |
| **Interaksjon** | Statiske knapper. | Hover-effekter, micro-animations og progressiv innlasting. |

---
*Dokumentasjon generert 11.01.2026 for Simulation_StandAlone_Pro*
