---
description: Dyp arkitektonisk og spilldesignmessig analyse av Simulation-modulen.
---

Dette workflowet brukes for å utføre en omfattende revisjon av spillets logikk, arkitektur og balanse. Det er spesielt nyttig før større refaktoreringer eller implementering av komplekse politiske systemer.

1.  **Kartlegging**: 
    - List filer i `src/features/simulation` for oversikt.
    - Les `todo.md` for å se prioriteringer.
2.  **Statisk Analyse**: 
    - Sjekk `simulationTypes.ts` for datamodellens robusthet.
    - Les `data/gameBalance.ts`, `data/roles.ts`, og `data/production.ts` for å vurdere spillbalanse.
3.  **Logikk-gjennomgang**:
    - Analyser `globalActions.ts` og `actions.ts` for å finne rase-betingelser i transaksjoner.
    - Finn ut hvordan Baron/Konge-systemet er implementert i `logic/handlers`.
4.  **UI-revisjon**:
    - Undersøk `SimulationViewport.tsx` og de nyeste UI-komponentene i `components/` for kognitiv belastning og visuell klarhet.
5.  **Audit**: Opprett en Architectural Audit som et artifact som dekker teknisk gjeld (f.eks. `SimulationHost.tsx`), spillbalanse, og UI-forbedringer.
