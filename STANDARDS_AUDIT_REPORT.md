# InstaSpec Standards Audit (QA Snapshot)

## Rule Flow Diagram
Inputs (project setup: facility type, standard, jurisdiction, ratings, occupancy hints)  
→ Door normalization (`normalizeDoor`, `validatePhysics`, `checkCompliance`, `generateInstantDoorSchedule`)  
→ Hardware grouping (`buildSetProfile`, `generateHardwareSets`, `sanitizeHardwareItems`, material/electrified filters)  
→ Validation layer (`evaluateSetValidationIssues`, in-form warnings)  
→ Outputs (hardware sets + operations text, CSV/XLSX exports, BIM CSV, print layouts, trace when `STANDARDS_TRACE=on`).

## Standards / Rules Coverage Matrix
| Rule Area | Specific Check | Where Implemented (file:function) | How Verified | Status | Notes / Required confirmation |
| --- | --- | --- | --- | --- | --- |
| Fire / Life Safety | Fire-rated sets must include closers + seals; glass fire doors add gasketing | `src/App.jsx:generateHardwareSets`, `src/standards/validation.js:evaluateSetValidationIssues` | Unit: `validationScenarios.fire_door_missing_closer_and_seal` | PASS (logic present) | Only presence checked; no UL10C/EN1634 rating match or temp rise checks. |
| Egress | Stair/exit doors require panic hardware | `generateHardwareSets` (panic added for “stair”), `evaluateSetValidationIssues` | Unit: `validationScenarios.stair_exit_missing_panic` | PASS (rule enforced) | Occupant load/egress width not considered; Needs Human Confirmation for other assembly/retail triggers. |
| Accessibility | Width bounds 600–1300mm, hint when >1100mm; advisory note for width <850mm on accessible/entrance | `validatePhysics`, `checkCompliance` | Manual review (no blocking test) | UNCERTAIN | ADA_MIN_CLEAR_OPENING_MM defined but unused; no maneuvering clearances/force checks. Needs Human Confirmation. |
| Hardware Function | Maglock support kit/card reader auto-added; single hinge enforcement; finish overrides | `sanitizeHardwareItems` + helpers | Unit: `hardwareSanitizeScenarios.maglock_supports_added` | PASS | No fail-safe release validation; does not stop user from removing safety trims. |
| Acoustics / STC | STC ≥ 40 adds perimeter/ADB/gasket package (pairs include double qty) | `computeSetContext`, `ensureAcousticItems` | Unit: `hardwareSanitizeScenarios.acoustic_auto_package` | PASS | Does not verify tested door leaf STC listings. |
| Security / Access | Electromechanical intent adds strike/card reader; keyword-based intent recommendation | `getRecommendedHardwareIntent`, `generateHardwareSets` | Unit: `buildSetProfile`/intent test | UNCERTAIN | No fail-safe/egress interlock checks; maglock release per NFPA 101 not validated. |
| Materials / Corrosion | Lock/electrified type filtered by material; finish overrides per category/standard | `getAllowedLockTypesForMaterials`, `getAllowedElectrifiedTypesForMaterials`, `applyFinishOverrides` | Unit: material filter test | PASS | No environment-based corrosion class (e.g., coastal) selection. |
| Door Type / Usage | Instant schedules per facility (education, healthcare, hospitality, transport, residential, office) | `INSTANT_SCHEDULE_RULES`, `generateInstantDoorSchedule` | Unit: instant schedule test | PASS | Generated doors not validated against jurisdictional occupancy limits. |

## Golden Door Scenarios (tests/standards_audit/golden_doors.json)
- `fire_door_missing_closer_and_seal`: flags missing closer + perimeter/drop seals on FD60 set.  
- `stair_exit_missing_panic`: flags missing panic on stair/exit door.  
- `glass_needs_patch`: warns when glass door set lacks patch/rail hardware.  
- `maglock_supports_added`: verifies maglock kit adds contact, PSU, card reader (when allowed).  
- `acoustic_auto_package`: verifies STC-driven acoustic package & glazing gasket.  
- Classification samples cover escape-route vs non-egress glass doors.

## Static Review & Risks
- **High**: Accessibility conformance incomplete (no 813mm clear-open calculation, no maneuvering/force checks). `ADA_MIN_CLEAR_OPENING_MM` unused → silent gap. Needs Human Confirmation before enforcement.  
- **High**: Panic hardware trigger limited to keyword match; occupant load/egress width not evaluated (IBC/NFPA 101). Could miss assembly/retail doors without “stair/exit” keyword.  
- **Medium**: Maglock/strike fail-safe release, REX, fire alarm unlock not validated; only accessory kit auto-add.  
- **Medium**: Fire ratings accepted without cross-check to door material/config (no smoke control / S-label logic for corridors).  
- **Low**: STANDARDS_AUTOFIX not implemented; current behavior unchanged unless future flagged patches are added.

## Recommended Patches (flagged, opt-in only)
1) Behind `STANDARDS_AUTOFIX=on`, auto-suggest panic hardware when doors classify as assembly/retail (e.g., use keywords + optional occupant load input), emitting a warning trace and UI notice before applying.  
2) Add ADA clear-opening calculator (width minus hinge/handle deduction) and surface maneuvering warnings; gate behind feature flag until confirmed.  
3) Add maglock fail-safe release validation: require egress side REX + fire alarm unlock when electrified locking present; trace-only until approved.  
4) Add smoke/temperature ratings per fire door type (cross-corridor/stair) with warning if seals/closers removed.

## Trace / Explainability
- `STANDARDS_TRACE=on` (env, window flag, or localStorage) now captures rule events in-memory and logs to console, covering door classification, sanitize auto-adds, compliance notes, and validation issues (`src/standards/trace.js`). Default off; no behavior change when disabled.

## Test Harness
- Added `npm run standards:audit` (Vitest) targeting `tests/standards_audit/**/*.test.js`.  
- Scenarios and coverage live in `tests/standards_audit/golden_doors.json`.

## Files Created / Modified
- Added: `src/standards/trace.js`, `src/standards/validation.js`, `tests/standards_audit/golden_doors.json`, `tests/standards_audit/standards_audit.test.js`, `vitest.config.js`, `STANDARDS_AUDIT_REPORT.md`.  
- Modified: `src/App.jsx` (exports + trace hooks + shared validation), `package.json`, `package-lock.json`.

## How to Run Locally
```bash
npm install
STANDARDS_TRACE=on npm run standards:audit   # enable trace logs during tests (optional)
npm run standards:audit                      # run audit test harness
```
