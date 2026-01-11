---
description: Optimaliser byggstørrelse og rydd i ubenyttede assets.
---
Dette workflowet bruker **ULTRATHINK** for å vedlikeholde spillets ytelse ved å auditere `public/`-mappen.

1. Deklarer **ULTRATHINK** modus.
2. **Asset-skanning:**
    - List alle filer i `public/assets/` og sorter etter størrelse.
    - Identifiser alle filer over 500KB.
    - Marker gjenkjennbare formater (PNG/JPG) for konvertering til WebP.
3. **Manifest-audit (Dødt kjøtt):**
    - Bruk `grep_search` for å sjekke om filene i `public/` faktisk er referert til i `src/`.
    - Lag en liste over "orphaned assets" (filer som ikke brukes) og foreslå sletting.
4. **Ytelses-analyse:**
    - Beregn teoretisk besparelse ved å optimalisere de 10 største filene.
5. **Oppsummering:** Presenter en handlingsliste (Action Plan) for å redusere spillmodulens totale størrelse.
