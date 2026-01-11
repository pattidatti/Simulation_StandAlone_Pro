---
description: ULTRATHINK Planlegging V2 - Dynamisk kontekst og arkitektonisk dybde
---

Dette workflowet aktiverer ULTRATHINK for dyp planlegging med automatisk kontekstoppdagelse.

1. Start med å deklarere **ULTRATHINK** modus.
2. **Kontekst-oppdagelse:**
    - Bruk `find_by_name` for å finne strategidokumenter (`*_SUMMARY.md`, `*_STRATEGY.md`, `*_EVOLUTION.md`).
    - Les de mest relevante dokumentene for å forstå overordnet visjon.
    - Sjekk koden direkte for å verifisere nåværende tilstand (ikke stol blindt på `todo.md`).
3. Analyser forespørselen:
    - **Intent Alignment:** Samsvarer dette med den overordnede strategien?
    - **Arkitektonisk Gjeld:** Introduserer dette rot? Planlegg en "cleanup" hvis nødvendig.
    - **Psykologisk UX:** Hvilken følelse skal spilleren sitte igjen med?
4. Opprett/oppdater `implementation_plan.md`:
    - Del inn i atomiske faser (Data -> Logikk -> UI).
    - Definer spesifikke "Avant-Garde" UI-mål (glassmorphism, micro-animations, visuell rytme).
5. Be om review før eksekvering.
