---
description: Fiks automatisk import-feil relatert til store/små bokstaver (casing).
---
Dette workflowet bruker **ULTRATHINK** for å løse "Module not found" feil i Linux CI-miljøer ved å auditere fil-casing.

1. Deklarer **ULTRATHINK** modus.
2. **Revisjon (Dry Run):**
    - Kjør `node scripts/audit-imports-deep.js` for å finne alle avvik mellom import-setninger og faktiske filnavn.
    - Rapporter alle funn uten å endre filer ennå.
3. **Sikkerhets-analyse:**
    - Identifiser om noen av feilene er i kritiske moduler (f.eks. `SimulationContext` eller `GlobalActions`).
    - Sjekk om endringene vil påvirke Git sin sporing (`git config core.ignorecase false`).
4. **Eksekvering (Auto-Fix):**
    - Be brukeren om bekreftelse.
    - Oppdater import-setningene i de berørte kildefilene slik at de matcher filsystemet nøyaktig.
5. **Verifisering:**
    - Kjør `npx tsc --noEmit` for å bekrefte at alle typer fortsatt resolver korrekt.
    - Verifiser at lokal build (`npm run build`) passerer.
