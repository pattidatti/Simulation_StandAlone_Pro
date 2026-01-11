---
description: Gjennomfør en visuell audit for å sikre prosjektets "Avant-Garde" standarder.
---
Dette workflowet bruker **ULTRATHINK** for å polere brukergrensesnittet (UI) med fokus på visuell eleganse og mikro-interaksjoner.

1. Deklarer **ULTRATHINK** modus.
2. **Design-audit:**
    - Analyser de forespurte React-komponentene.
    - Sjekk fargebruk mot HSL-tokens: 
        - Bakgrunn: `hsl(222, 47%, 11%)`
        - Primærfarge: `hsl(142, 71%, 45%)`
        - Gull/Advarsel: `hsl(38, 92%, 50%)`
    - Sjekk easing-kurver mot spec:
        - `cubic-bezier(0.16, 1, 0.3, 1)` (Out-Expo) for standard bevegelser.
        - `cubic-bezier(0.34, 1.56, 0.64, 1)` for interaktive elementer (overshoot).
3. **Anbefalinger (The "WOW" Factor):**
    - Legg til glassmorphism (backdrop-filter: blur) der det gir mening.
    - Foreslå mikro-interaksjoner (f.eks. `hover:scale(1.02)` med Framer Motion).
    - Sikre at typografi har korrekt hierarki og lesbarhet (WCAG AAA).
4. **Eksekvering:**
    - Implementer endringene direkte i koden eller foreslå en oppdatering av stil-filene.
5. **Verifisering:** Bruk `generate_image` eller skjermbilder for å vise før/etter hvis mulig.
