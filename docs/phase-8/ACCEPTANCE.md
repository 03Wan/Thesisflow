# Phase 8 Acceptance

## Current result

Phase 8 implementation is **implemented for the supported DOCX workflow**. The formal writing source-of-truth, versioned sections, structured citations, evidence/artifact/run lineage, controlled AI proposals, outline proposal gate and DOCX snapshot path are present. PDF is intentionally not advertised because no reliable local renderer is available.

## Verified in this turn

- `npm run typecheck` PASS
- `npm run build` PASS
- `npm test -- --run` PASS (33 files / 86 tests)
- Writing page uses project-scoped persistence and has visible save/error states.
- AI proposals default to pending; Reject leaves正文 unchanged; Accept writes through a revision-producing save.
- DOCX export is generated from structured sections, includes bibliography and source-lineage notes, is reopened in tests as a ZIP package, and does not replace the editable source.
- Export manifests persist revision/file hash/warnings in browser metadata or the Tauri SQL domain.
- `cargo test ... phase8_writing_domain_preserves_evidence_lineage_and_stale_propagation` PASS.
- Product navigation and command palette no longer expose advisor/teacher review workflows.

## Explicit scope / follow-up

- PDF export remains unsupported and must not be enabled until a reliable renderer is added.
- Tauri export currently uses the browser download path; a native save-dialog integration can be added as a separate packaging task.
- The automated E2E uses project-isolated lineage fixtures; manual validation with a populated user project is still recommended before Phase 9.
