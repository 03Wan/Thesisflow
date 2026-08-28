# Phase 8 Writing Capability Matrix

Baseline: 2026-08-26. The existing app passed typecheck, lint, 82 tests and production build before Phase 8 changes.

| Area | Source of truth | Phase 8 status | Evidence |
|---|---|---|---|
| Thesis document | `thesis_documents` keyed by `project_id` | Implemented | `src/services/writingService.ts` |
| Section tree/content | `thesis_sections`; stable UUID, parent/order, HTML, real word count | Implemented | `src/types/writing.ts`, migration 0013 |
| Autosave/revisions | Debounced section save + immutable `thesis_revisions` | Implemented | save transaction / browser local fallback |
| Requirements | Existing confirmed requirement repository | Reused | Requirements remain separate from recommendation UI |
| Literature | Existing `literature_items` | Reused | citation stores `literature_id`; no second reference table |
| Evidence | Existing Phase 7 `evidence_blocks` / `result_artifacts` | Implemented | links persist evidence/artifact/run IDs and stale propagation |
| Citation | `thesis_citations` structured instances | Implemented | stable anchor, locator, source hash |
| AI | `thesis_ai_proposals` | Implemented | pending proposal, source ids, hash, accept/reject |
| Export | Structured snapshot to DOCX with bibliography and lineage notes | Implemented | manifest records revision/hash/warnings; reopen tested; PDF intentionally unsupported |
| Tests | Existing suite + Phase 8 service/E2E + Rust migration test | Implemented | 33 files / 86 tests plus migration scope test |

## Duplicate-source audit

The old `/writing` route was a generic workspace shell and did not own thesis content. The new page owns only view state and sends content to `WritingService`; local browser storage is an offline preview fallback, while Tauri uses the SQL domain. Export output is never treated as editable truth.

## Prioritized risks

1. Confirmed format mappings beyond page size/margins need explicit `manual_check` reporting.
2. PDF export is not claimed until a reliable renderer is available.
3. Native Tauri save-dialog integration is a packaging follow-up; the supported browser download path is covered.

## Remaining implementation sequence

Section planner source badges → evidence/artifact insertion and stale actions → citation audit and bibliography derivation → export manifest persistence and DOCX reopen validation → project-isolated E2E.
