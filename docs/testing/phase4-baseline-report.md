# Phase 4 Baseline Report

- Checked: 2026-08-24
- Repository: `main` tracking `origin/main`; working tree was clean before baseline commands.
- Recent commits: `202b398 feat: connect file parsing and rule review UI`, `d93cb9f fix: audit rejected and conflicting rule candidates`, `a68a43e docs: record phase 3 final acceptance gaps`.
- Schema: migration v7 (`0007_allow_parse_history.sql`) after v6, containing `document_parses`, `rule_candidates`, `thesis_rules`, `rule_conflicts`, and `rule_audit_log`.
- AI dependencies: none found in package manifests/lockfiles; no AI SDK was added.

## Evidence checked

| Area | Baseline result | Evidence |
| --- | --- | --- |
| Document Parser / NormalizedDocument / SourceLocator | Implemented and unit-tested, not end-to-end accepted. | `src/types/document.ts`, parsers, and parser tests; Phase 3 acceptance item 1 remains FAIL. |
| `rule_candidates`, `thesis_rules`, `rule_conflicts`, audit log | Schema and service paths exist, but real persisted acceptance coverage is incomplete. | migration v6; `RuleReviewService`; Phase 3 items 8–12 remain FAIL/PARTIAL. |
| Confirmed rule → Requirements / Workflow | Service contains a projection path gated by confirmation, but no real Tauri/SQLite/UI acceptance test proves it. | `src/services/ruleReviewService.ts`; Phase 3 items 9 and 14 remain FAIL. |
| 三江学院 fixture | Not accepted. | `docs/testing/phase3-sanjiang-fixture-report.md`: legacy equivalent fixture, multi-value extraction, conditional exceptions, deadlines/batches, persistence, and UI confirmation are outstanding. |
| Quality commands | PASS | After stopping the workspace Vite process and restoring the npm dependency tree with an isolated cache: `npm run typecheck`, `npm run lint`, 19 Vitest files / 51 tests, and production build all passed. Rust `cargo test` passed 6 tests. Existing PDF/chart test warnings and the Vite chunk-size warning are non-fatal. |

## Gate decision

**Phase 3 remains NOT ACCEPTED** because the persisted end-to-end and Sanjiang fixture acceptance gaps remain. The local quality-gate environment has been restored and is no longer a blocker. This Phase 4 infrastructure skeleton adds no real provider integration, SDK, or STEP 02 feature.

## Required remediation before rerun

1. Add real Tauri/SQLite acceptance tests for import → persisted normalized document → candidates → confirm/reject/conflict/audit → Requirements/Workflow, including restart persistence.
2. Create and import a content-equivalent DOCX/PDF Sanjiang fixture, complete deterministic extraction for the listed requirements/deadlines/batches, and rerun its report.
3. Update this baseline only with actual acceptance evidence. Do not add a real AI SDK or enable a provider until these gates pass.
