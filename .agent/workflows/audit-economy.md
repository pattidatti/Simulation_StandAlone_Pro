---
description: Valider og balanser spillets økonomi (ROI, profitt-løkker og yield).
---
Dette workflowet aktiverer **ULTRATHINK** for å revidere økonomiske konstanter i Simulation-modulen.

1. Deklarer **ULTRATHINK** modus.
2. **Datainnsamling:** 
    - Les inn `features/simulation/data/gameBalance.ts` og `features/simulation/data/production.ts`.
    - Identifiser alle `CRAFTING_COSTS`, `MARKET_PRICES` og `RESOURCE_YIELDS`.
3. **Økonomisk Revisjon (Loop Simulator):**
    - Sjekk for "Negative Cost Loops": Koster det mindre å *lage* en gjenstand enn det man får for å *selge* den (inkludert råvarekostnader)?
    - Beregn ROI (Return on Investment) for alle oppgraderinger. Er balansen mellom kostnad og gevinst fornuftig?
    - Sammenlign `Resource Yields` med gjennomsnittlig spilletid. Er progresjonen for rask eller for treg?
4. **Feilsøking:**
    - Finn de 3 største ubalansene i de nåværende tallene.
    - Foreslå konkrete justeringer (f.eks. "Øk kostnaden for X med 15%").
5. **Rapport:** Presenter funnene i en ryddig tabell med fokus på spilløkonomisk stabilitet.
