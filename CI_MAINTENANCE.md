# CI & Build Maintenance Guide

This document tracks known issues and fixes related to the CI/CD pipeline and local build process for the Feudal Simulation project.

## Known Issues & Resolutions

### Phantom TypeScript / ESLint Errors in CI
**Symptoms:** CI reports "Cannot find module", "useEffect is not defined", or "unused variable" even when the local code appears correct and `npm run build` passes locally.

**Root Cause:** 
1. **Dependency Inconsistency:** Use of non-standard or "future" versions of packages (e.g., `typescript@5.9.3`, `eslint@9.39.1`) in `package.json` or `package-lock.json`. These versions may behave differently in the Linux-based CI environment or fail to resolve correctly during `npm ci`.
2. **ESLint v9 Migration:** ESLint v9 introduced a "flat config" system. If the project lacks an `eslint.config.js`, the CI build will fail during the linting step.

**Resolution:**
- Normalize `package.json` to stable, LTS-aligned versions.
- **Critical:** Delete `package-lock.json` and run `npm install` to regenerate a clean, consistent dependency tree.
- Ensure ESLint version is pinned (e.g., `^8.57.0`) if a legacy configuration style is preferred.

### Case Sensitivity (Linux vs. Windows)
**Symptoms:** Build passes on Windows but fails in CI with "Module not found".

**Resolution:**
- Run the `scripts/audit-imports-deep.js` tool to check for casing mismatches between import statements and filenames.
- Ensure Git tracks casing correctly (`git config core.ignorecase false`).

## Maintenance Commands

### Regenerate Lockfile
If the build starts behaving erratically in CI after dependency updates:
```powershell
Remove-Item package-lock.json
npm install
```

### Deep Casing Audit
```bash
node scripts/audit-imports-deep.js
```

### Local CI Simulation (Dry Run)
```bash
npx tsc --noEmit
npm run build
```
