# SpecSmart Project Status

## Overview
- Single-page React (Vite) tool for door/hardware specification workflows branded as "SpecSmart v2.0 Enterprise".
- UI is Tailwind-driven (CDN in index.html plus local config) with lucide-react icons; all logic lives in src/App.jsx (~1.8k LOC).
- Data is entirely client-side: persisted to localStorage under specSmartDB; no backend/API calls.

## Current Functionality
- Landing page + dashboard to create/delete projects; project state: name, facility type, standard (ANSI/EN), jurisdiction, client/architect notes.
- Wizard with 4 steps: (0) Project context, (1) Door schedule (add/edit/duplicate doors with location, dimensions, ratings, handing, ADA, material), (2) Hardware sets auto-generated per door grouping with editing UI, (3) Review page with validation summary and exports.
- Hardware logic: groups doors by use/fire/config/material/STC, auto-builds hardware sets with BHMA categories, hinge qty rules, glass/stair/fire variants. Library feature to save/load hardware templates; add-item modal tied to product catalog and finishes per standard.
- Visuals: door/hardware preview SVGs, handing illustrations, compliance hints, audit log sidebar, print-friendly spec sheet, dashboard placeholders for "Upload Floor Plan" and "Instant Schedule" (coming soon).

## Exports & Data Sharing
- Excel export via dynamic import from SheetJS CDN (https://cdn.sheetjs.com/...); generates Door Schedule, Hardware Specs, and BOM sheets with project headers.
- BIM CSV export for shared parameters; print mode for PDF generation via browser print.
- Local-only persistence; "Reset" clears localStorage.

## Roles/Permissions
- userRole toggles Architect vs Contractor (contractor option disabled in UI). Owner read-only logic exists but no way to select it yet.

## Risks / Gaps
- Monolithic src/App.jsx (~1.8k lines) with mixed state/logic/UI; hard to maintain/test.
- Exports depend on external CDN and browser Blob APIs; will fail offline or with blocked network/CSP.
- Tailwind loaded both via CDN and build pipeline; potential style drift between dev/prod.
- No automated tests, lint config present but not customized; no type safety.
- Persistence limited to browser storage; multi-user collaboration/versioning unavailable.

## Setup / Run
- `npm install` then `npm run dev` (Vite). Build via `npm run build`, preview via `npm run preview`. Network required for SheetJS CDN + CDN Tailwind if build output still references it.

## Suggested Next Steps
1) Split App.jsx into composable components/hooks and add routing for wizard steps.
2) Replace CDN SheetJS with packaged dependency and add offline-safe export handling + error UI.
3) Decide on Tailwind source (CDN vs compiled) and remove duplication; add global typography/colors per design language.
4) Add validation/unit tests around hardware generation and door physics checks; enable CI linting.
5) Expose role switching (Owner/Contractor) with proper permissions, or remove unused branches.
6) Plan persistence strategy (backend API or file download/upload) for sharing projects across machines.
