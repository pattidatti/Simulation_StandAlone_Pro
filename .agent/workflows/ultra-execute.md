---
description: ULTRATHINK Execute V2 - Kirurgisk implementering med rekursiv feilhåndtering
---

Dette workflowet brukes for feilfri implementering av godkjente planer.

1. Start med å deklarere **ULTRATHINK** modus.
2. **Snapshotting:** Oppsummer kort nåværende tilstand av berørte filer før du endrer noe.
3. **Fasevis Eksekvering:**
    - Fullfør én fase av gangen.
    - Verifiser atomisk (hver funksjon/komponent) før neste steg.
4. **Rekursiv feilhåndtering:**
    - Hvis build/test feiler 2 ganger på samme sted: STOPP. 
    - Bruk `grep_search` og `view_file_outline` for å analysere foreldre-logikken på nytt.
    - Foreslå `/ultra-refine` hvis planen må endres radikalt.
5. Opprett `walkthrough.md` med bevis på at alle faser er fullført og dokumentert med JSDoc.
