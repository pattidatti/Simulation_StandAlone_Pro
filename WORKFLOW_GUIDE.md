# ⚓ Prosjekt-Workflows: En Guide for Utviklere

Denne guiden gir deg oversikt over alle automatiserte arbeidsflyter (workflows) i Simulation_StandAlone_Pro. Disse verktøyene sikrer høy kvalitet på kode, design og spillbalanse.

## 🧠 Slik velger du riktig workflow (Beslutningsmatrise)

| Hvis du skal... | Bruk denne workflowen | Hvorfor? |
| :--- | :--- | :--- |
| **Planlegge** en ny funksjon | `@/ultra-plan` | Gir dyp arkitektonisk analyse før koding. |
| **Kritisk analysere** en plan | `@/ultra-refine` | Finner svakheter, race conditions og UI-detaljer. |
| **Implementere** en godkjent plan | `@/ultra-execute` | Sikrer feilfri koding med atomisk verifisering. |
| **Fikse feil** eller verifisere | `@/ultra-verify` | Kjører tester og UX-audits. |
| **Balansere økonomien** | `@/audit-economy` | Sjekker for "uendelige penger" og ROI-feil. |
| **Polere brukergrensesnittet** | `@/ui-polish` | Enforcer "Avant-Garde" estetikk og HSL-farger. |
| **Optimalisere ytelse** | `@/optimize-assets` | Rydder i ubrukte filer og gir bedre lastetider. |
| **Fikse CI-byggfeil** (Linux) | `@/fix-imports` | Fikser automatisk store/små bokstaver i importer. |

---

## 🛠️ Dypdykk i Workflows

### 💰 `/audit-economy`
**Hva gjør den?** Skanner `gameBalance.ts` og `production.ts` for å finne logiske brister i spillets økonomi.
- **Når:** Etter at du har endret priser, crafting-oppskrifter eller ressurs-yields.
- **Teknisk:** Simulerer ROI (Return on Investment) og sjekker om det koster mindre å lage en gjenstand enn det du får for å selge den.

### ✨ `/ui-polish`
**Hva gjør den?** Analyserer React-komponenter for å sikre at de følger prosjektets visuelle standard.
- **Når:** Hver gang du har laget en ny UI-modul eller knapp.
- **Parametere:** Sjekker HSL-farger, cubic-bezier animasjoner og padding-konsistens.

### 🚀 `/optimize-assets`
**Hva gjør den?** Rydder i `public/`-mappen.
- **Når:** Før du pusher store oppdateringer med nye modeller eller bilder.
- **Funksjon:** Identifiserer filer over 500KB og foreslår WebP-konvertering. Sjekker også om filer i mappen faktisk brukes i koden.

### 🔍 `/fix-imports`
**Hva gjør den?** Brobygger mellom Windows og Linux.
- **Når:** Hvis koden din fungerer lokalt (Windows), men kræsjer i GitHub Actions (Linux).
- **Løsning:** Finner importer som `StandardUI.tsx` vs `standardui.tsx` og retter dem til korrekt casing.

---

## 🏗️ Grunnleggende Workflows (Standard)

- **`@/analyze-simulation`**: Brukes for å forstå dypet av bakend-systemene i Simulation-modulen.
- **`@/ultra-plan`**: Den viktigste workflowen for arkitektur. Lager en `implementation_plan.md`.
- **`@/ultra-execute`**: Eksekverings-motoren. Brukes for å skrive selve koden etter at planen er reviewet.

> [!TIP]
> Hvis du er usikker, start alltid med `@/ultra-plan`. Den vil ofte foreslå hvilke andre workflows som trengs for oppgaven.
