# InstaSpec Project Status

## Overview
- React 18 + Vite single-page app for door/hardware scheduling branded as "InstaSpec"; primary logic/UI lives in `src/App.jsx` (~6.1k LOC).
- Styling via Tailwind (CDN in `index.html` plus local `tailwind.config.js`), lucide-react icons, and ad-hoc CSS in `src/index.css`.
- Firebase Firestore backs beta access, per-user projects, and download usage; `.env` commits dev credentials.
- Hardware/standards logic is embedded in the app and partly exposed for tests; exports use SheetJS loaded from a CDN at runtime.

## Architecture & Data
- **Auth/Beta**: `src/auth/*.js[x]` provides email+code beta login, session persistence, and an admin-only panel to mint/extend codes, view feedback/access requests, and adjust download limits.
- **Projects**: `src/auth/projectStore.js` reads/writes per-user projects to the Firestore `projects` collection; app state keeps undo/redo history per session.
- **Standards**: `src/standards/trace.js` toggles rule tracing via `STANDARDS_TRACE`; `src/standards/validation.js` performs set-level checks (fire/panic/glass) surfaced in the UI and tests.
- **UI shell**: `src/App.jsx` drives landing page, dashboard, wizard (Project Setup -> Door Schedule -> Hardware Sets -> Validation/Review), instant schedule generator, bulk door tools, and download modals.

## Current Functionality
- Project dashboard gated by beta login; supports create/duplicate/delete, instant scheduling toggle, and door template duplication with bulk location expansion.
- Door schedule captures use, location, dimensions, handing, fire/STC/ADA, material/config, and hardware intent; provides previews and bulk creation helpers.
- Hardware sets auto-group doors by use, fire rating, config, material, STC, and intent; profiles drive warnings (fire closer/seals, exit panic, glass patch/rail) and sanitize electrified/maglock support items.
- Exports: XLSX (SheetJS via CDN), BIM CSV, and print/PDF; non-admin users enforce a 10-download quota via `betaUsage` records in Firestore.
- Beta admin panel surfaces beta users/login stats, feedback/access queues, download usage, and master code; "Upload Floor Plan" and "Instant Schedule" tiles are labeled coming soon.

## Testing & Quality
- `npm run standards:audit` (Vitest) covers door classification, set validation, hardware sanitization, material/electrified filters, and instant schedule generation using `tests/standards_audit/*` fixtures.
- Linting exists (`npm run lint`) but no automated CI config; no UI/e2e coverage beyond the standards harness.

## Known Risks / Gaps
- Monolithic `src/App.jsx` blends data, rules, and UI, making regression testing and reuse difficult.
- Runtime depends on external services: Firestore for auth/projects/usage and SheetJS CDN for XLSX; offline/CSP or network issues break exports and persistence.
- Tailwind is loaded twice (CDN + build pipeline), risking style drift between dev/prod; custom CSS partially duplicates utilities.
- Secrets: `.env` and `.env.local` with Firebase keys and beta master code are committed to the repo.
- Limited validation: accessibility and occupancy/egress logic remain shallow; download quota checks fail closed when Firestore errors.
- No state versioning/migrations for Firestore project documents; schema drift could break older records.

## Runbook
- Install: `npm install`.
- Dev: `npm run dev`; Build: `npm run build`; Preview: `npm run preview`.
- Tests: `npm run standards:audit`; enable traces with `STANDARDS_TRACE=on`.
- Required env: Firebase vars (`VITE_FB_*`), beta code defaults (`VITE_BETA_ACCESS_CODE`, `VITE_MASTER_BETA_CODE` optional), and optional `VITE_FIRESTORE_DATABASE`.

## Suggested Next Steps
1) Split `src/App.jsx` into feature modules (auth shell, project store/hooks, door wizard, hardware engine, exports) and add routing/state tests.
2) Bundle SheetJS locally (replace CDN import) and add offline/failed-export handling with user-facing errors; align Tailwind to a single source.
3) Secure secrets (.env handling) and introduce CI to run lint + standards audit; extend tests to cover download quota logic and Firestore read/write fallbacks.
4) Expand standards validation (ADA clear openings, occupant load triggers, fail-safe electrified egress) behind feature flags and surface in UI trace.

