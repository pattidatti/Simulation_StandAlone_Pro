---
description: Utfør en dyp teknisk og spilldesignmessig analyse av Simulation-spillet for å gi kontekst for videreutvikling.
---

Dette workflowet guider agenten gjennom en grundig arkitektonisk revisjon av `simulation`-modulen for å identifisere flaskehalser, logiske brister og designmessige inkonsistenser.

1.  **Utforsk mappestrukturen & Planlegging**: 
    - List ut alle filer i `src/features/simulation` for å kartlegge moduler, hooks og logikk-sharding.
    - Les `todo.md` for å forstå nåværende veikart, spesielt med fokus på Baron/Konge-systemet og krigsrommet.
2.  **Analyser datamodellen & Skalerbarhet**: 
    - Les `simulationTypes.ts` og `constants.ts`. 
    - Undersøk `src/features/simulation/data/gameBalance.ts` og `roles.ts` for å forstå den matematiske og sosiale grunnmuren.
    - Evaluer om datastrukturen støtter horisontal skalering og multi-regionale data (sjekk om produksjon er segregert per region).
3.  **Gjennemgå arkitektur & Transaksjonsmodell**:
    - Undersøk `SimulationContext.tsx`. Vurder state-håndteringens effektivitet og re-render kostnader.
    - Analyser `globalActions.ts` vs `actions.ts`. Undersøk hvordan handlinger rutes gjennom `actionRegistry.ts`.
    - Identifiser potensielle race-conditions i globale handlinger, spesielt rundt ressursbidrag til kjernebygninger (slott, tronsal).
4.  **Evaluer gameplay-mekanikker & Balanse**:
    - Se på produksjonskjeder i `src/features/simulation/data/production.ts`. Er progresjonen meningsfull?
    - Analyser Baron/Konge-systemet: Finnes det faktiske suksesjons- og maktmekanismer (sjekk `roles.ts` og relaterte handlers)?
    - Undersøk "dead-ends" i crafting eller ressurser (f.eks. honning eller overflødige items som "iron").
5.  **Kritisk UI/UX Revisjon (Intentional Minimalism)**:
    - Se på `SimulationViewport.tsx` og `components/`-mappen. 
    - Vurder om det visuelle hierarkiet overlever informasjonsmengden i de nye krigsrom- og oppgraderings-menyene.
    - Sjekk kognitiv belastning: Er det tydelig for brukeren hvilket nivå en bygning er på, og hva neste steg koster?
6.  **Rapportering (Architectural Audit)**: Opprett en omfattende rapport (som et artifact) som dekker:
    - **Arkitektonisk Integritet**: Evaluering av transaksjonsmodellen og modularitet.
    - **Baron/Konge-status**: Verifisering av om politiske systemer fungerer som tiltenkt.
    - **Spillbalanse-revisjon**: Spesifikke tall (stamina/yield) som bør justeres.
    - **Bespoke UI Critique**: Forslag til å forbedre visualisering av progresjon og oppgraderinger.
    - **Teknisk Gjeld**: Identifisering av monolittiske filer (f.eks. `SimulationHost.tsx`) som bør splittes.
